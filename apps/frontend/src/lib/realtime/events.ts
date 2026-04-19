export const REALTIME_EVENTS = {
  COMMENT_CREATED: "comment.created",
  ISSUE_CREATED: "issue.created",
  ISSUE_UPDATED: "issue.updated",
  ISSUE_DELETED: "issue.deleted",
  ISSUE_ACTIVITY_CREATED: "issue.activity.created",
  ISSUE_STEP_RECORD_CREATED: "issue.step_record.created",
  WORKFLOW_RUN_CREATED: "workflow.run.created",
  WORKFLOW_STEP_STATUS_CHANGED: "workflow.step.status_changed",
  WORKFLOW_STEP_COMPLETED: "workflow.step.completed",
  WORKFLOW_STEP_REVERTED: "workflow.step.reverted",
  WORKFLOW_RECORD_SUBMITTED: "workflow.record.submitted",
  WORKFLOW_REVIEW_REQUESTED: "workflow.review.requested",
  WORKFLOW_REVIEW_APPROVED: "workflow.review.approved",
  WORKFLOW_REVIEW_CHANGES_REQUESTED: "workflow.review.changes_requested",
  WORKFLOW_HANDOFF_REQUESTED: "workflow.handoff.requested",
  WORKFLOW_HANDOFF_ACCEPTED: "workflow.handoff.accepted",
  WORKFLOW_BLOCKED: "workflow.blocked",
  WORKFLOW_UNBLOCKED: "workflow.unblocked",
  WORKFLOW_RUN_COMPLETED: "workflow.run.completed",
  INBOX_UPDATED: "inbox.updated",
  PROJECT_SUMMARY_INVALIDATED: "project.summary.invalidated",
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export const ISSUE_REALTIME_EVENTS = [
  REALTIME_EVENTS.COMMENT_CREATED,
  REALTIME_EVENTS.ISSUE_UPDATED,
  REALTIME_EVENTS.ISSUE_DELETED,
  REALTIME_EVENTS.ISSUE_ACTIVITY_CREATED,
] as const satisfies readonly RealtimeEventName[];

export const WORKFLOW_REALTIME_EVENTS = [
  REALTIME_EVENTS.ISSUE_STEP_RECORD_CREATED,
  REALTIME_EVENTS.WORKFLOW_RUN_CREATED,
  REALTIME_EVENTS.WORKFLOW_STEP_STATUS_CHANGED,
  REALTIME_EVENTS.WORKFLOW_STEP_COMPLETED,
  REALTIME_EVENTS.WORKFLOW_STEP_REVERTED,
  REALTIME_EVENTS.WORKFLOW_RECORD_SUBMITTED,
  REALTIME_EVENTS.WORKFLOW_REVIEW_REQUESTED,
  REALTIME_EVENTS.WORKFLOW_REVIEW_APPROVED,
  REALTIME_EVENTS.WORKFLOW_REVIEW_CHANGES_REQUESTED,
  REALTIME_EVENTS.WORKFLOW_HANDOFF_REQUESTED,
  REALTIME_EVENTS.WORKFLOW_HANDOFF_ACCEPTED,
  REALTIME_EVENTS.WORKFLOW_BLOCKED,
  REALTIME_EVENTS.WORKFLOW_UNBLOCKED,
  REALTIME_EVENTS.WORKFLOW_RUN_COMPLETED,
] as const satisfies readonly RealtimeEventName[];

export const WORKSPACE_REALTIME_EVENTS = [
  REALTIME_EVENTS.ISSUE_CREATED,
  REALTIME_EVENTS.ISSUE_UPDATED,
  REALTIME_EVENTS.ISSUE_DELETED,
  REALTIME_EVENTS.WORKFLOW_RUN_CREATED,
  REALTIME_EVENTS.WORKFLOW_STEP_STATUS_CHANGED,
  REALTIME_EVENTS.WORKFLOW_STEP_COMPLETED,
  REALTIME_EVENTS.WORKFLOW_STEP_REVERTED,
  REALTIME_EVENTS.WORKFLOW_RECORD_SUBMITTED,
  REALTIME_EVENTS.WORKFLOW_REVIEW_REQUESTED,
  REALTIME_EVENTS.WORKFLOW_REVIEW_APPROVED,
  REALTIME_EVENTS.WORKFLOW_REVIEW_CHANGES_REQUESTED,
  REALTIME_EVENTS.WORKFLOW_HANDOFF_REQUESTED,
  REALTIME_EVENTS.WORKFLOW_HANDOFF_ACCEPTED,
  REALTIME_EVENTS.WORKFLOW_BLOCKED,
  REALTIME_EVENTS.WORKFLOW_UNBLOCKED,
  REALTIME_EVENTS.WORKFLOW_RUN_COMPLETED,
  REALTIME_EVENTS.PROJECT_SUMMARY_INVALIDATED,
] as const satisfies readonly RealtimeEventName[];

export const USER_REALTIME_EVENTS = [
  REALTIME_EVENTS.INBOX_UPDATED,
] as const satisfies readonly RealtimeEventName[];

export type IssueRealtimeEditingField =
  | "title"
  | "description"
  | "state"
  | "assignee"
  | "dueDate"
  | "priority";

export interface IssueRealtimePresence {
  clientSessionId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  editingField: IssueRealtimeEditingField | null;
  focusingNode: string | null;
}

export interface CommentCreatedPayload {
  issueId: string;
  workspaceId: string;
  commentId: string;
  parentId: string | null;
  authorId: string;
}

export interface IssueUpdatedPayload {
  issueId: string;
  workspaceId: string;
  changedFields: string[];
  issueType: string | null;
}

export interface IssueCreatedPayload {
  issueId: string;
  workspaceId: string;
  issueType: string | null;
}

export interface IssueDeletedPayload {
  issueId: string;
  workspaceId: string;
}

export interface IssueActivityCreatedPayload {
  issueId: string;
  workspaceId: string;
  activityId: string;
  actorId: string;
  action: string;
}

export interface IssueStepRecordCreatedPayload {
  issueId: string;
  workspaceId: string;
  stepRecordId: string;
  stepId: string;
  assigneeId: string;
}

export interface WorkflowRunEventPayload {
  issueId: string;
  workspaceId: string;
  event: string;
  runStatus: string | null;
  currentStepId: string | null;
  targetStepId?: string | null;
  actorId?: string | null;
  activityId?: string | null;
}

export interface InboxUpdatedPayload {
  operation: "INSERT" | "UPDATE" | "DELETE";
  itemId: string;
  workspaceId: string;
  targetUserId: string;
  type: string;
  bucket: string;
  status: string;
  priority: string;
  requiresAction: boolean;
  projectId: string | null;
  issueId: string | null;
  workflowRunId: string | null;
  occurredAt: string;
}

export interface ProjectSummaryInvalidatedPayload {
  operation: "INSERT" | "UPDATE" | "DELETE";
  projectId: string;
  workspaceId: string;
}

export interface RealtimePayloadMap {
  [REALTIME_EVENTS.COMMENT_CREATED]: CommentCreatedPayload;
  [REALTIME_EVENTS.ISSUE_CREATED]: IssueCreatedPayload;
  [REALTIME_EVENTS.ISSUE_UPDATED]: IssueUpdatedPayload;
  [REALTIME_EVENTS.ISSUE_DELETED]: IssueDeletedPayload;
  [REALTIME_EVENTS.ISSUE_ACTIVITY_CREATED]: IssueActivityCreatedPayload;
  [REALTIME_EVENTS.ISSUE_STEP_RECORD_CREATED]: IssueStepRecordCreatedPayload;
  [REALTIME_EVENTS.WORKFLOW_RUN_CREATED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_STEP_STATUS_CHANGED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_STEP_COMPLETED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_STEP_REVERTED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_RECORD_SUBMITTED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_REVIEW_REQUESTED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_REVIEW_APPROVED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_REVIEW_CHANGES_REQUESTED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_HANDOFF_REQUESTED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_HANDOFF_ACCEPTED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_BLOCKED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_UNBLOCKED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.WORKFLOW_RUN_COMPLETED]: WorkflowRunEventPayload;
  [REALTIME_EVENTS.INBOX_UPDATED]: InboxUpdatedPayload;
  [REALTIME_EVENTS.PROJECT_SUMMARY_INVALIDATED]: ProjectSummaryInvalidatedPayload;
}

export function isWorkflowRealtimeEvent(
  event: RealtimeEventName,
): event is
  | typeof REALTIME_EVENTS.ISSUE_STEP_RECORD_CREATED
  | (typeof WORKFLOW_REALTIME_EVENTS)[number] {
  return (WORKFLOW_REALTIME_EVENTS as readonly RealtimeEventName[]).includes(
    event,
  );
}
