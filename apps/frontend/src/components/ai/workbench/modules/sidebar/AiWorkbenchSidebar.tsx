"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  MessageSquareText,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAiThreadDisplayTitleWithLabels } from "@/components/ai/workbench/aiWorkbenchUtils";
import type { AiThreadRecord } from "@/lib/ai/types";
import type { Issue } from "@/lib/fetchers/issue";
import { cn } from "@/lib/utils";
import { useMeasuredVirtualList } from "@/hooks/useMeasuredVirtualList";

export interface AiWorkbenchSidebarProps {
  workspaceName: string;
  threads: AiThreadRecord[];
  resolvedThreadId?: string | null;
  projectOptions: Array<{
    id: string;
    name: string;
  }>;
  issueOptions: Issue[];
  issueMap: Map<string, Issue>;
  projectNameMap: Map<string, string>;
  projectSelectValue: string;
  issueSelectValue: string;
  noneValue: string;
  currentProject?: {
    id: string;
    name: string;
  } | null;
  currentIssue?: Issue | null;
  contextSummary: string;
  isProjectsLoading?: boolean;
  isIssuesLoading?: boolean;
  issueSelectDisabled?: boolean;
  isCreatingThread?: boolean;
  onProjectChange: (value: string) => void;
  onIssueChange: (value: string) => void;
  onResetContext: () => void;
  onStartNewThread: () => Promise<void> | void;
  onSelectThread: (thread: AiThreadRecord) => void;
}

interface SidebarThreadItem {
  thread: AiThreadRecord;
  title: string;
  contextLabel: string;
  timestampLabel: string;
  tone: "workspace" | "project" | "issue";
  projectId: string | null;
  issueId: string | null;
}

interface SidebarProjectGroup {
  project: {
    id: string;
    name: string;
  };
  projectThread: SidebarThreadItem | null;
  issueThreads: SidebarThreadItem[];
  issueThreadCount: number;
  projectThreadCount: number;
}

type SidebarRow =
  | {
      id: string;
      type: "section";
      label: string;
      topSpacing: boolean;
    }
  | {
      id: string;
      type: "thread";
      item: SidebarThreadItem;
    }
  | {
      id: string;
      type: "project";
      group: SidebarProjectGroup;
      active: boolean;
      expanded: boolean;
    }
  | {
      id: string;
      type: "empty";
      variant: "workspace" | "project";
    };

type AiTranslate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function getIssueLabel(issue: Issue) {
  return issue.key ? `${issue.key} · ${issue.title}` : issue.title;
}

function formatRelativeThreadTime(
  value: string | null | undefined,
  locale: string,
  tAi: AiTranslate,
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

  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

function getThreadTone(thread: AiThreadRecord): SidebarThreadItem["tone"] {
  if (thread.originSurfaceType === "ISSUE") {
    return "issue";
  }

  if (thread.originSurfaceType === "PROJECT") {
    return "project";
  }

  return "workspace";
}

function getThreadContextLabel(
  thread: AiThreadRecord,
  issueMap: Map<string, Issue>,
  projectNameMap: Map<string, string>,
  workspaceName: string,
  tAi: AiTranslate,
) {
  if (
    thread.originSurfaceType === "ISSUE" &&
    thread.originSurfaceId &&
    issueMap.has(thread.originSurfaceId)
  ) {
    return getIssueLabel(issueMap.get(thread.originSurfaceId)!);
  }

  if (
    thread.originSurfaceType === "PROJECT" &&
    thread.originSurfaceId &&
    projectNameMap.has(thread.originSurfaceId)
  ) {
    return `${projectNameMap.get(thread.originSurfaceId)!} · ${tAi(
      "workbench.sidebar.projectConversation",
    )}`;
  }

  return `${workspaceName} · ${tAi("workbench.sidebar.freeConversation")}`;
}

function getToneMeta(item: SidebarThreadItem, tAi: AiTranslate) {
  const neutralClassName =
    "border-black/[0.06] bg-black/[0.03] text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/72";

  switch (item.tone) {
    case "issue":
      return {
        icon: MessageSquareText,
        label: item.contextLabel,
        className: neutralClassName,
      };
    case "project":
      return {
        icon: FolderOpen,
        label: tAi("workbench.sidebar.projectConversation"),
        className: neutralClassName,
      };
    default:
      return {
        icon: Bot,
        label: tAi("workbench.sidebar.freeConversation"),
        className: neutralClassName,
      };
  }
}

function SidebarThreadRow({
  item,
  active,
  tAi,
  onSelectThread,
}: {
  item: SidebarThreadItem;
  active: boolean;
  tAi: AiTranslate;
  onSelectThread: (thread: AiThreadRecord) => void;
}) {
  const meta = getToneMeta(item, tAi);
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onSelectThread(item.thread)}
      className={cn(
        "group flex min-w-0 w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition",
        active
          ? "border-black/[0.1] bg-black/[0.045] dark:border-white/12 dark:bg-white/[0.07]"
          : "border-transparent bg-transparent hover:border-black/[0.06] hover:bg-black/[0.03] dark:hover:border-white/8 dark:hover:bg-white/[0.04]",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border",
          meta.className,
        )}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-3">
          <p className="max-w-[200px] flex-1 truncate text-sm font-medium text-slate-900 dark:text-white/92">
            {item.title}
          </p>
          <span className="shrink-0 font-mono text-[10px] text-slate-400 dark:text-white/24">
            {item.timestampLabel}
          </span>
        </div>

        <p className="mt-1 truncate text-xs text-slate-500 dark:text-white/40">
          {meta.label}
        </p>
      </div>
    </button>
  );
}

export function AiWorkbenchSidebar({
  workspaceName,
  threads,
  resolvedThreadId = null,
  projectOptions,
  issueMap,
  projectNameMap,
  currentProject = null,
  currentIssue = null,
  isCreatingThread = false,
  onProjectChange,
  onStartNewThread,
  onSelectThread,
}: AiWorkbenchSidebarProps) {
  const locale = useLocale();
  const tAi = useTranslations("ai");
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const threadItems = useMemo<SidebarThreadItem[]>(
    () =>
      threads.map((thread) => {
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
          title: getAiThreadDisplayTitleWithLabels(
            thread.title,
            tAi("shared.conversation"),
            tAi("shared.conversationLegacy"),
            tAi("shared.surfaceLabel"),
          ),
          contextLabel: getThreadContextLabel(
            thread,
            issueMap,
            projectNameMap,
            workspaceName,
            tAi,
          ),
          timestampLabel: formatRelativeThreadTime(
            thread.lastMessageAt || thread.updatedAt,
            locale,
            tAi,
          ),
          tone: getThreadTone(thread),
          projectId,
          issueId:
            thread.originSurfaceType === "ISSUE" ? thread.originSurfaceId : null,
        };
      }),
    [issueMap, locale, projectNameMap, tAi, threads, workspaceName],
  );

  const sortedThreadItems = useMemo(
    () =>
      [...threadItems].sort((left, right) => {
        const leftTime = new Date(
          left.thread.lastMessageAt || left.thread.updatedAt || 0,
        ).getTime();
        const rightTime = new Date(
          right.thread.lastMessageAt || right.thread.updatedAt || 0,
        ).getTime();

        return rightTime - leftTime;
      }),
    [threadItems],
  );

  const freeThreads = useMemo(
    () => sortedThreadItems.filter((item) => item.tone === "workspace"),
    [sortedThreadItems],
  );

  const projectGroups = useMemo<SidebarProjectGroup[]>(
    () =>
      projectOptions.map((project) => {
        const projectThreads = sortedThreadItems.filter(
          (item) => item.projectId === project.id,
        );
        const issueThreads = projectThreads.filter((item) => item.tone === "issue");
        const projectThread =
          projectThreads.find((item) => item.tone === "project") || null;

        return {
          project,
          projectThread,
          issueThreads,
          issueThreadCount: issueThreads.length,
          projectThreadCount: projectThreads.filter((item) => item.tone === "project")
            .length,
        };
      }),
    [projectOptions, sortedThreadItems],
  );

  const activeProjectId = currentIssue?.projectId || currentProject?.id || null;
  const resolvedThreadItem = useMemo(
    () =>
      resolvedThreadId
        ? sortedThreadItems.find((item) => item.thread.id === resolvedThreadId) || null
        : null,
    [resolvedThreadId, sortedThreadItems],
  );
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    const initialKeys = new Set<string>();

    if (resolvedThreadItem?.projectId) {
      initialKeys.add(resolvedThreadItem.projectId);
    }

    return initialKeys;
  });

  useEffect(() => {
    if (!resolvedThreadItem) {
      return;
    }

    setExpandedKeys((previous) => {
      const next = new Set(previous);

      if (resolvedThreadItem.projectId) {
        next.add(resolvedThreadItem.projectId);
      }

      return next;
    });
  }, [resolvedThreadItem]);

  const toggleExpanded = (key: string) => {
    setExpandedKeys((previous) => {
      const next = new Set(previous);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const handleSelectProject = (group: SidebarProjectGroup) => {
    if (group.projectThread) {
      onSelectThread(group.projectThread.thread);
      return;
    }

    onProjectChange(group.project.id);
  };

  const sidebarRows = useMemo<SidebarRow[]>(() => {
    const rows: SidebarRow[] = [
      {
        id: "section-workspace",
        type: "section",
        label: tAi("workbench.sidebar.workspaceSection"),
        topSpacing: false,
      },
    ];

    if (freeThreads.length > 0) {
      rows.push(
        ...freeThreads.map((item) => ({
          id: `thread:${item.thread.id}`,
          type: "thread" as const,
          item,
        })),
      );
    } else {
      rows.push({
        id: "empty-workspace",
        type: "empty",
        variant: "workspace",
      });
    }

    rows.push({
      id: "section-projects",
      type: "section",
      label: tAi("workbench.sidebar.projectsSection"),
      topSpacing: true,
    });

    for (const group of projectGroups) {
      const expanded = expandedKeys.has(group.project.id);
      const active =
        activeProjectId === group.project.id ||
        (resolvedThreadItem?.tone === "project" &&
          resolvedThreadItem.projectId === group.project.id);

      rows.push({
        id: `project:${group.project.id}`,
        type: "project",
        group,
        active,
        expanded,
      });

      if (!expanded) {
        continue;
      }

      if (group.issueThreads.length > 0) {
        rows.push(
          ...group.issueThreads.map((item) => ({
            id: `thread:${item.thread.id}`,
            type: "thread" as const,
            item,
          })),
        );
      } else {
        rows.push({
          id: `empty-project:${group.project.id}`,
          type: "empty",
          variant: "project",
        });
      }
    }

    return rows;
  }, [
    activeProjectId,
    expandedKeys,
    freeThreads,
    projectGroups,
    resolvedThreadItem,
    tAi,
  ]);

  const shouldVirtualize = sidebarRows.length > 40;
  const { virtualItems, totalSize, measureElement } = useMeasuredVirtualList({
    containerRef: viewportRef,
    itemCount: sidebarRows.length,
    enabled: shouldVirtualize,
    overscan: 8,
    estimateSize: (index) => {
      const row = sidebarRows[index];

      switch (row?.type) {
        case "section":
          return row.topSpacing ? 48 : 28;
        case "project":
          return 76;
        case "empty":
          return 82;
        case "thread":
        default:
          return 78;
      }
    },
  });

  const renderRow = (row: SidebarRow) => {
    switch (row.type) {
      case "section":
        return (
          <div className={cn(row.topSpacing && "pt-3")}>
            <p className="px-2 text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400 dark:text-white/24">
              {row.label}
            </p>
          </div>
        );
      case "thread":
        return (
          <SidebarThreadRow
            item={row.item}
            active={row.item.thread.id === resolvedThreadId}
            tAi={tAi}
            onSelectThread={onSelectThread}
          />
        );
      case "empty":
        return (
          <div className="rounded-lg border border-dashed border-black/[0.08] px-4 py-3 text-sm leading-6 text-slate-500 dark:border-white/8 dark:text-white/34">
            {row.variant === "workspace"
              ? tAi("workbench.sidebar.freeEmpty")
              : tAi("workbench.sidebar.projectEmpty")}
          </div>
        );
      case "project":
        return (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg border border-black/[0.06] bg-black/[0.02] p-2 transition dark:border-white/8 dark:bg-white/[0.02]",
              row.active &&
                "border-black/[0.1] bg-black/[0.045] dark:border-white/12 dark:bg-white/[0.07]",
            )}
          >
            <button
              type="button"
              onClick={() => toggleExpanded(row.group.project.id)}
              className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-black/[0.04] hover:text-slate-900 dark:text-white/42 dark:hover:bg-white/[0.06] dark:hover:text-white"
              aria-label={
                row.expanded
                  ? tAi("workbench.sidebar.collapseProject", {
                      name: row.group.project.name,
                    })
                  : tAi("workbench.sidebar.expandProject", {
                      name: row.group.project.name,
                    })
              }
            >
              {row.expanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectProject(row.group)}
              className="flex min-w-0 flex-1 gap-3 text-left"
            >
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-black/[0.03] text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/72">
                <FolderOpen className="size-4" />
              </div>

              <div className="min-w-0 flex-1 flex">
                <div className="flex min-w-0 w-full items-center gap-3">
                  <p className="max-w-[200px] flex-1 truncate text-sm font-medium text-slate-950 dark:text-white line-clamp-1">
                    {row.group.project.name}
                  </p>
                </div>
              </div>
            </button>
          </div>
        );
    }
  };

  return (
    <aside className="flex w-[375px] shrink-0 flex-col overflow-hidden rounded-lg border border-black/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.98))] shadow-[0_30px_100px_-70px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(10,10,12,0.99))] dark:shadow-[0_30px_100px_-70px_rgba(0,0,0,0.9)]">
      <div className="border-b border-black/[0.06] px-6 py-3 dark:border-white/8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400 dark:text-white/24">
                {tAi("shared.surfaceLabel")}
              </p>
              <h2 className="truncate text-[15px] font-semibold text-slate-950 dark:text-white">
                {workspaceName}
              </h2>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            className="h-10 rounded-2xl bg-slate-950 px-3 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/92"
            disabled={isCreatingThread}
            onClick={() => void onStartNewThread()}
          >
            <Plus className="mr-1 size-4" />
            {tAi("workbench.sidebar.new")}
          </Button>
        </div>
      </div>

      <ScrollArea
        className="min-h-0 flex-1 overflow-hidden"
        viewportRef={viewportRef}
      >
        <div className="px-3 py-4">
          {shouldVirtualize ? (
            <div className="relative" style={{ height: totalSize }}>
              {virtualItems.map((virtualItem) => {
                const row = sidebarRows[virtualItem.index];

                return (
                  <div
                    key={row.id}
                    ref={measureElement(virtualItem.index)}
                    className="absolute inset-x-0 pb-1.5"
                    style={{ top: virtualItem.start }}
                  >
                    {renderRow(row)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1.5">
              {sidebarRows.map((row) => (
                <div key={row.id}>{renderRow(row)}</div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
