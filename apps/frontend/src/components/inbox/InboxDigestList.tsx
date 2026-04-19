"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { RiArrowRightSLine, RiFileTextLine } from "react-icons/ri";
import type { InboxItem } from "@/lib/fetchers/inbox";
import { cn } from "@/lib/utils";
import {
  getInboxDigestDisplayTitle,
  getInboxDigestSummary,
  getInboxDigestTargetLabel,
} from "@/components/inbox/inbox-digest-utils";

function formatOccurredAt(value: string, locale: string) {
  return new Date(value).toLocaleString(locale, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InboxDigestList({
  items,
  isLoading = false,
  emptyTitle,
  emptyDescription,
  onOpenItem,
  className,
}: {
  items: InboxItem[];
  isLoading?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  onOpenItem: (item: InboxItem) => void;
  className?: string;
}) {
  const locale = useLocale();
  const tInbox = useTranslations("inbox");
  const tDocs = useTranslations("docs");

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-4"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-app-button-hover" />
            <div className="mt-3 h-4 w-48 animate-pulse rounded bg-app-button-hover" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-app-button-hover" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded bg-app-button-hover" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-app-border bg-app-bg/40 px-4 py-6 text-center",
          className,
        )}
      >
        <div className="text-sm font-medium text-app-text-primary">
          {emptyTitle}
        </div>
        <p className="mt-2 text-sm leading-6 text-app-text-secondary">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const targetLabel = getInboxDigestTargetLabel(item);
        const summary = getInboxDigestSummary(item, locale, tInbox, tDocs);
        const displayTitle = getInboxDigestDisplayTitle(item, tInbox);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpenItem(item)}
            className="group w-full rounded-2xl border border-app-border bg-app-bg/70 px-4 py-4 text-left transition hover:bg-app-button-hover/40"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl border border-app-border bg-app-content-bg p-2 text-app-text-secondary">
                <RiFileTextLine className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                {targetLabel ? (
                  <div className="text-[11px] uppercase tracking-[0.18em] text-app-text-muted">
                    {targetLabel}
                  </div>
                ) : null}
                <div className="mt-1 text-sm font-medium text-app-text-primary">
                  {displayTitle}
                </div>
                {summary ? (
                  <p className="mt-2 text-sm leading-6 text-app-text-secondary">
                    {summary}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-app-text-muted">
                  <span>{formatOccurredAt(item.occurredAt, locale)}</span>
                  <span className="inline-flex items-center gap-1 text-app-text-secondary transition group-hover:text-app-text-primary">
                    {item.actionLabel || tInbox("row.markSeen")}
                    <RiArrowRightSLine className="size-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
