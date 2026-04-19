"use client";

import React from "react";
import { RiArrowRightSLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import type {
  ProjectSummaryIssue,
  ProjectWorkflowSummary,
} from "@/lib/fetchers/project";
import type { DocRecord } from "@/lib/fetchers/doc";
import type { Issue } from "@/lib/fetchers/issue";
import type {
  ProjectsTranslationFn,
} from "@/components/projects/project-activity-utils";
import type { WorkflowRuntimeSnapshot } from "@/components/projects/project-detail-helpers";
import { formatShortDate } from "@/components/projects/project-view-utils";
import {
  getAssigneeLabel,
  getIssuePriorityWeight,
  getIssueStateLabel,
  getPendingConfirmationTargetLabel,
  getWorkflowFocusLabel,
  getWorkflowRunStatusLabel,
  isBlockedIssueLike,
} from "@/components/projects/project-detail-helpers";

export function ProjectPanel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-app-border bg-app-content-bg/80 p-5 shadow-sm isolate">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-app-text-primary">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-app-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ProjectMetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClassName =
    tone === "danger"
      ? "border-rose-500/20 bg-app-content-bg"
      : tone === "warning"
        ? "border-amber-500/20 bg-app-content-bg"
        : tone === "success"
          ? "border-emerald-500/20 bg-app-content-bg"
          : "border-app-border bg-app-content-bg";

  return (
    <div className={cn("rounded-2xl border px-4 py-3", toneClassName)}>
      <div className="text-xs text-app-text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-app-text-primary">{value}</div>
      {hint && <div className="mt-1 text-xs text-app-text-secondary">{hint}</div>}
    </div>
  );
}

export function ProjectIssueRow({
  issue,
  onOpenIssue,
  tProjects,
  locale,
}: {
  issue: ProjectSummaryIssue;
  onOpenIssue?: (issueId: string) => void;
  tProjects: ProjectsTranslationFn;
  locale: string;
}) {
  const priorityTone = getIssuePriorityWeight(issue.priority);

  return (
    <button
      type="button"
      onClick={() => onOpenIssue?.(issue.id)}
      className="flex w-full items-center gap-3 rounded-2xl border border-app-border bg-app-content-bg px-3 py-3 text-left transition hover:bg-app-button-hover/35"
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-2xl border text-xs font-medium",
          isBlockedIssueLike(issue)
            ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
            : "border-app-border bg-app-content-bg text-app-text-secondary",
        )}
      >
        {issue.key || issue.id.slice(0, 4)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-app-text-primary">
            {issue.title}
          </span>
          {priorityTone >= 3 && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
              {issue.priority === "URGENT"
                ? tProjects("detail.priority.urgent")
                : tProjects("detail.priority.high")}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
          <span>{getIssueStateLabel(issue, tProjects)}</span>
          <span>·</span>
          <span>{getAssigneeLabel(issue, tProjects)}</span>
          {issue.dueDate && (
            <>
              <span>·</span>
              <span>{formatShortDate(issue.dueDate, locale)}</span>
            </>
          )}
        </div>
      </div>
      <RiArrowRightSLine className="size-4 shrink-0 text-app-text-muted" />
    </button>
  );
}

export function ProjectDocRow({
  doc,
  locale,
  onOpenDoc,
  tProjects,
}: {
  doc: DocRecord;
  locale: string;
  onOpenDoc: (docId: string) => void;
  tProjects: ProjectsTranslationFn;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenDoc(doc._id)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-content-bg px-3 py-3 text-left transition hover:bg-app-button-hover/35"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-app-text-primary">{doc.title}</div>
        <div className="mt-1 text-xs text-app-text-muted">
          {tProjects("detail.collaboration.docUpdatedAt", {
            value: formatShortDate(new Date(doc.lastEditedAt).toISOString(), locale),
          })}
        </div>
      </div>
      <RiArrowRightSLine className="size-4 shrink-0 text-app-text-muted" />
    </button>
  );
}

export function ProjectPendingConfirmationRow({
  issue,
  locale,
  onOpenIssue,
  tProjects,
}: {
  issue: Issue;
  locale: string;
  onOpenIssue: (issue: Issue) => void;
  tProjects: ProjectsTranslationFn;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenIssue(issue)}
      className="flex w-full items-center gap-3 rounded-2xl border border-app-border bg-app-content-bg px-3 py-3 text-left transition hover:bg-app-button-hover/35"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-app-border bg-app-bg text-xs font-medium text-app-text-secondary">
        {issue.key || issue.id.slice(0, 4)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-app-text-primary">{issue.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
          <span>{getWorkflowRunStatusLabel(issue, tProjects)}</span>
          <span>·</span>
          <span>{getPendingConfirmationTargetLabel(issue, tProjects)}</span>
          {issue.workflowRun?.currentStepName && (
            <>
              <span>·</span>
              <span>
                {tProjects("detail.collaboration.currentStep", {
                  name: issue.workflowRun.currentStepName,
                })}
              </span>
            </>
          )}
          {issue.dueDate && (
            <>
              <span>·</span>
              <span>{formatShortDate(issue.dueDate, locale)}</span>
            </>
          )}
        </div>
      </div>
      <RiArrowRightSLine className="size-4 shrink-0 text-app-text-muted" />
    </button>
  );
}

export function ProjectWorkflowRuntimeRow({
  workflow,
  runtime,
  onOpen,
  tProjects,
}: {
  workflow: ProjectWorkflowSummary;
  runtime?: WorkflowRuntimeSnapshot;
  onOpen: () => void;
  tProjects: ProjectsTranslationFn;
}) {
  const focusLabel = runtime?.focusIssue
    ? getWorkflowFocusLabel(runtime.focusIssue, tProjects)
    : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-content-bg px-3 py-3 text-left transition hover:bg-app-button-hover/35"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-app-text-primary">
          {workflow.name}
        </div>
        <div className="mt-1 text-xs text-app-text-muted">
          {tProjects("detail.collaboration.workflowRuntimeSummary", {
            issueCount: workflow.issueCount,
            activeCount: runtime?.active ?? 0,
            waitingReviewCount: runtime?.waitingReview ?? 0,
            handoffPendingCount: runtime?.handoffPending ?? 0,
            blockedCount: runtime?.blocked ?? 0,
          })}
        </div>
        {focusLabel && (
          <div className="mt-1 truncate text-xs text-app-text-secondary">{focusLabel}</div>
        )}
      </div>
      <RiArrowRightSLine className="size-4 shrink-0 text-app-text-muted" />
    </button>
  );
}

export function WorkspaceCard({
  label,
  value,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-app-border bg-app-content-bg px-4 py-4 text-left transition hover:bg-app-button-hover/35"
    >
      <div className="text-xs uppercase tracking-[0.18em] text-app-text-muted">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-app-text-primary">{value}</div>
    </button>
  );
}

export function StatMiniCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-app-border bg-app-content-bg px-3 py-3">
      <div className="text-[11px] text-app-text-muted">{label}</div>
      <div className="mt-2 text-xl font-semibold text-app-text-primary">{value}</div>
    </div>
  );
}

export function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-app-border bg-app-content-bg px-4 py-5 text-sm text-app-text-secondary">
      {text}
    </div>
  );
}
