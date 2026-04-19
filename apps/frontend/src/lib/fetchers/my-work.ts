import { getBackendBaseUrl } from "@/lib/backend-url";
import { IssuePriority } from "@/types/prisma";
import { MyWorkInboxSignal } from "@/lib/fetchers/inbox";

const API_BASE_URL = getBackendBaseUrl();

export type MyWorkSourceType = "issue" | "workflow";
export type MyWorkActionType =
  | "todo"
  | "execution"
  | "review"
  | "handoff"
  | "blocked"
  | "done";

export interface MyWorkItem {
  id: string;
  sourceType: MyWorkSourceType;
  sourceId: string;
  issueId: string;
  issueKey: string | null;
  title: string;
  projectId: string | null;
  projectName: string | null;
  workflowId: string | null;
  workflowRunId: string | null;
  currentActionType: MyWorkActionType;
  currentActionLabel: string;
  currentStepName: string | null;
  status: string | null;
  statusLabel: string;
  priority: IssuePriority | null;
  dueAt: string | null;
  updatedAt: string;
  blockedReason: string | null;
  targetUserId: string | null;
  targetName: string | null;
  assigneeUserId: string | null;
  assigneeName: string | null;
  isOverdue: boolean;
  needsAttention: boolean;
}

export interface MyWorkResponse {
  workspaceId: string;
  generatedAt: string;
  counts: {
    total: number;
    todayFocus: number;
    waitingForMe: number;
    inProgress: number;
    blocked: number;
    completedToday: number;
    attention: number;
  };
  todayFocus: MyWorkItem[];
  waitingForMe: MyWorkItem[];
  inProgress: MyWorkItem[];
  blocked: MyWorkItem[];
  completedToday: MyWorkItem[];
  inboxSignals: MyWorkInboxSignal[];
}

export async function fetchMyWork(
  workspaceId: string,
  token: string,
): Promise<MyWorkResponse> {
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/my-work`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("获取个人工作聚合失败");
  }

  return response.json();
}
