export interface WorkflowLevelDocLike {
  issueId?: string | null;
}

export function filterWorkflowLevelDocs<T extends WorkflowLevelDocLike>(
  docs: readonly T[],
) {
  return docs.filter((doc) => !doc.issueId);
}
