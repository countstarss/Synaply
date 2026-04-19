"use client";

import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectDetail,
  ProjectSummary,
  ProjectSummaryIssue,
} from "@/lib/fetchers/project";
import type { ProjectsTranslationFn } from "@/components/projects/project-activity-utils";
import { isActiveIssueCategory } from "@/lib/issue-board";
import {
  IssuePriority,
  IssueStateCategory,
  IssueStatus,
  IssueType,
} from "@/types/prisma";

type IssueStateLike = {
  name?: string | null;
  category?: IssueStateCategory | null;
};

type IssueStatusLike = {
  state?: IssueStateLike | null;
  currentStepStatus?: IssueStatus | null;
};

export type WorkflowRuntimeSnapshot = {
  active: number;
  waitingReview: number;
  handoffPending: number;
  blocked: number;
  focusIssue: Issue | null;
};

export function isCompletedIssueLike(issue: IssueStatusLike) {
  return issue.state?.category === IssueStateCategory.DONE;
}

export function isActiveIssueLike(issue: IssueStatusLike) {
  return isActiveIssueCategory(issue.state?.category);
}

export function isBlockedIssueLike(issue: IssueStatusLike) {
  if (issue.currentStepStatus === IssueStatus.BLOCKED) {
    return true;
  }

  const stateName = issue.state?.name?.toLowerCase() ?? "";
  return stateName.includes("blocked") || stateName.includes("block");
}

export function getIssuePriorityWeight(priority?: IssuePriority | null) {
  switch (priority) {
    case IssuePriority.URGENT:
      return 4;
    case IssuePriority.HIGH:
      return 3;
    case IssuePriority.NORMAL:
      return 2;
    case IssuePriority.LOW:
      return 1;
    default:
      return 0;
  }
}

export function getIssueStateLabel(
  issue: Pick<ProjectSummaryIssue, "state" | "currentStepStatus">,
  tProjects: ProjectsTranslationFn,
) {
  if (issue.currentStepStatus === IssueStatus.BLOCKED) {
    return tProjects("detail.issueState.blocked");
  }

  if (issue.currentStepStatus === IssueStatus.DONE) {
    return tProjects("detail.issueState.done");
  }

  if (issue.currentStepStatus === IssueStatus.IN_PROGRESS) {
    return tProjects("detail.issueState.inProgress");
  }

  return issue.state?.name || tProjects("detail.issueState.uncategorized");
}

export function getWorkflowRunStatusLabel(
  issue: Pick<Issue, "workflowRun">,
  tProjects: ProjectsTranslationFn,
) {
  switch (issue.workflowRun?.runStatus) {
    case "WAITING_REVIEW":
      return tProjects("detail.collaboration.status.waitingReview");
    case "HANDOFF_PENDING":
      return tProjects("detail.collaboration.status.handoffPending");
    case "BLOCKED":
      return tProjects("detail.collaboration.status.blocked");
    case "ACTIVE":
      return tProjects("detail.collaboration.status.active");
    case "DONE":
      return tProjects("detail.collaboration.status.done");
    default:
      return tProjects("detail.collaboration.status.unknown");
  }
}

export function getPendingConfirmationTargetLabel(
  issue: Pick<Issue, "workflowRun">,
  tProjects: ProjectsTranslationFn,
) {
  const targetName =
    issue.workflowRun?.targetName ||
    issue.workflowRun?.currentAssigneeName ||
    null;

  return targetName
    ? tProjects("detail.collaboration.pendingTarget", { name: targetName })
    : tProjects("detail.collaboration.pendingTargetFallback");
}

export function getWorkflowFocusLabel(
  issue: Issue,
  tProjects: ProjectsTranslationFn,
) {
  const parts = [
    tProjects("detail.collaboration.workflowFocusIssue", { name: issue.title }),
  ];

  if (issue.workflowRun?.currentStepName) {
    parts.push(
      tProjects("detail.collaboration.currentStep", {
        name: issue.workflowRun.currentStepName,
      }),
    );
  }

  const targetName =
    issue.workflowRun?.targetName ||
    issue.workflowRun?.currentAssigneeName ||
    null;

  if (targetName) {
    parts.push(tProjects("detail.collaboration.pendingTarget", { name: targetName }));
  }

  return parts.join(" · ");
}

export function getAssigneeLabel(
  issue: Pick<ProjectSummaryIssue, "assignees" | "directAssigneeId">,
  tProjects: ProjectsTranslationFn,
) {
  const firstAssignee = issue.assignees.find((item) => item.member?.user);

  if (firstAssignee?.member?.user) {
    return (
      firstAssignee.member.user.name ||
      firstAssignee.member.user.email ||
      tProjects("detail.assignee.assigned")
    );
  }

  return issue.directAssigneeId
    ? tProjects("detail.assignee.assigned")
    : tProjects("detail.assignee.pending");
}

export function normalizeIssueForSummary(issue: Issue): ProjectSummaryIssue {
  return {
    id: issue.id,
    key: issue.key,
    title: issue.title,
    description: issue.description,
    dueDate: issue.dueDate,
    priority: issue.priority,
    issueType: issue.issueType,
    workflowId: issue.workflowId,
    directAssigneeId: issue.directAssigneeId,
    currentStepStatus: issue.currentStepStatus,
    currentStepIndex: issue.currentStepIndex,
    totalSteps: issue.totalSteps,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    state: issue.state
      ? {
          id: issue.state.id,
          name: issue.state.name,
          color: issue.state.color,
          category: issue.state.category,
        }
      : null,
    assignees:
      issue.assignees?.map((assignee) => ({
        member: assignee.member
          ? {
              id: assignee.member.id,
              user: assignee.member.user
                ? {
                    id: assignee.member.user.id,
                    name: assignee.member.user.name,
                    email: assignee.member.user.email || "",
                    avatarUrl:
                      assignee.member.user.avatarUrl ||
                      assignee.member.user.avatar_url,
                    avatar_url:
                      assignee.member.user.avatar_url ||
                      assignee.member.user.avatarUrl,
                  }
                : null,
            }
          : null,
      })) ?? [],
  };
}

export function buildFallbackMetrics(
  issues: Issue[],
  lastSyncAt?: string | null,
): ProjectSummary["metrics"] {
  const activeIssues = issues.filter((issue) => isActiveIssueLike(issue));
  const completedIssues = issues.filter((issue) =>
    isCompletedIssueLike(issue),
  ).length;
  const completionBaseIssueCount = activeIssues.length + completedIssues;
  const blockedIssues = activeIssues.filter((issue) =>
    isBlockedIssueLike(issue),
  ).length;
  const overdueIssues = activeIssues.filter((issue) => {
    if (!issue.dueDate) {
      return false;
    }

    return new Date(issue.dueDate).getTime() < Date.now();
  }).length;
  const workflowCount = new Set(
    issues.map((issue) => issue.workflowId).filter(Boolean),
  ).size;
  const highPriorityIssues = activeIssues.filter(
    (issue) =>
      issue.priority === IssuePriority.HIGH ||
      issue.priority === IssuePriority.URGENT,
  ).length;
  const unassignedIssues = activeIssues.filter((issue) => {
    const hasAssignee =
      issue.directAssigneeId ||
      issue.assignees?.some((assignee) => Boolean(assignee.member?.id));
    return !hasAssignee;
  }).length;

  return {
    totalIssues: activeIssues.length,
    openIssues: activeIssues.length,
    completedIssues,
    blockedIssues,
    overdueIssues,
    workflowCount,
    workflowIssueCount: activeIssues.filter((issue) =>
      Boolean(issue.workflowId),
    ).length,
    highPriorityIssues,
    unassignedIssues,
    completionRate:
      completionBaseIssueCount > 0
        ? Math.round((completedIssues / completionBaseIssueCount) * 100)
        : 0,
    staleSyncDays: lastSyncAt
      ? Math.floor(
          (Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60 * 24),
        )
      : null,
  };
}

export function buildFallbackAttentionItems(
  project: Project | ProjectDetail,
  metrics: ProjectSummary["metrics"],
  tProjects: ProjectsTranslationFn,
): ProjectSummary["attentionItems"] {
  const items: ProjectSummary["attentionItems"] = [];

  if (metrics.blockedIssues > 0) {
    items.push({
      id: "blocked-issues",
      severity: "high",
      title: tProjects("detail.attention.blockedTitle"),
      description: tProjects("detail.attention.blockedDescription", {
        count: metrics.blockedIssues,
      }),
    });
  }

  if (metrics.overdueIssues > 0) {
    items.push({
      id: "overdue-issues",
      severity: "medium",
      title: tProjects("detail.attention.overdueTitle"),
      description: tProjects("detail.attention.overdueDescription", {
        count: metrics.overdueIssues,
      }),
    });
  }

  if ((metrics.staleSyncDays ?? 0) >= 7) {
    items.push({
      id: "stale-sync",
      severity: "medium",
      title: tProjects("detail.attention.staleSyncTitle"),
      description: tProjects("detail.attention.staleSyncDescription", {
        count: metrics.staleSyncDays ?? 0,
      }),
    });
  }

  if (items.length === 0 && project.riskLevel !== undefined && project.riskLevel !== null) {
    items.push({
      id: "healthy",
      severity: "low",
      title: tProjects("detail.attention.healthyTitle"),
      description: tProjects("detail.attention.healthyDescription"),
    });
  }

  return items;
}

export function isWorkflowPendingConfirmationIssue(issue: Issue) {
  return (
    issue.issueType === IssueType.WORKFLOW &&
    (issue.workflowRun?.runStatus === "WAITING_REVIEW" ||
      issue.workflowRun?.runStatus === "HANDOFF_PENDING")
  );
}
