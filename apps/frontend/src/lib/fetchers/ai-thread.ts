import type {
  AiApprovalRecord,
  AiMessagePage,
  AiThreadRecord,
  AiSurfaceType,
} from "@/lib/ai/types";

const AI_API_BASE = "/api/ai";

type ClientAiFetchOptions = {
  token: string;
};

async function fetchAiApi<T>(
  path: string,
  opts: ClientAiFetchOptions,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${AI_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.token}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "AI 线程请求失败");
  }

  return response.json() as Promise<T>;
}

export function listAiThreads(workspaceId: string, token: string) {
  return fetchAiApi<AiThreadRecord[]>(`/threads?workspaceId=${workspaceId}`, {
    token,
  });
}

export function createAiThread(
  workspaceId: string,
  token: string,
  body: {
    title?: string;
    originSurfaceType?: AiSurfaceType;
    originSurfaceId?: string;
  },
) {
  return fetchAiApi<AiThreadRecord>(
    "/threads",
    {
      token,
    },
    {
      method: "POST",
      body: JSON.stringify({ workspaceId, ...body }),
    },
  );
}

export function getAiThread(
  workspaceId: string,
  threadId: string,
  token: string,
) {
  return fetchAiApi<AiThreadRecord>(
    `/threads/${threadId}?workspaceId=${workspaceId}`,
    { token },
  );
}

export function listAiThreadMessages(
  workspaceId: string,
  threadId: string,
  token: string,
  cursor?: string,
) {
  const searchParams = new URLSearchParams({ workspaceId });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  return fetchAiApi<AiMessagePage>(
    `/threads/${threadId}/messages?${searchParams.toString()}`,
    { token },
  );
}

export function confirmAiApproval(
  workspaceId: string,
  threadId: string,
  approvalId: string,
  token: string,
) {
  return fetchAiApi<{
    approval: AiApprovalRecord;
    execution: unknown;
  }>(
    `/threads/${threadId}/approvals/${approvalId}/confirm`,
    { token },
    {
      method: "POST",
      body: JSON.stringify({ workspaceId }),
    },
  );
}

export function getAiApproval(
  workspaceId: string,
  threadId: string,
  approvalId: string,
  token: string,
) {
  return fetchAiApi<AiApprovalRecord>(
    `/threads/${threadId}/approvals/${approvalId}?workspaceId=${workspaceId}`,
    { token },
  );
}

export function rejectAiApproval(
  workspaceId: string,
  threadId: string,
  approvalId: string,
  token: string,
) {
  return fetchAiApi<AiApprovalRecord>(
    `/threads/${threadId}/approvals/${approvalId}/reject`,
    { token },
    {
      method: "POST",
      body: JSON.stringify({ workspaceId }),
    },
  );
}

export function streamAiThreadMessage(
  workspaceId: string,
  threadId: string,
  token: string,
  text: string,
) {
  return fetch(`${AI_API_BASE}/threads/${threadId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      workspaceId,
      text,
    }),
  });
}
