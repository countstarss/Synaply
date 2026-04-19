-- =====================================================================
-- Realtime cleanup: issue semantic events + frontend dedupe support
-- =====================================================================
-- This migration tightens the issue broadcast contract so the database is
-- the authoritative source for semantic create/update/delete events:
--
-- 1. `issue.created` is emitted for INSERTs on workspace topics.
-- 2. `issue.updated` remains the UPDATE event on workspace topics.
-- 3. `issue.deleted` is emitted for DELETEs on workspace topics and the
--    issue:{id} topic so detail views can react without frontend fallback.
--
-- Existing frontend listeners already subscribe to all three event names,
-- so this change is rollout-safe and lets us remove duplicated client-side
-- REST broadcasts for every issue mutation except a temporary issue-detail
-- delete fallback.
-- =====================================================================

create or replace function public.realtime_issue_workspace_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, realtime, pg_temp
as $$
declare
  workspace_topic text;
  old_workspace_topic text;
  issue_topic text;
  payload jsonb;
  old_payload jsonb;
  changed_fields text[];
  issue_id text;
  workspace_id text;
  issue_type text;
  event_name text;
begin
  if tg_op = 'INSERT' then
    issue_id := new.id::text;
    workspace_id := new.workspace_id::text;
    issue_type := new."issueType"::text;
    changed_fields := array['created'];
    event_name := 'issue.created';
  elsif tg_op = 'UPDATE' then
    issue_id := new.id::text;
    workspace_id := new.workspace_id::text;
    issue_type := new."issueType"::text;
    changed_fields := public.realtime_issue_changed_fields(old, new);

    if coalesce(array_length(changed_fields, 1), 0) = 0 then
      return new;
    end if;

    event_name := 'issue.updated';
  else
    issue_id := old.id::text;
    workspace_id := old.workspace_id::text;
    issue_type := old."issueType"::text;
    changed_fields := array['deleted'];
    event_name := 'issue.deleted';
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
    event_name,
    workspace_topic,
    true
  );

  if tg_op = 'UPDATE' and old.workspace_id::text is distinct from new.workspace_id::text then
    old_workspace_topic := 'workspace:' || old.workspace_id::text;
    old_payload := jsonb_build_object(
      'operation', tg_op,
      'issueId', issue_id,
      'workspaceId', old.workspace_id,
      'changedFields', to_jsonb(changed_fields),
      'issueType', old."issueType"::text
    );

    perform realtime.send(
      old_payload,
      event_name,
      old_workspace_topic,
      true
    );
  end if;

  if tg_op = 'DELETE' then
    issue_topic := 'issue:' || issue_id;

    perform realtime.send(
      payload,
      event_name,
      issue_topic,
      true
    );

    return old;
  end if;

  return new;
end;
$$;
