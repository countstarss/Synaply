"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { AiMessageRecord } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { AiWorkbenchInputArea } from "@/components/ai/workbench/modules/chat/AiWorkbenchInputArea";
import { AiWorkbenchChatMessage } from "@/components/ai/workbench/modules/chat/AiWorkbenchChatMessage";
import { useAiWorkbenchSelectionStore } from "@/components/ai/workbench/modules/chat/AiWorkbenchSelectionStore";
import { cn } from "@/lib/utils";

interface AiWorkbenchChatPanelProps {
  messages: AiMessageRecord[];
  draft: string;
  onDraftChange: (value: string) => void;
  onQuickReply?: (value: string) => Promise<void> | void;
  onSend: () => Promise<void> | void;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
  pendingViewportAnchorId?: string | null;
  disabled?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
}

export function AiWorkbenchChatPanel({
  messages,
  draft,
  onDraftChange,
  onQuickReply,
  onSend,
  isLoading = false,
  isStreaming = false,
  streamingText = "",
  pendingViewportAnchorId = null,
  disabled = false,
  isSubmitting = false,
  error = null,
}: AiWorkbenchChatPanelProps) {
  const tAi = useTranslations("ai");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const previousMessagesCountRef = useRef(0);
  const lastAnchoredMessageIdRef = useRef<string | null>(null);
  const initializedThreadKeyRef = useRef<string | null>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [containerViewportHeight, setContainerViewportHeight] = useState(0);
  const isSelectionMode = useAiWorkbenchSelectionStore(
    (state) => state.isSelectionMode,
  );
  const autoSelectEnabled = useAiWorkbenchSelectionStore(
    (state) => state.autoSelectEnabled,
  );
  const addToSelection = useAiWorkbenchSelectionStore(
    (state) => state.addToSelection,
  );
  const resetSelectionState = useAiWorkbenchSelectionStore(
    (state) => state.resetSelectionState,
  );

  const hasMessages = useMemo(
    () => messages.length > 0 || isStreaming,
    [isStreaming, messages.length],
  );
  const threadKey = messages[0]?.threadId ?? "__empty__";
  const lastMessage = messages.at(-1);
  const shouldReserveViewportSpace =
    !!pendingViewportAnchorId || isStreaming || lastMessage?.role === "USER";
  const viewportSpacerHeight = shouldReserveViewportSpace
    ? Math.max(containerViewportHeight - 256, 220)
    : 0;

  const stopScrollAnimation = useCallback(() => {
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }
  }, []);

  const animateScrollTo = useCallback((top: number, duration = 240) => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    stopScrollAnimation();

    const startTop = container.scrollTop;
    const delta = top - startTop;

    if (Math.abs(delta) < 4) {
      container.scrollTop = top;
      return;
    }

    const startTime = performance.now();

    const step = (currentTime: number) => {
      const progress = Math.min(1, (currentTime - startTime) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      container.scrollTop = startTop + delta * easedProgress;

      if (progress < 1) {
        scrollAnimationFrameRef.current = requestAnimationFrame(step);
        return;
      }

      scrollAnimationFrameRef.current = null;
    };

    scrollAnimationFrameRef.current = requestAnimationFrame(step);
  }, [stopScrollAnimation]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior, block: "end" });
    setIsAutoScrollEnabled(true);
  };

  const handleMessageInView = (isInView: boolean, message: AiMessageRecord) => {
    if (isInView && isSelectionMode && autoSelectEnabled) {
      addToSelection(message);
    }
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const syncViewportMetrics = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = distanceFromBottom < 120;

      setShowScrollButton(!isNearBottom);
      setIsAutoScrollEnabled(isNearBottom);
      setContainerViewportHeight(container.clientHeight);
    };

    syncViewportMetrics();
    container.addEventListener("scroll", syncViewportMetrics, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            syncViewportMetrics();
          })
        : null;

    resizeObserver?.observe(container);

    return () => {
      container.removeEventListener("scroll", syncViewportMetrics);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      stopScrollAnimation();
    };
  }, [stopScrollAnimation]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || !hasMessages) {
      return;
    }

    if (initializedThreadKeyRef.current === threadKey) {
      return;
    }

    stopScrollAnimation();
    container.scrollTop = container.scrollHeight;
    previousMessagesCountRef.current = messages.length;
    initializedThreadKeyRef.current = threadKey;
    setShowScrollButton(false);
    setIsAutoScrollEnabled(true);
  }, [hasMessages, messages.length, stopScrollAnimation, threadKey]);

  useEffect(() => {
    if (!pendingViewportAnchorId) {
      return;
    }

    if (lastAnchoredMessageIdRef.current === pendingViewportAnchorId) {
      return;
    }

    const container = containerRef.current;
    const target = document.getElementById(`message-${pendingViewportAnchorId}`);

    if (!container || !target) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = Math.max(
      0,
      container.scrollTop + (targetRect.top - containerRect.top),
    );

    animateScrollTo(targetTop, 260);
    lastAnchoredMessageIdRef.current = pendingViewportAnchorId;
    setIsAutoScrollEnabled(false);
  }, [animateScrollTo, messages.length, pendingViewportAnchorId]);

  useEffect(() => {
    const hasNewMessage = messages.length > previousMessagesCountRef.current;

    if ((hasNewMessage || isStreaming) && isAutoScrollEnabled) {
      scrollToBottom(hasNewMessage ? "smooth" : "auto");
    }

    previousMessagesCountRef.current = messages.length;
  }, [isAutoScrollEnabled, isStreaming, messages.length, streamingText]);

  useEffect(() => {
    resetSelectionState();
  }, [resetSelectionState, threadKey]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {hasMessages ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-white/58 to-transparent dark:from-[rgba(12,12,14,0.14)]" />
      ) : null}

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div
          className={cn(
            "mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 sm:px-6 lg:px-8",
            hasMessages ? "pb-44 pt-6" : "py-12",
          )}
        >
          {isLoading && !hasMessages ? (
            <div className="flex min-h-[360px] flex-1 items-center justify-center text-sm text-slate-500 dark:text-white/52">
              {tAi("workbench.chat.loading")}
            </div>
          ) : !hasMessages ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-3xl pb-48">
                <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                  <h3 className="max-w-3xl text-[32px] font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[40px]">
                    {tAi("workbench.chat.heroTitle")}
                  </h3>

                  <motion.div
                    layoutId="ai-composer-shell"
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 28,
                    }}
                    className="mt-8 w-full"
                  >
                    <AiWorkbenchInputArea
                      value={draft}
                      onChange={onDraftChange}
                      onSend={onSend}
                      disabled={disabled}
                      isSubmitting={isSubmitting}
                      error={error}
                      variant="hero"
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <AiWorkbenchChatMessage
                  key={message.id}
                  message={message}
                  onInView={handleMessageInView}
                  onQuickReply={onQuickReply}
                  disableQuickReply={isSubmitting}
                />
              ))}

              {isStreaming ? (
                <AiWorkbenchChatMessage streamingText={streamingText} />
              ) : null}
            </div>
          )}

          {hasMessages && viewportSpacerHeight > 0 ? (
            <div
              aria-hidden
              className="pointer-events-none shrink-0 transition-[height] duration-200 ease-out"
              style={{ height: `${viewportSpacerHeight}px` }}
            />
          ) : null}

          <div ref={endRef} />
        </div>
      </div>

      {hasMessages ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white/96 via-white/84 to-transparent dark:from-[rgba(12,12,14,0.98)] dark:via-[rgba(12,12,14,0.88)]" />

          <div className="absolute inset-x-0 bottom-0 px-4 pb-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <motion.div
                layoutId="ai-composer-shell"
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 28,
                }}
              >
                <AiWorkbenchInputArea
                  value={draft}
                  onChange={onDraftChange}
                  onSend={onSend}
                  disabled={disabled}
                  isSubmitting={isSubmitting}
                  error={error}
                  variant="docked"
                />
              </motion.div>
            </div>
          </div>
        </>
      ) : null}

      {hasMessages && showScrollButton ? (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={cn(
            "absolute bottom-24 right-6 z-20 rounded-full border border-black/[0.06] bg-white/92 text-slate-700 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.22)] hover:bg-white dark:border-white/10 dark:bg-[rgba(24,24,27,0.96)] dark:text-white dark:shadow-[0_18px_48px_-28px_rgba(0,0,0,0.9)] dark:hover:bg-[rgba(30,30,34,0.98)]",
            "sm:right-8",
          )}
          onClick={() => scrollToBottom()}
        >
          <ChevronDown className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
