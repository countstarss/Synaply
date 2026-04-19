"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RiRobot2Line } from "react-icons/ri";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AiComposer } from "@/components/ai/thread/AiComposer";
import { AiMessageList } from "@/components/ai/thread/AiMessageList";
import { AiThreadList } from "@/components/ai/thread/AiThreadList";
import { useAiThread } from "@/hooks/useAiThread";
import { useAiThreadStream } from "@/hooks/useAiThreadStream";
import type { AiSurfaceType } from "@/lib/ai/types";
import { useAiThreadStore } from "@/stores/ai-thread";

interface AiThreadShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  originSurfaceType: AiSurfaceType;
  originSurfaceId: string;
  originTitle?: string | null;
}

export function AiThreadShell({
  open,
  onOpenChange,
  workspaceId,
  originSurfaceType,
  originSurfaceId,
  originTitle,
}: AiThreadShellProps) {
  const tAi = useTranslations("ai");
  const { isStreaming, streamingText, error, setError } = useAiThreadStore();
  const { thread, threadId, messages, isLoading } = useAiThread({
    workspaceId,
    originSurfaceType,
    originSurfaceId,
    originTitle,
    enabled: open,
  });
  const { sendMessage } = useAiThreadStream({
    workspaceId,
    threadId,
  });

  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open, setError]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full max-w-2xl flex-col gap-0 border-l border-app-border bg-app-content-bg p-0"
      >
        <SheetHeader className="border-b border-app-border bg-app-content-bg pr-12">
          <SheetTitle className="flex items-center gap-2 text-app-text-primary">
            <RiRobot2Line className="size-5 text-sky-600" />
            {tAi("thread.shell.title")}
          </SheetTitle>
          <SheetDescription className="text-app-text-secondary">
            {tAi("thread.shell.description")}
          </SheetDescription>
          <AiThreadList
            thread={thread}
            fallbackTitle={originTitle}
            isLoading={isLoading && !thread}
          />
          {error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {error}
            </div>
          ) : null}
        </SheetHeader>

        <AiMessageList
          messages={messages}
          isLoading={isLoading && messages.length === 0}
          isStreaming={isStreaming}
          streamingText={streamingText}
        />

        <AiComposer
          disabled={!threadId || isLoading}
          onSend={async (text) => {
            await sendMessage(text);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
