"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  differenceInCalendarDays,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bug,
  CheckCheck,
  Clock3,
  FileText,
  Inbox as InboxIcon,
  Loader2,
  Mail,
  MailOpen,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCachedPageVisibility } from "@/components/cache/CachedPageVisibility";
import { useAcceptWorkflowHandoff } from "@/hooks/useIssueApi";
import {
  useClearInboxItems,
  useInbox,
  useMarkInboxItemDone,
  useMarkInboxItemSeen,
  useMarkInboxItemUnread,
  useSnoozeInboxItem,
} from "@/hooks/useInbox";
import { useWorkspaceRealtime } from "@/hooks/realtime/useWorkspaceRealtime";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  InboxActionDefinition,
  InboxItem,
  InboxQueryParams,
  InboxSummary,
} from "@/lib/fetchers/inbox";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/i18n/navigation";
import { buildProjectPath } from "@/components/projects/project-route-utils";
import { useDocStore } from "@/stores/doc-store";
import { openDocRoute } from "@/components/shared/docs/doc-navigation";
import {
  getInboxDigestSummary,
  resolveInboxDocContext,
} from "@/components/inbox/inbox-digest-utils";
import AmbientGlow from "../global/AmbientGlow";

const WorkflowIssueDetail = dynamic(
  () => import("@/components/issue/WorkflowIssueDetail"),
  { loading: () => null },
);
const NormalIssueDetail = dynamic(
  () => import("@/components/shared/issue/NormalIssueDetail"),
  { loading: () => null },
);

type InboxViewId = "primary" | "other" | "digest" | "later" | "cleared";

type GroupedItems = {
  label: string;
  items: InboxItem[];
};

const VIEW_ORDER: InboxViewId[] = [
  "primary",
  "other",
  "digest",
  "later",
  "cleared",
];

const GHOST_BUTTON_CLASS =
  "border border-[#e5e1ee] bg-white text-[#655f72] hover:bg-[#faf9fd] dark:border-white/10 dark:bg-[#161616] dark:text-[#b8b2c4] dark:hover:bg-[#222222] dark:hover:text-[#f2eefb]";

const ICON_BUTTON_CLASS =
  "size-8 rounded-full border border-transparent text-[#726c80] hover:border-[#e1ddec] hover:bg-[#f5f3fb] hover:text-[#413c4d] dark:text-[#a29bae] dark:hover:border-white/10 dark:hover:bg-[#242424] dark:hover:text-[#f2eefb]";

const PRIMARY_ACTION_CLASS =
  "border border-[#6a5cff] bg-[#6a5cff] text-white hover:bg-[#5d51ea] dark:border-white/12 dark:bg-[#262626] dark:text-[#f3f1f7] dark:hover:bg-[#303030] disabled:border-[#e3deef] disabled:bg-[#f3f1f9] disabled:text-[#9b96a8] dark:disabled:border-white/10 dark:disabled:bg-[#1a1a1a] dark:disabled:text-[#6f697a]";

function isInboxView(value: string | null): value is InboxViewId {
  return (
    value === "primary" ||
    value === "other" ||
    value === "digest" ||
    value === "later" ||
    value === "cleared"
  );
}

function formatRelativeTime(
  value: string,
  t: (key: string, values?: Record<string, string | number>) => string,
  locale: string,
) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / (1000 * 60)), 0);

  if (diffMinutes < 1) {
    return t("relativeTime.justNow");
  }

  if (diffMinutes < 60) {
    return t("relativeTime.minutesAgo", { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return t("relativeTime.hoursAgo", { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return t("relativeTime.daysAgo", { count: diffDays });
  }

  return new Date(value).toLocaleDateString(locale, {
    month: "2-digit",
    day: "2-digit",
  });
}

function getViewIcon(view: InboxViewId) {
  switch (view) {
    case "primary":
      return <InboxIcon className="size-4.5" />;
    case "other":
      return <Activity className="size-4.5" />;
    case "digest":
      return <FileText className="size-4.5" />;
    case "later":
      return <Clock3 className="size-4.5" />;
    case "cleared":
      return <CheckCheck className="size-4.5" />;
  }
}

function getViewLabel(
  view: InboxViewId,
  t: (key: string) => string,
) {
  switch (view) {
    case "primary":
      return t("views.primary");
    case "other":
      return t("views.other");
    case "digest":
      return t("views.digest");
    case "later":
      return t("views.later");
    case "cleared":
      return t("views.cleared");
  }
}

function getViewCount(summary: InboxSummary | undefined, view: InboxViewId) {
  if (!summary) {
    return 0;
  }

  switch (view) {
    case "primary":
      return summary.needsResponse;
    case "other":
      return summary.needsAttention + summary.following;
    case "digest":
      return summary.digest;
    case "later":
      return summary.snoozed;
    case "cleared":
      return summary.done;
  }
}

function getViewSubLabel(
  summary: InboxSummary | undefined,
  view: InboxViewId,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  const count = getViewCount(summary, view);

  if (view === "later") {
    return count
      ? t("viewSubLabel.laterCount", { count })
      : t("viewSubLabel.laterEmpty");
  }

  if (view === "digest") {
    return count
      ? t("viewSubLabel.digestCount", { count })
      : t("viewSubLabel.digestEmpty");
  }

  if (view === "cleared") {
    return count
      ? t("viewSubLabel.clearedCount", { count })
      : t("viewSubLabel.clearedEmpty");
  }

  return count
    ? t("viewSubLabel.pendingCount", { count })
    : t("viewSubLabel.pendingEmpty");
}

function hasUnreadInView(summary: InboxSummary | undefined, view: InboxViewId) {
  return (summary?.unreadByView?.[view] ?? 0) > 0;
}

function getEmptyCopy(
  activeView: InboxViewId,
  t: (key: string) => string,
) {
  if (activeView === "primary") {
    return {
      title: t("empty.primary.title"),
      description: t("empty.primary.description"),
    };
  }

  if (activeView === "other") {
    return {
      title: t("empty.other.title"),
      description: t("empty.other.description"),
    };
  }

  if (activeView === "digest") {
    return {
      title: t("empty.digest.title"),
      description: t("empty.digest.description"),
    };
  }

  if (activeView === "later") {
    return {
      title: t("empty.later.title"),
      description: t("empty.later.description"),
    };
  }

  return {
    title: t("empty.cleared.title"),
    description: t("empty.cleared.description"),
  };
}

function getSourceMeta(
  item: InboxItem,
  t: (key: string) => string,
) {
  const digestTargetLabel =
    item.type === "digest.generated" &&
    typeof item.metadata?.digestTargetLabel === "string"
      ? item.metadata.digestTargetLabel
      : null;
  const preferredLabel = digestTargetLabel || item.projectName || item.issueKey;

  if (item.sourceType === "workflow") {
    return {
      icon: <Workflow className="size-4" />,
      label: preferredLabel || t("source.workflow"),
      tone: "bg-[#ecebff] text-[#6a5cff] dark:bg-[#242424] dark:text-[#c9c4d4]",
    };
  }

  if (item.sourceType === "project") {
    return {
      icon: <ShieldAlert className="size-4" />,
      label: preferredLabel || t("source.project"),
      tone: "bg-[#fff4e8] text-[#b76d20] dark:bg-[#242424] dark:text-[#c9c4d4]",
    };
  }

  if (item.sourceType === "doc") {
    return {
      icon: <FileText className="size-4" />,
      label: preferredLabel || t("source.doc"),
      tone: "bg-[#edf8f1] text-[#1f8f57] dark:bg-[#242424] dark:text-[#c9c4d4]",
    };
  }

  return {
    icon: <Bug className="size-4" />,
    label: preferredLabel || t("source.issue"),
    tone: "bg-[#edf5ff] text-[#3b6edc] dark:bg-[#242424] dark:text-[#c9c4d4]",
  };
}

function getSectionLabel(
  value: string,
  t: (key: string) => string,
) {
  const date = new Date(value);
  const now = new Date();
  const dayDistance = differenceInCalendarDays(now, date);

  if (isToday(date)) {
    return t("groups.today");
  }

  if (dayDistance <= 7) {
    return t("groups.recentWeek");
  }

  if (isSameMonth(date, now)) {
    return t("groups.earlierThisMonth");
  }

  return format(date, "yyyy-MM");
}

function groupItemsByDate(
  items: InboxItem[],
  t: (key: string) => string,
): GroupedItems[] {
  const groups = new Map<string, InboxItem[]>();

  for (const item of items) {
    const label = getSectionLabel(item.occurredAt, t);
    const bucket = groups.get(label) || [];
    bucket.push(item);
    groups.set(label, bucket);
  }

  return Array.from(groups.entries()).map(([label, grouped]) => ({
    label,
    items: grouped,
  }));
}

function getDisplayTitle(
  item: InboxItem,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  const docTitle =
    typeof item.metadata?.docTitle === "string" ? item.metadata.docTitle : null;
  const digestDocCount =
    typeof item.metadata?.digestDocCount === "number"
      ? item.metadata.digestDocCount
      : 1;

  if (item.type === "digest.generated") {
    return t("docTitles.digestGenerated", {
      count: digestDocCount,
    });
  }

  if (!docTitle) {
    return item.title;
  }

  switch (item.type) {
    case "doc.review.ready":
      return t("docTitles.reviewReady", { title: docTitle });
    case "doc.handoff.ready":
      return t("docTitles.handoffReady", { title: docTitle });
    case "doc.release.updated":
      return t("docTitles.releaseUpdated", { title: docTitle });
    case "doc.decision.updated":
      return t("docTitles.decisionUpdated", { title: docTitle });
    default:
      return item.title;
  }
}

function getDisplaySummary(
  item: InboxItem,
  locale: string,
  tInbox: (key: string, values?: Record<string, string | number>) => string,
  tDocs: (key: string, values?: Record<string, string | number>) => string,
) {
  if (item.type !== "digest.generated") {
    return null;
  }

  return getInboxDigestSummary(item, locale, tInbox, tDocs);
}

function filterItemsForView(items: InboxItem[], activeView: InboxViewId) {
  if (activeView === "other") {
    return items.filter(
      (item) =>
        item.bucket === "needs-attention" || item.bucket === "following",
    );
  }

  if (activeView === "digest") {
    return items.filter((item) => item.bucket === "digest");
  }

  return items;
}

function hasAction(
  item: InboxItem,
  key: InboxActionDefinition["key"],
) {
  return item.availableActions.some((action) => action.key === key);
}

function ViewTabs({
  activeView,
  summary,
  onChange,
}: {
  activeView: InboxViewId;
  summary?: InboxSummary;
  onChange: (view: InboxViewId) => void;
}) {
  const tInbox = useTranslations("inbox");
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#e8e7ef] bg-app-content-bg dark:border-white/10">
      <div className="grid min-w-0 grid-cols-2 md:grid-cols-5">
        {VIEW_ORDER.map((view) => {
          const active = activeView === view;
          const hasUnread = hasUnreadInView(summary, view);

          return (
            <button
              key={view}
              type="button"
              onClick={() => onChange(view)}
              className={cn(
                "relative border-b-2 px-5 py-5 text-left transition",
                active
                  ? "border-b-[#2f2d3a] bg-app-content-bg dark:border-b-[#f0ebfa]"
                  : "border-b-transparent bg-app-content-bg hover:bg-app-button-hover/60 dark:hover:bg-app-button-hover",
                view !== "cleared"
                  ? "md:border-r md:border-r-[#efedf5] dark:md:border-r-white/8"
                  : "",
              )}
            >
              <div className="flex items-center gap-3 text-[#3a3646] dark:text-[#efebf7]">
                {getViewIcon(view)}
                <span className="text-[1rem] font-semibold">
                  {getViewLabel(view, tInbox)}
                </span>
              </div>
              <div className="mt-1 text-sm text-[#7b768b] dark:text-[#9f99ae]">
                {getViewSubLabel(summary, view, tInbox)}
              </div>
              {hasUnread ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-4 right-4 size-2.5 rounded-full border-2 border-app-content-bg bg-[#ff4d6d] dark:border-[#121212]"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
        active
          ? "border-[#d8d3ff] bg-[#f1efff] text-[#5a4fff] dark:border-white/12 dark:bg-[#262626] dark:text-[#f3f1f7]"
          : "border-[#e7e4ef] bg-app-content-bg text-[#656071] hover:border-[#d7d3e4] hover:bg-app-button-hover/60 dark:border-white/10 dark:text-[#b4aec1] dark:hover:border-white/15 dark:hover:bg-app-button-hover dark:hover:text-[#f2eefb]",
      )}
    >
      <SlidersHorizontal className="size-4" />
      {label}
    </button>
  );
}

function EmptyState({ activeView }: { activeView: InboxViewId }) {
  const tInbox = useTranslations("inbox");
  const copy = getEmptyCopy(activeView, tInbox);

  return (
    <div className="rounded-[18px] border border-dashed border-[#dfdce7] bg-app-content-bg px-6 py-14 text-center dark:border-white/10">
      <div className="text-base font-semibold text-[#302d39] dark:text-[#f0ebfa]">
        {copy.title}
      </div>
      <div className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#787283] dark:text-[#9d97ab]">
        {copy.description}
      </div>
    </div>
  );
}

function InboxRow({
  item,
  isMutating,
  showReadToggle,
  onOpen,
  onToggleRead,
  onSnooze,
  onClear,
  onAccept,
}: {
  item: InboxItem;
  isMutating: boolean;
  showReadToggle: boolean;
  onOpen: (item: InboxItem) => Promise<void> | void;
  onToggleRead: (item: InboxItem) => Promise<void> | void;
  onSnooze: (item: InboxItem) => Promise<void> | void;
  onClear: (item: InboxItem) => Promise<void> | void;
  onAccept: (item: InboxItem) => Promise<void> | void;
}) {
  const tInbox = useTranslations("inbox");
  const tDocs = useTranslations("docs");
  const locale = useLocale();
  const sourceMeta = getSourceMeta(item, tInbox);
  const displayTitle = getDisplayTitle(item, tInbox);
  const displaySummary = getDisplaySummary(item, locale, tInbox, tDocs);
  const isUnread = item.status === "unread";
  const canAccept = hasAction(item, "accept_handoff");
  const shouldRaiseRow = isUnread;

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    void onOpen(item);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleRowKeyDown}
      onClick={() => void onOpen(item)}
      aria-label={tInbox("row.openAria", { title: displayTitle })}
      className="group block w-full px-1 py-1 text-left focus:outline-none"
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "140px",
      }}
    >
      <div
        className={cn(
          "grid cursor-pointer gap-4 rounded-sm border px-4 py-3 transition-all duration-200 md:grid-cols-[240px_minmax(0,1fr)_auto]",
          shouldRaiseRow
            ? "border-[#e7e1ef] bg-app-content-bg shadow-[0_14px_34px_rgba(29,25,38,0.06)] dark:border-white/10 dark:!bg-[#171717] dark:shadow-[0_20px_42px_rgba(0,0,0,0.32)]"
            : "border-transparent bg-transparent shadow-none",
          "group-hover:border-[#e8e3f0] group-hover:bg-app-content-bg group-hover:shadow-[0_12px_30px_rgba(29,25,38,0.05)] dark:group-hover:border-white/8 dark:group-hover:!bg-[#171717] dark:group-hover:shadow-[0_18px_38px_rgba(0,0,0,0.28)]",
          "group-focus-visible:border-[#e3deeb] group-focus-visible:bg-app-content-bg group-focus-visible:shadow-[0_12px_30px_rgba(29,25,38,0.05)] dark:group-focus-visible:border-white/10 dark:group-focus-visible:!bg-[#171717] dark:group-focus-visible:shadow-[0_18px_38px_rgba(0,0,0,0.28)]",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-[12px]",
              sourceMeta.tone,
            )}
          >
            {sourceMeta.icon}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[0.95rem] font-medium text-[#322f3b] dark:text-[#f2eefb]">
              {sourceMeta.label}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-[#8a8595] dark:text-[#9c96aa]">
                  {item.issueKey ? <span>{item.issueKey}</span> : null}
                  <span>{format(new Date(item.occurredAt), "MM-dd")}</span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center">
          <div className="min-w-0">
            <div
              className={cn(
                "line-clamp-1 text-[1rem]",
                isUnread
                  ? "font-semibold text-[#2f2b39] dark:text-[#f7f3ff]"
                  : "font-medium text-[#403b4c] dark:text-[#ddd7e8]",
              )}
            >
              {displayTitle}
            </div>
            {displaySummary ? (
              <div className="mt-1 line-clamp-2 text-sm leading-6 text-[#8a8595] dark:text-[#9c96aa]">
                {displaySummary}
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="flex items-start justify-between gap-3 md:min-w-[220px] md:justify-end"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="pt-[3px]">
              <Button
                type="button"
                className="text-sm text-[#8a8595] dark:text-[#9c96aa] bg-transparent px-1 hover:bg-transparent"
              >
                {formatRelativeTime(item.occurredAt, tInbox, locale)}
              </Button>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {showReadToggle ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isMutating}
                className={ICON_BUTTON_CLASS}
                onClick={() => void onToggleRead(item)}
                title={isUnread ? tInbox("row.markSeen") : tInbox("row.markUnread")}
              >
                {isUnread ? (
                  <MailOpen className="size-4" />
                ) : (
                  <Mail className="size-4" />
                )}
              </Button>
            ) : null}

            {canAccept ? (
              <Button
                type="button"
                variant="ghost"
                disabled={isMutating}
                className="h-8 rounded-full border border-[#d8d3ff] bg-[#f1efff] px-3 text-sm text-[#5a4fff] hover:bg-[#e9e6ff] dark:border-white/12 dark:bg-[#262626] dark:text-[#f3f1f7] dark:hover:bg-[#303030]"
                onClick={() => void onAccept(item)}
              >
                <ArrowUpRight className="size-4" />
                {tInbox("row.accept")}
              </Button>
            ) : null}

            {item.status !== "done" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isMutating}
                className={ICON_BUTTON_CLASS}
                onClick={() => void onSnooze(item)}
                title={tInbox("row.snooze")}
              >
                <Clock3 className="size-4" />
              </Button>
            ) : null}

            <Button
              type="button"
              disabled={isMutating}
              className={cn(
                "h-10 rounded-[12px] px-4 text-sm shadow-none",
                item.status === "done"
                  ? "border border-[#e6e2ef] bg-app-content-bg text-[#736d81] hover:bg-app-button-hover/55 dark:border-white/10 dark:text-[#9f99ad] dark:hover:bg-app-button-hover/75"
                  : PRIMARY_ACTION_CLASS,
              )}
              onClick={() => void onClear(item)}
            >
              {isMutating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              {item.status === "done" ? tInbox("row.cleared") : tInbox("row.clear")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InboxPageContent() {
  const tInbox = useTranslations("inbox");
  const searchParams = useSearchParams();
  const isPageVisible = useCachedPageVisibility();
  const [activeView, setActiveView] = useState<InboxViewId>(() => {
    const requestedView = searchParams.get("view");
    return isInboxView(requestedView) ? requestedView : "primary";
  });
  const [onlyActionable, setOnlyActionable] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedIssueIsWorkflow, setSelectedIssueIsWorkflow] = useState(false);
  const [mutatingItemId, setMutatingItemId] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspace();
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);
  const workspaceId = currentWorkspace?.id || "";
  const pathname = usePathname();
  const router = useRouter();
  const supportsUnreadFilter =
    activeView === "primary" ||
    activeView === "other" ||
    activeView === "digest";
  const supportsActionableFilter =
    activeView === "primary" || activeView === "other";

  const inboxParams = useMemo<InboxQueryParams>(() => {
    const params: InboxQueryParams = {
      limit: 100,
    };

    if (activeView === "primary") {
      params.bucket = "needs-response";
    }

    if (activeView === "digest") {
      params.bucket = "digest";
    }

    if (activeView === "later") {
      params.status = "snoozed";
    }

    if (activeView === "cleared") {
      params.status = "done";
    }

    if (supportsActionableFilter && onlyActionable) {
      params.requiresAction = true;
    }

    if (supportsUnreadFilter && unreadOnly) {
      params.status = "unread";
    }

    return params;
  }, [
    activeView,
    onlyActionable,
    supportsActionableFilter,
    supportsUnreadFilter,
    unreadOnly,
  ]);

  const {
    data: feed,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useInbox(workspaceId, inboxParams, { enabled: isPageVisible });
  const markSeen = useMarkInboxItemSeen();
  const markUnread = useMarkInboxItemUnread();
  const markDone = useMarkInboxItemDone();
  const clearItems = useClearInboxItems();
  const snoozeItem = useSnoozeInboxItem();
  const acceptWorkflowHandoff = useAcceptWorkflowHandoff();

  useWorkspaceRealtime(workspaceId, {
    enabled: isPageVisible && !selectedIssueId,
    userEnabled: isPageVisible,
  });

  useEffect(() => {
    const requestedView = searchParams.get("view");

    if (!isInboxView(requestedView) || requestedView === activeView) {
      return;
    }

    setActiveView(requestedView);
  }, [activeView, searchParams]);

  const handleViewChange = useCallback(
    (nextView: InboxViewId) => {
      setActiveView(nextView);

      const params = new URLSearchParams(searchParams.toString());
      if (nextView === "primary") {
        params.delete("view");
      } else {
        params.set("view", nextView);
      }

      const nextHref = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextHref);
    },
    [pathname, router, searchParams],
  );

  const rawItems = useMemo(() => feed?.items ?? [], [feed?.items]);
  const visibleItems = useMemo(
    () => filterItemsForView(rawItems, activeView),
    [activeView, rawItems],
  );
  const groupedItems = useMemo(
    () => groupItemsByDate(visibleItems, tInbox),
    [visibleItems, tInbox],
  );
  const summary = feed?.summary;
  const canClearAll =
    activeView !== "cleared" && visibleItems.some((item) => item.status !== "done");

  const handleRefresh = async () => {
    await refetch();
  };

  const handleOpenItem = async (item: InboxItem) => {
    try {
      if (item.status === "unread") {
        await markSeen.mutateAsync({
          workspaceId,
          itemId: item.id,
        });
      }

      if (item.docId) {
        openDocRoute({
          workspaceId,
          workspaceType: currentWorkspace?.type || "PERSONAL",
          context: resolveInboxDocContext(
            item,
            currentWorkspace?.type || "PERSONAL",
          ),
          docId: item.docId,
          projectId: item.projectId,
          router,
          setActiveDocId,
        });
        return;
      }

      if (item.issueId) {
        setSelectedIssueId(item.issueId);
        setSelectedIssueIsWorkflow(item.sourceType === "workflow");
        return;
      }

      if (item.projectId) {
        router.push(buildProjectPath(item.projectId));
      }
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : tInbox("toasts.openFailed"),
      );
    }
  };

  const handleToggleRead = async (item: InboxItem) => {
    try {
      setMutatingItemId(item.id);

      if (item.status === "unread") {
        await markSeen.mutateAsync({
          workspaceId,
          itemId: item.id,
        });
        toast.success(tInbox("toasts.markedSeen"));
        return;
      }

      await markUnread.mutateAsync({
        workspaceId,
        itemId: item.id,
      });
      toast.success(tInbox("toasts.markedUnread"));
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : tInbox("toasts.updateReadFailed"),
      );
    } finally {
      setMutatingItemId(null);
    }
  };

  const handleSnooze = async (item: InboxItem) => {
    try {
      setMutatingItemId(item.id);
      const tomorrow = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();

      await snoozeItem.mutateAsync({
        workspaceId,
        itemId: item.id,
        until: tomorrow,
      });
      toast.success(tInbox("toasts.snoozed"));
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : tInbox("toasts.snoozeFailed"),
      );
    } finally {
      setMutatingItemId(null);
    }
  };

  const handleClear = async (item: InboxItem) => {
    if (item.status === "done") {
      return;
    }

    try {
      setMutatingItemId(item.id);
      await markDone.mutateAsync({
        workspaceId,
        itemId: item.id,
      });
      toast.success(tInbox("toasts.cleared"));
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : tInbox("toasts.clearFailed"),
      );
    } finally {
      setMutatingItemId(null);
    }
  };

  const handleAccept = async (item: InboxItem) => {
    if (!item.issueId) {
      return;
    }

    try {
      setMutatingItemId(item.id);
      await acceptWorkflowHandoff.mutateAsync({
        workspaceId,
        issueId: item.issueId,
        data: {},
      });
      toast.success(tInbox("toasts.handoffAccepted"));
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : tInbox("toasts.acceptFailed"),
      );
    } finally {
      setMutatingItemId(null);
    }
  };

  const handleClearAll = async () => {
    const ids = visibleItems
      .filter((item) => item.status !== "done")
      .map((item) => item.id);

    if (ids.length === 0) {
      return;
    }

    try {
      await clearItems.mutateAsync({
        workspaceId,
        itemIds: ids,
      });
      toast.success(tInbox("toasts.clearedView"));
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : tInbox("toasts.clearAllFailed"),
      );
    }
  };

  const handleCloseDetail = () => {
    setSelectedIssueId(null);
    setSelectedIssueIsWorkflow(false);
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
    <div className="flex h-full flex-col bg-[#f7f7fb] text-[#2f2d3a] dark:bg-[#111111] dark:text-[#ece9f4]">
      <div className="flex-1 overflow-y-auto">
        <AmbientGlow />
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-6 py-6">
          <ViewTabs
            activeView={activeView}
            summary={summary}
            onChange={handleViewChange}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#e9e6f0] isolate bg-app-content-bg/80 px-4 py-3 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              {supportsUnreadFilter || supportsActionableFilter ? (
                <>
                  {supportsUnreadFilter ? (
                    <FilterButton
                      label={tInbox("filters.unread")}
                      active={unreadOnly}
                      onClick={() => setUnreadOnly((value) => !value)}
                    />
                  ) : null}
                  {supportsActionableFilter ? (
                    <FilterButton
                      label={tInbox("filters.actionable")}
                      active={onlyActionable}
                      onClick={() => setOnlyActionable((value) => !value)}
                    />
                  ) : null}
                  {(onlyActionable || unreadOnly) && (
                    <FilterButton
                      label={tInbox("filters.clear")}
                      active={false}
                      onClick={() => {
                        setOnlyActionable(false);
                        setUnreadOnly(false);
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="text-sm text-[#777182] dark:text-[#9791a5]">
                  {tInbox("filters.archivedHint")}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn("h-10 rounded-[12px] px-3", GHOST_BUTTON_CLASS)}
                onClick={() => void handleRefresh()}
              >
                {isRefetching ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {tInbox("actions.refresh")}
              </Button>
              <Button
                type="button"
                disabled={!canClearAll || clearItems.isPending}
                className={cn(
                  "h-10 rounded-[12px] px-4 text-white shadow-none disabled:shadow-none",
                  PRIMARY_ACTION_CLASS,
                )}
                onClick={() => void handleClearAll()}
              >
                {clearItems.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCheck className="size-4" />
                )}
                {tInbox("actions.clearView")}
              </Button>
            </div>
          </div>

          <div className="px-1 text-sm text-[#777182] dark:text-[#9791a5]">
            {tInbox("hint")}
          </div>

          {isLoading ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-[18px] border border-[#e8e5ef] bg-app-content-bg dark:border-white/10">
              <Loader2 className="size-5 animate-spin text-[#8b8596] dark:text-[#9b95aa]" />
              <div className="text-sm text-[#7f798b] dark:text-[#9d97ab]">
                {tInbox("states.loading")}
              </div>
            </div>
          ) : error ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[18px] border border-[#f0d7dc] bg-app-content-bg px-6 text-center dark:border-red-500/20">
              <AlertTriangle className="size-5 text-[#cb5969] dark:text-red-400" />
              <div>
                <div className="text-sm font-semibold text-[#302d39] dark:text-[#f0ebfa]">
                  {tInbox("states.errorTitle")}
                </div>
                <div className="mt-2 text-sm text-[#7f798b] dark:text-[#9d97ab]">
                  {error instanceof Error ? error.message : tInbox("states.errorDescription")}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                className={cn("h-10 rounded-[12px] px-3", GHOST_BUTTON_CLASS)}
                onClick={() => void handleRefresh()}
              >
                <RefreshCw className="size-4" />
                {tInbox("actions.retry")}
              </Button>
            </div>
          ) : groupedItems.length ? (
            <div className="flex flex-col gap-6 isolate bg-app-content-bg/80 rounded-2xl p-4">
              {groupedItems.map((group) => (
                <section key={group.label}>
                  <div className="mb-3 px-1 text-[1.05rem] font-semibold text-[#767083] dark:text-[#a19aae]">
                    {group.label}
                  </div>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <InboxRow
                        key={item.id}
                        item={item}
                        isMutating={mutatingItemId === item.id}
                        showReadToggle={supportsUnreadFilter}
                        onOpen={handleOpenItem}
                        onToggleRead={handleToggleRead}
                        onSnooze={handleSnooze}
                        onClear={handleClear}
                        onAccept={handleAccept}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState activeView={activeView} />
          )}
        </div>
      </div>
    </div>
  );
}
