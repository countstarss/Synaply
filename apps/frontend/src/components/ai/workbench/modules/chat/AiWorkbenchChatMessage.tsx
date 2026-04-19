"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCheck,
  CheckCircle2,
  Copy,
  Layers3,
  LoaderCircle,
  Square,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AiMessagePart, AiMessageRecord } from "@/lib/ai/types";
import { AiApprovalRequestCard } from "@/components/ai/thread/AiApprovalRequestCard";
import { AiClarificationOptionsCard } from "@/components/ai/thread/AiClarificationOptionsCard";
import { AiCodingPromptCard } from "@/components/ai/thread/AiCodingPromptCard";
import { AiToolResultCard } from "@/components/ai/thread/AiToolResultCard";
import { AiWorkbenchLoadingDots } from "@/components/ai/workbench/modules/chat/AiWorkbenchLoadingDots";
import { getAiMessageSelectionText } from "@/components/ai/workbench/modules/chat/AiWorkbenchChatUtils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useAiWorkbenchSelectionStore } from "@/components/ai/workbench/modules/chat/AiWorkbenchSelectionStore";

interface AiWorkbenchChatMessageProps {
  message?: AiMessageRecord;
  streamingText?: string;
  onInView?: (isInView: boolean, message: AiMessageRecord) => void;
  onQuickReply?: (value: string) => Promise<void> | void;
  disableQuickReply?: boolean;
}

function renderTextPart(text: string, className?: string) {
  return (
    <pre
      className={cn(
        "w-full whitespace-pre-wrap break-words font-sans text-sm leading-7 [overflow-wrap:anywhere]",
        className,
      )}
    >
      {text}
    </pre>
  );
}

function renderPart(
  message: AiMessageRecord,
  part: AiMessagePart,
  index: number,
  onQuickReply?: (value: string) => Promise<void> | void,
  disableQuickReply = false,
) {
  switch (part.type) {
    case "text":
      return (
        <div
          key={`${message.id}-${part.type}-${index}`}
          className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] px-4 py-3.5 text-slate-900 shadow-[0_16px_48px_-36px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(26,26,29,0.96),rgba(14,14,16,0.98))] dark:text-white dark:shadow-[0_16px_48px_-36px_rgba(0,0,0,0.9)]"
        >
          {renderTextPart(part.text)}
        </div>
      );
    case "error":
      return (
        <div
          key={`${message.id}-${part.type}-${index}`}
          className="overflow-hidden rounded-[24px] border border-rose-200/70 bg-rose-50/95 px-4 py-3.5 text-rose-950 shadow-sm dark:border-rose-500/24 dark:bg-rose-950/28 dark:text-rose-100"
        >
          {renderTextPart(part.message, "text-rose-950 dark:text-rose-100")}
        </div>
      );
    case "tool-result":
      return (
        <div key={`${message.id}-${part.type}-${index}`} className="min-w-0">
          <AiToolResultCard part={part} />
        </div>
      );
    case "approval-request":
      return (
        <div key={`${message.id}-${part.type}-${index}`} className="min-w-0">
          <AiApprovalRequestCard threadId={message.threadId} part={part} />
        </div>
      );
    case "coding-prompt":
      return (
        <div key={`${message.id}-${part.type}-${index}`} className="min-w-0">
          <AiCodingPromptCard part={part} />
        </div>
      );
    case "clarification-options":
      return (
        <div key={`${message.id}-${part.type}-${index}`} className="min-w-0">
          <AiClarificationOptionsCard
            part={part}
            onSelect={onQuickReply}
            disabled={disableQuickReply}
          />
        </div>
      );
    case "context-chip":
      return (
        <div
          key={`${message.id}-${part.type}-${index}`}
          className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-black/[0.06] bg-black/[0.03] px-3 py-1 text-xs text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/64"
        >
          {part.label}
        </div>
      );
    case "tool-call":
      return null;
    default:
      return null;
  }
}

export function AiWorkbenchChatMessage({
  message,
  streamingText = "",
  onInView,
  onQuickReply,
  disableQuickReply = false,
}: AiWorkbenchChatMessageProps) {
  const tAi = useTranslations("ai");
  const messageRef = useRef<HTMLDivElement | null>(null);
  const isSelectionMode = useAiWorkbenchSelectionStore(
    (state) => state.isSelectionMode,
  );
  const isSelected = useAiWorkbenchSelectionStore((state) =>
    message ? state.selectedMessages.some((item) => item.id === message.id) : false,
  );
  const enterSelectionMode = useAiWorkbenchSelectionStore(
    (state) => state.enterSelectionMode,
  );
  const exitSelectionMode = useAiWorkbenchSelectionStore(
    (state) => state.exitSelectionMode,
  );
  const addToSelection = useAiWorkbenchSelectionStore(
    (state) => state.addToSelection,
  );
  const toggleMessageSelection = useAiWorkbenchSelectionStore(
    (state) => state.toggleMessageSelection,
  );
  const isStreaming = !message;
  const isUser = message?.role === "USER";
  const isSystem = message?.role === "SYSTEM";
  const visibleParts = message
    ? message.parts.filter((part) => part.type !== "tool-call")
    : [];
  const textOnly =
    isStreaming ||
    (visibleParts.length > 0 &&
      visibleParts.every(
        (part) => part.type === "text" || part.type === "error",
      ));

  const widthClassName = isUser
    ? "max-w-[min(82%,44rem)]"
    : textOnly
      ? "max-w-[min(100%,54rem)]"
      : "w-full max-w-[min(100%,58rem)]";

  useEffect(() => {
    if (!message || !onInView || !messageRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        onInView(entry.isIntersecting, message);
      },
      {
        threshold: 0.5,
        rootMargin: "0px",
      },
    );

    observer.observe(messageRef.current);

    return () => {
      observer.disconnect();
    };
  }, [message, onInView]);

  if (isStreaming) {
    return (
      <div className="flex w-full justify-start">
        <div className={cn("min-w-0", widthClassName)}>
          <div className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] px-4 py-3.5 text-slate-900 shadow-[0_16px_48px_-36px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(26,26,29,0.96),rgba(14,14,16,0.98))] dark:text-white dark:shadow-[0_16px_48px_-36px_rgba(0,0,0,0.9)]">
            {streamingText ? (
              renderTextPart(streamingText)
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/56">
                <LoaderCircle className="size-4 animate-spin" />
                {tAi("workbench.chat.streaming")}
                <AiWorkbenchLoadingDots className="ml-0.5" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleCopyMessage = async () => {
    if (!message) {
      return;
    }

    try {
      await navigator.clipboard.writeText(getAiMessageSelectionText(message, tAi));
      toast.success(tAi("workbench.chat.copySuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tAi("shared.copyFailed"));
    }
  };

  const messageNode = (
    <div
      ref={messageRef}
      id={message ? `message-${message.id}` : undefined}
      className={cn(
        "group relative flex w-full scroll-mt-28 transition-all duration-300",
        isUser ? "justify-end" : isSystem ? "justify-center" : "justify-start",
        isSelectionMode &&
          "cursor-pointer rounded-[28px] px-1 py-1 hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.025]",
      )}
      onClick={() => {
        if (message && isSelectionMode) {
          toggleMessageSelection(message);
        }
      }}
    >
      {isSelectionMode && isSelected ? (
        <div className="absolute left-0 top-1/2 z-10 -translate-y-1/2 md:-left-8">
          <CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-300" />
        </div>
      ) : null}

      <div className={cn("min-w-0", widthClassName)}>
        {textOnly ? (
          <div
            className={cn(
              "overflow-hidden rounded-[24px] border px-4 py-3.5 shadow-[0_16px_48px_-36px_rgba(0,0,0,0.9)]",
              isUser &&
                "border-sky-400/30 bg-[linear-gradient(135deg,rgba(35,128,255,0.96),rgba(20,97,210,0.94))] text-white",
              !isUser &&
                !isSystem &&
                "border-black/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] text-slate-900 shadow-[0_16px_48px_-36px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(26,26,29,0.96),rgba(14,14,16,0.98))] dark:text-white dark:shadow-[0_16px_48px_-36px_rgba(0,0,0,0.9)]",
              isSystem &&
                "border-amber-200/60 bg-amber-50/95 text-amber-950 shadow-sm dark:border-amber-400/20 dark:bg-amber-950/24 dark:text-amber-100",
              isSelectionMode && isSelected && "ring-1 ring-sky-400/40",
            )}
          >
            <div className="flex min-w-0 flex-col gap-3">
              {visibleParts.length > 0 ? (
                visibleParts.map((part, index) => (
                  <div key={`${message.id}-${part.type}-${index}`} className="min-w-0">
                    {part.type === "error"
                      ? renderTextPart(
                          part.message,
                          isSystem
                            ? "text-amber-950 dark:text-amber-100"
                            : "text-rose-700 dark:text-rose-100",
                        )
                      : part.type === "text"
                        ? renderTextPart(
                            part.text,
                            isSystem ? "text-amber-950 dark:text-amber-100" : undefined,
                          )
                        : null}
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-slate-500 dark:text-white/60">
                  {tAi("workbench.chat.noContent")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex min-w-0 flex-col gap-3",
              isSelectionMode && isSelected && "rounded-[28px] ring-1 ring-sky-400/32 ring-offset-2 ring-offset-transparent",
            )}
          >
              {visibleParts.length > 0 ? (
                visibleParts.map((part, index) =>
                renderPart(message, part, index, onQuickReply, disableQuickReply),
              )
            ) : (
              <div className="rounded-[24px] border border-black/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] px-4 py-3.5 text-sm leading-7 text-slate-500 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(26,26,29,0.96),rgba(14,14,16,0.98))] dark:text-white/60">
                {tAi("workbench.chat.noContent")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{messageNode}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onSelect={() => void handleCopyMessage()}>
          <Copy className="size-4" />
          {tAi("workbench.chat.copy")}
        </ContextMenuItem>
        <ContextMenuSeparator />
        {isSelectionMode ? (
          <>
            <ContextMenuItem
              onSelect={() => {
                if (message) {
                  toggleMessageSelection(message);
                }
              }}
            >
              {isSelected ? (
                <Square className="size-4" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              {isSelected
                ? tAi("workbench.chat.deselect")
                : tAi("workbench.chat.select")}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={exitSelectionMode}>
              <X className="size-4" />
              {tAi("workbench.chat.exitMultiSelect")}
            </ContextMenuItem>
          </>
        ) : (
          <ContextMenuItem
            onSelect={() => {
              if (!message) {
                return;
              }

              enterSelectionMode();
              addToSelection(message);
            }}
          >
            <Layers3 className="size-4" />
            {tAi("workbench.chat.multiSelect")}
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
