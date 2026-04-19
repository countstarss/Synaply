"use client";

import React from "react";
import { Globe2 } from "lucide-react";
import {
  RiAlarmWarningLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiFlag2Line,
  RiLockLine,
  RiRoadMapLine,
  RiSparklingLine,
  RiTeamLine,
  RiTimeLine,
} from "react-icons/ri";
import { priorityConfig, statusConfig } from "@/lib/data/issueConfig";
import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectVisibility,
} from "@/lib/fetchers/project";
import {
  ProjectRiskLevel,
  ProjectStatus,
} from "@/types/prisma";

type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

export const VISIBILITY_META: Record<
  ProjectVisibility,
  {
    label: string;
    chipClassName: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  PRIVATE: {
    label: "Private",
    chipClassName:
      "border-slate-300/70 bg-slate-500/10 text-slate-700 dark:border-slate-700 dark:bg-slate-500/15 dark:text-slate-200",
    description: "Best for personal workspaces. Resource-level permissions are not strictly enforced by visibility yet.",
    icon: <RiLockLine className="size-3.5" />,
  },
  TEAM_READONLY: {
    label: "Team Readonly",
    chipClassName:
      "border-sky-300/70 bg-sky-500/10 text-sky-700 dark:border-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
    description: "Team members can view this project. Write access is still controlled by OWNER and ADMIN roles.",
    icon: <RiTeamLine className="size-3.5" />,
  },
  TEAM_EDITABLE: {
    label: "Team Editable",
    chipClassName:
      "border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    description: "Best for collaborative projects. Backend write permissions are still determined by workspace member roles.",
    icon: <RiSparklingLine className="size-3.5" />,
  },
  PUBLIC: {
    label: "Public",
    chipClassName:
      "border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    description: "A public-facing project view for sharing context and status.",
    icon: <Globe2 className="size-3.5" />,
  },
};

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  {
    label: string;
    chipClassName: string;
    icon: React.ReactNode;
  }
> = {
  PLANNING: {
    label: "Planning",
    chipClassName:
      "border-slate-300/70 bg-slate-500/10 text-slate-700 dark:border-slate-700 dark:bg-slate-500/15 dark:text-slate-200",
    icon: <RiRoadMapLine className="size-3.5" />,
  },
  ACTIVE: {
    label: "Active",
    chipClassName:
      "border-sky-300/70 bg-sky-500/10 text-sky-700 dark:border-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
    icon: <RiSparklingLine className="size-3.5" />,
  },
  BLOCKED: {
    label: "Blocked",
    chipClassName:
      "border-rose-300/70 bg-rose-500/10 text-rose-700 dark:border-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
    icon: <RiAlarmWarningLine className="size-3.5" />,
  },
  SHIPPING: {
    label: "Shipping",
    chipClassName:
      "border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    icon: <RiTimeLine className="size-3.5" />,
  },
  DONE: {
    label: "Done",
    chipClassName:
      "border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    icon: <RiCheckboxCircleLine className="size-3.5" />,
  },
  ARCHIVED: {
    label: "Archived",
    chipClassName:
      "border-zinc-300/70 bg-zinc-500/10 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-200",
    icon: <RiLockLine className="size-3.5" />,
  },
};

export const PROJECT_RISK_META: Record<
  ProjectRiskLevel,
  {
    label: string;
    chipClassName: string;
    icon: React.ReactNode;
  }
> = {
  LOW: {
    label: "Low risk",
    chipClassName:
      "border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    icon: <RiFlag2Line className="size-3.5" />,
  },
  MEDIUM: {
    label: "Medium risk",
    chipClassName:
      "border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    icon: <RiErrorWarningLine className="size-3.5" />,
  },
  HIGH: {
    label: "High risk",
    chipClassName:
      "border-orange-300/70 bg-orange-500/10 text-orange-700 dark:border-orange-800 dark:bg-orange-500/15 dark:text-orange-200",
    icon: <RiAlarmWarningLine className="size-3.5" />,
  },
  CRITICAL: {
    label: "Critical risk",
    chipClassName:
      "border-rose-300/70 bg-rose-500/10 text-rose-700 dark:border-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
    icon: <RiAlarmWarningLine className="size-3.5" />,
  },
};

export function getProjectVisibilityMeta(t: TranslationFn) {
  return {
    PRIVATE: {
      ...VISIBILITY_META.PRIVATE,
      label: t("visibility.private.label"),
      description: t("visibility.private.description"),
    },
    TEAM_READONLY: {
      ...VISIBILITY_META.TEAM_READONLY,
      label: t("visibility.teamReadonly.label"),
      description: t("visibility.teamReadonly.description"),
    },
    TEAM_EDITABLE: {
      ...VISIBILITY_META.TEAM_EDITABLE,
      label: t("visibility.teamEditable.label"),
      description: t("visibility.teamEditable.description"),
    },
    PUBLIC: {
      ...VISIBILITY_META.PUBLIC,
      label: t("visibility.public.label"),
      description: t("visibility.public.description"),
    },
  } as const satisfies typeof VISIBILITY_META;
}

export function getProjectStatusMeta(t: TranslationFn) {
  return {
    PLANNING: {
      ...PROJECT_STATUS_META.PLANNING,
      label: t("status.planning"),
    },
    ACTIVE: {
      ...PROJECT_STATUS_META.ACTIVE,
      label: t("status.active"),
    },
    BLOCKED: {
      ...PROJECT_STATUS_META.BLOCKED,
      label: t("status.blocked"),
    },
    SHIPPING: {
      ...PROJECT_STATUS_META.SHIPPING,
      label: t("status.shipping"),
    },
    DONE: {
      ...PROJECT_STATUS_META.DONE,
      label: t("status.done"),
    },
    ARCHIVED: {
      ...PROJECT_STATUS_META.ARCHIVED,
      label: t("status.archived"),
    },
  } as const satisfies typeof PROJECT_STATUS_META;
}

export function getProjectRiskMeta(t: TranslationFn) {
  return {
    LOW: {
      ...PROJECT_RISK_META.LOW,
      label: t("risk.low"),
    },
    MEDIUM: {
      ...PROJECT_RISK_META.MEDIUM,
      label: t("risk.medium"),
    },
    HIGH: {
      ...PROJECT_RISK_META.HIGH,
      label: t("risk.high"),
    },
    CRITICAL: {
      ...PROJECT_RISK_META.CRITICAL,
      label: t("risk.critical"),
    },
  } as const satisfies typeof PROJECT_RISK_META;
}

export function formatShortDate(date: string, locale = "en") {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatPreciseDate(date: string, locale = "en") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getProjectOwnerLabel(
  project: Pick<Project, "owner"> | null | undefined,
  t?: TranslationFn,
) {
  const owner = project?.owner;

  if (!owner) {
    return t ? t("owner.missing") : "No owner assigned";
  }

  return owner.user.name || owner.user.email || (t ? t("owner.unnamedMember") : "Unnamed member");
}

export function getPriorityTone(issue: Issue) {
  if (!issue.priority) {
    return null;
  }

  return priorityConfig[issue.priority as keyof typeof priorityConfig] || null;
}

export function getIssueStateMeta(issue: Issue) {
  if (
    issue.currentStepStatus &&
    statusConfig[issue.currentStepStatus as keyof typeof statusConfig]
  ) {
    const workflowState =
      statusConfig[issue.currentStepStatus as keyof typeof statusConfig];

    return {
      label: workflowState.label,
      icon: workflowState.icon,
      className: workflowState.color,
    };
  }

  return {
    label: issue.state?.name || "Uncategorized",
    icon: <span className="size-2 rounded-full bg-app-text-muted" />,
    className: "text-app-text-secondary",
  };
}
