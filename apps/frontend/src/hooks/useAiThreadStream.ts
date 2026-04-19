"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { streamAiThreadMessage } from "@/lib/fetchers/ai-thread";
import { useAiThreadStore } from "@/stores/ai-thread";

interface UseAiThreadStreamOptions {
  workspaceId: string;
  threadId: string | null;
}

interface SendAiThreadMessageOptions {
  onLocalMessage?: (messageId: string) => void;
}

export function useAiThreadStream({
  workspaceId,
  threadId,
}: UseAiThreadStreamOptions) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const {
    addMessage,
    startStreaming,
    appendStreamingText,
    completeStreaming,
    cancelStreaming,
    setError,
  } = useAiThreadStore();

  const sendMessage = useCallback(
    async (
      text: string,
      threadIdOverride?: string,
      options?: SendAiThreadMessageOptions,
    ) => {
      const trimmedText = text.trim();
      const activeThreadId = threadIdOverride ?? threadId;

      if (!trimmedText) {
        return;
      }

      if (!session?.access_token) {
        throw new Error("未授权");
      }

      if (!activeThreadId) {
        throw new Error("AI 线程尚未准备好");
      }

      const localMessageId = `local-user-${Date.now()}`;

      addMessage({
        id: localMessageId,
        threadId: activeThreadId,
        runId: null,
        role: "USER",
        parts: [
          {
            type: "text",
            text: trimmedText,
          },
        ],
        createdAt: new Date().toISOString(),
      });
      options?.onLocalMessage?.(localMessageId);

      setError(null);
      startStreaming();

      try {
        const response = await streamAiThreadMessage(
          workspaceId,
          activeThreadId,
          session.access_token,
          trimmedText,
        );

        if (!response.ok) {
          throw new Error((await response.text()) || "发送 AI 消息失败");
        }

        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error("AI 响应流不可用");
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          appendStreamingText(decoder.decode(value, { stream: true }));
        }

        const finalChunk = decoder.decode();

        if (finalChunk) {
          appendStreamingText(finalChunk);
        }

        completeStreaming(activeThreadId);

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["ai-thread", workspaceId, activeThreadId],
          }),
          queryClient.invalidateQueries({
            queryKey: ["ai-thread-messages", workspaceId, activeThreadId],
          }),
        ]);
      } catch (streamError) {
        cancelStreaming();
        const message =
          streamError instanceof Error
            ? streamError.message
            : "发送 AI 消息失败";
        setError(message);
        addMessage({
          id: `local-system-${Date.now()}`,
          threadId: activeThreadId,
          runId: null,
          role: "SYSTEM",
          parts: [
            {
              type: "error",
              message,
            },
          ],
          createdAt: new Date().toISOString(),
        });
        throw streamError;
      }
    },
    [
      addMessage,
      appendStreamingText,
      cancelStreaming,
      completeStreaming,
      queryClient,
      session?.access_token,
      setError,
      startStreaming,
      threadId,
      workspaceId,
    ],
  );

  return {
    sendMessage,
  };
}
