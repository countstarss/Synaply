"use client";

import React from "react";
import { RiArrowRightSLine, RiCheckLine, RiLoader4Line } from "react-icons/ri";
import { cn } from "@/lib/utils";
import type { Issue } from "@/lib/fetchers/issue";
import { formatShortDate, getIssueStateMeta, getPriorityTone } from "@/components/projects/project-view-utils";
import { IssueType } from "@/types/prisma";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function ProjectIssueList({
  issues,
  pendingIssueIds,
  onOpenIssue,
  onQuickCompleteIssue,
  onCancelIssue,
  canCancelIssue,
  canQuickCompleteIssue,
  tProjects,
  quickCompleteLabel,
  locale,
}: {
  issues: Issue[];
  pendingIssueIds: Set<string>;
  onOpenIssue: (issue: Issue) => void;
  onQuickCompleteIssue: (issue: Issue) => void;
  onCancelIssue: (issue: Issue) => void;
  canCancelIssue: (issue: Issue) => boolean;
  canQuickCompleteIssue: (issue: Issue) => boolean;
  tProjects: (key: string, values?: Record<string, string | number>) => string;
  quickCompleteLabel: string;
  locale: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-app-border bg-app-content-bg">
      {issues.map((issue) => {
        const priorityMeta = getPriorityTone(issue);
        const stateMeta = getIssueStateMeta(issue);
        const isPending = pendingIssueIds.has(issue.id);
        const isWorkflowIssue = issue.issueType === IssueType.WORKFLOW;
        const canQuickComplete = !isWorkflowIssue && canQuickCompleteIssue(issue);
        const canCancel = canCancelIssue(issue);
        const issueRow = (
          <div className="group/issue-row flex items-center gap-4 border-b border-app-border px-4 py-3 transition last:border-b-0 hover:bg-app-button-hover/35">
            {isWorkflowIssue ? (
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-bg",
                  stateMeta.className,
                )}
              >
                {stateMeta.icon}
              </div>
            ) : (
              <button
                type="button"
                disabled={isPending || !canQuickComplete}
                onClick={(event) => {
                  event.stopPropagation();
                  onQuickCompleteIssue(issue);
                }}
                aria-label={quickCompleteLabel}
                title={quickCompleteLabel}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-bg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-app-content-bg",
                  isPending
                    ? "cursor-wait text-app-text-muted"
                    : canQuickComplete
                      ? "cursor-pointer text-app-text-muted hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-200"
                      : "cursor-not-allowed text-app-text-muted/45",
                )}
              >
                {isPending ? (
                  <RiLoader4Line className="size-3.5 animate-spin" />
                ) : (
                  <RiCheckLine
                    className={cn(
                      "size-3.5 transition",
                      canQuickComplete
                        ? "opacity-25 group-hover/issue-row:opacity-100"
                        : "opacity-15",
                    )}
                  />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenIssue(issue)}
              className="flex min-w-0 flex-1 items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-app-content-bg"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-app-text-muted">
                    {issue.key || issue.id.slice(0, 8)}
                  </span>
                  <span className="truncate text-sm text-app-text-primary">
                    {issue.title}
                  </span>
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                {issue.dueDate && (
                  <b className="text-bold text-xs text-white/80">
                    {formatShortDate(issue.dueDate, locale)}
                  </b>
                )}
                <span className="text-xs text-app-text-muted">
                  {stateMeta.label}
                </span>
                {priorityMeta && (
                  <span
                    className={cn(
                      "rounded-full border px-2 py-1 text-[11px]",
                      priorityMeta.color,
                    )}
                  >
                    {priorityMeta.label}
                  </span>
                )}
              </div>

              <RiArrowRightSLine className="size-4 shrink-0 text-app-text-muted transition group-hover/issue-row:translate-x-0.5 group-hover/issue-row:text-app-text-primary" />
            </button>
          </div>
        );

        return (
          <ContextMenu key={issue.id}>
            <ContextMenuTrigger asChild>{issueRow}</ContextMenuTrigger>
            <ContextMenuContent className="w-44">
              <ContextMenuGroup>
                <ContextMenuItem onSelect={() => onOpenIssue(issue)}>
                  {tProjects("subviews.issues.openIssue")}
                </ContextMenuItem>
                <ContextMenuItem
                  variant="destructive"
                  disabled={isPending || !canCancel}
                  onSelect={() => onCancelIssue(issue)}
                >
                  {tProjects("subviews.issues.cancelIssue")}
                </ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}
