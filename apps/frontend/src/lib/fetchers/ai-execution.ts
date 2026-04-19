import { getBackendBaseUrl } from "@/lib/backend-url";

const API_BASE_URL = getBackendBaseUrl();

export type AiExecutionAvailabilityStatus =
  | "available"
  | "requires_target_check"
  | "unavailable";

export interface AiActionFieldDescriptor {
  name: string;
  label: string;
  type: "string" | "string[]" | "enum" | "json" | "date";
  required: boolean;
  description: string;
  options?: string[];
}

export interface AiExecutionActionDefinition {
  key: string;
  label: string;
  description: string;
  area: "project" | "issue" | "workflow" | "doc";
  targetType: "WORKSPACE" | "PROJECT" | "ISSUE" | "WORKFLOW" | "DOC";
  approvalMode: "AUTO" | "CONFIRM";
  requiresTargetId: boolean;
  fields: AiActionFieldDescriptor[];
  sampleInput: Record<string, unknown>;
  availability: {
    status: AiExecutionAvailabilityStatus;
    reason?: string;
  };
}

export interface AiExecutionCapabilitiesResponse {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  actorRole: "OWNER" | "ADMIN" | "MEMBER";
  actions: AiExecutionActionDefinition[];
}

export interface AiExecutionRecord {
  id: string;
  actionKey: string;
  actionLabel: string;
  area: "project" | "issue" | "workflow" | "doc";
  status: "PREVIEW" | "SUCCEEDED" | "FAILED" | "BLOCKED";
  approvalMode: "AUTO" | "CONFIRM";
  targetType: "WORKSPACE" | "PROJECT" | "ISSUE" | "WORKFLOW" | "DOC" | null;
  targetId: string | null;
  summary: string | null;
  conversationId: string | null;
  createdAt: string;
  completedAt: string | null;
  input: Record<string, unknown> | null;
  result: unknown;
  error: {
    name?: string;
    message?: string;
    statusCode?: number;
  } | null;
}

export interface ExecuteAiActionPayload {
  input?: Record<string, unknown>;
  dryRun?: boolean;
  confirmed?: boolean;
  conversationId?: string;
}

export interface ExecuteAiActionResult {
  executionId: string;
  status: "preview" | "succeeded" | "failed" | "blocked";
  needsConfirmation: boolean;
  message: string;
  summary: string;
  targetId: string | null;
  approvalMode: "AUTO" | "CONFIRM";
  action: AiExecutionActionDefinition;
  result?: unknown;
  error?: {
    name?: string;
    message?: string;
    statusCode?: number;
  };
}

async function fetchAiExecutionApi<T>(
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
    let message = "AI 执行层请求失败";

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

  return response.json();
}

export function getAiExecutionCapabilities(
  workspaceId: string,
  token: string,
): Promise<AiExecutionCapabilitiesResponse> {
  return fetchAiExecutionApi<AiExecutionCapabilitiesResponse>(
    `/workspaces/${workspaceId}/ai-execution/capabilities`,
    token,
  );
}

export function getAiExecutionHistory(
  workspaceId: string,
  token: string,
  limit = 20,
): Promise<AiExecutionRecord[]> {
  return fetchAiExecutionApi<AiExecutionRecord[]>(
    `/workspaces/${workspaceId}/ai-execution/executions?limit=${limit}`,
    token,
  );
}

export function executeAiAction(
  workspaceId: string,
  actionKey: string,
  token: string,
  data: ExecuteAiActionPayload,
): Promise<ExecuteAiActionResult> {
  return fetchAiExecutionApi<ExecuteAiActionResult>(
    `/workspaces/${workspaceId}/ai-execution/actions/${actionKey}/execute`,
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}
