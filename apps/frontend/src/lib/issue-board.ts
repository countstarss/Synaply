import type { Issue, IssueStateSummary } from "@/lib/fetchers/issue";
import type { IssueState } from "@/lib/fetchers/issue-state";
import { IssuePriority, IssueStateCategory } from "@/types/prisma";

type IssueStateLike = Pick<IssueState, "id" | "category" | "isDefault">;

export const ISSUE_STATE_CATEGORY_ORDER = [
  IssueStateCategory.BACKLOG,
  IssueStateCategory.TODO,
  IssueStateCategory.IN_PROGRESS,
  IssueStateCategory.DONE,
  IssueStateCategory.CANCELED,
] as const;

export const ACTIVE_ISSUE_STATE_CATEGORIES: readonly IssueStateCategory[] = [
  IssueStateCategory.BACKLOG,
  IssueStateCategory.TODO,
  IssueStateCategory.IN_PROGRESS,
] as const;

export const CLOSED_ISSUE_STATE_CATEGORIES: readonly IssueStateCategory[] = [
  IssueStateCategory.DONE,
  IssueStateCategory.CANCELED,
] as const;

export const ISSUE_STATE_CATEGORY_LABELS: Record<IssueStateCategory, string> = {
  [IssueStateCategory.BACKLOG]: "Backlog",
  [IssueStateCategory.TODO]: "To do",
  [IssueStateCategory.IN_PROGRESS]: "In progress",
  [IssueStateCategory.DONE]: "Done",
  [IssueStateCategory.CANCELED]: "Canceled",
};

function hasIssueBoardStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

export function getIssueBoardCategoryOrderStorageKey(workspaceId: string) {
  return `project-issue-board-category-order:${workspaceId}`;
}

export function normalizeIssueStateCategoryOrder(value: unknown) {
  if (!Array.isArray(value)) {
    return [...ISSUE_STATE_CATEGORY_ORDER];
  }

  const normalizedCategories = value.filter(
    (category): category is IssueStateCategory =>
      typeof category === "string" &&
      ISSUE_STATE_CATEGORY_ORDER.includes(category as IssueStateCategory),
  );
  const dedupedCategories = normalizedCategories.filter(
    (category, index) => normalizedCategories.indexOf(category) === index,
  );
  const missingCategories = ISSUE_STATE_CATEGORY_ORDER.filter(
    (category) => !dedupedCategories.includes(category),
  );

  return [...dedupedCategories, ...missingCategories];
}

export function readIssueBoardCategoryOrderFromStorage(workspaceId: string) {
  if (!workspaceId || !hasIssueBoardStorage()) {
    return [...ISSUE_STATE_CATEGORY_ORDER];
  }

  try {
    const storedOrder = window.localStorage.getItem(
      getIssueBoardCategoryOrderStorageKey(workspaceId),
    );

    return normalizeIssueStateCategoryOrder(
      storedOrder ? JSON.parse(storedOrder) : ISSUE_STATE_CATEGORY_ORDER,
    );
  } catch {
    return [...ISSUE_STATE_CATEGORY_ORDER];
  }
}

export function persistIssueBoardCategoryOrderToStorage(
  workspaceId: string,
  order: IssueStateCategory[],
) {
  if (!workspaceId || !hasIssueBoardStorage()) {
    return false;
  }

  const normalizedOrder = normalizeIssueStateCategoryOrder(order);
  const serializedOrder = JSON.stringify(normalizedOrder);

  try {
    const storageKey = getIssueBoardCategoryOrderStorageKey(workspaceId);

    window.localStorage.setItem(storageKey, serializedOrder);

    return window.localStorage.getItem(storageKey) === serializedOrder;
  } catch {
    return false;
  }
}

const ISSUE_PRIORITY_ORDER: Record<IssuePriority, number> = {
  [IssuePriority.URGENT]: 0,
  [IssuePriority.HIGH]: 1,
  [IssuePriority.NORMAL]: 2,
  [IssuePriority.LOW]: 3,
};

function getIssuePriorityRank(issue: Issue) {
  if (!issue.priority) {
    return 4;
  }

  return ISSUE_PRIORITY_ORDER[issue.priority] ?? 4;
}

function getTimestamp(value?: string | null, fallback = Number.POSITIVE_INFINITY) {
  if (!value) {
    return fallback;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? fallback : timestamp;
}

export function getIssueCategory(issue?: Pick<Issue, "state"> | null) {
  return issue?.state?.category ?? IssueStateCategory.BACKLOG;
}

export function isActiveIssueCategory(
  category?: IssueStateCategory | null,
) {
  return ACTIVE_ISSUE_STATE_CATEGORIES.includes(
    category ?? IssueStateCategory.BACKLOG,
  );
}

export function isClosedIssueCategory(category?: IssueStateCategory | null) {
  return CLOSED_ISSUE_STATE_CATEGORIES.includes(
    category ?? IssueStateCategory.BACKLOG,
  );
}

export function isActiveIssue(issue?: Pick<Issue, "state"> | null) {
  return isActiveIssueCategory(getIssueCategory(issue));
}

export function isClosedIssue(issue?: Pick<Issue, "state"> | null) {
  return isClosedIssueCategory(getIssueCategory(issue));
}

export function resolveIssueStateForCategory<T extends IssueStateLike>(
  issueStates: T[],
  category: IssueStateCategory,
) {
  return (
    issueStates.find(
      (issueState) => issueState.category === category && issueState.isDefault,
    ) || issueStates.find((issueState) => issueState.category === category) || null
  );
}

export function compareIssuesByUrgency(left: Issue, right: Issue) {
  const priorityDiff = getIssuePriorityRank(left) - getIssuePriorityRank(right);

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const dueDateDiff =
    getTimestamp(left.dueDate) - getTimestamp(right.dueDate);

  if (dueDateDiff !== 0) {
    return dueDateDiff;
  }

  const updatedAtDiff =
    getTimestamp(right.updatedAt, 0) - getTimestamp(left.updatedAt, 0);

  if (updatedAtDiff !== 0) {
    return updatedAtDiff;
  }

  const sequenceDiff =
    (left.sequence ?? Number.MAX_SAFE_INTEGER) -
    (right.sequence ?? Number.MAX_SAFE_INTEGER);

  if (sequenceDiff !== 0) {
    return sequenceDiff;
  }

  const createdAtDiff =
    getTimestamp(left.createdAt, 0) - getTimestamp(right.createdAt, 0);

  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return left.id.localeCompare(right.id);
}

export function sortIssuesByUrgency<T extends Issue>(issues: T[]) {
  return [...issues].sort(compareIssuesByUrgency);
}

export function buildIssueStateSummary(
  issueState: IssueStateLike & Partial<IssueStateSummary>,
): IssueStateSummary {
  return {
    id: issueState.id,
    category: issueState.category,
    isDefault: issueState.isDefault,
    name: issueState.name ?? "",
    color: issueState.color ?? null,
    position: issueState.position,
    isArchived: issueState.isArchived,
    workspaceId: issueState.workspaceId,
    createdAt: issueState.createdAt,
    updatedAt: issueState.updatedAt,
  };
}
