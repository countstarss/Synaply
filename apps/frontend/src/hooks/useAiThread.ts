"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  createAiThread as createAiThreadRequest,
  getAiThread as getAiThreadRequest,
  listAiThreadMessages as listAiThreadMessagesRequest,
  listAiThreads,
} from "@/lib/fetchers/ai-thread";
import type { AiSurfaceType } from "@/lib/ai/types";
import { useAiThreadStore } from "@/stores/ai-thread";

interface UseAiThreadOptions {
  workspaceId: string;
  originSurfaceType: AiSurfaceType;
  originSurfaceId: string;
  originTitle?: string | null;
  enabled?: boolean;
  autoCreate?: boolean;
  threadIdOverride?: string | null;
}

export function useAiThread({
  workspaceId,
  originSurfaceType,
  originSurfaceId,
  originTitle,
  enabled = true,
  autoCreate = true,
  threadIdOverride = null,
}: UseAiThreadOptions) {
  const { session } = useAuth();
  const {
    currentThreadId,
    messages,
    isLoading,
    isStreaming,
    error,
    setCurrentThreadId,
    setMessages,
    setLoading,
    setError,
    reset,
  } = useAiThreadStore();

  const originKey = `${workspaceId}:${originSurfaceType}:${originSurfaceId}`;
  const threadKey = threadIdOverride
    ? `thread:${threadIdOverride}`
    : `origin:${originKey}`;

  useEffect(() => {
    reset();
  }, [reset, threadKey]);

  const threadListQuery = useQuery({
    queryKey: ["ai-threads", workspaceId],
    queryFn: async () => {
      if (!session?.access_token) {
        return [];
      }

      return listAiThreads(workspaceId, session.access_token);
    },
    enabled: enabled && Boolean(session?.access_token && workspaceId),
  });

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return createAiThreadRequest(workspaceId, session.access_token, {
        title: originTitle ? `${originTitle} · Intelligence` : "Intelligence 对话",
        originSurfaceType,
        originSurfaceId,
      });
    },
    onSuccess: (thread) => {
      setCurrentThreadId(thread.id);
      setError(null);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "创建 AI 线程失败",
      );
    },
  });
  const {
    mutate: createThread,
    mutateAsync: createThreadAsync,
    isPending: isCreateThreadPending,
    error: createThreadError,
  } = createThreadMutation;

  const ensureThread = async () => {
    if (!session?.access_token) {
      throw new Error("未授权");
    }

    if (threadIdOverride) {
      if (currentThreadId !== threadIdOverride) {
        setCurrentThreadId(threadIdOverride);
      }

      return threadIdOverride;
    }

    if (currentThreadId) {
      return currentThreadId;
    }

    let threads = threadListQuery.data;

    if (!threads) {
      const threadListResult = await threadListQuery.refetch();
      threads = threadListResult.data ?? [];
    }

    const existingThread = threads.find(
      (thread) =>
        thread.originSurfaceType === originSurfaceType &&
        thread.originSurfaceId === originSurfaceId,
    );

    if (existingThread) {
      if (currentThreadId !== existingThread.id) {
        setCurrentThreadId(existingThread.id);
      }

      return existingThread.id;
    }

    const createdThread = await createThreadAsync();
    return createdThread.id;
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (threadIdOverride) {
      if (currentThreadId !== threadIdOverride) {
        setCurrentThreadId(threadIdOverride);
      }

      return;
    }

    if (!session?.access_token || !workspaceId || currentThreadId) {
      return;
    }

    if (threadListQuery.isLoading || isCreateThreadPending) {
      return;
    }

    const existingThread = threadListQuery.data?.find(
      (thread) =>
        thread.originSurfaceType === originSurfaceType &&
        thread.originSurfaceId === originSurfaceId,
    );

    if (existingThread && autoCreate) {
      if (currentThreadId !== existingThread.id) {
        setCurrentThreadId(existingThread.id);
      }

      return;
    }

    if (threadListQuery.data && autoCreate) {
      createThread();
    }
  }, [
    autoCreate,
    createThread,
    currentThreadId,
    enabled,
    isCreateThreadPending,
    originSurfaceId,
    originSurfaceType,
    session?.access_token,
    setCurrentThreadId,
    threadIdOverride,
    threadListQuery.data,
    threadListQuery.isLoading,
    workspaceId,
  ]);

  const threadQuery = useQuery({
    queryKey: ["ai-thread", workspaceId, currentThreadId],
    queryFn: async () => {
      if (!session?.access_token || !currentThreadId) {
        return null;
      }

      return getAiThreadRequest(
        workspaceId,
        currentThreadId,
        session.access_token,
      );
    },
    enabled:
      enabled &&
      Boolean(session?.access_token && workspaceId && currentThreadId),
  });

  const messagesQuery = useQuery({
    queryKey: ["ai-thread-messages", workspaceId, currentThreadId],
    queryFn: async () => {
      if (!session?.access_token || !currentThreadId) {
        return null;
      }

      return listAiThreadMessagesRequest(
        workspaceId,
        currentThreadId,
        session.access_token,
      );
    },
    enabled:
      enabled &&
      Boolean(session?.access_token && workspaceId && currentThreadId),
  });

  useEffect(() => {
    setLoading(
      threadListQuery.isLoading ||
        isCreateThreadPending ||
        threadQuery.isLoading ||
        messagesQuery.isLoading,
    );
  }, [
    isCreateThreadPending,
    messagesQuery.isLoading,
    setLoading,
    threadListQuery.isLoading,
    threadQuery.isLoading,
  ]);

  useEffect(() => {
    if (messagesQuery.data?.items && !isStreaming) {
      setMessages(messagesQuery.data.items);
    }
  }, [isStreaming, messagesQuery.data?.items, setMessages]);

  useEffect(() => {
    const queryError =
      createThreadError ??
      threadListQuery.error ??
      threadQuery.error ??
      messagesQuery.error;

    if (!queryError) {
      return;
    }

    setError(
      queryError instanceof Error ? queryError.message : "加载 AI 线程失败",
    );
  }, [
    createThreadError,
    messagesQuery.error,
    setError,
    threadListQuery.error,
    threadQuery.error,
  ]);

  return {
    thread: threadQuery.data,
    threadId: currentThreadId,
    messages,
    isLoading,
    error,
    ensureThread,
  };
}
