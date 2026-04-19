"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  normalizeIssueStateCategoryOrder,
  persistIssueBoardCategoryOrderToStorage,
  readIssueBoardCategoryOrderFromStorage,
} from "@/lib/issue-board";
import { IssueStateCategory } from "@/types/prisma";

function isSameCategoryOrder(
  left: IssueStateCategory[],
  right: IssueStateCategory[],
) {
  return (
    left.length === right.length &&
    left.every((category, index) => category === right[index])
  );
}

export function useProjectBoardState({
  workspaceId,
  tProjects,
}: {
  workspaceId: string;
  tProjects: (key: string, values?: Record<string, string | number>) => string;
}) {
  const [issuesViewMode, setIssuesViewMode] = useState<"list" | "board">("list");
  const [issueBoardCategoryOrder, setIssueBoardCategoryOrder] = useState<
    IssueStateCategory[]
  >(() => readIssueBoardCategoryOrderFromStorage(workspaceId));
  const [savedIssueBoardCategoryOrder, setSavedIssueBoardCategoryOrder] =
    useState<IssueStateCategory[]>(() =>
      readIssueBoardCategoryOrderFromStorage(workspaceId),
    );

  useEffect(() => {
    const storedOrder = readIssueBoardCategoryOrderFromStorage(workspaceId);
    setIssueBoardCategoryOrder(storedOrder);
    setSavedIssueBoardCategoryOrder(storedOrder);
  }, [workspaceId]);

  const hasUnsavedIssueBoardCategoryOrder = !isSameCategoryOrder(
    savedIssueBoardCategoryOrder,
    issueBoardCategoryOrder,
  );

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
      toast.error(tProjects("toasts.boardOrderMissingWorkspace"));
      return;
    }

    const normalizedOrder = normalizeIssueStateCategoryOrder(
      issueBoardCategoryOrder,
    );

    if (isSameCategoryOrder(savedIssueBoardCategoryOrder, normalizedOrder)) {
      toast.message(tProjects("toasts.boardOrderUnchanged"));
      return;
    }

    const didPersist = persistIssueBoardCategoryOrderToStorage(
      workspaceId,
      normalizedOrder,
    );

    if (!didPersist) {
      toast.error(tProjects("toasts.boardOrderSaveFailed"));
      return;
    }

    const persistedOrder = readIssueBoardCategoryOrderFromStorage(workspaceId);

    setIssueBoardCategoryOrder(persistedOrder);
    setSavedIssueBoardCategoryOrder(persistedOrder);
    toast.success(tProjects("toasts.boardOrderSaved"));
  };

  return {
    issuesViewMode,
    issueBoardCategoryOrder,
    hasUnsavedIssueBoardCategoryOrder,
    setIssuesViewMode,
    handleIssueBoardCategoryOrderChange,
    handleSaveIssueBoardCategoryOrder,
  };
}
