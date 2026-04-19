"use client";

import React from "react";
import {
  RiArrowRightSLine,
  RiLoopLeftLine,
  RiTimeLine,
} from "react-icons/ri";
import type { Issue } from "@/lib/fetchers/issue";
import { formatPreciseDate } from "@/components/projects/project-view-utils";
import {
  formatProjectRelativeTime,
  getProjectActivityActorLabel,
  type ProjectTimelineEntry,
  type ProjectsTranslationFn,
} from "@/components/projects/project-activity-utils";

export function ProjectActivityTimeline({
  entries,
  locale,
  tProjects,
  relativeTimePrefix,
  emptyText,
  syncTitle,
  syncDescription,
  actorFallbackLabel,
  onOpenIssue,
  syncTimeMode = "relative+precise",
}: {
  entries: ProjectTimelineEntry[];
  locale: string;
  tProjects: ProjectsTranslationFn;
  relativeTimePrefix: "detail.relativeTime" | "subviews.relativeTime";
  emptyText: string;
  syncTitle: string;
  syncDescription: string;
  actorFallbackLabel: string;
  onOpenIssue?: (issue: Issue) => void;
  syncTimeMode?: "relative+precise" | "precise";
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-app-border bg-app-content-bg px-4 py-5 text-sm text-app-text-secondary">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const relativeTime = formatProjectRelativeTime(
          entry.occurredAt,
          tProjects,
          locale,
          relativeTimePrefix,
        );
        const preciseTime = formatPreciseDate(entry.occurredAt, locale);

        if (entry.type === "sync") {
          return (
            <div
              key={entry.id}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-app-text-primary">
                <RiLoopLeftLine className="size-4 text-emerald-300" />
                {syncTitle}
              </div>
              <div className="mt-1 text-xs leading-5 text-app-text-secondary">
                {syncDescription}
              </div>
              <div className="mt-2 text-xs text-app-text-secondary">
                {syncTimeMode === "precise"
                  ? preciseTime
                  : `${relativeTime} · ${preciseTime}`}
              </div>
            </div>
          );
        }

        return (
          <div
            key={entry.id}
            className="rounded-2xl border border-app-border bg-app-content-bg px-4 py-3"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-app-text-primary">
              <RiTimeLine className="size-4 text-app-text-muted" />
              {entry.activity.action}
            </div>
            <div className="mt-1 text-xs leading-5 text-app-text-secondary">
              {getProjectActivityActorLabel(entry.activity, actorFallbackLabel)} ·{" "}
              {relativeTime}
            </div>
            <div className="mt-1 text-[11px] text-app-text-muted">
              {preciseTime}
            </div>
            {entry.issue && onOpenIssue && (
              <button
                type="button"
                onClick={() => onOpenIssue(entry.issue!)}
                className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300 transition hover:text-sky-200"
              >
                {entry.issue.key || entry.issue.id.slice(0, 4)} · {entry.issue.title}
                <RiArrowRightSLine className="size-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
