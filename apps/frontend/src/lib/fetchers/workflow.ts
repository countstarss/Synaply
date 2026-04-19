import { CreateWorkflowDto, UpdateWorkflowDto } from "@/api";
import { getBackendBaseUrl } from "@/lib/backend-url";

const API_BASE_URL = getBackendBaseUrl();

const getWorkflowErrorMessage = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  const rawText = await response.text().catch(() => "");

  if (!rawText) {
    return fallbackMessage;
  }

  try {
    const parsed = JSON.parse(rawText) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(parsed.message)) {
      return parsed.message.join(", ");
    }

    if (typeof parsed.message === "string") {
      return parsed.message;
    }

    if (typeof parsed.error === "string") {
      return parsed.error;
    }
  } catch {
    return rawText;
  }

  return fallbackMessage;
};

// MARK: - ✅工作流
export interface WorkflowResponse {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;

  status: string;
  creatorId: string;

  visibility: "PRIVATE" | "TEAM_READONLY" | "TEAM_EDITABLE" | "PUBLIC";
  assigneeMap?: Record<string, string>;
  description?: string;
  json?: Record<string, unknown> | string | null;

  totalSteps: number;
  version: string;

  currentStepIndex: number;
  currentStepStatus: string;
  isSystemTemplate: boolean;

  creator?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  };
  usage?: {
    totalRunCount: number;
    activeRunCount: number;
    projectCount: number;
  };
}

/**
 * 获取工作流列表
 */
export const fetchWorkflows = async (
  workspaceId: string,
  token: string
): Promise<WorkflowResponse[]> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await getWorkflowErrorMessage(response, "获取工作流列表失败"));
  }

  return response.json();
};

/**
 * 获取工作流详情
 */
export const fetchWorkflowById = async (
  workspaceId: string,
  workflowId: string,
  token: string
): Promise<WorkflowResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows/${workflowId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await getWorkflowErrorMessage(response, "获取工作流详情失败"));
  }

  return response.json();
};

/**
 * 创建工作流
 */
export const createWorkflow = async (
  workspaceId: string,
  data: CreateWorkflowDto,
  token: string
): Promise<WorkflowResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(await getWorkflowErrorMessage(response, "创建工作流失败"));
  }

  return response.json();
};

/**
 * 更新工作流
 */
export const updateWorkflow = async (
  workspaceId: string,
  workflowId: string,
  data: UpdateWorkflowDto,
  token: string
): Promise<WorkflowResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows/${workflowId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(await getWorkflowErrorMessage(response, "更新工作流失败"));
  }

  return response.json();
};

/**
 * 删除工作流
 */
export const deleteWorkflow = async (
  workspaceId: string,
  workflowId: string,
  token: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows/${workflowId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await getWorkflowErrorMessage(response, "删除工作流失败"));
  }
};

/**
 * 发布工作流
 */
export const publishWorkflow = async (
  workspaceId: string,
  workflowId: string,
  token: string
): Promise<WorkflowResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows/${workflowId}/publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await getWorkflowErrorMessage(response, "发布工作流失败"));
  }

  return response.json();
};

/**
 * 更新工作流JSON数据（包含节点和边的信息）
 */
export const updateWorkflowJson = async (
  workspaceId: string,
  workflowId: string,
  workflowData: {
    name?: string;
    description?: string;
    nodes: unknown[];
    edges: unknown[];
    assigneeMap?: Record<string, string>;
  },
  token: string,
  status?: "DRAFT" | "PUBLISHED",
): Promise<WorkflowResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows/${workflowId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        json: workflowData,
        status,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await getWorkflowErrorMessage(response, "更新工作流数据失败"));
  }

  return response.json();
};
