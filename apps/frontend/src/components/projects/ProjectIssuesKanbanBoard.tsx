"use client";

import React, { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DragDropProvider,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { RiDraggable, RiFlowChart, RiLoader4Line } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { getIssueCategory, normalizeIssueStateCategoryOrder } from "@/lib/issue-board";
import { type Issue, isWorkflowIssue } from "@/lib/fetchers/issue";
import {
  formatShortDate,
  getPriorityTone,
} from "@/components/projects/project-view-utils";
import { IssueStateCategory } from "@/types/prisma";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface ProjectIssuesKanbanBoardProps {
  issues: Issue[];
  categoryOrder: IssueStateCategory[];
  pendingIssueIds: Set<string>;
  onOpenIssue: (issue: Issue) => void;
  onCategoryOrderChange: (order: IssueStateCategory[]) => void;
  onMoveIssue: (issue: Issue, category: IssueStateCategory) => void;
  onCancelIssue?: (issue: Issue) => void;
  canCancelIssue?: (issue: Issue) => boolean;
}

type DragEntity = {
  id?: string | number;
  data?: Record<string, unknown>;
  sortable?: {
    group?: string | number;
    index?: number;
    initialIndex?: number;
    initialGroup?: string | number;
  };
} | null | undefined;

const COLUMN_ID_PREFIX = "project-issue-column:";
const CARD_ID_PREFIX = "project-issue-card:";
const DROPZONE_ID_PREFIX = "project-issue-dropzone:";
const ISSUE_STATE_CATEGORY_MESSAGE_KEYS: Record<IssueStateCategory, string> = {
  [IssueStateCategory.BACKLOG]: "backlog",
  [IssueStateCategory.TODO]: "todo",
  [IssueStateCategory.IN_PROGRESS]: "inProgress",
  [IssueStateCategory.DONE]: "done",
  [IssueStateCategory.CANCELED]: "canceled",
};

function getIdentifierFromEntity(entity: DragEntity) {
  const identifier = entity?.id;
  return typeof identifier === "string" ? identifier : null;
}

function isCategoryValue(value: string) {
  return Object.values(IssueStateCategory).includes(value as IssueStateCategory);
}

function parseCategoryFromIdentifier(identifier: string | null) {
  if (!identifier) {
    return null;
  }

  if (!identifier.startsWith(COLUMN_ID_PREFIX)) {
    if (!identifier.startsWith(DROPZONE_ID_PREFIX)) {
      return null;
    }
  }

  const categoryValue = identifier.startsWith(COLUMN_ID_PREFIX)
    ? identifier.slice(COLUMN_ID_PREFIX.length)
    : identifier.slice(DROPZONE_ID_PREFIX.length);
  return isCategoryValue(categoryValue)
    ? (categoryValue as IssueStateCategory)
    : null;
}

function parseIssueIdFromIdentifier(identifier: string | null) {
  if (!identifier || !identifier.startsWith(CARD_ID_PREFIX)) {
    return null;
  }

  return identifier.slice(CARD_ID_PREFIX.length);
}

function getKindFromEntity(entity: DragEntity) {
  const kind = entity?.data?.kind;

  if (typeof kind === "string") {
    return kind;
  }

  const identifier = getIdentifierFromEntity(entity);

  if (!identifier) {
    return null;
  }

  if (identifier.startsWith(COLUMN_ID_PREFIX)) {
    return "issue-column";
  }

  if (identifier.startsWith(CARD_ID_PREFIX)) {
    return "issue-card";
  }

  return null;
}

function getCategoryFromEntity(entity: DragEntity) {
  const category = entity?.data?.category;

  if (typeof category === "string" && isCategoryValue(category)) {
    return category as IssueStateCategory;
  }

  return parseCategoryFromIdentifier(getIdentifierFromEntity(entity));
}

function getIssueIdFromEntity(entity: DragEntity) {
  const issueId = entity?.data?.issueId;

  if (typeof issueId === "string") {
    return issueId;
  }

  return parseIssueIdFromIdentifier(getIdentifierFromEntity(entity));
}

function getSortableProjection(entity: DragEntity) {
  const sortable = entity?.sortable;

  if (!sortable) {
    return null;
  }

  return sortable;
}

function moveCategoryToIndex(
  categories: IssueStateCategory[],
  fromIndex: number,
  toIndex: number,
) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= categories.length ||
    toIndex >= categories.length
  ) {
    return categories;
  }

  const nextCategories = [...categories];
  const [movedCategory] = nextCategories.splice(fromIndex, 1);

  if (!movedCategory) {
    return categories;
  }

  nextCategories.splice(toIndex, 0, movedCategory);
  return nextCategories;
}

function ProjectIssueKanbanColumn({
  category,
  index,
  issues,
  pendingIssueIds,
  onOpenIssue,
  onCancelIssue,
  canCancelIssue,
  tProjects,
  tIssues,
}: {
  category: IssueStateCategory;
  index: number;
  issues: Issue[];
  pendingIssueIds: Set<string>;
  onOpenIssue: (issue: Issue) => void;
  onCancelIssue?: (issue: Issue) => void;
  canCancelIssue?: (issue: Issue) => boolean;
  tProjects: (key: string, values?: Record<string, string | number>) => string;
  tIssues: ReturnType<typeof useTranslations>;
}) {
  const categoryMessageKey = ISSUE_STATE_CATEGORY_MESSAGE_KEYS[category];
  const categoryLabel = tIssues.has(`stateCategory.${categoryMessageKey}`)
    ? tIssues(`stateCategory.${categoryMessageKey}`)
    : category;
  const { ref, handleRef, isDragSource, isDropTarget } = useSortable({
    id: `project-issue-column:${category}`,
    index,
    group: "project-issue-columns",
    type: "project-issue-column",
    accept: ["project-issue-column"],
    data: {
      kind: "issue-column",
      category,
    },
  });
  const {
    ref: dropzoneRef,
    isDropTarget: isIssueDropTarget,
  } = useDroppable({
    id: `project-issue-dropzone:${category}`,
    accept: ["project-issue-card"],
    data: {
      kind: "issue-dropzone",
      category,
    },
  });
  const setColumnRefs = (element: Element | null) => {
    ref(element);
    dropzoneRef(element);
  };

  return (
    <section
      ref={setColumnRefs}
      className={cn(
        "flex h-full min-h-0 w-[17.5rem] min-w-[17.5rem] select-none flex-col overflow-hidden rounded-t-2xl bg-app-bg/50 px-1 py-1 transition",
        isDragSource && "opacity-70",
        (isDropTarget || isIssueDropTarget) && "outline outline-1 outline-sky-500/30",
      )}
    >
      <div className="sticky top-0 z-10 mb-2 flex items-center justify-between gap-2 rounded-xl bg-app-content-bg/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-app-content-bg/80">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-app-text-primary">
            {categoryLabel}
          </h3>
          <p className="mt-0.5 text-[11px] text-app-text-muted">
            {tProjects("kanban.issueCount", { count: issues.length })}
          </p>
        </div>

        <button
          ref={handleRef}
          type="button"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-app-text-muted transition hover:bg-app-button-hover hover:text-app-text-primary"
          aria-label={tProjects("kanban.reorderColumn", {
            label: categoryLabel,
          })}
          title={tProjects("kanban.dragColumn")}
        >
          <RiDraggable className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-t-xl px-1 pb-1 transition scrollbar-hidden">
        <div className="flex min-h-full flex-col gap-2">
          {issues.map((issue) => (
            <ProjectIssueKanbanCard
              key={issue.id}
              issue={issue}
              category={category}
              isPending={pendingIssueIds.has(issue.id)}
              onOpenIssue={onOpenIssue}
              onCancelIssue={onCancelIssue}
              canCancelIssue={canCancelIssue}
              tProjects={tProjects}
            />
          ))}
          {issues.length === 0 && (
            <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-app-border/80 bg-app-content-bg/40 px-3 text-center text-xs text-app-text-muted">
              {tProjects("kanban.dropIssue")}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProjectIssueKanbanCard({
  issue,
  category,
  isPending,
  onOpenIssue,
  onCancelIssue,
  canCancelIssue,
  tProjects,
}: {
  issue: Issue;
  category: IssueStateCategory;
  isPending: boolean;
  onOpenIssue: (issue: Issue) => void;
  onCancelIssue?: (issue: Issue) => void;
  canCancelIssue?: (issue: Issue) => boolean;
  tProjects: (key: string, values?: Record<string, string | number>) => string;
}) {
  const { ref, handleRef, isDragSource, isDropping } = useDraggable({
    id: `project-issue-card:${issue.id}`,
    type: "project-issue-card",
    disabled: isPending,
    data: {
      kind: "issue-card",
      issueId: issue.id,
      category,
    },
  });
  const priorityMeta = getPriorityTone(issue);
  const canCancel = canCancelIssue?.(issue) ?? true;

  const card = (
    <div
      ref={ref}
      className={cn(
        "group select-none rounded-2xl border border-app-border bg-app-bg/90 shadow-sm transition",
        isDragSource && "opacity-60",
        isDropping && "border-sky-500/45",
        isPending && "opacity-80",
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <button
            type="button"
            onClick={() => onOpenIssue(issue)}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-app-text-muted">
                {issue.key || issue.id.slice(0, 8)}
              </span>
              {isWorkflowIssue(issue) && (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200">
                  <RiFlowChart className="size-3" />
                  {tProjects("kanban.workflow")}
                </span>
              )}
            </div>
            <div className="mt-2 line-clamp-2 text-sm font-medium text-app-text-primary">
              {issue.title}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {issue.dueDate && (
                <span className="text-[11px] text-app-text-secondary">
                  {formatShortDate(issue.dueDate)}
                </span>
              )}
              {priorityMeta && (
                <span
                  className={cn(
                    "rounded-full border px-2 py-1 text-[11px]",
                    priorityMeta.color,
                  )}
                >
                  {priorityMeta.label}
                </span>
              )}
            </div>
          </button>
        </div>

        <button
          ref={handleRef}
          type="button"
          disabled={isPending}
          onClick={(event) => event.stopPropagation()}
          className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-app-border bg-app-content-bg text-app-text-muted transition hover:bg-app-button-hover hover:text-app-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={tProjects("kanban.dragIssue", { title: issue.title })}
          title={tProjects("kanban.dragIssueCategory")}
        >
          {isPending ? (
            <RiLoader4Line className="size-4 animate-spin" />
          ) : (
            <RiDraggable className="size-4" />
          )}
        </button>
      </div>
    </div>
  );

  if (!onCancelIssue) {
    return card;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuGroup>
          <ContextMenuItem onSelect={() => onOpenIssue(issue)}>
            {tProjects("kanban.openIssue")}
          </ContextMenuItem>
          <ContextMenuItem
            variant="destructive"
            disabled={isPending || !canCancel}
            onSelect={() => onCancelIssue(issue)}
          >
            {tProjects("kanban.cancelIssue")}
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ProjectIssueKanbanCardOverlay({ issue }: { issue: Issue }) {
  const priorityMeta = getPriorityTone(issue);

  return (
    <div className="w-[17.5rem] select-none rounded-2xl border border-sky-500/45 bg-app-content-bg/95 p-3 shadow-2xl">
      <div className="font-mono text-[11px] text-app-text-muted">
        {issue.key || issue.id.slice(0, 8)}
      </div>
      <div className="mt-2 text-sm font-medium text-app-text-primary">
        {issue.title}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {issue.dueDate && (
          <span className="text-[11px] text-app-text-secondary">
            {formatShortDate(issue.dueDate)}
          </span>
        )}
        {priorityMeta && (
          <span
            className={cn(
              "rounded-full border px-2 py-1 text-[11px]",
              priorityMeta.color,
            )}
          >
            {priorityMeta.label}
          </span>
        )}
      </div>
    </div>
  );
}

export function ProjectIssuesKanbanBoard({
  issues,
  categoryOrder,
  pendingIssueIds,
  onOpenIssue,
  onCategoryOrderChange,
  onMoveIssue,
  onCancelIssue,
  canCancelIssue,
}: ProjectIssuesKanbanBoardProps) {
  const tProjects = useTranslations("projects");
  const tIssues = useTranslations("issues");
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const lastOverCategoryRef = useRef<IssueStateCategory | null>(null);
  const activeIssue = useMemo(
    () => issues.find((issue) => issue.id === activeIssueId) || null,
    [activeIssueId, issues],
  );
  const orderedCategories = useMemo(
    () => normalizeIssueStateCategoryOrder(categoryOrder),
    [categoryOrder],
  );
  const groupedIssues = useMemo(() => {
    const buckets = orderedCategories.reduce(
      (accumulator, category) => {
        accumulator[category] = [];
        return accumulator;
      },
      {} as Record<IssueStateCategory, Issue[]>,
    );

    for (const issue of issues) {
      const issueCategory = getIssueCategory(issue);

      if (!buckets[issueCategory]) {
        buckets[issueCategory] = [];
      }

      buckets[issueCategory].push(issue);
    }

    return buckets;
  }, [issues, orderedCategories]);
  const issueCategoryMap = useMemo(
    () =>
      new Map(
        issues.map((issue) => {
          const category = getIssueCategory(issue);
          return [issue.id, category] as const;
        }),
      ),
    [issues],
  );

  const resolveCategory = (entity: DragEntity) => {
    const directCategory = getCategoryFromEntity(entity);

    if (directCategory) {
      return directCategory;
    }

    const issueId = getIssueIdFromEntity(entity);
    return issueId ? issueCategoryMap.get(issueId) || null : null;
  };

  return (
    <DragDropProvider
      onDragStart={(event) => {
        lastOverCategoryRef.current = resolveCategory(event.operation.source);

        if (getKindFromEntity(event.operation.source) === "issue-card") {
          setActiveIssueId(getIssueIdFromEntity(event.operation.source));
          return;
        }

        setActiveIssueId(null);
      }}
      onDragOver={(event) => {
        const targetCategory = resolveCategory(event.operation.target);

        if (targetCategory) {
          lastOverCategoryRef.current = targetCategory;
        }
      }}
      onDragEnd={(event) => {
        setActiveIssueId(null);

        if (event.canceled) {
          lastOverCategoryRef.current = null;
          return;
        }

        const sourceKind = getKindFromEntity(event.operation.source);
        const sourceCategory = resolveCategory(event.operation.source);
        const sourceSortable = getSortableProjection(event.operation.source);
        const projectedTargetCategory =
          sourceSortable?.group &&
          typeof sourceSortable.group === "string" &&
          isCategoryValue(sourceSortable.group)
            ? (sourceSortable.group as IssueStateCategory)
            : null;
        const targetCategory =
          resolveCategory(event.operation.target) ||
          projectedTargetCategory ||
          lastOverCategoryRef.current;

        lastOverCategoryRef.current = null;

        if (!sourceKind || !sourceCategory) {
          return;
        }

        if (sourceKind === "issue-column") {
          const fromIndex = sourceSortable?.initialIndex;
          const toIndex = sourceSortable?.index;

          if (
            typeof fromIndex !== "number" ||
            typeof toIndex !== "number" ||
            fromIndex === toIndex
          ) {
            return;
          }

          const nextCategoryOrder = moveCategoryToIndex(
            orderedCategories,
            fromIndex,
            toIndex,
          );

          onCategoryOrderChange(nextCategoryOrder);

          return;
        }

        if (!targetCategory) {
          return;
        }

        const issueId = getIssueIdFromEntity(event.operation.source);

        if (!issueId) {
          return;
        }

        const issue = issues.find((currentIssue) => currentIssue.id === issueId);

        if (!issue || getIssueCategory(issue) === targetCategory) {
          return;
        }

        onMoveIssue(issue, targetCategory);
      }}
    >
      <div className="h-full min-h-0 select-none overflow-x-auto overflow-y-hidden scrollbar-hidden">
        <div className="flex h-full min-h-0 min-w-max items-stretch gap-3">
          {orderedCategories.map((category, index) => (
            <ProjectIssueKanbanColumn
              key={category}
              category={category}
              index={index}
              issues={groupedIssues[category] || []}
              pendingIssueIds={pendingIssueIds}
              onOpenIssue={onOpenIssue}
              onCancelIssue={onCancelIssue}
              canCancelIssue={canCancelIssue}
              tProjects={tProjects}
              tIssues={tIssues}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeIssue ? <ProjectIssueKanbanCardOverlay issue={activeIssue} /> : null}
      </DragOverlay>
    </DragDropProvider>
  );
}
