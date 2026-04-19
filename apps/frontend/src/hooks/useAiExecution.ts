"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  executeAiAction,
  getAiExecutionCapabilities,
  getAiExecutionHistory,
  type ExecuteAiActionPayload,
} from "@/lib/fetchers/ai-execution";

export function useAiExecutionCapabilities(workspaceId?: string | null) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["ai-execution-capabilities", workspaceId],
    queryFn: async () => {
      if (!session?.access_token || !workspaceId) {
        throw new Error("未授权");
      }

      return getAiExecutionCapabilities(workspaceId, session.access_token);
    },
    enabled: Boolean(session?.access_token && workspaceId),
  });
}

export function useAiExecutionHistory(
  workspaceId?: string | null,
  limit = 20,
) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["ai-execution-history", workspaceId, limit],
    queryFn: async () => {
      if (!session?.access_token || !workspaceId) {
        throw new Error("未授权");
      }

      return getAiExecutionHistory(workspaceId, session.access_token, limit);
    },
    enabled: Boolean(session?.access_token && workspaceId),
  });
}

export function useExecuteAiAction() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      actionKey,
      data,
    }: {
      workspaceId: string;
      actionKey: string;
      data: ExecuteAiActionPayload;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return executeAiAction(
        workspaceId,
        actionKey,
        session.access_token,
        data,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ai-execution-history", variables.workspaceId],
      });
    },
  });
}
