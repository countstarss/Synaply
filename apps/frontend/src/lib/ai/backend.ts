import { getBackendBaseUrl } from "@/lib/backend-url";
import type {
  AiActorContextDetail,
  AiApprovalRecord,
  AiCodingPromptAssembly,
  AiDocDetail,
  AiDocSearchResult,
  AiExecutionActionResult,
  AiExecutionCapabilities,
  AiExecutionManifest,
  AiIssueDetail,
  AiIssueListResult,
  AiIssueSearchResult,
  AiMessagePage,
  AiMessageRecord,
  AiProjectDetail,
  AiProjectSearchResult,
  AiRunRecord,
  AiSurfaceSummary,
  AiThreadRecord,
  AiWorkflowSearchResult,
  AiWorkflowRunDetail,
  AiWorkspaceMemberSearchResult,
  AiWorkspaceSummaryDetail,
} from "@/lib/ai/types";

const API_BASE_URL = getBackendBaseUrl();

export type ServerFetchOptions = {
  token: string;
  workspaceId: string;
  signal?: AbortSignal;
};

type FetchBackendInit = Omit<RequestInit, "body" | "headers" | "signal"> & {
  body?: unknown;
  headers?: HeadersInit;
  query?: Record<string, string | number | undefined | null>;
};

async function fetchAiBackend<T>(
  path: string,
  opts: ServerFetchOptions,
  init: FetchBackendInit = {},
): Promise<T> {
  const searchParams = new URLSearchParams();

  Object.entries(init.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const response = await fetch(
    `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`,
    {
      method: init.method ?? "GET",
      cache: "no-store",
      signal: opts.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.token}`,
        ...(init.headers ?? {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    },
  );

  if (!response.ok) {
    const errorText = await readBackendError(response);
    throw new Error(errorText);
  }

  return response.json() as Promise<T>;
}

async function readBackendError(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string | string[] };

    if (Array.isArray(payload.message)) {
      return payload.message.join("，");
    }

    if (payload.message) {
      return payload.message;
    }
  } catch {
    const rawText = await response.text();

    if (rawText) {
      return rawText;
    }
  }

  return `AI backend 请求失败（${response.status}）`;
}

function getThreadBasePath(workspaceId: string) {
  return `/workspaces/${workspaceId}/ai-threads`;
}

function getContextBasePath(workspaceId: string) {
  return `/workspaces/${workspaceId}/ai-context`;
}

function getExecutionBasePath(workspaceId: string) {
  return `/workspaces/${workspaceId}/ai-execution`;
}

export function createAiThread(
  opts: ServerFetchOptions,
  body: {
    title?: string;
    originSurfaceType?: string;
    originSurfaceId?: string;
  },
) {
  return fetchAiBackend<AiThreadRecord>(
    getThreadBasePath(opts.workspaceId),
    opts,
    {
      method: "POST",
      body,
    },
  );
}

export function listAiThreads(opts: ServerFetchOptions, limit = 100) {
  return fetchAiBackend<AiThreadRecord[]>(
    getThreadBasePath(opts.workspaceId),
    opts,
    {
      query: { limit },
    },
  );
}

export function getAiThread(opts: ServerFetchOptions, threadId: string) {
  return fetchAiBackend<AiThreadRecord>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}`,
    opts,
  );
}

export function listAiThreadMessages(
  opts: ServerFetchOptions,
  threadId: string,
  cursor?: string,
  limit = 200,
) {
  return fetchAiBackend<AiMessagePage>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/messages`,
    opts,
    {
      query: { cursor, limit },
    },
  );
}

export function appendAiMessage(
  opts: ServerFetchOptions,
  threadId: string,
  body: {
    role: string;
    parts: unknown[];
    runId?: string;
  },
) {
  return fetchAiBackend<AiMessageRecord>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/messages`,
    opts,
    {
      method: "POST",
      body,
    },
  );
}

export function startAiRun(
  opts: ServerFetchOptions,
  threadId: string,
  body: {
    model?: string;
    maxSteps?: number;
    tokenBudget?: number;
  },
) {
  return fetchAiBackend<AiRunRecord>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/runs`,
    opts,
    {
      method: "POST",
      body,
    },
  );
}

export function recordAiRunStep(
  opts: ServerFetchOptions,
  threadId: string,
  runId: string,
  body: {
    kind: string;
    stepIndex: number;
    model?: string;
    toolName?: string;
    toolInput?: unknown;
    toolOutput?: unknown;
    promptSnapshot?: unknown;
    responseSnapshot?: unknown;
    tokensIn?: number;
    tokensOut?: number;
    latencyMs?: number;
    error?: unknown;
  },
) {
  return fetchAiBackend<{
    id: string;
    runId: string;
    stepIndex: number;
    kind: string;
    createdAt: string;
  }>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/runs/${runId}/steps`,
    opts,
    {
      method: "POST",
      body,
    },
  );
}

export function finishAiRun(
  opts: ServerFetchOptions,
  threadId: string,
  runId: string,
  body: {
    status: string;
    tokensUsed?: number;
    lastError?: unknown;
  },
) {
  return fetchAiBackend<AiRunRecord>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/runs/${runId}/finish`,
    opts,
    {
      method: "POST",
      body,
    },
  );
}

export function createAiApproval(
  opts: ServerFetchOptions,
  threadId: string,
  body: {
    runId: string;
    actionKey: string;
    summary?: string;
    input?: unknown;
    previewResult?: unknown;
  },
) {
  return fetchAiBackend<AiApprovalRecord>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/approvals`,
    opts,
    {
      method: "POST",
      body,
    },
  );
}

export function confirmAiApproval(
  opts: ServerFetchOptions,
  threadId: string,
  approvalId: string,
) {
  return fetchAiBackend<AiApprovalRecord>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/approvals/${approvalId}/confirm`,
    opts,
    {
      method: "POST",
    },
  );
}

export function getAiApproval(
  opts: ServerFetchOptions,
  threadId: string,
  approvalId: string,
) {
  return fetchAiBackend<AiApprovalRecord>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/approvals/${approvalId}`,
    opts,
  );
}

export function rejectAiApproval(
  opts: ServerFetchOptions,
  threadId: string,
  approvalId: string,
) {
  return fetchAiBackend<AiApprovalRecord>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/approvals/${approvalId}/reject`,
    opts,
    {
      method: "POST",
    },
  );
}

export function pinAiContext(
  opts: ServerFetchOptions,
  threadId: string,
  body: {
    surfaceType: string;
    surfaceId: string;
    source?: string;
  },
) {
  return fetchAiBackend<AiThreadRecord["pins"][number]>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/pins`,
    opts,
    {
      method: "POST",
      body,
    },
  );
}

export function unpinAiContext(
  opts: ServerFetchOptions,
  threadId: string,
  pinId: string,
) {
  return fetchAiBackend<{ id: string; deleted: boolean }>(
    `${getThreadBasePath(opts.workspaceId)}/${threadId}/pins/${pinId}`,
    opts,
    {
      method: "DELETE",
    },
  );
}

export function getAiSurfaceSummary(
  opts: ServerFetchOptions,
  params: {
    surfaceType: string;
    surfaceId: string;
  },
) {
  return fetchAiBackend<AiSurfaceSummary>(
    `${getContextBasePath(opts.workspaceId)}/surface`,
    opts,
    {
      query: params,
    },
  );
}

export function postAiSurfaceSummaries(
  opts: ServerFetchOptions,
  body: {
    pins: Array<{
      surfaceType: string;
      surfaceId: string;
    }>;
  },
) {
  return fetchAiBackend<AiSurfaceSummary[]>(
    `${getContextBasePath(opts.workspaceId)}/summaries`,
    opts,
    {
      method: "POST",
      body,
    },
  );
}

export function getAiExecutionManifest(opts: ServerFetchOptions) {
  return fetchAiBackend<AiExecutionManifest>(
    `${getExecutionBasePath(opts.workspaceId)}/manifest`,
    opts,
  );
}

export function getAiWorkspaceSummary(opts: ServerFetchOptions) {
  return fetchAiBackend<AiWorkspaceSummaryDetail>(
    `${getContextBasePath(opts.workspaceId)}/workspace-summary`,
    opts,
  );
}

export function getAiActorContext(opts: ServerFetchOptions) {
  return fetchAiBackend<AiActorContextDetail>(
    `${getContextBasePath(opts.workspaceId)}/actor-context`,
    opts,
  );
}

export function searchAiProjects(
  opts: ServerFetchOptions,
  params: {
    query?: string;
    limit?: number;
  },
) {
  return fetchAiBackend<AiProjectSearchResult>(
    `${getContextBasePath(opts.workspaceId)}/projects/search`,
    opts,
    {
      query: params,
    },
  );
}

export function getAiProjectDetail(
  opts: ServerFetchOptions,
  projectId: string,
) {
  return fetchAiBackend<AiProjectDetail>(
    `${getContextBasePath(opts.workspaceId)}/projects/${projectId}`,
    opts,
  );
}

export function getAiIssueDetail(opts: ServerFetchOptions, issueId: string) {
  return fetchAiBackend<AiIssueDetail>(
    `${getContextBasePath(opts.workspaceId)}/issues/${issueId}`,
    opts,
  );
}

export function listAiIssues(
  opts: ServerFetchOptions,
  params: {
    projectId?: string;
    assigneeScope?: "ANY" | "ME";
    stateCategories?: string[];
    limit?: number;
  },
) {
  return fetchAiBackend<AiIssueListResult>(
    `${getContextBasePath(opts.workspaceId)}/issues/list`,
    opts,
    {
      query: {
        projectId: params.projectId,
        assigneeScope: params.assigneeScope,
        stateCategories: params.stateCategories?.join(","),
        limit: params.limit,
      },
    },
  );
}

export function searchAiIssues(
  opts: ServerFetchOptions,
  params: {
    query?: string;
    projectId?: string;
    limit?: number;
  },
) {
  return fetchAiBackend<AiIssueSearchResult>(
    `${getContextBasePath(opts.workspaceId)}/issues/search`,
    opts,
    {
      query: params,
    },
  );
}

export function searchAiWorkflows(
  opts: ServerFetchOptions,
  params: {
    query?: string;
    limit?: number;
  },
) {
  return fetchAiBackend<AiWorkflowSearchResult>(
    `${getContextBasePath(opts.workspaceId)}/workflows/search`,
    opts,
    {
      query: params,
    },
  );
}

export function getAiWorkflowRunDetail(
  opts: ServerFetchOptions,
  issueId: string,
) {
  return fetchAiBackend<AiWorkflowRunDetail>(
    `${getContextBasePath(opts.workspaceId)}/workflow-runs/${issueId}`,
    opts,
  );
}

export function searchAiDocs(
  opts: ServerFetchOptions,
  params: {
    query?: string;
    limit?: number;
  },
) {
  return fetchAiBackend<AiDocSearchResult>(
    `${getContextBasePath(opts.workspaceId)}/docs/search`,
    opts,
    {
      query: params,
    },
  );
}

export function getAiDocDetail(opts: ServerFetchOptions, docId: string) {
  return fetchAiBackend<AiDocDetail>(
    `${getContextBasePath(opts.workspaceId)}/docs/${docId}`,
    opts,
  );
}

export function getAiExecutionCapabilities(opts: ServerFetchOptions) {
  return fetchAiBackend<AiExecutionCapabilities>(
    `${getContextBasePath(opts.workspaceId)}/capabilities`,
    opts,
  );
}

export function searchAiWorkspaceMembers(
  opts: ServerFetchOptions,
  params: {
    query?: string;
    limit?: number;
  },
) {
  return fetchAiBackend<AiWorkspaceMemberSearchResult>(
    `${getContextBasePath(opts.workspaceId)}/workspace-members/search`,
    opts,
    {
      query: params,
    },
  );
}

export function assembleAiCodingPrompt(
  opts: ServerFetchOptions,
  issueId: string,
) {
  return fetchAiBackend<AiCodingPromptAssembly>(
    `${getContextBasePath(opts.workspaceId)}/coding-prompt/assemble`,
    opts,
    {
      method: "POST",
      body: { issueId },
    },
  );
}

export function executeAiAction(
  opts: ServerFetchOptions,
  actionKey: string,
  body: {
    input?: Record<string, unknown>;
    dryRun?: boolean;
    confirmed?: boolean;
    conversationId?: string;
  },
) {
  return fetchAiBackend<AiExecutionActionResult>(
    `${getExecutionBasePath(opts.workspaceId)}/actions/${actionKey}/execute`,
    opts,
    {
      method: "POST",
      body,
    },
  );
}
