"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiAddLine,
  RiSearchLine,
  RiFilter3Line,
  RiFlowChart,
  RiEdit2Line,
} from "react-icons/ri";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCachedPageVisibility } from "@/components/cache/CachedPageVisibility";
import CreateIssueModal from "@/components/shared/issue/CreateIssueModal";
import IssueDetailPageSurface from "@/components/issue/IssueDetailPageSurface";
import {
  IssueViewModeToggle,
  type IssueViewMode,
} from "@/components/issue/IssueViewModeToggle";
import { ProjectIssuesKanbanBoard } from "@/components/projects/ProjectIssuesKanbanBoard";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { Issue, isWorkflowIssue } from "@/lib/fetchers/issue";
import { useIssues, useCancelIssue, useUpdateIssue } from "@/hooks/useIssueApi";
import { useIssueStates } from "@/hooks/useIssueStates";
import { useProjects } from "@/hooks/useProjectApi";
import { useTeamMemberByUserId, useTeamMembers } from "@/hooks/useTeam";
import { useWorkspaceRealtime } from "@/hooks/realtime/useWorkspaceRealtime";
import { useWorkspace } from "@/hooks/useWorkspace";
import { usePathname, useRouter } from "@/i18n/navigation";
import { priorityConfig, statusConfig } from "@/lib/data/issueConfig";
import {
  buildIssueStateSummary,
  getIssueCategory,
  ISSUE_STATE_CATEGORY_LABELS,
  isActiveIssue,
  isClosedIssue,
  normalizeIssueStateCategoryOrder,
  persistIssueBoardCategoryOrderToStorage,
  readIssueBoardCategoryOrderFromStorage,
  resolveIssueStateForCategory,
  sortIssuesByUrgency,
} from "@/lib/issue-board";
import { IssuePriority, IssueStateCategory, IssueType } from "@/types/prisma";

type IssueListView = "all" | "my";
type FilterValue = "__all__";
type ProjectFilterValue = FilterValue | "__unassigned__" | string;
type IssueTypeFilterValue = FilterValue | IssueType;
type IssuePriorityFilterValue = FilterValue | IssuePriority;
type IssueStateCategoryFilterValue = FilterValue | IssueStateCategory;
type OptimisticIssueState = Pick<Issue, "state" | "stateId">;

const ALL_FILTER_VALUE: FilterValue = "__all__";
const UNASSIGNED_PROJECT_VALUE = "__unassigned__";

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  [IssueType.NORMAL]: "Standard",
  [IssueType.WORKFLOW]: "Workflow",
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  [IssuePriority.LOW]: "Low",
  [IssuePriority.NORMAL]: "Normal",
  [IssuePriority.HIGH]: "High",
  [IssuePriority.URGENT]: "Urgent",
};

const STATE_CATEGORY_ORDER = [
  IssueStateCategory.BACKLOG,
  IssueStateCategory.TODO,
  IssueStateCategory.IN_PROGRESS,
  IssueStateCategory.DONE,
  IssueStateCategory.CANCELED,
] as const;

function isSameCategoryOrder(
  left: IssueStateCategory[],
  right: IssueStateCategory[],
) {
  return (
    left.length === right.length &&
    left.every((category, index) => category === right[index])
  );
}

function getAssigneeName(issue: Issue) {
  const directAssignee = issue.assignees?.find(
    (assignee) => assignee.memberId === issue.directAssigneeId,
  );
  const firstAssignee = directAssignee || issue.assignees?.[0];
  const user = firstAssignee?.member?.user;

  return user?.name?.trim() || user?.email?.split("@")[0] || "Unassigned";
}

function issueBelongsToUser(
  issue: Issue,
  currentMemberId?: string,
  currentUserId?: string,
) {
  if (!currentMemberId && !currentUserId) {
    return false;
  }

  if (currentMemberId) {
    if (
      issue.directAssigneeId === currentMemberId ||
      issue.creatorMemberId === currentMemberId ||
      issue.assignees?.some((assignee) => assignee.memberId === currentMemberId)
    ) {
      return true;
    }
  }

  return Boolean(
    currentUserId &&
      (issue.creatorId === currentUserId ||
        issue.assignees?.some(
          (assignee) => assignee.member?.user?.id === currentUserId,
        )),
  );
}

function getIssueSearchText(issue: Issue, projectName: string) {
  return [
    issue.title,
    issue.description,
    issue.key,
    issue.id,
    projectName,
    issue.state?.name,
    getAssigneeName(issue),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getIssueIdFromPathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const issuesSegmentIndex = segments.indexOf("issues");

  if (issuesSegmentIndex === -1) {
    return "";
  }

  return decodeURIComponent(segments[issuesSegmentIndex + 1] || "");
}

export default function IssuesPageContent() {
  const t = useTranslations("issues");
  const isPageVisible = useCachedPageVisibility();
  const pathname = usePathname();
  const router = useRouter();
  const routedIssueId = getIssueIdFromPathname(pathname);
  const [selectedView, setSelectedView] = useState<IssueListView>("all");
  const [issuesViewMode, setIssuesViewMode] = useState<IssueViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] =
    useState<ProjectFilterValue>(ALL_FILTER_VALUE);
  const [selectedStateCategory, setSelectedStateCategory] =
    useState<IssueStateCategoryFilterValue>(ALL_FILTER_VALUE);
  const [selectedPriority, setSelectedPriority] =
    useState<IssuePriorityFilterValue>(ALL_FILTER_VALUE);
  const [selectedIssueType, setSelectedIssueType] =
    useState<IssueTypeFilterValue>(ALL_FILTER_VALUE);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingCancelIssue, setPendingCancelIssue] = useState<Issue | null>(
    null,
  );

  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const [issueBoardCategoryOrder, setIssueBoardCategoryOrder] = useState<
    IssueStateCategory[]
  >(() => readIssueBoardCategoryOrderFromStorage(workspaceId));
  const [savedIssueBoardCategoryOrder, setSavedIssueBoardCategoryOrder] =
    useState<IssueStateCategory[]>(() =>
      readIssueBoardCategoryOrderFromStorage(workspaceId),
    );
  const [optimisticIssueStates, setOptimisticIssueStates] = useState<
    Record<string, OptimisticIssueState>
  >({});
  const [pendingIssueIds, setPendingIssueIds] = useState<Set<string>>(new Set());
  const { data: currentUserTeamMember } = useTeamMemberByUserId(user?.id);
  const { data: teamMembers = [] } = useTeamMembers(currentWorkspace?.teamId, {
    enabled: isPageVisible,
  });
  const { data: issues = [], isLoading: isLoadingIssues } =
    useIssues(workspaceId, {}, { enabled: isPageVisible });
  const { data: projects = [] } = useProjects(workspaceId, {
    enabled: isPageVisible,
  });
  const { data: issueStates = [] } = useIssueStates(workspaceId, {
    enabled: !!workspaceId && isPageVisible,
  });
  const queryClient = useQueryClient();
  const cancelIssueMutation = useCancelIssue();
  const updateIssueMutation = useUpdateIssue();
  const currentWorkspaceMember =
    teamMembers.find(
      (member) => member.user?.id === user?.id || member.userId === user?.id,
    ) || null;
  const currentActorMemberId =
    currentWorkspaceMember?.id || currentUserTeamMember?.id;

  useWorkspaceRealtime(workspaceId, {
    enabled: isPageVisible && !routedIssueId,
  });

  useEffect(() => {
    const storedOrder = readIssueBoardCategoryOrderFromStorage(workspaceId);

    setIssueBoardCategoryOrder(storedOrder);
    setSavedIssueBoardCategoryOrder(storedOrder);
    setOptimisticIssueStates({});
    setPendingIssueIds(new Set());
    setPendingCancelIssue(null);
  }, [workspaceId]);

  useEffect(() => {
    setOptimisticIssueStates((current) => {
      let hasChanged = false;
      const nextState = { ...current };

      for (const issue of issues) {
        const optimisticState = current[issue.id];

        if (!optimisticState) {
          continue;
        }

        if (issue.stateId === optimisticState.stateId) {
          delete nextState[issue.id];
          hasChanged = true;
        }
      }

      return hasChanged ? nextState : current;
    });
  }, [issues]);

  const projectNameById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );
  const issueStateCategoryOptions = useMemo(() => {
    const availableCategories = new Set(
      issueStates
        .map((state) => state.category)
        .filter((category): category is IssueStateCategory => Boolean(category)),
    );

    return STATE_CATEGORY_ORDER.filter((category) =>
      availableCategories.has(category),
    );
  }, [issueStates]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedProjectId !== ALL_FILTER_VALUE ||
    selectedStateCategory !== ALL_FILTER_VALUE ||
    selectedPriority !== ALL_FILTER_VALUE ||
    selectedIssueType !== ALL_FILTER_VALUE;
  const hasUnsavedIssueBoardCategoryOrder = !isSameCategoryOrder(
    savedIssueBoardCategoryOrder,
    issueBoardCategoryOrder,
  );

  const issuesWithOptimisticState = useMemo(
    () =>
      issues.map((issue) => {
        const optimisticState = optimisticIssueStates[issue.id];

        if (!optimisticState) {
          return issue;
        }

        return {
          ...issue,
          stateId: optimisticState.stateId,
          state: optimisticState.state,
        };
      }),
    [issues, optimisticIssueStates],
  );

  const activeIssueCount = useMemo(
    () => issuesWithOptimisticState.filter(isActiveIssue).length,
    [issuesWithOptimisticState],
  );
  const myIssueCount = useMemo(
    () =>
      issuesWithOptimisticState.filter(
        (issue) =>
          isActiveIssue(issue) &&
          issueBelongsToUser(issue, currentActorMemberId, user?.id),
      ).length,
    [currentActorMemberId, issuesWithOptimisticState, user?.id],
  );

  const baseFilteredIssues = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortIssuesByUrgency(
      issuesWithOptimisticState.filter((issue) => {
        const projectName =
          issue.project?.name ||
          (issue.projectId ? projectNameById.get(issue.projectId) : "") ||
          "";

        if (
          selectedView === "my" &&
          !issueBelongsToUser(issue, currentActorMemberId, user?.id)
        ) {
          return false;
        }

        if (normalizedQuery) {
          const searchText = getIssueSearchText(issue, projectName);
          if (!searchText.includes(normalizedQuery)) {
            return false;
          }
        }

        if (
          selectedProjectId === UNASSIGNED_PROJECT_VALUE &&
          Boolean(issue.projectId)
        ) {
          return false;
        }

        if (
          selectedProjectId !== ALL_FILTER_VALUE &&
          selectedProjectId !== UNASSIGNED_PROJECT_VALUE &&
          issue.projectId !== selectedProjectId
        ) {
          return false;
        }

        if (
          selectedStateCategory !== ALL_FILTER_VALUE &&
          getIssueCategory(issue) !== selectedStateCategory
        ) {
          return false;
        }

        if (
          selectedPriority !== ALL_FILTER_VALUE &&
          issue.priority !== selectedPriority
        ) {
          return false;
        }

        if (selectedIssueType !== ALL_FILTER_VALUE) {
          const issueType = isWorkflowIssue(issue)
            ? IssueType.WORKFLOW
            : IssueType.NORMAL;

          if (issueType !== selectedIssueType) {
            return false;
          }
        }

        return true;
      }),
    );
  }, [
    currentActorMemberId,
    issuesWithOptimisticState,
    projectNameById,
    searchQuery,
    selectedIssueType,
    selectedPriority,
    selectedProjectId,
    selectedStateCategory,
    selectedView,
    user?.id,
  ]);
  const shouldListHideClosedIssues =
    issuesViewMode === "list" &&
    selectedStateCategory === ALL_FILTER_VALUE;
  const filteredIssues = useMemo(
    () =>
      shouldListHideClosedIssues
        ? baseFilteredIssues.filter(isActiveIssue)
        : baseFilteredIssues,
    [baseFilteredIssues, shouldListHideClosedIssues],
  );
  const activeFilteredIssueCount =
    baseFilteredIssues.filter(isActiveIssue).length;
  const closedFilteredIssueCount =
    baseFilteredIssues.filter(isClosedIssue).length;
  const selectedStateCategoryLabel =
    selectedStateCategory === ALL_FILTER_VALUE
      ? null
      : ISSUE_STATE_CATEGORY_LABELS[selectedStateCategory];
  const issueSummaryText = selectedStateCategoryLabel
    ? t("page.summary.withState", {
        count: filteredIssues.length,
        state: selectedStateCategoryLabel,
      })
    : shouldListHideClosedIssues
      ? t("page.summary.activeOnly", { count: activeFilteredIssueCount })
      : t("page.summary.mixed", {
          total: filteredIssues.length,
          active: activeFilteredIssueCount,
        });

  const handleCreateIssue = () => {
    queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
  };

  const handleViewIssue = (issue: Issue) => {
    router.push(`/issues/${encodeURIComponent(issue.id)}`);
  };

  const handleUpdateIssue = () => {
    queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
  };

  const handleIssueBoardCategoryOrderChange = (
    nextOrder: IssueStateCategory[],
  ) => {
    const normalizedOrder = normalizeIssueStateCategoryOrder(nextOrder);

    if (isSameCategoryOrder(issueBoardCategoryOrder, normalizedOrder)) {
      return;
    }

    setIssueBoardCategoryOrder(normalizedOrder);
  };

  const handleSaveIssueBoardCategoryOrder = () => {
    if (!workspaceId) {
      toast.error(t("toasts.boardOrderMissingWorkspace"));
      return;
    }

    const normalizedOrder = normalizeIssueStateCategoryOrder(
      issueBoardCategoryOrder,
    );

    if (isSameCategoryOrder(savedIssueBoardCategoryOrder, normalizedOrder)) {
      toast.message(t("toasts.boardOrderUnchanged"));
      return;
    }

    const didPersist = persistIssueBoardCategoryOrderToStorage(
      workspaceId,
      normalizedOrder,
    );

    if (!didPersist) {
      toast.error(t("toasts.boardOrderSaveFailed"));
      return;
    }

    const persistedOrder = readIssueBoardCategoryOrderFromStorage(workspaceId);

    setIssueBoardCategoryOrder(persistedOrder);
    setSavedIssueBoardCategoryOrder(persistedOrder);
    toast.success(t("toasts.boardOrderSaved"));
  };

  const handleMoveIssueToCategory = (
    issue: Issue,
    nextCategory: IssueStateCategory,
  ) => {
    if (!workspaceId || pendingIssueIds.has(issue.id)) {
      return;
    }

    const targetState = resolveIssueStateForCategory(issueStates, nextCategory);

    if (!targetState || issue.stateId === targetState.id) {
      return;
    }

    setOptimisticIssueStates((current) => ({
      ...current,
      [issue.id]: {
        stateId: targetState.id,
        state: buildIssueStateSummary(targetState),
      },
    }));
    setPendingIssueIds((current) => {
      const nextState = new Set(current);
      nextState.add(issue.id);
      return nextState;
    });

    updateIssueMutation.mutate(
      {
        workspaceId,
        issueId: issue.id,
        data: {
          stateId: targetState.id,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
          setPendingIssueIds((current) => {
            const nextState = new Set(current);
            nextState.delete(issue.id);
            return nextState;
          });
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("toasts.updateFailed"),
          );
          setOptimisticIssueStates((current) => {
            const nextState = { ...current };
            delete nextState[issue.id];
            return nextState;
          });
          setPendingIssueIds((current) => {
            const nextState = new Set(current);
            nextState.delete(issue.id);
            return nextState;
          });
        },
      },
    );
  };

  const canCancelIssue = (issue: Issue) => {
    const creatorMemberId = issue.creatorMemberId || issue.creatorId;

    if (!creatorMemberId || !currentActorMemberId) {
      return true;
    }

    return creatorMemberId === currentActorMemberId;
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedProjectId(ALL_FILTER_VALUE);
    setSelectedStateCategory(ALL_FILTER_VALUE);
    setSelectedPriority(ALL_FILTER_VALUE);
    setSelectedIssueType(ALL_FILTER_VALUE);
  };

  const handleCancelIssue = () => {
    if (!workspaceId || !pendingCancelIssue) {
      return;
    }

    if (pendingIssueIds.has(pendingCancelIssue.id)) {
      return;
    }

    const issue = pendingCancelIssue;
    if (!canCancelIssue(issue)) {
      toast.error(t("page.onlyCreatorCanCancel"));
      setPendingCancelIssue(null);
      return;
    }

    const targetState = resolveIssueStateForCategory(
      issueStates,
      IssueStateCategory.CANCELED,
    );

    if (targetState) {
      setOptimisticIssueStates((current) => ({
        ...current,
        [issue.id]: {
          stateId: targetState.id,
          state: buildIssueStateSummary(targetState),
        },
      }));
    }

    setPendingIssueIds((current) => {
      const nextState = new Set(current);
      nextState.add(issue.id);
      return nextState;
    });

    cancelIssueMutation.mutate(
      { workspaceId, issueId: issue.id },
      {
        onSuccess: () => {
          toast.success(t("page.cancelled"));
          setPendingCancelIssue(null);
          setPendingIssueIds((current) => {
            const nextState = new Set(current);
            nextState.delete(issue.id);
            return nextState;
          });
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("page.cancelFailed"),
          );
          setOptimisticIssueStates((current) => {
            const nextState = { ...current };
            delete nextState[issue.id];
            return nextState;
          });
          setPendingIssueIds((current) => {
            const nextState = new Set(current);
            nextState.delete(issue.id);
            return nextState;
          });
        },
      },
    );
  };

  if (routedIssueId) {
    return (
      <div className="h-full w-full bg-transparent">
        <IssueDetailPageSurface
          issueId={routedIssueId}
          workspaceId={workspaceId}
          onClose={() => router.push("/issues")}
          onUpdate={handleUpdateIssue}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-app-bg">
      <div className="border-b border-app-border px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-lg font-semibold text-app-text-primary">
              Issues
            </h1>
            <div className="flex items-center gap-1 rounded-lg bg-app-button-hover p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`rounded-md px-3 py-1 text-sm transition-colors ${
                  selectedView === "all"
                    ? "bg-app-content-bg text-app-text-primary shadow-sm"
                    : "text-app-text-secondary hover:text-app-text-primary"
                }`}
                onClick={() => setSelectedView("all")}
              >
                {t("page.tabs.all", {
                  count: activeIssueCount ? `(${activeIssueCount})` : "",
                })}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`rounded-md px-3 py-1 text-sm transition-colors ${
                  selectedView === "my"
                    ? "bg-app-content-bg text-app-text-primary shadow-sm"
                    : "text-app-text-secondary hover:text-app-text-primary"
                }`}
                onClick={() => setSelectedView("my")}
              >
                {t("page.tabs.my", {
                  count: myIssueCount ? `(${myIssueCount})` : "",
                })}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <IssueViewModeToggle
              value={issuesViewMode}
              onValueChange={setIssuesViewMode}
            />
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700"
            >
              <RiAddLine className="h-4 w-4" />
              {t("page.actions.create")}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-b border-app-border px-6 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <RiSearchLine className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
              <Input
                type="text"
                placeholder={t("page.filters.searchPlaceholder")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 w-full rounded-lg border-app-border bg-app-content-bg pl-8 pr-3 text-sm text-app-text-primary placeholder-app-text-muted"
              />
            </div>

            <Select
              value={selectedProjectId}
              onValueChange={(value) =>
                setSelectedProjectId(value as ProjectFilterValue)
              }
            >
              <SelectTrigger
                aria-label={t("page.filters.projectAria")}
                className="h-9 w-[160px] border-app-border bg-app-content-bg text-app-text-primary"
              >
                <SelectValue placeholder={t("page.filters.allProjects")} />
              </SelectTrigger>
              <SelectContent className="border-app-border bg-app-content-bg">
                <SelectGroup>
                  <SelectItem value={ALL_FILTER_VALUE}>{t("page.filters.allProjects")}</SelectItem>
                  <SelectItem value={UNASSIGNED_PROJECT_VALUE}>
                    {t("page.filters.unassignedProject")}
                  </SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={selectedStateCategory}
              onValueChange={(value) =>
                setSelectedStateCategory(value as IssueStateCategoryFilterValue)
              }
            >
              <SelectTrigger
                aria-label={t("page.filters.stateAria")}
                className="h-9 w-[140px] border-app-border bg-app-content-bg text-app-text-primary"
              >
                <SelectValue placeholder={t("page.filters.allStates")} />
              </SelectTrigger>
              <SelectContent className="border-app-border bg-app-content-bg">
                <SelectGroup>
                  <SelectItem value={ALL_FILTER_VALUE}>{t("page.filters.allStates")}</SelectItem>
                  {issueStateCategoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {ISSUE_STATE_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={selectedPriority}
              onValueChange={(value) =>
                setSelectedPriority(value as IssuePriorityFilterValue)
              }
            >
              <SelectTrigger
                aria-label={t("page.filters.priorityAria")}
                className="h-9 w-[140px] border-app-border bg-app-content-bg text-app-text-primary"
              >
                <SelectValue placeholder={t("page.filters.allPriorities")} />
              </SelectTrigger>
              <SelectContent className="border-app-border bg-app-content-bg">
                <SelectGroup>
                  <SelectItem value={ALL_FILTER_VALUE}>{t("page.filters.allPriorities")}</SelectItem>
                  {Object.values(IssuePriority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={selectedIssueType}
              onValueChange={(value) =>
                setSelectedIssueType(value as IssueTypeFilterValue)
              }
            >
              <SelectTrigger
                aria-label={t("page.filters.typeAria")}
                className="h-9 w-[130px] border-app-border bg-app-content-bg text-app-text-primary"
              >
                <SelectValue placeholder={t("page.filters.allTypes")} />
              </SelectTrigger>
              <SelectContent className="border-app-border bg-app-content-bg">
                <SelectGroup>
                  <SelectItem value={ALL_FILTER_VALUE}>{t("page.filters.allTypes")}</SelectItem>
                  {Object.values(IssueType).map((issueType) => (
                    <SelectItem key={issueType} value={issueType}>
                      {ISSUE_TYPE_LABELS[issueType]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-app-border px-3 text-sm text-app-text-secondary transition hover:text-app-text-primary disabled:cursor-not-allowed disabled:opacity-45"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              <RiFilter3Line className="h-4 w-4" />
              {t("page.filters.clear")}
            </Button>

            {issuesViewMode === "board" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex h-9 items-center rounded-lg border border-app-border px-3 text-sm text-app-text-secondary transition hover:text-app-text-primary disabled:cursor-not-allowed disabled:opacity-45"
                onClick={handleSaveIssueBoardCategoryOrder}
                disabled={!hasUnsavedIssueBoardCategoryOrder}
              >
                {hasUnsavedIssueBoardCategoryOrder
                  ? t("page.actions.saveBoardOrder")
                  : t("page.actions.savedOrder")}
              </Button>
            )}
          </div>

          <div className="text-xs text-app-text-muted">
            {issueSummaryText}
            {selectedView === "my"
              ? t("page.summary.mySuffix")
              : "."}
            {shouldListHideClosedIssues && closedFilteredIssueCount > 0
              ? t("page.summary.closedSuffix", {
                  count: closedFilteredIssueCount,
                })
              : ""}
            {shouldListHideClosedIssues
              ? t("page.summary.listViewHint")
              : ""}
          </div>
        </div>
      </div>

      <div
        className={
          issuesViewMode === "board"
            ? "min-h-0 flex-1 overflow-hidden px-6 py-4"
            : "flex-1 overflow-y-auto"
        }
      >
        <div
          className={
            issuesViewMode === "board" ? "h-full min-h-0" : "px-6 py-4"
          }
        >
          {isLoadingIssues ? (
            <div className="py-12 text-center text-app-text-muted">
              {t("page.loading")}
            </div>
          ) : issuesViewMode === "board" ? (
            <ProjectIssuesKanbanBoard
              issues={filteredIssues}
              categoryOrder={issueBoardCategoryOrder}
              pendingIssueIds={pendingIssueIds}
              onOpenIssue={handleViewIssue}
              onCategoryOrderChange={handleIssueBoardCategoryOrderChange}
              onMoveIssue={handleMoveIssueToCategory}
              onCancelIssue={setPendingCancelIssue}
              canCancelIssue={canCancelIssue}
            />
          ) : filteredIssues.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-app-text-muted">
                {issues.length === 0 ? t("page.empty.none") : t("page.empty.filtered")}
              </div>
              {issues.length === 0 && (
                <Button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  <RiAddLine className="h-4 w-4" />
                  {t("page.empty.createFirst")}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredIssues.map((issue) => {
                const statusKey = (issue.currentStepStatus ||
                  "TODO") as keyof typeof statusConfig;
                const status = statusConfig[statusKey] || statusConfig.TODO;
                const priorityKey = (issue.priority ||
                  IssuePriority.NORMAL) as keyof typeof priorityConfig;
                const priority = priorityConfig[priorityKey];
                const issueType = isWorkflowIssue(issue)
                  ? IssueType.WORKFLOW
                  : IssueType.NORMAL;
                const projectName =
                  issue.project?.name ||
                  (issue.projectId ? projectNameById.get(issue.projectId) : "") ||
                  t("page.filters.unassignedProject");

                const isPending = pendingIssueIds.has(issue.id);
                const canCancel = canCancelIssue(issue);
                const issueRow = (
                  <div
                    role="button"
                    tabIndex={0}
                    className="group flex cursor-pointer items-center gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-app-button-hover focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    onClick={() => handleViewIssue(issue)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleViewIssue(issue);
                      }
                    }}
                  >
                    <div className={`flex items-center ${status.color}`}>
                      {status.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-medium text-app-text-primary">
                          {issue.title}
                        </h3>
                        {issueType === IssueType.WORKFLOW && (
                          <div className="flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                            <RiFlowChart className="h-3 w-3" />
                            <span>{t("page.states.workflow")}</span>
                          </div>
                        )}
                        <span className="rounded border border-app-border px-2 py-0.5 text-xs text-app-text-secondary">
                          {issue.state?.name || status.label}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-app-text-muted">
                        <span>{issue.key || `#${issue.id.slice(0, 8)}`}</span>
                        <span>{projectName}</span>
                        <span>{t("page.states.assignee")}：{getAssigneeName(issue)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded border px-2 py-0.5 text-xs ${priority.color}`}
                      >
                        {priority.label}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleViewIssue(issue);
                          }}
                          className="size-7 rounded p-1 transition-colors hover:bg-app-content-bg"
                          title={t("page.actions.viewOrEdit")}
                        >
                          <RiEdit2Line className="h-4 w-4 text-app-text-secondary" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );

                return (
                  <ContextMenu key={issue.id}>
                    <ContextMenuTrigger asChild>{issueRow}</ContextMenuTrigger>
                    <ContextMenuContent className="w-44">
                      <ContextMenuGroup>
                        <ContextMenuItem onSelect={() => handleViewIssue(issue)}>
                          {t("page.actions.openIssue")}
                        </ContextMenuItem>
                        <ContextMenuItem
                          variant="destructive"
                          disabled={isPending || !canCancel}
                          onSelect={() => setPendingCancelIssue(issue)}
                        >
                          {t("page.actions.cancelIssue")}
                        </ContextMenuItem>
                      </ContextMenuGroup>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreateIssue}
      />

      <Dialog
        open={Boolean(pendingCancelIssue)}
        onOpenChange={(open) => {
          if (!open && !cancelIssueMutation.isPending) {
            setPendingCancelIssue(null);
          }
        }}
      >
        <DialogContent className="border-app-border bg-app-content-bg text-app-text-primary sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("page.cancelDialog.title")}</DialogTitle>
            <DialogDescription className="text-app-text-secondary">
              {t("page.cancelDialog.description")}
            </DialogDescription>
          </DialogHeader>
          {pendingCancelIssue && (
            <div className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-secondary">
              {pendingCancelIssue.key ? `${pendingCancelIssue.key} · ` : ""}
              {pendingCancelIssue.title}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={cancelIssueMutation.isPending}
              >
                {t("page.cancelDialog.keep")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelIssueMutation.isPending}
              onClick={handleCancelIssue}
            >
              {cancelIssueMutation.isPending
                ? t("page.cancelDialog.pending")
                : t("page.cancelDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
