"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowUpRight,
  Bug,
  Clock3,
  Loader2,
  RefreshCw,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import WorkflowIssueDetail from "@/components/issue/WorkflowIssueDetail";
import InfoBarTabs from "@/components/layout/infobar/InfoBarTabs";
import AmbientGlow from "@/components/global/AmbientGlow";
import NormalIssueDetail from "@/components/shared/issue/NormalIssueDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMyWork } from "@/hooks/useMyWork";
import { useCachedPageVisibility } from "@/components/cache/CachedPageVisibility";
import {
  useAcceptWorkflowHandoff,
  useUpdateWorkflowRunStatus,
} from "@/hooks/useIssueApi";
import { useWorkspaceRealtime } from "@/hooks/realtime/useWorkspaceRealtime";
import { useWorkspace } from "@/hooks/useWorkspace";
import { priorityConfig } from "@/lib/data/issueConfig";
import { MyWorkItem, MyWorkResponse } from "@/lib/fetchers/my-work";
import { cn } from "@/lib/utils";
import { IssuePriority, IssueStatus } from "@/types/prisma";

type WorkTabId = "today" | "waiting" | "in-progress" | "blocked" | "completed";
type SectionId = "waitingForMe" | "inProgress" | "blocked" | "completedToday";

interface SectionMeta {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

interface SummaryMetricCardProps {
  tabId: WorkTabId;
  label: string;
  value: number;
  tone?: "default" | "attention" | "danger" | "success";
  active?: boolean;
  onSelect: (tabId: WorkTabId) => void;
  className?: string;
}

interface WorkSectionProps {
  meta: SectionMeta;
  items: MyWorkItem[];
  onOpenIssue: (item: MyWorkItem) => void;
  onMarkStarted: (item: MyWorkItem) => Promise<void>;
  onAcceptHandoff: (item: MyWorkItem) => Promise<void>;
  isMutatingIssueId: string | null;
}

interface WorkItemRowProps {
  item: MyWorkItem;
  onOpenIssue: (item: MyWorkItem) => void;
  onMarkStarted: (item: MyWorkItem) => Promise<void>;
  onAcceptHandoff: (item: MyWorkItem) => Promise<void>;
  isMutating: boolean;
}

const TAB_ORDER: WorkTabId[] = [
  "today",
  "waiting",
  "in-progress",
  "blocked",
  "completed",
];

function getSummaryToneClasses(tone: SummaryMetricCardProps["tone"]) {
  switch (tone) {
    case "attention":
      return {
        accent: "bg-sky-200/80",
        ambient:
          "radial-gradient(circle at top left, rgba(125, 211, 252, 0.14), transparent 34%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 44%)",
      };
    case "danger":
      return {
        accent: "bg-rose-300/80",
        ambient:
          "radial-gradient(circle at top left, rgba(251, 113, 133, 0.14), transparent 34%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 44%)",
      };
    case "success":
      return {
        accent: "bg-emerald-300/80",
        ambient:
          "radial-gradient(circle at top left, rgba(110, 231, 183, 0.14), transparent 34%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 44%)",
      };
    default:
      return {
        accent: "bg-slate-300/70 dark:bg-white/60",
        ambient:
          "radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), transparent 32%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.05), transparent 44%)",
      };
  }
}

function SummaryMetricCard({
  tabId,
  label,
  value,
  tone = "default",
  active = false,
  onSelect,
  className,
}: SummaryMetricCardProps) {
  const toneClasses = getSummaryToneClasses(tone);

  return (
    <button
      type="button"
      onClick={() => onSelect(tabId)}
      aria-pressed={active}
      className={cn(
        "group relative h-[118px] overflow-hidden rounded-2xl border text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/20",
        active
          ? "border-sky-200 bg-app-content-bg shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-white/12 dark:shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
          : "border-app-border bg-app-content-bg shadow-[0_12px_30px_rgba(15,23,42,0.05)] hover:bg-app-button-hover/40 hover:shadow-[0_16px_34px_rgba(15,23,42,0.07)] dark:border-white/[0.07] dark:shadow-[0_12px_30px_rgba(0,0,0,0.16)]",
        "hover:-translate-y-0.5",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-75"
        style={{ backgroundImage: toneClasses.ambient }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 to-transparent opacity-70 dark:from-white/[0.05]" />
      {active ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-4 bottom-0 h-px",
            toneClasses.accent,
          )}
        />
      ) : null}

      <div className="relative flex h-full flex-col justify-between px-4 py-4">
        <div className="text-[13px] font-medium text-app-text-secondary">
          {label}
        </div>
        <div className="text-[34px] font-semibold tracking-[-0.05em] text-app-text-primary">
          {value}
        </div>
      </div>
    </button>
  );
}

function getSummaryCardActiveState(activeTab: WorkTabId, tabId: WorkTabId) {
  if (tabId === "today") {
    return activeTab === "today";
  }

  return activeTab === tabId;
}

function renderSummaryCards(
  data: MyWorkResponse | undefined,
  activeTab: WorkTabId,
  onSelect: (tabId: WorkTabId) => void,
  tTasks: (key: string, values?: Record<string, string | number>) => string,
) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryMetricCard
        tabId="today"
        label={tTasks("summary.todayFocus")}
        value={data?.counts.todayFocus || 0}
        tone="attention"
        active={getSummaryCardActiveState(activeTab, "today")}
        onSelect={onSelect}
      />
      <SummaryMetricCard
        tabId="waiting"
        label={tTasks("summary.waiting")}
        value={data?.counts.waitingForMe || 0}
        tone="attention"
        active={getSummaryCardActiveState(activeTab, "waiting")}
        onSelect={onSelect}
      />
      <SummaryMetricCard
        tabId="in-progress"
        label={tTasks("summary.inProgress")}
        value={data?.counts.inProgress || 0}
        tone="default"
        active={getSummaryCardActiveState(activeTab, "in-progress")}
        onSelect={onSelect}
      />
      <SummaryMetricCard
        tabId="blocked"
        label={tTasks("summary.blocked")}
        value={data?.counts.blocked || 0}
        tone="danger"
        active={getSummaryCardActiveState(activeTab, "blocked")}
        onSelect={onSelect}
      />
      <SummaryMetricCard
        tabId="completed"
        label={tTasks("summary.completedToday")}
        value={data?.counts.completedToday || 0}
        tone="success"
        active={getSummaryCardActiveState(activeTab, "completed")}
        onSelect={onSelect}
      />
    </div>
  );
}

function formatDueLabel(dueAt: string | null) {
  if (!dueAt) {
    return null;
  }

  return format(new Date(dueAt), "MM-dd");
}

function getPriorityBadge(priority: IssuePriority | null) {
  if (!priority) {
    return null;
  }

  const tone = priorityConfig[priority];

  if (!tone) {
    return null;
  }

  return (
    <Badge variant="outline" className={cn("border", tone.color)}>
      {tone.label}
    </Badge>
  );
}

function getActionTone(item: MyWorkItem) {
  switch (item.currentActionType) {
    case "review":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
    case "handoff":
      return "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200";
    case "blocked":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200";
    case "execution":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
    case "done":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    default:
      return "border-app-border bg-app-bg text-app-text-secondary";
  }
}

function getSourceMeta(
  item: MyWorkItem,
  tTasks: (key: string, values?: Record<string, string | number>) => string,
) {
  if (item.sourceType === "workflow") {
    return {
      label: tTasks("row.source.workflow"),
      icon: <Workflow className="size-3.5" />,
    };
  }

  return {
    label: tTasks("row.source.issue"),
    icon: <Bug className="size-3.5" />,
  };
}

function getQuickActionLabel(
  item: MyWorkItem,
  tTasks: (key: string, values?: Record<string, string | number>) => string,
) {
  if (item.sourceType === "workflow" && item.currentActionType === "handoff") {
    return tTasks("row.quickAction.accept");
  }

  if (
    item.sourceType === "workflow" &&
    item.currentActionType === "todo" &&
    item.status === IssueStatus.TODO
  ) {
    return tTasks("row.quickAction.start");
  }

  if (item.currentActionType === "review") {
    return tTasks("row.quickAction.review");
  }

  return tTasks("row.quickAction.open");
}

function getQueueMeta(
  item: MyWorkItem,
  tTasks: (key: string, values?: Record<string, string | number>) => string,
) {
  if (item.currentActionType === "review" && item.targetName) {
    return tTasks("row.queue.review", { name: item.targetName });
  }

  if (item.currentActionType === "handoff" && item.targetName) {
    return tTasks("row.queue.handoff", { name: item.targetName });
  }

  if (item.assigneeName) {
    return tTasks("row.queue.assignee", { name: item.assigneeName });
  }

  return item.sourceType === "workflow"
    ? tTasks("row.queue.workflow")
    : tTasks("row.queue.issue");
}

function getSignalCopy(item: MyWorkItem) {
  if (item.currentActionType === "blocked" && item.blockedReason) {
    return item.blockedReason;
  }

  if (item.currentStepName) {
    return item.currentStepName;
  }

  return item.statusLabel;
}

function WorkItemRow({
  item,
  onOpenIssue,
  onMarkStarted,
  onAcceptHandoff,
  isMutating,
}: WorkItemRowProps) {
  const tTasks = useTranslations("tasks");
  const sourceMeta = getSourceMeta(item, tTasks);
  const priorityBadge = getPriorityBadge(item.priority);
  const dueLabel = formatDueLabel(item.dueAt);
  const showAcceptHandoff =
    item.sourceType === "workflow" && item.currentActionType === "handoff";
  const showMarkStarted =
    item.sourceType === "workflow" &&
    item.currentActionType === "todo" &&
    item.status === IssueStatus.TODO;

  const handleQuickAction = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (showAcceptHandoff) {
      await onAcceptHandoff(item);
      return;
    }

    if (showMarkStarted) {
      await onMarkStarted(item);
      return;
    }

    onOpenIssue(item);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onOpenIssue(item);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleRowKeyDown}
      onClick={() => onOpenIssue(item)}
      aria-label={tTasks("row.openIssueAria", { title: item.title })}
      className="group block w-full px-2 py-2 text-left focus:outline-none"
    >
      <div
        className={cn(
          "grid items-start gap-4 rounded-[18px] border border-transparent px-4 py-4 transition-all duration-200 md:grid-cols-[minmax(0,1.6fr)_minmax(190px,0.85fr)_minmax(190px,0.9fr)_auto]",
          "group-hover:border-app-border group-hover:bg-app-button-hover/40",
          "group-focus-visible:border-sky-200 group-focus-visible:bg-app-button-hover/40 group-focus-visible:ring-1 group-focus-visible:ring-sky-500/20",
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {item.issueKey ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-app-text-muted">
                {item.issueKey}
              </span>
            ) : null}
            <Badge
              variant="outline"
              className="gap-1 border-app-border bg-app-bg text-app-text-secondary"
            >
              {sourceMeta.icon}
              {sourceMeta.label}
            </Badge>
            <Badge
              variant="outline"
              className={cn("border", getActionTone(item))}
            >
              {item.currentActionLabel}
            </Badge>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <div
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
                item.currentActionType === "blocked"
                  ? "bg-red-400"
                  : item.currentActionType === "done"
                    ? "bg-emerald-400"
                    : item.currentActionType === "execution"
                      ? "bg-amber-300"
                      : "bg-slate-300 dark:bg-white/60",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-medium tracking-[-0.01em] text-app-text-primary">
                {item.title}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-app-text-muted">
                <span>{item.projectName || tTasks("row.unassignedProject")}</span>
                <span>·</span>
                <span>{getQueueMeta(item, tTasks)}</span>
              </div>
              {item.blockedReason && item.currentActionType !== "blocked" ? (
                <div className="mt-2 text-[12px] text-red-300">
                  {item.blockedReason}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted">
            {tTasks("table.context")}
          </div>
          <div className="mt-2 text-sm text-app-text-primary">
            {item.projectName || tTasks("row.workspaceQueue")}
          </div>
          <div className="mt-1 text-[12px] text-app-text-muted">
            {item.currentStepName || item.statusLabel}
          </div>
        </div>

        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted">
            {tTasks("table.signal")}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {priorityBadge}
            {dueLabel ? (
              <Badge
                variant="outline"
                className={cn(
                  "border-app-border bg-app-bg",
                  item.isOverdue
                    ? "text-rose-600 dark:text-red-300"
                    : "text-app-text-secondary",
                )}
              >
                {tTasks("row.due", { value: dueLabel })}
              </Badge>
            ) : null}
          </div>
          <div
            className={cn(
              "mt-2 text-[12px] leading-5",
              item.currentActionType === "blocked"
                ? "text-red-300"
                : "text-app-text-muted",
            )}
          >
            {getSignalCopy(item)}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-start md:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg border border-app-border bg-app-content-bg text-app-text-secondary hover:bg-app-button-hover/60 hover:text-app-text-primary"
            onClick={handleQuickAction}
            disabled={isMutating}
          >
            {isMutating ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <ArrowUpRight data-icon="inline-start" />
            )}
            {getQuickActionLabel(item, tTasks)}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptySectionState({ meta }: { meta: SectionMeta }) {
  return (
    <div className="rounded-xl border border-dashed border-app-border bg-app-bg px-4 py-8 text-center">
      <div className="text-sm font-medium text-app-text-primary">
        {meta.emptyTitle}
      </div>
      <div className="mt-2 text-sm text-app-text-muted">
        {meta.emptyDescription}
      </div>
    </div>
  );
}

function WorkSection({
  meta,
  items,
  onOpenIssue,
  onMarkStarted,
  onAcceptHandoff,
  isMutatingIssueId,
}: WorkSectionProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-app-border bg-app-content-bg shadow-none">
      <CardHeader className="gap-2 border-b border-app-border px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base text-app-text-primary">
              {meta.title}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-sm text-app-text-muted">
          {meta.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {items.length === 0 ? (
          <div className="px-5 py-5">
            <EmptySectionState meta={meta} />
          </div>
        ) : (
          <>
            <div className="hidden border-b border-app-border bg-app-bg px-4 py-2 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(190px,0.85fr)_minmax(190px,0.9fr)_auto] md:gap-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted">
                <TasksTableLabel labelKey="table.work" />
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted">
                <TasksTableLabel labelKey="table.context" />
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted">
                <TasksTableLabel labelKey="table.signal" />
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted md:text-right">
                <TasksTableLabel labelKey="table.action" />
              </div>
            </div>
            <div className="divide-y divide-app-border">
              {items.map((item) => (
                <WorkItemRow
                  key={item.id}
                  item={item}
                  onOpenIssue={onOpenIssue}
                  onMarkStarted={onMarkStarted}
                  onAcceptHandoff={onAcceptHandoff}
                  isMutating={isMutatingIssueId === item.issueId}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TasksTableLabel({ labelKey }: { labelKey: string }) {
  const tTasks = useTranslations("tasks");
  return <>{tTasks(labelKey)}</>;
}

function getSectionMeta(
  tTasks: (key: string, values?: Record<string, string | number>) => string,
): Record<SectionId, SectionMeta> {
  return {
    waitingForMe: {
      title: tTasks("sections.waiting.title"),
      description: tTasks("sections.waiting.description"),
      emptyTitle: tTasks("sections.waiting.emptyTitle"),
      emptyDescription: tTasks("sections.waiting.emptyDescription"),
    },
    inProgress: {
      title: tTasks("sections.inProgress.title"),
      description: tTasks("sections.inProgress.description"),
      emptyTitle: tTasks("sections.inProgress.emptyTitle"),
      emptyDescription: tTasks("sections.inProgress.emptyDescription"),
    },
    blocked: {
      title: tTasks("sections.blocked.title"),
      description: tTasks("sections.blocked.description"),
      emptyTitle: tTasks("sections.blocked.emptyTitle"),
      emptyDescription: tTasks("sections.blocked.emptyDescription"),
    },
    completedToday: {
      title: tTasks("sections.completed.title"),
      description: tTasks("sections.completed.description"),
      emptyTitle: tTasks("sections.completed.emptyTitle"),
      emptyDescription: tTasks("sections.completed.emptyDescription"),
    },
  };
}

function buildTabs(
  tTasks: (key: string, values?: Record<string, string | number>) => string,
  data?: MyWorkResponse,
) {
  return TAB_ORDER.map((tabId) => {
    if (tabId === "waiting") {
      return {
        id: tabId,
        label: `${tTasks("tabs.waiting")}${data?.counts.waitingForMe ? ` (${data.counts.waitingForMe})` : ""}`,
      };
    }

    if (tabId === "in-progress") {
      return {
        id: tabId,
        label: `${tTasks("tabs.inProgress")}${data?.counts.inProgress ? ` (${data.counts.inProgress})` : ""}`,
      };
    }

    if (tabId === "blocked") {
      return {
        id: tabId,
        label: `${tTasks("tabs.blocked")}${data?.counts.blocked ? ` (${data.counts.blocked})` : ""}`,
      };
    }

    if (tabId === "completed") {
      return {
        id: tabId,
        label: `${tTasks("tabs.completed")}${data?.counts.completedToday ? ` (${data.counts.completedToday})` : ""}`,
      };
    }

    return {
      id: tabId,
      label: `${tTasks("tabs.today")}${data?.counts.todayFocus ? ` (${data.counts.todayFocus})` : ""}`,
    };
  });
}

function getActiveSection(activeTab: WorkTabId): SectionId | null {
  if (activeTab === "today") {
    return null;
  }

  if (activeTab === "waiting") {
    return "waitingForMe";
  }

  if (activeTab === "in-progress") {
    return "inProgress";
  }

  if (activeTab === "blocked") {
    return "blocked";
  }

  return "completedToday";
}

export default function TasksPageContent() {
  const tTasks = useTranslations("tasks");
  const isPageVisible = useCachedPageVisibility();
  const hasMountedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<WorkTabId>("today");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedIssueIsWorkflow, setSelectedIssueIsWorkflow] = useState(false);
  const [isMutatingIssueId, setIsMutatingIssueId] = useState<string | null>(
    null,
  );
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const { data, isLoading, error, refetch, isRefetching } =
    useMyWork(workspaceId, { enabled: isPageVisible });
  const updateWorkflowRunStatus = useUpdateWorkflowRunStatus();
  const acceptWorkflowHandoff = useAcceptWorkflowHandoff();

  useWorkspaceRealtime(workspaceId, {
    enabled: isPageVisible && !selectedIssueId,
    userEnabled: isPageVisible,
  });

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (!isPageVisible) {
      return;
    }

    void refetch();
  }, [isPageVisible, refetch]);

  const tabs = useMemo(() => buildTabs(tTasks, data), [data, tTasks]);
  const sectionMeta = useMemo(() => getSectionMeta(tTasks), [tTasks]);
  const sectionItems = useMemo(
    () => ({
      waitingForMe: data?.waitingForMe || [],
      inProgress: data?.inProgress || [],
      blocked: data?.blocked || [],
      completedToday: data?.completedToday || [],
    }),
    [data],
  );
  const activeSection = useMemo(() => getActiveSection(activeTab), [activeTab]);
  const generatedAtLabel = data?.generatedAt
    ? format(new Date(data.generatedAt), "HH:mm")
    : null;

  const handleOpenIssue = (item: MyWorkItem) => {
    setSelectedIssueId(item.issueId);
    setSelectedIssueIsWorkflow(item.sourceType === "workflow");
  };

  const handleCloseDetail = () => {
    setSelectedIssueId(null);
    setSelectedIssueIsWorkflow(false);
    void refetch();
  };

  const handleMarkStarted = async (item: MyWorkItem) => {
    if (item.sourceType !== "workflow") {
      handleOpenIssue(item);
      return;
    }

    try {
      setIsMutatingIssueId(item.issueId);
      await updateWorkflowRunStatus.mutateAsync({
        workspaceId,
        issueId: item.issueId,
        data: {
          status: IssueStatus.IN_PROGRESS,
        },
      });
      toast.success(tTasks("toasts.markedStarted"));
      await refetch();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : tTasks("toasts.markStartedFailed"),
      );
    } finally {
      setIsMutatingIssueId(null);
    }
  };

  const handleAcceptHandoff = async (item: MyWorkItem) => {
    if (item.sourceType !== "workflow") {
      handleOpenIssue(item);
      return;
    }

    try {
      setIsMutatingIssueId(item.issueId);
      await acceptWorkflowHandoff.mutateAsync({
        workspaceId,
        issueId: item.issueId,
        data: {},
      });
      toast.success(tTasks("toasts.handoffAccepted"));
      await refetch();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : tTasks("toasts.acceptHandoffFailed"),
      );
    } finally {
      setIsMutatingIssueId(null);
    }
  };

  if (selectedIssueId && selectedIssueIsWorkflow) {
    return (
      <div className="h-full w-full bg-app-bg p-2">
        <WorkflowIssueDetail
          issueId={selectedIssueId}
          workspaceId={workspaceId}
          isOpen={true}
          onClose={handleCloseDetail}
          onUpdate={handleCloseDetail}
          displayMode="page"
        />
      </div>
    );
  }

  if (selectedIssueId && !selectedIssueIsWorkflow) {
    return (
      <div className="h-full w-full bg-app-bg p-2">
        <NormalIssueDetail
          issueId={selectedIssueId}
          workspaceId={workspaceId}
          isOpen={true}
          onClose={handleCloseDetail}
          onUpdate={handleCloseDetail}
          displayMode="page"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-app-bg">
      <div className="border-b border-app-border px-4 py-3">
        <InfoBarTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as WorkTabId)}
        />
      </div>

      <div className="isolate relative flex-1 min-h-0 overflow-hidden">
        <AmbientGlow />
        <div className="relative z-20 h-full overflow-y-auto">
          <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32" />

            <div className="relative z-10 flex flex-col gap-4">
              {isLoading ? (
                <Card className="border border-app-border bg-app-content-bg shadow-none">
                  <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 py-12">
                    <Loader2 className="size-5 animate-spin text-app-text-muted" />
                    <div className="text-sm text-app-text-muted">
                      {tTasks("states.loading")}
                    </div>
                  </CardContent>
                </Card>
              ) : error ? (
                <Card className="border border-red-500/18 bg-red-500/[0.07] shadow-none">
                  <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 py-12 text-center">
                    <AlertTriangle className="size-5 text-red-300" />
                    <div>
                      <div className="text-sm font-medium text-app-text-primary">
                        {tTasks("states.errorTitle")}
                      </div>
                      <div className="mt-2 text-sm text-app-text-muted">
                        {error instanceof Error ? error.message : tTasks("states.errorDescription")}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-app-border bg-app-content-bg text-app-text-primary hover:bg-app-button-hover/60"
                      onClick={() => void refetch()}
                    >
                      <RefreshCw data-icon="inline-start" />
                      {tTasks("actions.retry")}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-app-border bg-app-content-bg px-4 py-3">
                      <div className="min-w-0 pr-2">
                        <h2 className="truncate text-[1.15rem] font-semibold tracking-[-0.03em] text-app-text-primary">
                          {tTasks("header.title")}
                        </h2>
                      </div>

                      <div className="ml-auto flex flex-wrap gap-2">
                        <div className="rounded-full border border-app-border bg-app-bg px-3 py-1.5 text-xs font-medium text-app-text-secondary">
                          {tTasks("header.activeCount", {
                            count: data?.counts.total || 0,
                          })}
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-bg px-3 py-1.5 text-xs font-medium text-app-text-secondary">
                          {isRefetching ? (
                            <RefreshCw className="size-3.5 animate-spin" />
                          ) : (
                            <Clock3 className="size-3.5" />
                          )}
                          {isRefetching
                            ? tTasks("header.syncing")
                            : generatedAtLabel
                              ? tTasks("header.updatedAt", { value: generatedAtLabel })
                              : tTasks("header.waitingFirstSync")}
                        </div>
                      </div>
                    </div>

                    {renderSummaryCards(data, activeTab, setActiveTab, tTasks)}
                  </div>

                  {activeTab === "today" ? (
                    <WorkSection
                      meta={{
                        title: tTasks("sections.today.title"),
                        description: tTasks("sections.today.description"),
                        emptyTitle: tTasks("sections.today.emptyTitle"),
                        emptyDescription: tTasks("sections.today.emptyDescription"),
                      }}
                      items={data?.todayFocus || []}
                      onOpenIssue={handleOpenIssue}
                      onMarkStarted={handleMarkStarted}
                      onAcceptHandoff={handleAcceptHandoff}
                      isMutatingIssueId={isMutatingIssueId}
                    />
                  ) : activeSection ? (
                    <div className="grid gap-6">
                      <WorkSection
                        meta={sectionMeta[activeSection]}
                        items={sectionItems[activeSection]}
                        onOpenIssue={handleOpenIssue}
                        onMarkStarted={handleMarkStarted}
                        onAcceptHandoff={handleAcceptHandoff}
                        isMutatingIssueId={isMutatingIssueId}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
