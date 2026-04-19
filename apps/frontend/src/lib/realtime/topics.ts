export function buildWorkspaceTopic(workspaceId: string) {
  return `workspace:${workspaceId}`;
}

export function buildIssueTopic(issueId: string) {
  return `issue:${issueId}`;
}

export function buildWorkflowIssueTopic(issueId: string) {
  return `workflow_issue:${issueId}`;
}

export function buildUserTopic(userId: string) {
  return `user:${userId}`;
}
