"use client";

import React, { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useCreateDocMutation, useDocsTree } from "@/hooks/useDocApi";
import { useDocStore } from "@/stores/doc-store";
import { sortIssuesByUrgency } from "@/lib/issue-board";
import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectDetail,
  ProjectSummary,
} from "@/lib/fetchers/project";
import { buildProjectPath } from "@/components/projects/project-route-utils";
import {
  formatPreciseDate,
  getProjectRiskMeta,
  getProjectStatusMeta,
} from "@/components/projects/project-view-utils";
import {
  buildFallbackAttentionItems,
  buildFallbackMetrics,
  isActiveIssueLike,
  isBlockedIssueLike,
  isWorkflowPendingConfirmationIssue,
  normalizeIssueForSummary,
  type WorkflowRuntimeSnapshot,
} from "@/components/projects/project-detail-helpers";
import {
  ProjectCollaborationPanel,
  ProjectDetailHeader,
  ProjectMetricCard,
  ProjectRisksPanel,
  ProjectTimelinePanel,
  ProjectWorkspacePanel,
} from "@/components/projects/ProjectDetailSections";
import {
  buildProjectTimelineEntries,
  formatProjectRelativeTime,
} from "@/components/projects/project-activity-utils";
import {
  buildDocTemplateContent,
  findDocTemplateDefinition,
  resolveDocTemplateTitle,
} from "@/components/shared/docs/doc-template-config";
import { openDocRoute } from "@/components/shared/docs/doc-navigation";
import type { DocKindCardSlot } from "@/components/shared/docs/DocKindCards";
import { IssueType, VisibilityType } from "@/types/prisma";

interface ProjectDetailViewProps {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  selectedProject: Project | ProjectDetail;
  currentUserId?: string;
  projectSummary?: ProjectSummary;
  workspaceName: string;
  visibilityLabel: string;
  projectIssues: Issue[];
  isSelectionPending: boolean;
  isLoadingProjectDetail: boolean;
  canManageProjects: boolean;
  onBack: () => void;
  onCreateIssue: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenIssue: (issue: Issue) => void;
  onMarkSync: () => void;
  isMarkingSync?: boolean;
  showBackButton?: boolean;
}

export function ProjectDetailView({
  workspaceId,
  workspaceType,
  selectedProject,
  currentUserId,
  projectSummary,
  workspaceName,
  visibilityLabel,
  projectIssues,
  isSelectionPending,
  isLoadingProjectDetail,
  canManageProjects,
  onBack,
  onCreateIssue,
  onEdit,
  onDelete,
  onOpenIssue,
  onMarkSync,
  isMarkingSync = false,
  showBackButton = true,
}: ProjectDetailViewProps) {
  const tProjects = useTranslations("projects");
  const tDocs = useTranslations("docs");
  const locale = useLocale();
  const router = useRouter();
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);
  const createProjectDoc = useCreateDocMutation();
  const docsContext = workspaceType === "PERSONAL" ? "personal" : "team";
  const projectDocsRoute = buildProjectPath(selectedProject.id, "docs");

  const { data: projectDocs = [] } = useDocsTree(
    workspaceId,
    {
      workspaceType,
      context: docsContext,
      projectId: selectedProject.id,
      includeArchived: false,
    },
    {
      enabled: !!workspaceId && !!currentUserId,
    },
  );
  const visibleProjectDocs = useMemo(
    () => projectDocs.filter((doc) => !doc.isProjectRootFolder),
    [projectDocs],
  );
  const projectDocumentCount = useMemo(
    () => visibleProjectDocs.filter((doc) => doc.type === "document").length,
    [visibleProjectDocs],
  );

  const displayedIssues = useMemo(
    () => sortIssuesByUrgency(projectIssues),
    [projectIssues],
  );
  const fallbackMetrics = useMemo(
    () => buildFallbackMetrics(displayedIssues, selectedProject.lastSyncAt),
    [displayedIssues, selectedProject.lastSyncAt],
  );
  const metrics = projectSummary?.metrics ?? fallbackMetrics;
  const blockedIssues =
    projectSummary?.blockedIssues ??
    displayedIssues
      .filter((issue) => isActiveIssueLike(issue) && isBlockedIssueLike(issue))
      .slice(0, 5)
      .map(normalizeIssueForSummary);
  const attentionItems =
    projectSummary?.attentionItems ??
    buildFallbackAttentionItems(selectedProject, fallbackMetrics, tProjects);
  const relatedWorkflows = projectSummary?.workflows ?? [];
  const recentActivity = useMemo(
    () => projectSummary?.recentActivity ?? [],
    [projectSummary?.recentActivity],
  );

  const allPendingConfirmationIssues = useMemo(
    () => displayedIssues.filter(isWorkflowPendingConfirmationIssue),
    [displayedIssues],
  );
  const pendingConfirmationIssues = allPendingConfirmationIssues.slice(0, 5);
  const pendingReviewCount = allPendingConfirmationIssues.filter(
    (issue) => issue.workflowRun?.runStatus === "WAITING_REVIEW",
  ).length;
  const pendingHandoffCount = allPendingConfirmationIssues.filter(
    (issue) => issue.workflowRun?.runStatus === "HANDOFF_PENDING",
  ).length;
  const workflowRunCounts = useMemo(
    () =>
      displayedIssues.reduce(
        (accumulator, issue) => {
          if (issue.issueType !== IssueType.WORKFLOW || !issue.workflowRun) {
            return accumulator;
          }

          switch (issue.workflowRun.runStatus) {
            case "ACTIVE":
              accumulator.active += 1;
              break;
            case "WAITING_REVIEW":
              accumulator.waitingReview += 1;
              break;
            case "HANDOFF_PENDING":
              accumulator.handoffPending += 1;
              break;
            case "BLOCKED":
              accumulator.blocked += 1;
              break;
            default:
              break;
          }

          return accumulator;
        },
        {
          active: 0,
          waitingReview: 0,
          handoffPending: 0,
          blocked: 0,
        },
      ),
    [displayedIssues],
  );
  const workflowRuntimeByWorkflowId = useMemo(
    () =>
      displayedIssues.reduce((accumulator, issue) => {
        if (
          issue.issueType !== IssueType.WORKFLOW ||
          !issue.workflowId ||
          !issue.workflowRun
        ) {
          return accumulator;
        }

        const runtime =
          accumulator.get(issue.workflowId) ??
          ({
            active: 0,
            waitingReview: 0,
            handoffPending: 0,
            blocked: 0,
            focusIssue: null,
          } satisfies WorkflowRuntimeSnapshot);

        if (!runtime.focusIssue || runtime.focusIssue.workflowRun?.runStatus === "DONE") {
          runtime.focusIssue = issue;
        }

        switch (issue.workflowRun.runStatus) {
          case "ACTIVE":
            runtime.active += 1;
            break;
          case "WAITING_REVIEW":
            runtime.waitingReview += 1;
            break;
          case "HANDOFF_PENDING":
            runtime.handoffPending += 1;
            break;
          case "BLOCKED":
            runtime.blocked += 1;
            break;
          default:
            break;
        }

        accumulator.set(issue.workflowId, runtime);
        return accumulator;
      }, new Map<string, WorkflowRuntimeSnapshot>()),
    [displayedIssues],
  );
  const projectIssueMap = useMemo(
    () => new Map<string, Issue>(projectIssues.map((issue) => [issue.id, issue])),
    [projectIssues],
  );
  const timelineEntries = useMemo(
    () =>
      buildProjectTimelineEntries({
        selectedProject,
        recentActivity,
        projectIssues,
      }),
    [projectIssues, recentActivity, selectedProject],
  );
  const overviewTimelineEntries = useMemo(
    () => timelineEntries.slice(0, 4),
    [timelineEntries],
  );

  const statusMeta = getProjectStatusMeta(tProjects)[selectedProject.status];
  const riskMeta = getProjectRiskMeta(tProjects)[selectedProject.riskLevel];

  const openSummaryIssue = (issueId: string) => {
    const issue = projectIssueMap.get(issueId);

    if (!issue) {
      toast.message(tProjects("detail.summary.missingIssue"));
      return;
    }

    onOpenIssue(issue);
  };

  const openProjectIssues = () => router.push(buildProjectPath(selectedProject.id, "issues"));
  const openProjectDocHub = () => router.push(projectDocsRoute);
  const openProjectWorkflow = () => router.push(buildProjectPath(selectedProject.id, "workflow"));
  const openProjectSync = () => router.push(buildProjectPath(selectedProject.id, "sync"));

  const openProjectDoc = (docId: string) => {
    openDocRoute({
      workspaceId,
      workspaceType,
      context: docsContext,
      docId,
      projectId: selectedProject.id,
      router,
      setActiveDocId,
    });
  };

  const handleCreateProjectDoc = async (
    slot: DocKindCardSlot = {
      kind: "PROJECT_BRIEF",
      templateKey: "project-brief-v1",
    },
  ) => {
    if (!currentUserId) {
      toast.error(tProjects("detail.summary.docCreateAuthRequired"));
      return;
    }

    const template = findDocTemplateDefinition(slot.templateKey);

    try {
      const createdDoc = await createProjectDoc.mutateAsync({
        workspaceId,
        data: {
          title: resolveDocTemplateTitle(slot.templateKey, tDocs, {
            projectName: selectedProject.name,
          }),
          projectId: selectedProject.id,
          kind: template?.kind ?? slot.kind,
          templateKey: slot.templateKey,
          visibility:
            workspaceType === "TEAM"
              ? VisibilityType.TEAM_EDITABLE
              : VisibilityType.PRIVATE,
          content: buildDocTemplateContent(slot.templateKey, tDocs),
        },
      });

      toast.success(tProjects("detail.summary.docCreated"));
      openProjectDoc(createdDoc._id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tProjects("detail.summary.docCreateFailed"),
      );
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col select-none z-50">
      <div className="mx-auto flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-8 pt-6">
        <ProjectDetailHeader
          selectedProject={selectedProject}
          workspaceName={workspaceName}
          visibilityLabel={visibilityLabel}
          isSelectionPending={isSelectionPending}
          isLoadingProjectDetail={isLoadingProjectDetail}
          canManageProjects={canManageProjects}
          metricsTotalIssues={metrics.totalIssues}
          projectDocsCount={projectDocumentCount}
          workflowCount={metrics.workflowCount}
          statusMeta={statusMeta}
          riskMeta={riskMeta}
          tProjects={tProjects}
          locale={locale}
          showBackButton={showBackButton}
          onBack={onBack}
          onEdit={onEdit}
          onDelete={onDelete}
          metricCards={
            <>
              <ProjectMetricCard
                label={tProjects("detail.summary.completion")}
                value={`${metrics.completionRate}%`}
                hint={tProjects("detail.summary.completionHint", {
                  completed: metrics.completedIssues,
                  total: metrics.totalIssues,
                })}
                tone={metrics.completionRate >= 70 ? "success" : "default"}
              />
              <ProjectMetricCard
                label={tProjects("detail.summary.riskAndDelay")}
                value={`${metrics.blockedIssues + metrics.overdueIssues}`}
                hint={tProjects("detail.summary.riskAndDelayHint", {
                  blocked: metrics.blockedIssues,
                  overdue: metrics.overdueIssues,
                })}
                tone={
                  metrics.blockedIssues > 0
                    ? "danger"
                    : metrics.overdueIssues > 0
                      ? "warning"
                      : "success"
                }
              />
              <ProjectMetricCard
                label={tProjects("detail.summary.executionSurface")}
                value={`${metrics.workflowIssueCount}`}
                hint={tProjects("detail.summary.executionSurfaceHint", {
                  workflowCount: metrics.workflowCount,
                  highPriority: metrics.highPriorityIssues,
                })}
              />
              <ProjectMetricCard
                label={tProjects("detail.summary.pendingConfirmations")}
                value={`${allPendingConfirmationIssues.length}`}
                hint={tProjects("detail.summary.pendingConfirmationsHint", {
                  reviewCount: pendingReviewCount,
                  handoffCount: pendingHandoffCount,
                })}
                tone={allPendingConfirmationIssues.length > 0 ? "warning" : "success"}
              />
              <ProjectMetricCard
                label={tProjects("detail.summary.recentSync")}
                value={
                  selectedProject.lastSyncAt
                    ? formatProjectRelativeTime(
                        selectedProject.lastSyncAt,
                        tProjects,
                        locale,
                        "detail.relativeTime",
                      )
                    : tProjects("detail.summary.notRecorded")
                }
                hint={
                  selectedProject.lastSyncAt
                    ? formatPreciseDate(selectedProject.lastSyncAt, locale)
                    : tProjects("detail.summary.recentSyncHint")
                }
                tone={(metrics.staleSyncDays ?? 0) >= 7 ? "warning" : "default"}
              />
            </>
          }
        />

        <div className="mt-4">
          <ProjectWorkspacePanel
            metricsTotalIssues={metrics.totalIssues}
            projectDocsCount={projectDocumentCount}
            relatedWorkflowsLength={relatedWorkflows.length}
            tProjects={tProjects}
            onCreateIssue={onCreateIssue}
            onCreateProjectDoc={handleCreateProjectDoc}
            onOpenIssues={openProjectIssues}
            onOpenProjectDocHub={openProjectDocHub}
            onOpenProjectWorkflow={openProjectWorkflow}
          />
        </div>

        <div className="mt-4">
          <ProjectCollaborationPanel
            locale={locale}
            relatedWorkflows={relatedWorkflows}
            projectDocs={visibleProjectDocs}
            pendingConfirmationIssues={pendingConfirmationIssues}
            workflowRunCounts={workflowRunCounts}
            workflowRuntimeByWorkflowId={workflowRuntimeByWorkflowId}
            tProjects={tProjects}
            tDocs={tDocs}
            onOpenIssue={onOpenIssue}
            onOpenDoc={openProjectDoc}
            onCreateProjectDoc={handleCreateProjectDoc}
            onOpenProjectDocHub={openProjectDocHub}
            onOpenProjectWorkflow={openProjectWorkflow}
          />
        </div>

        <div className="mt-4">
          <ProjectTimelinePanel
            timelineEntries={overviewTimelineEntries}
            locale={locale}
            tProjects={tProjects}
            isMarkingSync={isMarkingSync}
            onMarkSync={onMarkSync}
            onOpenSync={openProjectSync}
            onOpenIssue={onOpenIssue}
          />
        </div>

        <div className="mt-4">
          <ProjectRisksPanel
            attentionItems={attentionItems}
            blockedIssues={blockedIssues}
            tProjects={tProjects}
            locale={locale}
            onOpenIssue={openSummaryIssue}
          />
        </div>
      </div>
    </div>
  );
}
