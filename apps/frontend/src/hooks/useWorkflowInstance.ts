import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { WorkflowResponse } from "@/lib/fetchers/workflow";
import { scheduleQueryInvalidations } from "@/lib/query/scheduled-invalidation";
import { createWorkflowInstance } from "@/lib/workflow/createWorkflowInstance";
import { toast } from "sonner";

/**
 * 工作流实例化hook，用于创建基于工作流的Issue
 */
export function useWorkflowInstance() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workflow,
      title,
      description,
      workspaceId,
      dueDate,
    }: {
      workflow: WorkflowResponse;
      title: string;
      description?: string;
      workspaceId?: string;
      dueDate?: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      const response = await createWorkflowInstance(
        workflow,
        title,
        description,
        session.access_token,
        workspaceId,
        dueDate
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "创建工作流实例失败");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // 刷新issue列表
      const wsId = variables.workspaceId || variables.workflow.workspaceId;
      scheduleQueryInvalidations(queryClient, [{ queryKey: ["issues", wsId] }]);

      toast.success("工作流实例创建成功", {
        description: `已成功创建 "${variables.title}" 工作流实例`,
      });
    },
    onError: (error) => {
      toast.error("工作流实例创建失败", {
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    },
  });
}
