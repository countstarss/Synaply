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
