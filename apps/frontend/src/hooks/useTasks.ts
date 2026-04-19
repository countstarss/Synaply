"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTasksByWorkspace,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  Task,
} from "@/lib/fetchers/task";

export function useTasks(workspaceId: string | null) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const token = session?.access_token || "";

  // 获取任务列表
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery<Task[]>({
    queryKey: ["tasks", workspaceId],
    queryFn: () => fetchTasksByWorkspace(workspaceId!, token),
    enabled: !!workspaceId && !!token,
  });

  // 创建任务
  const createTaskMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description?: string;
      dueDate?: string;
    }) => apiCreateTask(workspaceId!, token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    },
  });

  // 更新任务
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      apiUpdateTask(workspaceId!, taskId, token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    },
  });

  // 删除任务
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiDeleteTask(workspaceId!, taskId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    },
  });

  return {
    tasks: tasks || [],
    isLoading,
    error,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
  };
}
