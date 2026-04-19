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
