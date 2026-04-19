import { getBackendBaseUrl } from "@/lib/backend-url";

const API_BASE_URL = getBackendBaseUrl();

export type InboxItemType =
  | "workflow.review.requested"
  | "workflow.handoff.requested"
  | "workflow.blocked"
  | "doc.review.ready"
  | "doc.handoff.ready"
  | "issue.assigned"
  | "issue.canceled"
  | "doc.release.updated"
  | "project.risk.flagged"
  | "doc.decision.updated"
  | "deadline.soon"
  | "digest.generated";

export type InboxBucket =
  | "needs-response"
  | "needs-attention"
  | "following"
  | "digest";

export type InboxItemStatus =
  | "unread"
  | "seen"
  | "done"
  | "dismissed"
  | "snoozed";

export type InboxItemPriority = "low" | "normal" | "high" | "urgent";

export type InboxSourceType = "issue" | "workflow" | "project" | "doc";

export type InboxActionKey =
  | "open"
  | "toggle_read"
  | "mark_done"
  | "snooze"
  | "accept_handoff";

export interface InboxActionDefinition {
  key: InboxActionKey;
  label: string;
}

export interface InboxSummary {
  needsResponse: number;
  needsAttention: number;
  following: number;
  digest: number;
  unread: number;
  snoozed: number;
  done: number;
  unreadByView: {
    primary: number;
    other: number;
    digest: number;
    later: number;
    cleared: number;
  };
}

export interface InboxItem {
  id: string;
  type: InboxItemType;
  bucket: InboxBucket;
  title: string;
  summary: string | null;
  priority: InboxItemPriority;
  status: InboxItemStatus;
  requiresAction: boolean;
  sourceType: InboxSourceType;
  sourceId: string;
  projectId: string | null;
  projectName: string | null;
  issueId: string | null;
  issueKey: string | null;
  workflowRunId: string | null;
  docId: string | null;
  actionLabel: string | null;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
  availableActions: InboxActionDefinition[];
}

export interface InboxFeedResponse {
  workspaceId: string;
  generatedAt: string;
  summary: InboxSummary;
  items: InboxItem[];
  nextCursor: string | null;
}

export interface MyWorkInboxSignal {
  id: string;
  type: InboxItemType;
  title: string;
  projectName: string | null;
  actionLabel: string | null;
  priority: InboxItemPriority;
  occurredAt: string;
  requiresAction: boolean;
}

export interface InboxQueryParams {
  bucket?: InboxBucket;
  status?: InboxItemStatus;
  type?: InboxItemType;
  projectId?: string;
  requiresAction?: boolean;
  cursor?: string;
  limit?: number;
}

function buildInboxQuery(params: InboxQueryParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.bucket) {
    searchParams.set("bucket", params.bucket);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.type) {
    searchParams.set("type", params.type);
  }

  if (params.projectId) {
    searchParams.set("projectId", params.projectId);
  }

  if (params.requiresAction !== undefined) {
    searchParams.set("requiresAction", String(params.requiresAction));
  }

  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function fetchInboxApi<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error("获取 Inbox 数据失败");
  }

  return response.json();
}

export function fetchInbox(
  workspaceId: string,
  token: string,
  params: InboxQueryParams = {},
) {
  return fetchInboxApi<InboxFeedResponse>(
    `/workspaces/${workspaceId}/inbox${buildInboxQuery(params)}`,
    token,
  );
}

export function fetchInboxSummary(workspaceId: string, token: string) {
  return fetchInboxApi<InboxSummary>(
    `/workspaces/${workspaceId}/inbox/summary`,
    token,
  );
}

export function markInboxItemSeen(
  workspaceId: string,
  itemId: string,
  token: string,
) {
  return fetchInboxApi<InboxItem>(
    `/workspaces/${workspaceId}/inbox/${itemId}/seen`,
    token,
    {
      method: "POST",
    },
  );
}

export function markInboxItemUnread(
  workspaceId: string,
  itemId: string,
  token: string,
) {
  return fetchInboxApi<InboxItem>(
    `/workspaces/${workspaceId}/inbox/${itemId}/unread`,
    token,
    {
      method: "POST",
    },
  );
}

export function markInboxItemDone(
  workspaceId: string,
  itemId: string,
  token: string,
) {
  return fetchInboxApi<InboxItem>(
    `/workspaces/${workspaceId}/inbox/${itemId}/done`,
    token,
    {
      method: "POST",
    },
  );
}

export function dismissInboxItem(
  workspaceId: string,
  itemId: string,
  token: string,
) {
  return fetchInboxApi<InboxItem>(
    `/workspaces/${workspaceId}/inbox/${itemId}/dismiss`,
    token,
    {
      method: "POST",
    },
  );
}

export function snoozeInboxItem(
  workspaceId: string,
  itemId: string,
  token: string,
  until?: string,
) {
  return fetchInboxApi<InboxItem>(
    `/workspaces/${workspaceId}/inbox/${itemId}/snooze`,
    token,
    {
      method: "POST",
      body: JSON.stringify(until ? { until } : {}),
    },
  );
}

export function clearInboxItems(
  workspaceId: string,
  itemIds: string[],
  token: string,
) {
  return fetchInboxApi<{ updatedCount: number }>(
    `/workspaces/${workspaceId}/inbox/clear`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ itemIds }),
    },
  );
}
