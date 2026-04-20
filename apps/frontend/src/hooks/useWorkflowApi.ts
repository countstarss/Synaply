import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { useUser } from "./useUser";
import {
  fetchWorkflows,
  fetchWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  publishWorkflow,
  updateWorkflowJson,
} from "@/lib/fetchers/workflow";
import { CreateWorkflowDto, UpdateWorkflowDto } from "@/api";
import { useAuth } from "@/context/AuthContext";

interface QueryEnabledOptions {
  enabled?: boolean;
}

/**
 * 获取工作流列表
 */
export const useWorkflows = (
  workspaceId?: string,
  options: QueryEnabledOptions = {},
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["workflows", workspaceId],
    queryFn: () => {
      if (!workspaceId || !session?.access_token) {
        throw new Error("工作空间ID和用户token不能为空");
      }
      return fetchWorkflows(workspaceId, session.access_token);
    },
    enabled: (options.enabled ?? true) && !!workspaceId && !!session?.access_token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * 获取工作流详情
 */
export const useWorkflow = (workspaceId?: string, workflowId?: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["workflow", workspaceId, workflowId],
    queryFn: () => {
      if (!workspaceId || !workflowId || !session?.access_token) {
        throw new Error("工作空间ID、工作流ID和用户token不能为空");
      }
      return fetchWorkflowById(workspaceId, workflowId, session.access_token);
    },
    enabled: !!workspaceId && !!workflowId && !!session?.access_token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * 创建工作流
 */
export const useCreateWorkflow = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: CreateWorkflowDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("用户token不能为空");
      }
      return createWorkflow(workspaceId, data, session.access_token);
    },
    onSuccess: (data, variables) => {
      // 刷新工作流列表
      queryClient.invalidateQueries({
        queryKey: ["workflows", variables.workspaceId],
      });
    },
  });
};

/**
 * 更新工作流
 */
export const useUpdateWorkflow = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      workflowId,
      data,
    }: {
      workspaceId: string;
      workflowId: string;
      data: UpdateWorkflowDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("用户token不能为空");
      }
      return updateWorkflow(
        workspaceId,
        workflowId,
        data,
        session.access_token
      );
    },
    onSuccess: (data, variables) => {
      // 刷新工作流列表和详情
      queryClient.invalidateQueries({
        queryKey: ["workflows", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workflow", variables.workspaceId, variables.workflowId],
      });
    },
  });
};

/**
 * 删除工作流
 */
export const useDeleteWorkflow = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      workflowId,
    }: {
      workspaceId: string;
      workflowId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("用户token不能为空");
      }
      return deleteWorkflow(workspaceId, workflowId, session.access_token);
    },
    onSuccess: (data, variables) => {
      // 刷新工作流列表
      queryClient.invalidateQueries({
        queryKey: ["workflows", variables.workspaceId],
      });
      // 移除详情缓存
      queryClient.removeQueries({
        queryKey: ["workflow", variables.workspaceId, variables.workflowId],
      });
    },
  });
};

/**
 * 发布工作流
 */
export const usePublishWorkflow = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      workflowId,
    }: {
      workspaceId: string;
      workflowId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("用户token不能为空");
      }
      return publishWorkflow(workspaceId, workflowId, session.access_token);
    },
    onSuccess: (data, variables) => {
      // 刷新工作流列表和详情
      queryClient.invalidateQueries({
        queryKey: ["workflows", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workflow", variables.workspaceId, variables.workflowId],
      });
    },
  });
};

/**
 * 更新工作流JSON数据
 */
export const useUpdateWorkflowJson = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      workflowId,
      workflowData,
      status,
    }: {
      workspaceId: string;
      workflowId: string;
      workflowData: {
        name?: string;
        description?: string;
        nodes: unknown[];
        edges: unknown[];
        assigneeMap?: Record<string, string>;
      };
      status?: "DRAFT" | "PUBLISHED";
    }) => {
      if (!session?.access_token) {
        throw new Error("用户token不能为空");
      }
      return updateWorkflowJson(
        workspaceId,
        workflowId,
        workflowData,
        session.access_token,
        status
      );
    },
    onSuccess: (data, variables) => {
      // 刷新工作流列表和详情
      queryClient.invalidateQueries({
        queryKey: ["workflows", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workflow", variables.workspaceId, variables.workflowId],
      });
    },
  });
};

/**
 * 批量操作工作流
 */
export const useBatchWorkflowOperations = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const deleteMultiple = useMutation({
    mutationFn: async ({
      workspaceId,
      workflowIds,
    }: {
      workspaceId: string;
      workflowIds: string[];
    }) => {
      if (!session?.access_token) {
        throw new Error("用户token不能为空");
      }

      const promises = workflowIds.map((id) =>
        deleteWorkflow(workspaceId, id, session?.access_token)
      );

      return Promise.all(promises);
    },
    onSuccess: (_data, variables) => {
      // 刷新工作流列表
      queryClient.invalidateQueries({
        queryKey: ["workflows", variables.workspaceId],
      });
      // 移除详情缓存
      variables.workflowIds.forEach((id) => {
        queryClient.removeQueries({
          queryKey: ["workflow", variables.workspaceId, id],
        });
      });
    },
  });

  return { deleteMultiple };
};

/**
 * 获取工作流统计信息
 */
export const useWorkflowStats = (
  workspaceId?: string,
  options: QueryEnabledOptions = {},
) => {
  const { data: workflows, isLoading } = useWorkflows(workspaceId, options);

  const stats = {
    total: workflows?.length || 0,
    published: workflows?.filter((w) => w.status === "PUBLISHED").length || 0,
    draft: workflows?.filter((w) => w.status === "DRAFT").length || 0,
    active:
      workflows?.filter(
        (w) => (w.usage?.activeRunCount || 0) > 0
      )
        .length || 0,
  };

  return { stats, isLoading };
};
