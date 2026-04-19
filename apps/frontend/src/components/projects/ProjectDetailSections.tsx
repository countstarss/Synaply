"use client";

import React from "react";
import {
  RiAddLine,
  RiAlarmWarningLine,
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiFileList3Line,
  RiLoader4Line,
  RiLoopLeftLine,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import { ProjectActivityTimeline } from "@/components/projects/ProjectActivityTimeline";
import {
  type ProjectTimelineEntry,
  type ProjectsTranslationFn,
} from "@/components/projects/project-activity-utils";
import type {
  Project,
  ProjectAttentionItem,
  ProjectDetail,
  ProjectSummaryIssue,
  ProjectWorkflowSummary,
} from "@/lib/fetchers/project";
import type { DocRecord } from "@/lib/fetchers/doc";
import type { Issue } from "@/lib/fetchers/issue";
import type { WorkflowRuntimeSnapshot } from "@/components/projects/project-detail-helpers";
import { formatPreciseDate, getProjectOwnerLabel } from "@/components/projects/project-view-utils";
import {
  EmptyPanel,
  ProjectIssueRow,
  ProjectPanel,
  ProjectPendingConfirmationRow,
  StatMiniCard,
  WorkspaceCard,
} from "@/components/projects/ProjectDetailShared";
import {
  DocKindCards,
  type DocKindCardSlot,
} from "@/components/shared/docs/DocKindCards";
import type { DocsTranslationFn } from "@/components/shared/docs/doc-template-config";

export { ProjectMetricCard } from "@/components/projects/ProjectDetailShared";

export function ProjectDetailHeader(props: {
  selectedProject: Project | ProjectDetail;
  workspaceName: string;
  visibilityLabel: string;
  isSelectionPending: boolean;
  isLoadingProjectDetail: boolean;
  canManageProjects: boolean;
  metricsTotalIssues: number;
  projectDocsCount: number;
  workflowCount: number;
  statusMeta: { chipClassName: string; icon: React.ReactNode; label: string };
  riskMeta: { chipClassName: string; icon: React.ReactNode; label: string };
  tProjects: ProjectsTranslationFn;
  locale: string;
  showBackButton: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  metricCards: React.ReactNode;
}) {
  const {
    selectedProject,
    workspaceName,
    visibilityLabel,
    isSelectionPending,
    isLoadingProjectDetail,
    canManageProjects,
    metricsTotalIssues,
    projectDocsCount,
    workflowCount,
    statusMeta,
    riskMeta,
    tProjects,
    locale,
    showBackButton,
    onBack,
    onEdit,
    onDelete,
    metricCards,
  } = props;

  return (
    <div className="shrink-0">
      {showBackButton && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs font-medium text-app-text-secondary transition hover:bg-app-button-hover hover:text-app-text-primary"
        >
          <RiArrowLeftLine className="size-3.5" />
        </button>
      )}

      <div
        className={cn(
          "relative isolate overflow-hidden rounded-[32px] border border-app-border bg-app-content-bg/80 px-5 py-5",
          showBackButton ? "mt-4" : "mt-0",
        )}
      >
        <div className="relative z-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
                <span>{workspaceName}</span>
                <span>·</span>
                <span>{visibilityLabel}</span>
                {(isSelectionPending || isLoadingProjectDetail) && (
                  <RiLoader4Line className="size-3.5 animate-spin" />
                )}
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-app-text-primary">
                {selectedProject.name}
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-app-text-primary/90">
                {selectedProject.brief || tProjects("detail.summary.missingBrief")}
              </p>
              {selectedProject.description && (
                <p className="mt-2 max-w-4xl text-sm leading-6 text-app-text-secondary">
                  {selectedProject.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium", statusMeta.chipClassName)}>{statusMeta.icon}{statusMeta.label}</span>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium", riskMeta.chipClassName)}>{riskMeta.icon}{riskMeta.label}</span>
                {selectedProject.phase && (
                  <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                    {tProjects("detail.summary.phase")} · {selectedProject.phase}
                  </span>
                )}
                <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                  {tProjects("detail.summary.owner")} · {getProjectOwnerLabel(selectedProject, tProjects)}
                </span>
                <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                  {tProjects("detail.summary.activeIssues", { count: metricsTotalIssues })}
                </span>
                <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                  {tProjects("detail.summary.workflowCount", { count: workflowCount })}
                </span>
                <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                  {tProjects("detail.summary.docsCount", { count: projectDocsCount })}
                </span>
                <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                  {tProjects("detail.summary.updatedAt", {
                    value: formatPreciseDate(selectedProject.updatedAt, locale),
                  })}
                </span>
              </div>
            </div>

            {canManageProjects && (
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-content-bg px-3 py-2 text-sm text-app-text-primary transition hover:bg-app-button-hover">
                  <RiEdit2Line className="size-4" />
                  {tProjects("detail.summary.edit")}
                </button>
                <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-app-content-bg px-3 py-2 text-sm text-red-600 transition hover:bg-red-500/15 dark:text-red-300">
                  <RiDeleteBinLine className="size-4" />
                  {tProjects("detail.summary.delete")}
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{metricCards}</div>
        </div>
      </div>
    </div>
  );
}

export function ProjectWorkspacePanel(props: {
  metricsTotalIssues: number;
  projectDocsCount: number;
  relatedWorkflowsLength: number;
  tProjects: ProjectsTranslationFn;
  onCreateIssue: () => void;
  onCreateProjectDoc: () => void;
  onOpenIssues: () => void;
  onOpenProjectDocHub: () => void;
  onOpenProjectWorkflow: () => void;
}) {
  const { metricsTotalIssues, projectDocsCount, relatedWorkflowsLength, tProjects, onCreateIssue, onCreateProjectDoc, onOpenIssues, onOpenProjectDocHub, onOpenProjectWorkflow } = props;

  return (
    <ProjectPanel
      title={tProjects("detail.summary.workspaceTitle")}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onCreateIssue} className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover">
            <RiAddLine className="size-3.5" />
            {tProjects("detail.summary.createIssue")}
          </button>
          <button type="button" onClick={onCreateProjectDoc} className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover">
            <RiFileList3Line className="size-3.5" />
            {tProjects("detail.summary.createDoc")}
          </button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-3">
        <WorkspaceCard label={tProjects("detail.summary.workspaceCards.issues")} value={metricsTotalIssues} onClick={onOpenIssues} />
        <WorkspaceCard label={tProjects("detail.summary.workspaceCards.docs")} value={projectDocsCount} onClick={onOpenProjectDocHub} />
        <WorkspaceCard label={tProjects("detail.summary.workspaceCards.workflow")} value={relatedWorkflowsLength} onClick={onOpenProjectWorkflow} />
      </div>
    </ProjectPanel>
  );
}

export function ProjectCollaborationPanel(props: {
  locale: string;
  relatedWorkflows: ProjectWorkflowSummary[];
  projectDocs: DocRecord[];
  pendingConfirmationIssues: Issue[];
  workflowRunCounts: Omit<WorkflowRuntimeSnapshot, "focusIssue">;
  workflowRuntimeByWorkflowId: Map<string, WorkflowRuntimeSnapshot>;
  tProjects: ProjectsTranslationFn;
  tDocs: DocsTranslationFn;
  onOpenIssue: (issue: Issue) => void;
  onOpenDoc: (docId: string) => void;
  onCreateProjectDoc: (slot: DocKindCardSlot) => void;
  onOpenProjectDocHub: () => void;
  onOpenProjectWorkflow: () => void;
}) {
  const {
    locale,
    projectDocs,
    pendingConfirmationIssues,
    workflowRunCounts,
    tProjects,
    tDocs,
    onOpenIssue,
    onOpenDoc,
    onCreateProjectDoc,
    onOpenProjectDocHub,
  } = props;
  const docSlots: DocKindCardSlot[] = [
    { kind: "PROJECT_BRIEF", templateKey: "project-brief-v1" },
    { kind: "DECISION_LOG", templateKey: "decision-log-v1" },
    { kind: "RELEASE_CHECKLIST", templateKey: "release-checklist-v1" },
  ];

  return (
    <ProjectPanel title={tProjects("detail.collaboration.title")} subtitle={tProjects("detail.collaboration.subtitle")}>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.18em] text-app-text-muted">{tProjects("detail.collaboration.pendingTitle")}</div>
          {pendingConfirmationIssues.length === 0 ? <EmptyPanel text={tProjects("detail.collaboration.pendingEmpty")} /> : <div className="space-y-2">{pendingConfirmationIssues.map((issue) => <ProjectPendingConfirmationRow key={issue.id} issue={issue} locale={locale} onOpenIssue={onOpenIssue} tProjects={tProjects} />)}</div>}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-[0.18em] text-app-text-muted">{tProjects("detail.collaboration.docsTitle")}</div>
            <button type="button" onClick={onOpenProjectDocHub} className="inline-flex items-center gap-1 text-xs text-app-text-secondary transition hover:text-app-text-primary">
              {tProjects("detail.collaboration.openDocs")}
              <RiArrowRightSLine className="size-3.5" />
            </button>
          </div>
          <DocKindCards
            docs={projectDocs}
            slots={docSlots}
            locale={locale}
            tDocs={tDocs}
            onOpenDoc={(doc) => onOpenDoc(doc._id)}
            onCreateDoc={onCreateProjectDoc}
          />
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.18em] text-app-text-muted">{tProjects("detail.collaboration.workflowRuntimeTitle")}</div>
          <div className="grid grid-cols-2 gap-2">
            <StatMiniCard label={tProjects("detail.collaboration.workflowRuntime.active")} value={workflowRunCounts.active} />
            <StatMiniCard label={tProjects("detail.collaboration.workflowRuntime.waitingReview")} value={workflowRunCounts.waitingReview} />
            <StatMiniCard label={tProjects("detail.collaboration.workflowRuntime.handoffPending")} value={workflowRunCounts.handoffPending} />
            <StatMiniCard label={tProjects("detail.collaboration.workflowRuntime.blocked")} value={workflowRunCounts.blocked} />
          </div>
        </div>
      </div>
    </ProjectPanel>
  );
}

export function ProjectTimelinePanel(props: {
  timelineEntries: ProjectTimelineEntry[];
  locale: string;
  tProjects: ProjectsTranslationFn;
  isMarkingSync: boolean;
  onMarkSync: () => void;
  onOpenSync: () => void;
  onOpenIssue: (issue: Issue) => void;
}) {
  const { timelineEntries, locale, tProjects, isMarkingSync, onMarkSync, onOpenSync, onOpenIssue } = props;

  return (
    <ProjectPanel
      title={tProjects("detail.timeline.title")}
      subtitle={tProjects("detail.timeline.subtitle")}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onOpenSync} className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover">
            {tProjects("detail.timeline.openSync")}
            <RiArrowRightSLine className="size-3.5" />
          </button>
          <button type="button" onClick={onMarkSync} disabled={isMarkingSync} className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover disabled:cursor-not-allowed disabled:opacity-60">
            {isMarkingSync ? <RiLoader4Line className="size-3.5 animate-spin" /> : <RiLoopLeftLine className="size-3.5" />}
            {tProjects("detail.timeline.updateSync")}
          </button>
        </div>
      }
    >
      <ProjectActivityTimeline
        entries={timelineEntries}
        locale={locale}
        tProjects={tProjects}
        relativeTimePrefix="detail.relativeTime"
        emptyText={tProjects("detail.timeline.empty")}
        syncTitle={tProjects("detail.timeline.syncTitle")}
        syncDescription={tProjects("detail.timeline.syncDescription")}
        actorFallbackLabel={tProjects("detail.timeline.actorFallback")}
        onOpenIssue={onOpenIssue}
        syncTimeMode="precise"
      />
    </ProjectPanel>
  );
}

export function ProjectRisksPanel({
  attentionItems,
  blockedIssues,
  tProjects,
  locale,
  onOpenIssue,
}: {
  attentionItems: ProjectAttentionItem[];
  blockedIssues: ProjectSummaryIssue[];
  tProjects: ProjectsTranslationFn;
  locale: string;
  onOpenIssue: (issueId: string) => void;
}) {
  return (
    <ProjectPanel title={tProjects("detail.summary.risksTitle")}>
      <div className="space-y-3">
        {attentionItems.map((item) => (
          <div key={item.id} className={cn("rounded-2xl border px-4 py-3", item.severity === "high" ? "border-rose-500/20 bg-rose-500/10" : item.severity === "medium" ? "border-amber-500/20 bg-amber-500/10" : "border-emerald-500/20 bg-emerald-500/10")}>
            <div className="flex items-center gap-2 text-sm font-medium text-app-text-primary">
              <RiAlarmWarningLine className="size-4" />
              {item.title}
            </div>
            <div className="mt-1 text-xs leading-5 text-app-text-secondary">{item.description}</div>
          </div>
        ))}
        <div className="pt-1">
          <div className="mb-2 text-xs uppercase tracking-[0.18em] text-app-text-muted">{tProjects("detail.summary.blockedIssuesTitle")}</div>
          {blockedIssues.length === 0 ? <EmptyPanel text={tProjects("detail.summary.blockedIssuesEmpty")} /> : <div className="space-y-2">{blockedIssues.map((issue) => <ProjectIssueRow key={issue.id} issue={issue} onOpenIssue={onOpenIssue} tProjects={tProjects} locale={locale} />)}</div>}
        </div>
      </div>
    </ProjectPanel>
  );
}
