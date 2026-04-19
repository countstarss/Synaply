"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { RiLoader4Line } from "react-icons/ri";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AiMessageRecord } from "@/lib/ai/types";
import { AiMessageBubble } from "@/components/ai/thread/AiMessageBubble";

interface AiMessageListProps {
  messages: AiMessageRecord[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
}

export function AiMessageList({
  messages,
  isLoading = false,
  isStreaming = false,
  streamingText = "",
}: AiMessageListProps) {
  const tAi = useTranslations("ai");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, streamingText, isStreaming]);

  return (
    <ScrollArea className="min-h-0 flex-1 bg-app-bg">
      <div className="flex min-h-full flex-col gap-4 px-4 py-5">
        {isLoading ? (
          <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-app-text-secondary">
            <RiLoader4Line className="mr-2 size-4 animate-spin" />
            {tAi("thread.messages.loading")}
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-app-text-secondary">
            {tAi("thread.messages.empty")}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <AiMessageBubble key={message.id} message={message} />
            ))}

            {isStreaming ? (
              <div className="flex w-full justify-start">
                <div className="max-w-[88%] rounded-2xl border border-app-border bg-app-content-bg px-4 py-3 text-sm text-app-text-primary shadow-sm">
                  {streamingText ? (
                    <pre className="whitespace-pre-wrap break-words font-sans leading-6">
                      {streamingText}
                    </pre>
                  ) : (
                    <div className="flex items-center gap-2 text-app-text-secondary">
                      <RiLoader4Line className="size-4 animate-spin" />
                      {tAi("thread.messages.streaming")}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}

        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
