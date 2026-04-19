import {
  IssuePriority,
  IssueScope,
  IssueStateCategory,
  IssueStatus,
  IssueType,
  VisibilityType,
} from "@/types/prisma";
import { getBackendBaseUrl } from "@/lib/backend-url";

const API_BASE_URL = getBackendBaseUrl();

// MARK: Issue
export interface IssueStateSummary {
  id: string;
  name: string;
  color?: string | null;
  category?: IssueStateCategory;
  position?: number;
  isDefault?: boolean;
  isArchived?: boolean;
  workspaceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssueProject {
  id: string;
  name: string;
  description?: string | null;
  workspaceId?: string;
  visibility?: string;
  creatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssueMemberUser {
  id: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
}

export interface IssueAssigneeMember {
  id: string;
  userId?: string;
  role?: string;
  user?: IssueMemberUser | null;
}

export interface IssueAssignee {
  id: string;
  issueId: string;
  memberId: string;
  assignedAt?: string;
  member?: IssueAssigneeMember | null;
}

export interface IssueLabelSummary {
  id: string;
  name: string;
  color?: string | null;
  workspaceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssueLabel {
  id: string;
  issueId: string;
  labelId: string;
  createdAt?: string;
  label?: IssueLabelSummary | null;
}

export interface Issue {
  id: string;
  key?: string;
  sequence?: number;
  title: string;
  description?: string | null;
  workspaceId: string;
  projectId?: string | null;
  directAssigneeId?: string | null;
  creatorId: string;
  creatorMemberId?: string | null;
  stateId?: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  priority?: IssuePriority | null;
  visibility?: VisibilityType;

  /**
   * Issue 类型：NORMAL / WORKFLOW
   */
  issueType?: IssueType | null;

  // 工作流相关字段
  workflowId?: string | null;
  totalSteps?: number | null;
  currentStepId?: string | null;
  currentStepIndex?: number | null;
  currentStepStatus?: IssueStatus | null;
  workflowSnapshot?: Record<string, unknown> | null;
  workflowRun?: WorkflowRunSummary | null;
  aiHandoffPrompt?: string | null;
  aiHandoffPromptUpdatedAt?: string | null;
  state?: IssueStateSummary | null;
  project?: IssueProject | null;
  assignees?: IssueAssignee[];
  labels?: IssueLabel[];
}

type WorkflowIssueIdentity = Pick<
  Issue,
  | "issueType"
  | "workflowId"
  | "workflowSnapshot"
>;

// MARK: CreateDTO
export interface CreateIssueDto {
  title: string;
  description?: string;
  workspaceId: string;
  projectId?: string;
  directAssigneeId?: string;
  dueDate?: string;
  stateId?: string;
  priority?: IssuePriority;
  visibility?: VisibilityType;
  assigneeIds?: string[];
  labelIds?: string[];
}

export interface IssueQueryParams {
  scope?: IssueScope;
  stateId?: string;
  stateCategory?: IssueStateCategory;
  projectId?: string;
  assigneeId?: string;
  labelId?: string;
  issueType?: IssueType;
  priority?: IssuePriority;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  cursor?: string;
  limit?: number;
}

// MARK: WorkflowIssueDto
export interface CreateWorkflowIssueDto {
  title: string;
  description?: string;
  workspaceId: string;
  dueDate?: string;
  projectId?: string;
  directAssigneeId?: string;
  stateId?: string;
  priority?: IssuePriority;
  visibility?: VisibilityType;
  assigneeIds?: string[];
  labelIds?: string[];
  workflowId: string;
}

export type WorkflowRunStatus =
  | "ACTIVE"
  | "BLOCKED"
  | "WAITING_REVIEW"
  | "HANDOFF_PENDING"
  | "DONE";

export type WorkflowRunActionType =
  | "execution"
  | "blocked"
  | "review"
  | "handoff"
  | "done";

export interface WorkflowRunSummary {
  templateId?: string | null;
  templateVersion?: string | null;
  runStatus: WorkflowRunStatus;
  currentActionType: WorkflowRunActionType;
  currentStepId?: string | null;
  currentStepIndex?: number | null;
  currentStepStatus?: IssueStatus | null;
  currentStepName?: string | null;
  currentAssigneeUserId?: string | null;
  currentAssigneeName?: string | null;
  totalSteps?: number | null;
  lastEventType?: string | null;
  blockedReason?: string | null;
  targetUserId?: string | null;
  targetName?: string | null;
}

export interface WorkflowRunActivityMetadata {
  kind: "workflow";
  eventType: string;
  runStatus: WorkflowRunStatus;
  actionType: WorkflowRunActionType;
  templateId?: string | null;
  templateVersion?: string | null;
  currentStepId?: string | null;
  currentStepName?: string | null;
  currentStepIndex?: number | null;
  previousStepId?: string | null;
  previousStepName?: string | null;
  nextStepId?: string | null;
  nextStepName?: string | null;
  assigneeUserId?: string | null;
  assigneeName?: string | null;
  targetUserId?: string | null;
  targetName?: string | null;
  reason?: string | null;
  comment?: string | null;
  resultText?: string | null;
}

export function isWorkflowIssue(issue: WorkflowIssueIdentity | null | undefined) {
  if (!issue) {
    return false;
  }

  return Boolean(
    issue.issueType === IssueType.WORKFLOW ||
      issue.workflowId ||
      issue.workflowSnapshot,
  );
}

function normalizeIssueType(issue: Issue) {
  const normalizedIssueType = isWorkflowIssue(issue)
    ? IssueType.WORKFLOW
    : IssueType.NORMAL;

  if (issue.issueType === normalizedIssueType) {
    return issue;
  }

  return {
    ...issue,
    issueType: normalizedIssueType,
  };
}

function normalizeIssueList(issues: Issue[]) {
  return issues.map(normalizeIssueType);
}

/**
 * 统一的 API 请求函数
 * @param endpoint API 路径
 * @param token Supabase JWT
 * @param options 请求选项 (method, body, etc.)
 * @returns Promise<T>
 */
async function fetchApi<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = "API 请求失败";

    try {
      const errorData = await response.json();
      message =
        errorData?.message ||
        errorData?.error ||
        (typeof errorData === "string" ? errorData : message);
    } catch {
      const errorText = await response.text().catch(() => "");
      message = errorText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

function buildIssueQueryString(params: IssueQueryParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.scope) searchParams.set("scope", params.scope);
  if (params.stateId) searchParams.set("stateId", params.stateId);
  if (params.stateCategory) {
    searchParams.set("stateCategory", params.stateCategory);
  }
  if (params.projectId) searchParams.set("projectId", params.projectId);
  if (params.assigneeId) searchParams.set("assigneeId", params.assigneeId);
  if (params.labelId) searchParams.set("labelId", params.labelId);
  if (params.issueType) searchParams.set("issueType", params.issueType);
  if (params.priority) searchParams.set("priority", params.priority);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.limit) searchParams.set("limit", `${params.limit}`);

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * 创建新的 Issue (简化版)
 * @param issueData 创建 Issue 所需的数据
 * @param token Supabase JWT
 * @returns Promise<Issue>
 */
export async function createIssue(
  issueData: CreateIssueDto,
  token: string,
): Promise<Issue> {
  const { workspaceId } = issueData;
  const issue = await fetchApi<Issue>(
    `/workspaces/${workspaceId}/issues/direct-assignee`,
    token,
    {
      method: "POST",
      body: JSON.stringify(issueData),
    },
  );

  return normalizeIssueType(issue);
}

/**
 * 创建基于工作流的 Issue
 * @param issueData 创建工作流 Issue 所需的数据
 * @param token Supabase JWT
 * @returns Promise<Issue>
 */
export async function createWorkflowIssue(
  issueData: CreateWorkflowIssueDto,
  token: string,
): Promise<Issue> {
  const { workspaceId } = issueData;
  const issue = await fetchApi<Issue>(
    `/workspaces/${workspaceId}/issues/workflow`,
    token,
    {
      method: "POST",
      body: JSON.stringify(issueData),
    },
  );

  return normalizeIssueType(issue);
}

/**
 * 获取指定工作空间下的所有 Issue (简化版)
 * @param workspaceId 工作空间 ID
 * @param token Supabase JWT
 * @returns Promise<Issue[]>
 */
export async function getIssues(
  workspaceId: string,
  token: string,
  params: IssueQueryParams = {},
): Promise<Issue[]> {
  const shouldFetchSinglePage =
    params.limit !== undefined || params.cursor !== undefined;

  if (shouldFetchSinglePage) {
    const issues = await fetchApi<Issue[]>(
      `/workspaces/${workspaceId}/issues${buildIssueQueryString(params)}`,
      token,
    );

    return normalizeIssueList(issues);
  }

  const pageSize = 100;
  const issues: Issue[] = [];
  let cursor: string | undefined;

  while (true) {
    const page = await fetchApi<Issue[]>(
      `/workspaces/${workspaceId}/issues${buildIssueQueryString({
        ...params,
        limit: pageSize,
        cursor,
      })}`,
      token,
    );

    issues.push(...page);

    if (page.length < pageSize) {
      break;
    }

    cursor = page[page.length - 1]?.id;

    if (!cursor) {
      break;
    }
  }

  return normalizeIssueList(issues);
}

export async function getIssue(
  workspaceId: string,
  issueId: string,
  token: string,
): Promise<Issue | null> {
  const issue = await fetchApi<Issue | null>(
    `/workspaces/${workspaceId}/issues/${issueId}`,
    token,
  );

  return issue ? normalizeIssueType(issue) : issue;
}

/**
 * 更新 Issue 信息（PATCH 部分字段）
 */
export async function updateIssue(
  workspaceId: string,
  issueId: string,
  data: Partial<Issue>,
  token: string,
): Promise<Issue> {
  const issue = await fetchApi<Issue>(
    `/workspaces/${workspaceId}/issues/${issueId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );

  return normalizeIssueType(issue);
}

/**
 * 取消 Issue（软取消）
 */
export async function cancelIssue(
  workspaceId: string,
  issueId: string,
  token: string,
): Promise<Issue> {
  const issue = await fetchApi<Issue>(
    `/workspaces/${workspaceId}/issues/${issueId}/cancel`,
    token,
    {
      method: "PATCH",
    },
  );

  return normalizeIssueType(issue);
}

/**
 * 删除 Issue
 */
export async function deleteIssue(
  workspaceId: string,
  issueId: string,
  token: string,
): Promise<void> {
  await fetchApi<void>(`/workspaces/${workspaceId}/issues/${issueId}`, token, {
    method: "DELETE",
  });
}

// -------------------- Step Record & Activity --------------------
// MARK: IssueStepRecord
export interface IssueStepRecord {
  id: string;
  issueId: string;
  stepId: string;
  stepName: string;
  index: number;
  resultText?: string;
  attachments?: unknown;
  assigneeId: string;
  createdAt: string;
  assignee?: IssueAssigneeMember | null;
}
// MARK: StepRecordDto
export interface CreateIssueStepRecordDto {
  stepId: string;
  stepName: string;
  index: number;
  resultText?: string;
  attachments?: unknown;
  assigneeId: string;
}

export async function createIssueStepRecord(
  workspaceId: string,
  issueId: string,
  data: CreateIssueStepRecordDto,
  token: string,
): Promise<IssueStepRecord> {
  return fetchApi<IssueStepRecord>(
    `/workspaces/${workspaceId}/issues/${issueId}/steps`,
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getIssueStepRecords(
  workspaceId: string,
  issueId: string,
  token: string,
): Promise<IssueStepRecord[]> {
  return fetchApi<IssueStepRecord[]>(
    `/workspaces/${workspaceId}/issues/${issueId}/steps`,
    token,
  );
}

// MARK: IssueActivity
export interface IssueActivity {
  id: string;
  issueId: string;
  actorId: string;
  action: string;
  metadata?: WorkflowRunActivityMetadata | Record<string, unknown>;
  createdAt: string;
  actor?: IssueAssigneeMember | null;
}

export interface CreateIssueActivityDto {
  action: string;
  metadata?: unknown;
}

export async function createIssueActivity(
  workspaceId: string,
  issueId: string,
  data: CreateIssueActivityDto,
  token: string,
): Promise<IssueActivity> {
  return fetchApi<IssueActivity>(
    `/workspaces/${workspaceId}/issues/${issueId}/activities`,
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getIssueActivities(
  workspaceId: string,
  issueId: string,
  token: string,
): Promise<IssueActivity[]> {
  return fetchApi<IssueActivity[]>(
    `/workspaces/${workspaceId}/issues/${issueId}/activities`,
    token,
  );
}

export interface UpdateWorkflowRunStatusDto {
  status: IssueStatus;
  comment?: string;
}

export interface AdvanceWorkflowRunDto {
  resultText?: string;
  comment?: string;
  attachments?: unknown;
  completionConfirmed?: boolean;
  issueTitleConfirmation?: string;
}

export interface RevertWorkflowRunDto {
  comment?: string;
}

export interface BlockWorkflowRunDto {
  reason?: string;
}

export interface UnblockWorkflowRunDto {
  comment?: string;
  restoreStatus?: IssueStatus;
}

export interface RequestWorkflowReviewDto {
  targetUserId?: string;
  targetName?: string;
  comment?: string;
}

export type WorkflowReviewOutcome = "APPROVED" | "CHANGES_REQUESTED";

export interface RespondWorkflowReviewDto {
  outcome: WorkflowReviewOutcome;
  comment?: string;
}

export interface RequestWorkflowHandoffDto {
  targetUserId?: string;
  targetName?: string;
  comment?: string;
}

export interface AcceptWorkflowHandoffDto {
  comment?: string;
}

export interface SubmitWorkflowRecordDto {
  resultText?: string;
  attachments?: unknown;
}

async function postWorkflowRunAction<TResponse, TPayload extends object | undefined>(
  workspaceId: string,
  issueId: string,
  action: string,
  token: string,
  payload?: TPayload,
): Promise<TResponse> {
  return fetchApi<TResponse>(
    `/workspaces/${workspaceId}/workflow-runs/${issueId}/${action}`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    },
  );
}

export async function getWorkflowRun(
  workspaceId: string,
  issueId: string,
  token: string,
): Promise<Issue> {
  const issue = await fetchApi<Issue>(
    `/workspaces/${workspaceId}/workflow-runs/${issueId}`,
    token,
  );

  return normalizeIssueType(issue);
}

export async function updateWorkflowRunStatus(
  workspaceId: string,
  issueId: string,
  data: UpdateWorkflowRunStatusDto,
  token: string,
): Promise<Issue> {
  const issue = await postWorkflowRunAction<Issue, UpdateWorkflowRunStatusDto>(
    workspaceId,
    issueId,
    "status",
    token,
    data,
  );

  return normalizeIssueType(issue);
}

export async function advanceWorkflowRun(
  workspaceId: string,
  issueId: string,
  data: AdvanceWorkflowRunDto,
  token: string,
): Promise<Issue> {
  const issue = await postWorkflowRunAction<Issue, AdvanceWorkflowRunDto>(
    workspaceId,
    issueId,
    "advance",
    token,
    data,
  );

  return normalizeIssueType(issue);
}

export async function revertWorkflowRun(
  workspaceId: string,
  issueId: string,
  data: RevertWorkflowRunDto,
  token: string,
): Promise<Issue> {
  const issue = await postWorkflowRunAction<Issue, RevertWorkflowRunDto>(
    workspaceId,
    issueId,
    "revert",
    token,
    data,
  );

  return normalizeIssueType(issue);
}

export async function blockWorkflowRun(
  workspaceId: string,
  issueId: string,
  data: BlockWorkflowRunDto,
  token: string,
): Promise<Issue> {
  const issue = await postWorkflowRunAction<Issue, BlockWorkflowRunDto>(
    workspaceId,
    issueId,
    "block",
    token,
    data,
  );

  return normalizeIssueType(issue);
}

export async function unblockWorkflowRun(
  workspaceId: string,
  issueId: string,
  data: UnblockWorkflowRunDto,
  token: string,
): Promise<Issue> {
  const issue = await postWorkflowRunAction<Issue, UnblockWorkflowRunDto>(
    workspaceId,
    issueId,
    "unblock",
    token,
    data,
  );

  return normalizeIssueType(issue);
}

export async function requestWorkflowReview(
  workspaceId: string,
  issueId: string,
  data: RequestWorkflowReviewDto,
  token: string,
): Promise<Issue> {
  const issue = await postWorkflowRunAction<Issue, RequestWorkflowReviewDto>(
    workspaceId,
    issueId,
    "request-review",
    token,
    data,
  );

  return normalizeIssueType(issue);
}

export async function requestWorkflowHandoff(
  workspaceId: string,
  issueId: string,
  data: RequestWorkflowHandoffDto,
  token: string,
): Promise<Issue> {
  const issue = await postWorkflowRunAction<Issue, RequestWorkflowHandoffDto>(
    workspaceId,
    issueId,
    "request-handoff",
    token,
    data,
  );

  return normalizeIssueType(issue);
}

export async function respondWorkflowReview(
  workspaceId: string,
  issueId: string,
  data: RespondWorkflowReviewDto,
  token: string,
): Promise<Issue> {
  const issue = await postWorkflowRunAction<Issue, RespondWorkflowReviewDto>(
    workspaceId,
    issueId,
    "respond-review",
    token,
    data,
  );

  return normalizeIssueType(issue);
}

export async function acceptWorkflowHandoff(
  workspaceId: string,
  issueId: string,
  data: AcceptWorkflowHandoffDto,
  token: string,
): Promise<Issue> {
  const issue = await postWorkflowRunAction<Issue, AcceptWorkflowHandoffDto>(
    workspaceId,
    issueId,
    "accept-handoff",
    token,
    data,
  );

  return normalizeIssueType(issue);
}

export async function submitWorkflowRecord(
  workspaceId: string,
  issueId: string,
  data: SubmitWorkflowRecordDto,
  token: string,
): Promise<Issue> {
  const issue = await postWorkflowRunAction<Issue, SubmitWorkflowRecordDto>(
    workspaceId,
    issueId,
    "submit-record",
    token,
    data,
  );

  return normalizeIssueType(issue);
}
