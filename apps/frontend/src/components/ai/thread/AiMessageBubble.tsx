"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  type AiMessagePart,
  type AiMessageRecord,
} from "@/lib/ai/types";
import { AiApprovalRequestCard } from "@/components/ai/thread/AiApprovalRequestCard";
import { AiClarificationOptionsCard } from "@/components/ai/thread/AiClarificationOptionsCard";
import { AiToolResultCard } from "@/components/ai/thread/AiToolResultCard";
import { AiCodingPromptCard } from "@/components/ai/thread/AiCodingPromptCard";

interface AiMessageBubbleProps {
  message: AiMessageRecord;
  onQuickReply?: (value: string) => Promise<void> | void;
}

function renderTextPart(text: string, className?: string) {
  return (
    <pre
      className={cn(
        "whitespace-pre-wrap break-words font-sans text-sm leading-6",
        className,
      )}
    >
      {text}
    </pre>
  );
}

function renderStructuredPart(
  message: AiMessageRecord,
  part: AiMessagePart,
  onQuickReply?: (value: string) => Promise<void> | void,
) {
  switch (part.type) {
    case "text":
      return renderTextPart(part.text);
    case "error":
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950 shadow-sm">
          {renderTextPart(part.message)}
        </div>
      );
    case "tool-result":
      return <AiToolResultCard part={part} />;
    case "approval-request":
      return <AiApprovalRequestCard threadId={message.threadId} part={part} />;
    case "coding-prompt":
      return <AiCodingPromptCard part={part} />;
    case "clarification-options":
      return <AiClarificationOptionsCard part={part} onSelect={onQuickReply} />;
    case "context-chip":
      return (
        <div className="inline-flex w-fit items-center rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs text-app-text-secondary">
          {part.label}
        </div>
      );
    case "tool-call":
      return null;
    default:
      return null;
  }
}

export function AiMessageBubble({
  message,
  onQuickReply,
}: AiMessageBubbleProps) {
  const tAi = useTranslations("ai");
  const isUser = message.role === "USER";
  const isSystem = message.role === "SYSTEM";
  const visibleParts = message.parts.filter((part) => part.type !== "tool-call");
  const textOnly =
    visibleParts.length > 0 &&
    visibleParts.every((part) => part.type === "text" || part.type === "error");

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
        isSystem && "justify-center",
      )}
    >
      <div
        className={cn(
          "max-w-[88%]",
          textOnly &&
            "rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser && textOnly && "bg-sky-600 text-white",
          !isUser &&
            !isSystem &&
            textOnly &&
            "border border-app-border bg-app-content-bg text-app-text-primary",
          isSystem &&
            textOnly &&
            "border border-amber-200 bg-amber-50 text-amber-900",
        )}
      >
        <div className={cn("flex flex-col gap-3", textOnly && "gap-2")}>
          {visibleParts.length > 0 ? (
            visibleParts.map((part, index) => (
              <div key={`${message.id}-${part.type}-${index}`}>
                {renderStructuredPart(message, part, onQuickReply)}
              </div>
            ))
          ) : (
            <p className="leading-6 text-app-text-secondary">
              {tAi("thread.messageBubble.empty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
