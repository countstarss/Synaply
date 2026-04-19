-- =====================================================================
-- Phase 1 (Realtime): semantic workflow events, inbox push, project sync
-- =====================================================================
-- Finishes wiring Supabase Realtime as the authoritative collaboration
-- broadcast layer. After this migration the database becomes the single
-- source of truth for realtime events:
--
--   1. Workflow review / handoff / blocked / etc are emitted under their
--      canonical event names by reading IssueActivity.metadata.eventType,
--      so backend services do not need to broadcast manually.
--   2. inbox_items inserts and status changes push to user:{id} topic so
--      the target user's clients refresh inbox/inbox-summary instantly.
--   3. project row changes emit project.summary.invalidated so project
--      pages and project-summary queries refresh without polling.
--   4. Realtime topic ACL is extended with a `user:{userId}` topic kind,
--      gated so only the user themselves can subscribe.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Topic ACL: add `user:{userId}` topic kind
-- ---------------------------------------------------------------------
-- The existing helper realtime_topic_workspace_id() returns null for any
-- topic kind it does not understand, which would deny `user:` topics if
-- left in the workspace-membership branch. We branch on `user:` first
-- and resolve membership only for workspace-bound topics afterwards.

create or replace function public.can_access_realtime_topic(topic text, user_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  topic_kind text;
  topic_resource_id text;
  workspace_id text;
  workspace_type text;
  workspace_owner_id text;
  workspace_team_id text;
  requesting_user_id text := $2;
begin
  if requesting_user_id is null then
    return false;
  end if;

  topic_kind := split_part(coalesce(topic, ''), ':', 1);
  topic_resource_id := nullif(split_part(coalesce(topic, ''), ':', 2), '');

  -- Per-user topic: only the user themselves may subscribe.
  if topic_kind = 'user' then
    return topic_resource_id is not null and topic_resource_id = requesting_user_id;
  end if;

  -- Workspace-bound topics: workspace / issue / workflow_issue.
  workspace_id := public.realtime_topic_workspace_id(topic);
  if workspace_id is null then
    return false;
  end if;

  select w.type::text, w.user_id::text, w.team_id::text
    into workspace_type, workspace_owner_id, workspace_team_id
    from public.workspaces w
   where w.id = workspace_id;

  if workspace_type is null then
    return false;
  end if;

  if workspace_type = 'PERSONAL' then
    return workspace_owner_id = requesting_user_id;
  end if;

  if workspace_type = 'TEAM' then
    return exists (
      select 1
        from public.team_members tm
       where tm.team_id::text = workspace_team_id
         and tm.user_id::text = requesting_user_id
    );
  end if;

  return false;
end;
$$;


-- ---------------------------------------------------------------------
-- 2. Semantic workflow events from issue_activities.metadata
-- ---------------------------------------------------------------------
-- Workflow run actions in issue.service.ts write IssueActivity rows whose
-- metadata follows the WorkflowActivityMetadata shape:
--
--   {
--     "kind": "workflow",
--     "eventType": "workflow.review.requested",  -- canonical event name
--     "runStatus": "WAITING_REVIEW",
--     "currentStepId": "...",
--     "nextStepId": "...",
--     "targetUserId": "...",
--     ...
--   }
--
-- The legacy "issue.activity.created" event continues to fire on
-- issue:{id} for activity-tab listeners. Workflow-kind activities are
-- additionally rebroadcast under metadata.eventType on workflow_issue:{id}
-- and workspace:{id}, so collaboration semantics (review request, handoff,
-- blocked, advance, etc.) flow without any code change in NestJS services.

create or replace function public.realtime_issue_activity_created_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  workspace_id text;
  metadata jsonb;
  metadata_kind text;
  event_name text;
  payload jsonb;
  workflow_topic text;
  workspace_topic text;
begin
  select i.workspace_id::text
    into workspace_id
    from public.issues i
   where i.id = new.issue_id;

  -- Legacy event for issue activity tab.
  perform realtime.send(
    jsonb_build_object(
      'activityId', new.id,
      'issueId', new.issue_id,
      'workspaceId', workspace_id,
      'actorId', new.actor_id,
      'action', new.action
    ),
    'issue.activity.created',
    'issue:' || new.issue_id::text,
    true
  );

  metadata := new.metadata;
  if metadata is null then
    return new;
  end if;

  metadata_kind := metadata ->> 'kind';
  event_name := metadata ->> 'eventType';

  if metadata_kind <> 'workflow' or event_name is null or event_name = '' then
    return new;
  end if;

  workflow_topic := 'workflow_issue:' || new.issue_id::text;
  workspace_topic := 'workspace:' || workspace_id;

  payload := jsonb_build_object(
    'issueId', new.issue_id,
    'workspaceId', workspace_id,
    'event', event_name,
    'runStatus', metadata ->> 'runStatus',
    'currentStepId', metadata ->> 'currentStepId',
    'targetStepId', metadata ->> 'nextStepId',
    'actorId', new.actor_id,
    'activityId', new.id
  );

  perform realtime.send(payload, event_name, workflow_topic, true);
  perform realtime.send(payload, event_name, workspace_topic, true);

  return new;
end;
$$;

-- The trigger binding (after insert on public.issue_activities) was
-- created by the prior realtime migration; replacing the function body
-- above is sufficient.


-- ---------------------------------------------------------------------
-- 3. Inbox push: inbox_items -> user:{targetUserId}
-- ---------------------------------------------------------------------
-- inbox.service.ts upserts inbox items on every getInbox sync, so we
-- skip UPDATEs that did not actually change anything user-visible to
-- avoid noise on every read.

create or replace function public.realtime_inbox_item_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  user_topic text;
  payload jsonb;
  row_record public.inbox_items;
begin
  if tg_op = 'DELETE' then
    row_record := old;
  else
    row_record := new;

    if tg_op = 'UPDATE'
       and new.status is not distinct from old.status
       and new.bucket is not distinct from old.bucket
       and new.read_at is not distinct from old.read_at
       and new.done_at is not distinct from old.done_at
       and new.dismissed_at is not distinct from old.dismissed_at
       and new.snoozed_until is not distinct from old.snoozed_until
       and new.priority is not distinct from old.priority
       and new.requires_action is not distinct from old.requires_action
       and new.title is not distinct from old.title
       and new.summary is not distinct from old.summary then
      return new;
    end if;
  end if;

  user_topic := 'user:' || row_record.target_user_id::text;

  payload := jsonb_build_object(
    'operation', tg_op,
    'itemId', row_record.id,
    'workspaceId', row_record.workspace_id,
    'targetUserId', row_record.target_user_id,
    'type', row_record.type,
    'bucket', row_record.bucket,
    'status', row_record.status,
    'priority', row_record.priority,
    'requiresAction', row_record.requires_action,
    'projectId', row_record.project_id,
    'issueId', row_record.issue_id,
    'workflowRunId', row_record.workflow_run_id,
    'occurredAt', row_record.occurred_at
  );

  perform realtime.send(payload, 'inbox.updated', user_topic, true);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists realtime_inbox_item_broadcast on public.inbox_items;
create trigger realtime_inbox_item_broadcast
after insert or update or delete on public.inbox_items
for each row
execute function public.realtime_inbox_item_broadcast();


-- ---------------------------------------------------------------------
-- 4. Project summary invalidation: projects row changes
-- ---------------------------------------------------------------------
-- Issue-level changes already invalidate project-summary on the workspace
-- topic via realtime_issue_workspace_broadcast. This trigger covers
-- changes to the project row itself (brief, status, riskLevel, owner,
-- phase, etc) and project create/delete.

create or replace function public.realtime_project_summary_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  workspace_topic text;
  project_id text;
  workspace_id text;
  payload jsonb;
begin
  if tg_op = 'DELETE' then
    project_id := old.id::text;
    workspace_id := old.workspace_id::text;
  else
    project_id := new.id::text;
    workspace_id := new.workspace_id::text;

    if tg_op = 'UPDATE'
       and new.name is not distinct from old.name
       and new.brief is not distinct from old.brief
       and new.description is not distinct from old.description
       and new.status is not distinct from old.status
       and new.phase is not distinct from old.phase
       and new.risk_level is not distinct from old.risk_level
       and new.owner_member_id is not distinct from old.owner_member_id
       and new.last_sync_at is not distinct from old.last_sync_at
       and new.visibility is not distinct from old.visibility
       and new.workspace_id is not distinct from old.workspace_id then
      return new;
    end if;
  end if;

  workspace_topic := 'workspace:' || workspace_id;

  payload := jsonb_build_object(
    'operation', tg_op,
    'projectId', project_id,
    'workspaceId', workspace_id
  );

  perform realtime.send(payload, 'project.summary.invalidated', workspace_topic, true);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists realtime_project_summary_broadcast on public.projects;
create trigger realtime_project_summary_broadcast
after insert or update or delete on public.projects
for each row
execute function public.realtime_project_summary_broadcast();
