"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { AiThreadRecord } from "@/lib/ai/types";

interface AiThreadListProps {
  thread: AiThreadRecord | null | undefined;
  fallbackTitle?: string | null;
  isLoading?: boolean;
}

export function AiThreadList({
  thread,
  fallbackTitle,
  isLoading = false,
}: AiThreadListProps) {
  const tAi = useTranslations("ai");
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-app-button-hover" />
        <div className="h-4 w-48 animate-pulse rounded bg-app-button-hover" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-app-text-primary">
          {thread?.title || fallbackTitle || tAi("thread.list.fallbackTitle")}
        </p>
        <p className="mt-1 text-xs text-app-text-secondary">
          {tAi("thread.list.description")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(thread?.pins.length ?? 0) > 0 ? (
          thread?.pins.map((pin) => (
            <Badge
              key={pin.id}
              variant="secondary"
              className="bg-app-button-hover text-app-text-primary"
            >
              {pin.surfaceType} · {pin.surfaceId.slice(0, 8)}
            </Badge>
          ))
        ) : (
          <Badge
            variant="secondary"
            className="bg-app-button-hover text-app-text-secondary"
          >
            {tAi("thread.list.noPins")}
          </Badge>
        )}
      </div>
    </div>
  );
}
