import { IssueStateCategory } from "@/types/prisma";

import { getBackendBaseUrl } from "@/lib/backend-url";

const API_BASE_URL = getBackendBaseUrl();

export interface IssueState {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  category: IssueStateCategory;
  position: number;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

async function fetchIssueStateApi<T>(
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
    let message = "Issue 状态请求失败";

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

export async function getIssueStates(
  workspaceId: string,
  token: string,
): Promise<IssueState[]> {
  return fetchIssueStateApi<IssueState[]>(
    `/workspaces/${workspaceId}/issue-states`,
    token,
  );
}
