"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RiAddLine, RiLoader4Line } from "react-icons/ri";
import { toast } from "sonner";
import {
  IssueViewModeToggle,
  type IssueViewMode,
} from "@/components/issue/IssueViewModeToggle";
import { ProjectIssueList } from "@/components/projects/ProjectIssueList";
import { ProjectIssuesKanbanBoard } from "@/components/projects/ProjectIssuesKanbanBoard";
import { ProjectSurfaceCard } from "@/components/projects/ProjectSurfaceCard";
import { useIssueStates } from "@/hooks/useIssueStates";
import { useCancelIssue, useUpdateIssue } from "@/hooks/useIssueApi";
import { cn } from "@/lib/utils";
import {
  buildIssueStateSummary,
  isActiveIssue,
  resolveIssueStateForCategory,
  sortIssuesByUrgency,
} from "@/lib/issue-board";
import type { Issue } from "@/lib/fetchers/issue";
import { IssueStateCategory, IssueType } from "@/types/prisma";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OptimisticIssueState = Pick<Issue, "state" | "stateId">;

export function ProjectIssuesSubview({
  workspaceId,
  projectIssues,
  issuesViewMode,
  issueBoardCategoryOrder,
  isLoadingProjectIssues,
  hasUnsavedIssueBoardCategoryOrder,
  currentTeamMemberId,
  onCreateIssue,
  onOpenIssue,
  onIssueBoardCategoryOrderChange,
  onSaveIssueBoardCategoryOrder,
  onIssuesViewModeChange,
}: {
  workspaceId: string;
  projectIssues: Issue[];
  issuesViewMode: IssueViewMode;
  issueBoardCategoryOrder: IssueStateCategory[];
  isLoadingProjectIssues: boolean;
  hasUnsavedIssueBoardCategoryOrder: boolean;
  currentTeamMemberId?: string;
  onCreateIssue: () => void;
  onOpenIssue: (issue: Issue) => void;
  onIssueBoardCategoryOrderChange: (order: IssueStateCategory[]) => void;
  onSaveIssueBoardCategoryOrder: () => void;
  onIssuesViewModeChange: (viewMode: IssueViewMode) => void;
}) {
  const tProjects = useTranslations("projects");
  const locale = useLocale();
  const quickCompleteLabel = tProjects.has("subviews.issues.quickComplete")
    ? tProjects("subviews.issues.quickComplete")
    : tProjects("subviews.issues.openIssue");
  const { data: issueStates = [] } = useIssueStates(workspaceId, {
    enabled: !!workspaceId,
  });
  const updateIssueMutation = useUpdateIssue();
  const cancelIssueMutation = useCancelIssue();
  const [optimisticIssueStates, setOptimisticIssueStates] = useState<
    Record<string, OptimisticIssueState>
  >({});
  const [pendingIssueIds, setPendingIssueIds] = useState<Set<string>>(new Set());
  const [pendingCancelIssue, setPendingCancelIssue] = useState<Issue | null>(
    null,
  );

  useEffect(() => {
    setOptimisticIssueStates({});
    setPendingIssueIds(new Set());
  }, [projectIssues, workspaceId]);

  useEffect(() => {
    setPendingCancelIssue(null);
  }, [workspaceId]);

  useEffect(() => {
    setOptimisticIssueStates((current) => {
      let hasChanged = false;
      const nextState = { ...current };

      for (const issue of projectIssues) {
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
  }, [projectIssues]);

  const displayedIssues = useMemo(
    () =>
      sortIssuesByUrgency(
        projectIssues.map((issue) => {
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
      ),
    [optimisticIssueStates, projectIssues],
  );
  const activeProjectIssues = useMemo(
    () => displayedIssues.filter(isActiveIssue),
    [displayedIssues],
  );
  const doneState = useMemo(
    () => resolveIssueStateForCategory(issueStates, IssueStateCategory.DONE),
    [issueStates],
  );
  const hiddenClosedIssueCount =
    displayedIssues.length - activeProjectIssues.length;
  const shouldListHideClosedIssues = issuesViewMode === "list";
  const visibleProjectIssues = shouldListHideClosedIssues
    ? activeProjectIssues
    : displayedIssues;
  const canCancelIssue = (issue: Issue) => {
    const creatorMemberId = issue.creatorMemberId || issue.creatorId;

    if (!creatorMemberId || !currentTeamMemberId) {
      return true;
    }

    return creatorMemberId === currentTeamMemberId;
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
          setPendingIssueIds((current) => {
            const nextState = new Set(current);
            nextState.delete(issue.id);
            return nextState;
          });
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : tProjects("subviews.issues.updateStateFailed"),
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

  const canQuickCompleteIssue = (issue: Issue) =>
    Boolean(
      issue.issueType !== IssueType.WORKFLOW &&
        doneState &&
        !pendingIssueIds.has(issue.id) &&
        issue.state?.category !== IssueStateCategory.DONE &&
        issue.state?.category !== IssueStateCategory.CANCELED,
    );

  const handleQuickCompleteIssue = (issue: Issue) => {
    if (!canQuickCompleteIssue(issue)) {
      return;
    }

    handleMoveIssueToCategory(issue, IssueStateCategory.DONE);
  };

  const handleCancelIssue = () => {
    if (!workspaceId || !pendingCancelIssue || pendingIssueIds.has(pendingCancelIssue.id)) {
      return;
    }

    const issue = pendingCancelIssue;
    if (!canCancelIssue(issue)) {
      toast.error(tProjects("subviews.issues.onlyCreatorCanCancel"));
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
      {
        workspaceId,
        issueId: issue.id,
      },
      {
        onSuccess: () => {
          toast.success(tProjects("subviews.issues.cancelled"));
          setPendingCancelIssue(null);
          setPendingIssueIds((current) => {
            const nextState = new Set(current);
            nextState.delete(issue.id);
            return nextState;
          });
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : tProjects("subviews.issues.cancelFailed"),
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

  return (
    <div className="flex h-full min-h-0 flex-col p-4 isolate">
      <ProjectSurfaceCard
        title={tProjects("subviews.issues.title")}
        subtitle={tProjects("subviews.issues.subtitle")}
        action={
          <button
            onClick={onCreateIssue}
            className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary transition hover:bg-app-button-hover"
          >
            <RiAddLine className="size-4" />
            {tProjects("subviews.issues.createIssue")}
          </button>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 pb-4">
            <div className="text-xs text-app-text-secondary">
              {tProjects("subviews.issues.summary", {
                active: activeProjectIssues.length,
                suffix:
                  hiddenClosedIssueCount > 0
                    ? tProjects("subviews.issues.hiddenSuffix", {
                        count: hiddenClosedIssueCount,
                        hidden: shouldListHideClosedIssues
                          ? tProjects("subviews.issues.hiddenLabel")
                          : "",
                      })
                    : "",
              })}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {issuesViewMode === "board" && (
                <button
                  type="button"
                  onClick={onSaveIssueBoardCategoryOrder}
                  className={cn(
                    "inline-flex h-8 items-center rounded-xl border px-3 text-xs font-medium transition",
                    hasUnsavedIssueBoardCategoryOrder
                      ? "border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
                      : "border-app-border bg-app-bg text-app-text-secondary hover:bg-app-button-hover",
                  )}
                >
                  {hasUnsavedIssueBoardCategoryOrder
                    ? tProjects("subviews.issues.saveBoardOrder")
                    : tProjects("subviews.issues.boardOrderSaved")}
                </button>
              )}
              <IssueViewModeToggle
                value={issuesViewMode}
                onValueChange={onIssuesViewModeChange}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {isLoadingProjectIssues ? (
              <div className="flex h-full items-center justify-center px-6 text-app-text-secondary">
                <RiLoader4Line className="mr-2 size-5 animate-spin" />
                {tProjects("subviews.issues.loading")}
              </div>
            ) : visibleProjectIssues.length === 0 ? (
              <div className="flex h-full items-center justify-center overflow-y-auto px-2">
                <div className="w-full h-full rounded-2xl border border-dashed border-app-border bg-app-bg p-6 text-center">
                  <div className="text-base font-semibold text-app-text-primary">
                    {tProjects("subviews.issues.emptyTitle")}
                  </div>
                  <div className="mt-2 text-sm text-app-text-secondary">
                    {tProjects("subviews.issues.emptyDescription")}
                  </div>
                  <button
                    onClick={onCreateIssue}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                  >
                    <RiAddLine className="size-4" />
                    {tProjects("subviews.issues.createIssue")}
                  </button>
                </div>
              </div>
            ) : issuesViewMode === "board" ? (
              <ProjectIssuesKanbanBoard
                issues={visibleProjectIssues}
                categoryOrder={issueBoardCategoryOrder}
                pendingIssueIds={pendingIssueIds}
                onOpenIssue={onOpenIssue}
                onCategoryOrderChange={onIssueBoardCategoryOrderChange}
                onMoveIssue={handleMoveIssueToCategory}
                onCancelIssue={setPendingCancelIssue}
                canCancelIssue={canCancelIssue}
              />
            ) : (
              <div className="h-full overflow-y-auto scrollbar-hidden">
                <ProjectIssueList
                  issues={visibleProjectIssues}
                  pendingIssueIds={pendingIssueIds}
                  onOpenIssue={onOpenIssue}
                  onQuickCompleteIssue={handleQuickCompleteIssue}
                  onCancelIssue={setPendingCancelIssue}
                  canCancelIssue={canCancelIssue}
                  canQuickCompleteIssue={canQuickCompleteIssue}
                  tProjects={tProjects}
                  quickCompleteLabel={quickCompleteLabel}
                  locale={locale}
                />
              </div>
            )}
          </div>
        </div>
      </ProjectSurfaceCard>

      <Dialog
        open={!!pendingCancelIssue}
        onOpenChange={(open) => {
          if (!open && !cancelIssueMutation.isPending) {
            setPendingCancelIssue(null);
          }
        }}
      >
        <DialogContent className="border-app-border bg-app-content-bg text-app-text-primary sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tProjects("subviews.issues.cancelDialog.title")}</DialogTitle>
            <DialogDescription>
              {tProjects("subviews.issues.cancelDialog.description")}
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
                {tProjects("subviews.issues.cancelDialog.keep")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelIssueMutation.isPending}
              onClick={handleCancelIssue}
            >
              {cancelIssueMutation.isPending
                ? tProjects("subviews.issues.cancelDialog.pending")
                : tProjects("subviews.issues.cancelDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
