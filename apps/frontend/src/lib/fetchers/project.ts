import { getBackendBaseUrl } from "@/lib/backend-url";
import {
  IssuePriority,
  IssueStateCategory,
  IssueStatus,
  IssueType,
  ProjectRiskLevel,
  ProjectStatus,
  VisibilityType,
} from "@/types/prisma";
import type { WorkflowResponse } from "@/lib/fetchers/workflow";

const API_BASE_URL = getBackendBaseUrl();

export type ProjectVisibility = VisibilityType;

export interface ProjectOwnerUser {
  id: string;
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
}

export interface ProjectOwnerMember {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: ProjectOwnerUser;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  brief?: string | null;
  status: ProjectStatus;
  phase?: string | null;
  riskLevel: ProjectRiskLevel;
  workspaceId: string;
  creatorId: string;
  ownerMemberId: string;
  owner?: ProjectOwnerMember | null;
  lastSyncAt?: string | null;
  visibility: ProjectVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  workspace?: {
    id: string;
    name: string;
    type: "PERSONAL" | "TEAM";
  };
}

export interface ProjectSummaryIssue {
  id: string;
  key?: string | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: IssuePriority | null;
  issueType?: IssueType | null;
  workflowId?: string | null;
  directAssigneeId?: string | null;
  currentStepStatus?: IssueStatus | null;
  currentStepIndex?: number | null;
  totalSteps?: number | null;
  createdAt: string;
  updatedAt: string;
  state?: {
    id: string;
    name: string;
    color?: string | null;
    category?: IssueStateCategory | null;
  } | null;
  assignees: Array<{
    member?: {
      id: string;
      user?: ProjectOwnerUser | null;
    } | null;
  }>;
}

export interface ProjectActivityItem {
  id: string;
  issueId: string;
  actorId: string;
  action: string;
  metadata?: unknown;
  createdAt: string;
  actor?: {
    id: string;
    user: ProjectOwnerUser;
  } | null;
  issue?: {
    id: string;
    key?: string | null;
    title: string;
  } | null;
}

export interface ProjectWorkflowSummary extends WorkflowResponse {
  issueCount: number;
}

export interface ProjectAttentionItem {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
}

export interface ProjectSummaryMetrics {
  totalIssues: number;
  openIssues: number;
  completedIssues: number;
  blockedIssues: number;
  overdueIssues: number;
  workflowCount: number;
  workflowIssueCount: number;
  highPriorityIssues: number;
  unassignedIssues: number;
  completionRate: number;
  staleSyncDays: number | null;
}

export interface ProjectSummary {
  project: ProjectDetail;
  metrics: ProjectSummaryMetrics;
  issueBreakdown: Record<IssueStateCategory, number>;
  keyIssues: ProjectSummaryIssue[];
  blockedIssues: ProjectSummaryIssue[];
  workflows: ProjectWorkflowSummary[];
  recentActivity: ProjectActivityItem[];
  attentionItems: ProjectAttentionItem[];
}

export interface DeleteProjectResult extends Project {
  deletedIssueCount: number;
  deletedDocCount: number;
  deletedFolderCount: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  brief?: string;
  status?: ProjectStatus;
  phase?: string;
  riskLevel?: ProjectRiskLevel;
  ownerMemberId?: string;
  lastSyncAt?: string;
  visibility?: ProjectVisibility;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  brief?: string;
  status?: ProjectStatus;
  phase?: string;
  riskLevel?: ProjectRiskLevel;
  ownerMemberId?: string;
  lastSyncAt?: string;
  visibility?: ProjectVisibility;
}

export const PROJECT_VISIBILITY_OPTIONS: Array<{
  value: ProjectVisibility;
  label: string;
  description: string;
}> = [
  {
    value: VisibilityType.PRIVATE,
    label: "Private",
    description: "仅当前 workspace 负责人或可访问成员可见",
  },
  {
    value: VisibilityType.TEAM_READONLY,
    label: "Team Readonly",
    description: "团队成员可读，不可改动项目本身",
  },
  {
    value: VisibilityType.TEAM_EDITABLE,
    label: "Team Editable",
    description: "团队内协作编辑，适合共享推进中的项目",
  },
  {
    value: VisibilityType.PUBLIC,
    label: "Public",
    description: "公开可见，适合对外共享的项目说明",
  },
];

export function getDefaultProjectVisibility(
  workspaceType: "PERSONAL" | "TEAM",
): ProjectVisibility {
  return workspaceType === "TEAM"
    ? VisibilityType.TEAM_READONLY
    : VisibilityType.PRIVATE;
}

async function fetchProjectApi<T>(
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
    let message = "项目请求失败";

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

export async function getProjects(
  workspaceId: string,
  token: string,
): Promise<Project[]> {
  return fetchProjectApi<Project[]>(`/workspaces/${workspaceId}/projects`, token);
}

export async function getProject(
  workspaceId: string,
  projectId: string,
  token: string,
): Promise<ProjectDetail> {
  return fetchProjectApi<ProjectDetail>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    token,
  );
}

export async function getProjectSummary(
  workspaceId: string,
  projectId: string,
  token: string,
): Promise<ProjectSummary> {
  return fetchProjectApi<ProjectSummary>(
    `/workspaces/${workspaceId}/projects/${projectId}/summary`,
    token,
  );
}

export async function getProjectActivity(
  workspaceId: string,
  projectId: string,
  token: string,
): Promise<ProjectActivityItem[]> {
  return fetchProjectApi<ProjectActivityItem[]>(
    `/workspaces/${workspaceId}/projects/${projectId}/activity`,
    token,
  );
}

export async function getProjectWorkflows(
  workspaceId: string,
  projectId: string,
  token: string,
): Promise<ProjectWorkflowSummary[]> {
  return fetchProjectApi<ProjectWorkflowSummary[]>(
    `/workspaces/${workspaceId}/projects/${projectId}/workflows`,
    token,
  );
}

export async function createProject(
  workspaceId: string,
  data: CreateProjectDto,
  token: string,
): Promise<Project> {
  return fetchProjectApi<Project>(`/workspaces/${workspaceId}/projects`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  data: UpdateProjectDto,
  token: string,
): Promise<Project> {
  return fetchProjectApi<Project>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

export async function deleteProject(
  workspaceId: string,
  projectId: string,
  token: string,
): Promise<DeleteProjectResult> {
  return fetchProjectApi<DeleteProjectResult>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    token,
    {
      method: "DELETE",
    },
  );
}
