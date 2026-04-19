import { create } from "zustand";
import type { AiMessageRecord } from "@/lib/ai/types";

interface AiThreadState {
  currentThreadId: string | null;
  messages: AiMessageRecord[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  error: string | null;
  setCurrentThreadId: (threadId: string | null) => void;
  setMessages: (messages: AiMessageRecord[]) => void;
  addMessage: (message: AiMessageRecord) => void;
  setLoading: (isLoading: boolean) => void;
  startStreaming: () => void;
  appendStreamingText: (chunk: string) => void;
  completeStreaming: (threadIdOverride?: string | null) => void;
  cancelStreaming: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAiThreadStore = create<AiThreadState>((set, get) => ({
  currentThreadId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingText: "",
  error: null,
  setCurrentThreadId: (threadId) =>
    set((state) =>
      state.currentThreadId === threadId
        ? state
        : { currentThreadId: threadId },
    ),
  setMessages: (messages) =>
    set((state) => (state.messages === messages ? state : { messages })),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setLoading: (isLoading) =>
    set((state) => (state.isLoading === isLoading ? state : { isLoading })),
  startStreaming: () =>
    set({
      isStreaming: true,
      streamingText: "",
    }),
  appendStreamingText: (chunk) =>
    set((state) => ({
      streamingText: `${state.streamingText}${chunk}`,
    })),
  completeStreaming: (threadIdOverride) => {
    const { currentThreadId, streamingText } = get();
    const targetThreadId = threadIdOverride ?? currentThreadId;

    set((state) => ({
      messages:
        streamingText.trim() && targetThreadId
          ? [
              ...state.messages,
              {
                id: `local-assistant-${Date.now()}`,
                threadId: targetThreadId,
                runId: null,
                role: "ASSISTANT",
                parts: [
                  {
                    type: "text",
                    text: streamingText,
                  },
                ],
                createdAt: new Date().toISOString(),
              },
            ]
          : state.messages,
      isStreaming: false,
      streamingText: "",
    }));
  },
  cancelStreaming: () =>
    set({
      isStreaming: false,
      streamingText: "",
    }),
  setError: (error) =>
    set((state) => (state.error === error ? state : { error })),
  reset: () =>
    set((state) =>
      state.currentThreadId === null &&
      state.messages.length === 0 &&
      !state.isLoading &&
      !state.isStreaming &&
      state.streamingText === "" &&
      state.error === null
        ? state
        : {
            currentThreadId: null,
            messages: [],
            isLoading: false,
            isStreaming: false,
            streamingText: "",
            error: null,
          },
    ),
}));
