"use client";

import React, { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RiLoader4Line, RiLoopLeftLine } from "react-icons/ri";
import { useRouter } from "@/i18n/navigation";
import { ProjectActivityTimeline } from "@/components/projects/ProjectActivityTimeline";
import { ProjectSurfaceCard } from "@/components/projects/ProjectSurfaceCard";
import {
  buildProjectTimelineEntries,
  formatProjectRelativeTime,
} from "@/components/projects/project-activity-utils";
import { useInbox } from "@/hooks/useInbox";
import type { Issue } from "@/lib/fetchers/issue";
import type { InboxItem } from "@/lib/fetchers/inbox";
import type {
  Project,
  ProjectActivityItem,
  ProjectDetail,
} from "@/lib/fetchers/project";
import { useDocStore } from "@/stores/doc-store";
import { openDocRoute } from "@/components/shared/docs/doc-navigation";
import { resolveInboxDocContext } from "@/components/inbox/inbox-digest-utils";
import { InboxDigestList } from "@/components/inbox/InboxDigestList";

export function ProjectSyncSubview({
  workspaceId,
  workspaceType,
  selectedProject,
  recentActivity,
  projectIssues,
  onMarkSync,
  isMarkingSync = false,
  onOpenIssue,
}: {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  selectedProject: Project | ProjectDetail;
  recentActivity: ProjectActivityItem[];
  projectIssues: Issue[];
  onMarkSync: () => void;
  isMarkingSync?: boolean;
  onOpenIssue: (issue: Issue) => void;
}) {
  const tProjects = useTranslations("projects");
  const locale = useLocale();
  const router = useRouter();
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);
  const timelineEntries = useMemo(
    () =>
      buildProjectTimelineEntries({
        selectedProject,
        recentActivity,
        projectIssues,
    }),
    [projectIssues, recentActivity, selectedProject],
  );
  const { data: digestFeed, isLoading: isLoadingDigest } = useInbox(
    workspaceId,
    {
      bucket: "digest",
      projectId: selectedProject.id,
      limit: 3,
    },
    { enabled: !!workspaceId && !!selectedProject.id },
  );
  const digestItems = digestFeed?.items ?? [];

  const handleOpenDigestItem = (item: InboxItem) => {
    if (item.docId) {
      openDocRoute({
        workspaceId,
        workspaceType,
        context: resolveInboxDocContext(item, workspaceType),
        docId: item.docId,
        projectId: item.projectId,
        router,
        setActiveDocId,
      });
      return;
    }

    if (item.issueId) {
      const issue = projectIssues.find((projectIssue) => projectIssue.id === item.issueId);
      if (issue) {
        onOpenIssue(issue);
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col p-4 isolate">
      <ProjectSurfaceCard
        title={tProjects("subviews.sync.title")}
        subtitle={tProjects("subviews.sync.subtitle")}
        action={
          <button
            type="button"
            onClick={onMarkSync}
            disabled={isMarkingSync}
            className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMarkingSync ? (
              <RiLoader4Line className="size-3.5 animate-spin" />
            ) : (
              <RiLoopLeftLine className="size-3.5" />
            )}
            {tProjects("subviews.sync.updateSync")}
          </button>
        }
      >
        <div className="flex h-full min-h-0 flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">
                {tProjects("subviews.sync.recentSync")}
              </div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {selectedProject.lastSyncAt
                  ? formatProjectRelativeTime(
                      selectedProject.lastSyncAt,
                      tProjects,
                      locale,
                      "subviews.relativeTime",
                    )
                  : tProjects("subviews.sync.notRecorded")}
              </div>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">
                {tProjects("subviews.sync.activityCount")}
              </div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {timelineEntries.length}
              </div>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">
                {tProjects("subviews.sync.updatedAt")}
              </div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {formatProjectRelativeTime(
                  selectedProject.updatedAt,
                  tProjects,
                  locale,
                  "subviews.relativeTime",
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-4">
                <div className="mb-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-app-text-muted">
                    {tProjects("subviews.sync.digest.title")}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-app-text-secondary">
                    {tProjects("subviews.sync.digest.description")}
                  </p>
                </div>
                <InboxDigestList
                  items={digestItems}
                  isLoading={isLoadingDigest}
                  emptyTitle={tProjects("subviews.sync.digest.emptyTitle")}
                  emptyDescription={tProjects("subviews.sync.digest.emptyDescription")}
                  onOpenItem={handleOpenDigestItem}
                />
              </div>

              <ProjectActivityTimeline
                entries={timelineEntries}
                locale={locale}
                tProjects={tProjects}
                relativeTimePrefix="subviews.relativeTime"
                emptyText={tProjects("subviews.sync.empty")}
                syncTitle={tProjects("subviews.sync.timeline.syncTitle")}
                syncDescription={tProjects("subviews.sync.timeline.syncDescription")}
                actorFallbackLabel={tProjects("subviews.sync.teamMember")}
                onOpenIssue={onOpenIssue}
              />
            </div>
          </div>
        </div>
      </ProjectSurfaceCard>
    </div>
  );
}
