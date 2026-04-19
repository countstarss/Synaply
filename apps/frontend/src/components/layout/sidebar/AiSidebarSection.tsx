"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  MessageSquareText,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useIssues } from "@/hooks/useIssueApi";
import { useProjects } from "@/hooks/useProjectApi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { usePathname, useRouter } from "@/i18n/navigation";
import { listAiThreads } from "@/lib/fetchers/ai-thread";
import type { AiThreadRecord } from "@/lib/ai/types";
import { cn, isRouteActive } from "@/lib/utils";
import SidebarSection from "./SidebarSection";
import {
  getAiComposePath,
  getAiThreadDisplayTitle,
  getAiThreadPath,
  getSelectionFromThread,
} from "@/components/ai/workbench/aiWorkbenchUtils";

interface SidebarThreadItem {
  thread: AiThreadRecord;
  title: string;
  projectId: string | null;
  timestampLabel: string;
}

interface SidebarProjectGroup {
  project: {
    id: string;
    name: string;
  };
  projectThread: SidebarThreadItem | null;
  issueThreads: SidebarThreadItem[];
}

type SidebarTranslationFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function formatRelativeThreadTime(
  value: string | null | undefined,
  locale: string,
  tAi: SidebarTranslationFn,
) {
  if (!value) {
    return tAi("workbench.sidebar.justNow");
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return tAi("workbench.sidebar.minutesAgo", { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return tAi("workbench.sidebar.hoursAgo", { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return tAi("workbench.sidebar.daysAgo", { count: diffDays });
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function SidebarThreadRow({
  item,
  active,
  nested = false,
  onSelect,
}: {
  item: SidebarThreadItem;
  active: boolean;
  nested?: boolean;
  onSelect: (thread: AiThreadRecord) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.thread)}
      className={cn(
        "mx-2 flex w-[calc(100%-1rem)] min-w-0 items-center gap-2 rounded-md px-3 py-1.5 text-left transition-colors",
        "text-gray-600 hover:bg-[#2b2b2b] hover:text-white dark:text-gray-300 dark:hover:text-white",
        active && "bg-[#2b2b2b] text-white",
        nested && "ml-7 w-[calc(100%-2.25rem)]",
      )}
      title={item.title}
    >
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-5">
        {item.title}
      </span>
      <span
        className={cn(
          "shrink-0 text-[11px] leading-5",
          active ? "text-white/55" : "text-gray-400 dark:text-gray-500",
        )}
      >
        {item.timestampLabel}
      </span>
    </button>
  );
}

export default function AiSidebarSection() {
  const locale = useLocale();
  const tAi = useTranslations("ai");
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ threadId?: string }>();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const activeThreadId =
    typeof params.threadId === "string" ? params.threadId : null;
  const selectedProjectId = searchParams.get("projectId") || "";
  const isAiRoute = isRouteActive(pathname, "/intelligence");

  const { data: projects = [] } = useProjects(workspaceId);
  const { data: issues = [] } = useIssues(
    workspaceId,
    { limit: 200 },
    { enabled: isAiRoute && !!workspaceId },
  );
  const threadsQuery = useQuery({
    queryKey: ["ai-threads", workspaceId],
    queryFn: async () => {
      if (!session?.access_token || !workspaceId) {
        return [];
      }

      return listAiThreads(workspaceId, session.access_token);
    },
    enabled: isAiRoute && !!session?.access_token && !!workspaceId,
  });

  const issueMap = useMemo(
    () => new Map(issues.map((issue) => [issue.id, issue])),
    [issues],
  );
  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      ),
    [projects],
  );
  const sortedThreads = useMemo(
    () =>
      [...(threadsQuery.data || [])].sort((left, right) => {
        const leftValue = left.lastMessageAt || left.updatedAt || left.createdAt;
        const rightValue =
          right.lastMessageAt || right.updatedAt || right.createdAt;

        return new Date(rightValue).getTime() - new Date(leftValue).getTime();
      }),
    [threadsQuery.data],
  );
  const threadItems = useMemo<SidebarThreadItem[]>(
    () =>
      sortedThreads.map((thread) => {
        const issue =
          thread.originSurfaceType === "ISSUE" && thread.originSurfaceId
            ? issueMap.get(thread.originSurfaceId) || null
            : null;
        const projectId =
          thread.originSurfaceType === "PROJECT"
            ? thread.originSurfaceId
            : issue?.projectId || null;

        return {
          thread,
          title: getAiThreadDisplayTitle(thread.title),
          projectId,
          timestampLabel: formatRelativeThreadTime(
            thread.lastMessageAt || thread.updatedAt,
            locale,
            tAi,
          ),
        };
      }),
    [issueMap, locale, sortedThreads, tAi],
  );
  const freeThreads = useMemo(
    () => threadItems.filter((item) => item.thread.originSurfaceType === "WORKSPACE"),
    [threadItems],
  );
  const projectGroups = useMemo<SidebarProjectGroup[]>(
    () =>
      sortedProjects.map((project) => {
        const projectThreads = threadItems.filter(
          (item) => item.projectId === project.id,
        );

        return {
          project,
          projectThread:
            projectThreads.find(
              (item) => item.thread.originSurfaceType === "PROJECT",
            ) || null,
          issueThreads: projectThreads.filter(
            (item) => item.thread.originSurfaceType === "ISSUE",
          ),
        };
      }),
    [sortedProjects, threadItems],
  );

  const resolvedThread = useMemo(
    () =>
      activeThreadId
        ? sortedThreads.find((thread) => thread.id === activeThreadId) || null
        : null,
    [activeThreadId, sortedThreads],
  );
  const resolvedSelection =
    resolvedThread && issueMap.size > 0
      ? getSelectionFromThread(resolvedThread, issueMap)
      : null;
  const currentProjectId = resolvedSelection?.projectId || selectedProjectId;
  const currentIssueId = resolvedSelection?.issueId || "";

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    const next = new Set<string>();

    if (currentProjectId) {
      next.add(currentProjectId);
    }

    return next;
  });

  useEffect(() => {
    if (!currentProjectId) {
      return;
    }

    setExpandedKeys((previous) => {
      if (previous.has(currentProjectId)) {
        return previous;
      }

      const next = new Set(previous);
      next.add(currentProjectId);
      return next;
    });
  }, [currentProjectId]);

  const toggleExpanded = (projectId: string) => {
    setExpandedKeys((previous) => {
      const next = new Set(previous);

      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }

      return next;
    });
  };

  const handleSelectThread = (thread: AiThreadRecord) => {
    router.push(getAiThreadPath(thread.id));
  };

  const handleSelectProject = (group: SidebarProjectGroup) => {
    if (group.projectThread) {
      handleSelectThread(group.projectThread.thread);
      return;
    }

    router.push(getAiComposePath(group.project.id));
  };

  if (!isAiRoute || !currentWorkspace) {
    return null;
  }

  return (
    <SidebarSection title={tAi("workbench.sidebar.sectionTitle")} defaultExpanded>
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => router.push(getAiComposePath(currentProjectId, currentIssueId))}
          className={cn(
            "mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-md px-4 py-2 text-left transition-colors",
            "text-gray-600 hover:bg-[#2b2b2b] hover:text-white dark:text-gray-300 dark:hover:text-white",
          )}
        >
          <Plus className="size-4 shrink-0" />
          <span className="truncate text-sm font-medium">
            {tAi("shared.newConversation")}
          </span>
        </button>

        {freeThreads.length > 0 ? (
          <>
            <div className="px-4 pt-2 text-[10px] font-medium tracking-[0.16em] text-gray-400">
              {tAi("workbench.sidebar.workspaceSection")}
            </div>
            {freeThreads.map((item) => (
              <SidebarThreadRow
                key={item.thread.id}
                item={item}
                active={item.thread.id === activeThreadId}
                onSelect={handleSelectThread}
              />
            ))}
          </>
        ) : null}

        {projectGroups.length > 0 ? (
          <div className="pt-2">
            <div className="px-4 pb-1 text-[10px] font-medium tracking-[0.16em] text-gray-400">
              {tAi("workbench.sidebar.projectsSection")}
            </div>

            {projectGroups.map((group) => {
              const expanded = expandedKeys.has(group.project.id);
              const isActiveProject = currentProjectId === group.project.id;

              return (
                <div key={group.project.id} className="space-y-1">
                  <div
                    className={cn(
                      "mx-2 flex items-center rounded-md transition-colors",
                      isActiveProject
                        ? "bg-[#2b2b2b] text-white"
                        : "text-gray-600 hover:bg-[#2b2b2b] hover:text-white dark:text-gray-300 dark:hover:text-white",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpanded(group.project.id)}
                      className="flex h-8 w-8 items-center justify-center opacity-70 transition-colors"
                      aria-label={
                        expanded
                          ? tAi("workbench.sidebar.collapseProject", {
                              name: group.project.name,
                            })
                          : tAi("workbench.sidebar.expandProject", {
                              name: group.project.name,
                            })
                      }
                    >
                      {expanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectProject(group)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pr-3 text-left"
                    >
                      <FolderOpen className="size-3.5 shrink-0" />
                      <span className="truncate text-[13px] font-medium">
                        {group.project.name}
                      </span>
                    </button>
                  </div>

                  {expanded ? (
                    group.issueThreads.length > 0 ? (
                      group.issueThreads.map((item) => (
                        <SidebarThreadRow
                          key={item.thread.id}
                          item={item}
                          active={item.thread.id === activeThreadId}
                          nested
                          onSelect={handleSelectThread}
                        />
                      ))
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectProject(group)}
                        className="mx-2 ml-7 flex w-[calc(100%-2.25rem)] items-center gap-2 rounded-md px-3 py-1.5 text-left text-[11px] text-gray-400 transition-colors hover:bg-[#2b2b2b] hover:text-white dark:text-gray-500 dark:hover:text-white"
                      >
                        <MessageSquareText className="size-3.5 shrink-0" />
                        <span className="truncate">
                          {tAi("workbench.sidebar.projectStart")}
                        </span>
                      </button>
                    )
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {threadsQuery.isLoading ? (
          <div className="px-4 py-2 text-xs text-gray-400">
            {tAi("workbench.sidebar.syncing")}
          </div>
        ) : null}

        {!threadsQuery.isLoading && threadItems.length === 0 ? (
          <div className="px-4 py-2 text-xs leading-6 text-gray-400 dark:text-gray-500">
            {tAi("workbench.sidebar.empty")}
          </div>
        ) : null}
      </div>
    </SidebarSection>
  );
}
