// MARK: - 📝任务 Task

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  calendarId: string;
  createdAt: string;
  updatedAt: string;
}

import { getBackendBaseUrl } from "@/lib/backend-url";

const API_BASE_URL = getBackendBaseUrl();

// 获取某工作空间全部任务
export const fetchTasksByWorkspace = async (
  workspaceId: string,
  token: string
): Promise<Task[]> => {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/tasks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("获取任务失败");
  return res.json();
};

// 创建任务
export const createTask = async (
  workspaceId: string,
  token: string,
  payload: {
    title: string;
    description?: string;
    dueDate?: string;
  }
): Promise<Task> => {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("创建任务失败");
  return res.json();
};

// 更新任务
export const updateTask = async (
  workspaceId: string,
  taskId: string,
  token: string,
  payload: Partial<{
    title: string;
    description?: string;
    dueDate?: string;
    status?: string;
  }>
): Promise<Task> => {
  const res = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/tasks/${taskId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error("更新任务失败");
  return res.json();
};

// 删除任务
export const deleteTask = async (
  workspaceId: string,
  taskId: string,
  token: string
): Promise<void> => {
  const res = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/tasks/${taskId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) throw new Error("删除任务失败");
};
