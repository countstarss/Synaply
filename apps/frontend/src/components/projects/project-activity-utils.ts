"use client";

import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectActivityItem,
  ProjectDetail,
} from "@/lib/fetchers/project";
import { formatShortDate } from "@/components/projects/project-view-utils";

export type ProjectsTranslationFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export type ProjectTimelineEntry =
  | {
      id: string;
      type: "sync";
      occurredAt: string;
    }
  | {
      id: string;
      type: "activity";
      occurredAt: string;
      activity: ProjectActivityItem;
      issue: Issue | null;
    };

export function formatProjectRelativeTime(
  date: string,
  tProjects: ProjectsTranslationFn,
  locale: string,
  translationPrefix: "detail.relativeTime" | "subviews.relativeTime",
) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / (1000 * 60)), 0);

  if (diffMinutes < 1) {
    return tProjects(`${translationPrefix}.justNow`);
  }

  if (diffMinutes < 60) {
    return tProjects(`${translationPrefix}.minutesAgo`, { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return tProjects(`${translationPrefix}.hoursAgo`, { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return tProjects(`${translationPrefix}.daysAgo`, { count: diffDays });
  }

  return formatShortDate(date, locale);
}

export function buildProjectTimelineEntries({
  selectedProject,
  recentActivity,
  projectIssues,
}: {
  selectedProject: Project | ProjectDetail;
  recentActivity: ProjectActivityItem[];
  projectIssues: Issue[];
}) {
  const projectIssueMap = new Map<string, Issue>(
    projectIssues.map((issue) => [issue.id, issue]),
  );

  const entries: ProjectTimelineEntry[] = recentActivity.map((activity) => ({
    id: activity.id,
    type: "activity",
    occurredAt: activity.createdAt,
    activity,
    issue: activity.issue ? projectIssueMap.get(activity.issue.id) || null : null,
  }));

  if (selectedProject.lastSyncAt) {
    entries.push({
      id: `project-sync-${selectedProject.id}-${selectedProject.lastSyncAt}`,
      type: "sync",
      occurredAt: selectedProject.lastSyncAt,
    });
  }

  return entries.sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

export function getProjectActivityActorLabel(
  activity: ProjectActivityItem,
  fallbackLabel: string,
) {
  return (
    activity.actor?.user?.name ||
    activity.actor?.user?.email ||
    fallbackLabel
  );
}
