create or replace function public.realtime_topic_workspace_id(topic text)
returns text
language plpgsql
stable
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  topic_kind text;
  topic_resource_id text;
  resolved_workspace_id text;
begin
  topic_kind := split_part(coalesce(topic, ''), ':', 1);
  topic_resource_id := nullif(split_part(coalesce(topic, ''), ':', 2), '');

  if topic_kind = 'workspace' then
    return topic_resource_id;
  end if;

  if topic_kind in ('issue', 'workflow_issue') and topic_resource_id is not null then
    select i.workspace_id
      into resolved_workspace_id
      from public.issues i
     where i.id = topic_resource_id;

    return resolved_workspace_id;
  end if;

  return null;
end;
$$;

create or replace function public.can_access_realtime_topic(topic text, user_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  workspace_id text;
  workspace_type text;
  workspace_owner_id text;
  workspace_team_id text;
begin
  if user_id is null then
    return false;
  end if;

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
    return workspace_owner_id = user_id;
  end if;

  if workspace_type = 'TEAM' then
    return exists (
      select 1
        from public.team_members tm
       where tm.team_id::text = workspace_team_id
         and tm.user_id::text = user_id
    );
  end if;

  return false;
end;
$$;

create or replace function public.realtime_issue_changed_fields(
  old_issue public.issues,
  new_issue public.issues
)
returns text[]
language plpgsql
stable
as $$
declare
  changed_fields text[];
begin
  changed_fields := array_remove(
    array[
      case when new_issue.workspace_id is distinct from old_issue.workspace_id then 'workspaceId' end,
      case when new_issue.title is distinct from old_issue.title then 'title' end,
      case when new_issue.description is distinct from old_issue.description then 'description' end,
      case when new_issue.state_id is distinct from old_issue.state_id then 'stateId' end,
      case when new_issue.project_id is distinct from old_issue.project_id then 'projectId' end,
      case when new_issue.direct_assignee_id is distinct from old_issue.direct_assignee_id then 'directAssigneeId' end,
      case when new_issue.due_date is distinct from old_issue.due_date then 'dueDate' end,
      case when new_issue.priority is distinct from old_issue.priority then 'priority' end,
      case when new_issue.visibility is distinct from old_issue.visibility then 'visibility' end,
      case when new_issue."issueType" is distinct from old_issue."issueType" then 'issueType' end,
      case when new_issue.workflow_id is distinct from old_issue.workflow_id then 'workflowId' end,
      case when new_issue."workflowSnapshot" is distinct from old_issue."workflowSnapshot" then 'workflowSnapshot' end,
      case when new_issue."totalSteps" is distinct from old_issue."totalSteps" then 'totalSteps' end,
      case when new_issue.current_step_id is distinct from old_issue.current_step_id then 'currentStepId' end,
      case when new_issue."currentStepIndex" is distinct from old_issue."currentStepIndex" then 'currentStepIndex' end,
      case when new_issue."currentStepStatus" is distinct from old_issue."currentStepStatus" then 'currentStepStatus' end,
      case when new_issue.key is distinct from old_issue.key then 'key' end,
      case when new_issue.sequence is distinct from old_issue.sequence then 'sequence' end,
      case when new_issue.creator_member_id is distinct from old_issue.creator_member_id then 'creatorMemberId' end
    ],
    null
  )::text[];

  return changed_fields;
end;
$$;

alter table realtime.messages enable row level security;

drop policy if exists "authenticated can receive private realtime messages" on realtime.messages;
create policy "authenticated can receive private realtime messages"
on realtime.messages
for select
to authenticated
using (
  public.can_access_realtime_topic((select realtime.topic()), (select auth.uid())::text)
  and realtime.messages.extension in ('broadcast', 'presence')
);

drop policy if exists "authenticated can send presence on private realtime messages" on realtime.messages;
create policy "authenticated can send presence on private realtime messages"
on realtime.messages
for insert
to authenticated
with check (
  public.can_access_realtime_topic((select realtime.topic()), (select auth.uid())::text)
  and realtime.messages.extension = 'presence'
);

create or replace function public.realtime_comment_created_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  topic text;
begin
  topic := 'issue:' || new.issue_id::text;

  perform realtime.send(
    jsonb_build_object(
      'commentId', new.id,
      'issueId', new.issue_id,
      'workspaceId', new.workspace_id,
      'parentId', new.parent_id,
      'authorId', new.author_id
    ),
    'comment.created',
    topic,
    true
  );

  return new;
end;
$$;

create or replace function public.realtime_issue_workspace_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  workspace_topic text;
  old_workspace_topic text;
  payload jsonb;
  changed_fields text[];
  issue_id text;
  workspace_id text;
  issue_type text;
begin
  if tg_op = 'INSERT' then
    issue_id := new.id::text;
    workspace_id := new.workspace_id::text;
    issue_type := new."issueType"::text;
    changed_fields := array['created'];
  elsif tg_op = 'UPDATE' then
    issue_id := new.id::text;
    workspace_id := new.workspace_id::text;
    issue_type := new."issueType"::text;
    changed_fields := public.realtime_issue_changed_fields(old, new);

    if coalesce(array_length(changed_fields, 1), 0) = 0 then
      return new;
    end if;
  else
    issue_id := old.id::text;
    workspace_id := old.workspace_id::text;
    issue_type := old."issueType"::text;
    changed_fields := array['deleted'];
  end if;

  workspace_topic := 'workspace:' || workspace_id;

  payload := jsonb_build_object(
    'operation', tg_op,
    'issueId', issue_id,
    'workspaceId', workspace_id,
    'changedFields', to_jsonb(changed_fields),
    'issueType', issue_type
  );

  perform realtime.send(
    payload,
    'issue.updated',
    workspace_topic,
    true
  );

  if tg_op = 'UPDATE' and old.workspace_id::text is distinct from new.workspace_id::text then
    old_workspace_topic := 'workspace:' || old.workspace_id::text;

    perform realtime.send(
      payload,
      'issue.updated',
      old_workspace_topic,
      true
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.realtime_issue_detail_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  issue_topic text;
  changed_fields text[];
begin
  changed_fields := public.realtime_issue_changed_fields(old, new);
  if coalesce(array_length(changed_fields, 1), 0) = 0 then
    return new;
  end if;

  issue_topic := 'issue:' || new.id::text;

  perform realtime.send(
    jsonb_build_object(
      'operation', tg_op,
      'issueId', new.id,
      'workspaceId', new.workspace_id,
      'changedFields', to_jsonb(changed_fields),
      'issueType', new."issueType"::text
    ),
    'issue.updated',
    issue_topic,
    true
  );

  return new;
end;
$$;

create or replace function public.realtime_issue_workflow_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  workflow_topic text;
  base_payload jsonb;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  workflow_topic := 'workflow_issue:' || new.id::text;
  base_payload := jsonb_build_object(
    'issueId', new.id,
    'workspaceId', new.workspace_id,
    'workflowId', new.workflow_id,
    'fromStepId', old.current_step_id,
    'toStepId', new.current_step_id,
    'fromIndex', old."currentStepIndex",
    'toIndex', new."currentStepIndex",
    'currentStepStatus', new."currentStepStatus"::text
  );

  if new."currentStepStatus" is distinct from old."currentStepStatus" then
    perform realtime.send(
      base_payload,
      'workflow.node.status_changed',
      workflow_topic,
      true
    );
  end if;

  if new."currentStepIndex" > old."currentStepIndex" then
    perform realtime.send(
      base_payload,
      'workflow.node.moved_next',
      workflow_topic,
      true
    );
  elsif new."currentStepIndex" < old."currentStepIndex" then
    perform realtime.send(
      base_payload,
      'workflow.node.moved_previous',
      workflow_topic,
      true
    );
  end if;

  return new;
end;
$$;

create or replace function public.realtime_issue_activity_created_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, realtime, pg_temp
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'activityId', new.id,
      'issueId', new.issue_id,
      'workspaceId', (select i.workspace_id from public.issues i where i.id = new.issue_id),
      'actorId', new.actor_id,
      'action', new.action
    ),
    'issue.activity.created',
    'issue:' || new.issue_id::text,
    true
  );

  return new;
end;
$$;

create or replace function public.realtime_issue_step_record_created_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, realtime, pg_temp
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'stepRecordId', new.id,
      'issueId', new.issue_id,
      'workspaceId', (select i.workspace_id from public.issues i where i.id = new.issue_id),
      'stepId', new."stepId",
      'assigneeId', new.assignee_id
    ),
    'issue.step_record.created',
    'workflow_issue:' || new.issue_id::text,
    true
  );

  return new;
end;
$$;

drop trigger if exists realtime_comment_created_broadcast on public.comments;
create trigger realtime_comment_created_broadcast
after insert on public.comments
for each row
execute function public.realtime_comment_created_broadcast();

drop trigger if exists realtime_issue_workspace_broadcast on public.issues;
create trigger realtime_issue_workspace_broadcast
after insert or update or delete on public.issues
for each row
execute function public.realtime_issue_workspace_broadcast();

drop trigger if exists realtime_issue_detail_broadcast on public.issues;
create trigger realtime_issue_detail_broadcast
after update on public.issues
for each row
execute function public.realtime_issue_detail_broadcast();

drop trigger if exists realtime_issue_workflow_broadcast on public.issues;
create trigger realtime_issue_workflow_broadcast
after update on public.issues
for each row
execute function public.realtime_issue_workflow_broadcast();

drop trigger if exists realtime_issue_activity_created_broadcast on public.issue_activities;
create trigger realtime_issue_activity_created_broadcast
after insert on public.issue_activities
for each row
execute function public.realtime_issue_activity_created_broadcast();

drop trigger if exists realtime_issue_step_record_created_broadcast on public."IssueStepRecord";
create trigger realtime_issue_step_record_created_broadcast
after insert on public."IssueStepRecord"
for each row
execute function public.realtime_issue_step_record_created_broadcast();
