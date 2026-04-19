"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Edge, Node } from "reactflow";
import { toast } from "sonner";
import {
  useAdvanceWorkflowRun,
  useRevertWorkflowRun,
  useUpdateWorkflowRunStatus,
} from "@/hooks/useIssueApi";
import { Issue } from "@/lib/fetchers/issue";
import { WorkflowIssue } from "@/types/team";
import { createInitialWorkflowIssue } from "@/app/[locale]/(main)/workflows/_components/utils/workflowUtils";
import { Session } from "@supabase/supabase-js";
import { IssueStatus } from "@/types/prisma";

interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
  [key: string]: unknown;
}

interface UseWorkflowNodeStatusProps {
  issue: Issue;
  workflow: WorkflowData | null;
  workflowIssue: WorkflowIssue | null;
  setWorkflowIssue: React.Dispatch<React.SetStateAction<WorkflowIssue | null>>;
  onIssueSynced?: (nextIssue: Issue) => void;
  currentNode: Node | null;
  user: {
    id?: string;
    user_metadata: {
      name?: string;
      avatar_url?: string;
    };
  } | null;
  session: Session | null;
  onUpdate: () => void;
}

export const useWorkflowNodeStatus = ({
  issue,
  workflow,
  workflowIssue,
  setWorkflowIssue,
  onIssueSynced,
  currentNode,
  user,
  onUpdate,
}: UseWorkflowNodeStatusProps) => {
  const tWorkflows = useTranslations("workflows");
  const updateWorkflowRunStatusMutation = useUpdateWorkflowRunStatus();
  const advanceWorkflowRunMutation = useAdvanceWorkflowRun();
  const revertWorkflowRunMutation = useRevertWorkflowRun();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isCompletionConfirmOpen, setIsCompletionConfirmOpen] = useState(false);
  const [pendingNextEdge, setPendingNextEdge] = useState<Edge | null>(null);

  const syncWorkflowIssue = useCallback(
    (nextIssue: Issue) => {
      const nextWorkflowIssue = createInitialWorkflowIssue(nextIssue);
      setWorkflowIssue(nextWorkflowIssue);
      onIssueSynced?.(nextIssue);
      onUpdate();
    },
    [onIssueSynced, onUpdate, setWorkflowIssue],
  );

  const ensureCurrentUserCanAct = useCallback(() => {
    if (!workflowIssue || !currentNode) {
      return false;
    }

    const nodeStatus = workflowIssue.nodeStatuses[currentNode.id] as
      | {
          assigneeId?: string;
        }
      | undefined;

    if (nodeStatus?.assigneeId && nodeStatus.assigneeId !== user?.id) {
      toast.error(tWorkflows("runtime.onlyCurrentOwner"));
      return false;
    }

    return true;
  }, [currentNode, tWorkflows, user?.id, workflowIssue]);

  const handleStatusUpdate = useCallback(
    async (nodeId: string, status: string, comment?: string) => {
      if (!workflowIssue || !currentNode) {
        return;
      }

      if (!ensureCurrentUserCanAct()) {
        return;
      }

      try {
        const updatedIssue = await updateWorkflowRunStatusMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            status: status as IssueStatus,
            comment,
          },
        });

        syncWorkflowIssue(updatedIssue);
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error
            ? error.message
            : tWorkflows("runtime.statusSyncFailed"),
        );
      }
    },
    [
      currentNode,
      ensureCurrentUserCanAct,
      issue.id,
      issue.workspaceId,
      syncWorkflowIssue,
      tWorkflows,
      updateWorkflowRunStatusMutation,
      workflowIssue,
    ],
  );

  const handleAdvance = useCallback(() => {
    if (!workflow || !workflowIssue || !currentNode) {
      return;
    }

    if (!ensureCurrentUserCanAct()) {
      return;
    }

    const nextEdge = workflow.edges.find(
      (edge: Edge) => edge.source === currentNode.id,
    );
    if (!nextEdge) {
      setPendingNextEdge(null);
      setIsCompletionConfirmOpen(true);
      return;
    }

    setPendingNextEdge(nextEdge);
    setIsRecordModalOpen(true);
  }, [currentNode, ensureCurrentUserCanAct, workflow, workflowIssue]);

  const handleSubmitRecord = useCallback(
    async ({ resultText }: { resultText: string }) => {
      if (!pendingNextEdge || !currentNode) {
        return;
      }

      try {
        const updatedIssue = await advanceWorkflowRunMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            resultText,
          },
        });

        setPendingNextEdge(null);
        setIsRecordModalOpen(false);
        syncWorkflowIssue(updatedIssue);
      } catch (error) {
        console.error("Failed to advance workflow run", error);
        toast.error(
          error instanceof Error ? error.message : tWorkflows("runtime.advanceFailed"),
        );
      }
    },
    [
      advanceWorkflowRunMutation,
      currentNode,
      issue.id,
      issue.workspaceId,
      pendingNextEdge,
      syncWorkflowIssue,
      tWorkflows,
    ],
  );

  const handleConfirmWorkflowCompletion = useCallback(
    async ({
      completionConfirmed,
      issueTitleConfirmation,
    }: {
      completionConfirmed: boolean;
      issueTitleConfirmation: string;
    }) => {
      if (!currentNode) {
        return;
      }

      if (!ensureCurrentUserCanAct()) {
        return;
      }

      try {
        const updatedIssue = await advanceWorkflowRunMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            completionConfirmed,
            issueTitleConfirmation,
          },
        });

        setPendingNextEdge(null);
        setIsCompletionConfirmOpen(false);
        syncWorkflowIssue(updatedIssue);
      } catch (error) {
        console.error("Failed to complete workflow run", error);
        toast.error(
          error instanceof Error ? error.message : tWorkflows("runtime.advanceFailed"),
        );
      }
    },
    [
      advanceWorkflowRunMutation,
      currentNode,
      ensureCurrentUserCanAct,
      issue.id,
      issue.workspaceId,
      syncWorkflowIssue,
      tWorkflows,
    ],
  );

  const handlePrevious = useCallback(async () => {
    if (!workflow || !workflowIssue || !currentNode) {
      return;
    }

    if (!ensureCurrentUserCanAct()) {
      return;
    }

    try {
      const updatedIssue = await revertWorkflowRunMutation.mutateAsync({
        workspaceId: issue.workspaceId,
        issueId: issue.id,
        data: {},
      });

      syncWorkflowIssue(updatedIssue);
    } catch (error) {
      console.error("Failed to revert workflow run", error);
      toast.error(
        error instanceof Error ? error.message : tWorkflows("runtime.revertFailed"),
      );
    }
  }, [
    currentNode,
    ensureCurrentUserCanAct,
    issue.id,
    issue.workspaceId,
    revertWorkflowRunMutation,
    syncWorkflowIssue,
    tWorkflows,
    workflow,
    workflowIssue,
  ]);

  const hasNextStep = useMemo(() => {
    if (!workflow || !currentNode) {
      return false;
    }

    return workflow.edges.some((edge: Edge) => edge.source === currentNode.id);
  }, [currentNode, workflow]);

  const isFinalNode = useMemo(() => {
    if (!workflow || !currentNode) {
      return false;
    }

    return !workflow.edges.some((edge: Edge) => edge.source === currentNode.id);
  }, [currentNode, workflow]);

  const canAdvance = useMemo(() => {
    if (!currentNode) {
      return false;
    }

    return hasNextStep || isFinalNode;
  }, [currentNode, hasNextStep, isFinalNode]);

  const canPrevious = useMemo(() => {
    if (!workflow || !currentNode) {
      return false;
    }

    return workflow.edges.some((edge: Edge) => edge.target === currentNode.id);
  }, [currentNode, workflow]);

  return {
    handleStatusUpdate,
    handleAdvance,
    handlePrevious,
    handleSubmitRecord,
    handleConfirmWorkflowCompletion,
    isRecordModalOpen,
    setIsRecordModalOpen,
    isCompletionConfirmOpen,
    setIsCompletionConfirmOpen,
    canAdvance,
    isFinalNode,
    canPrevious,
    isBusy:
      updateWorkflowRunStatusMutation.isPending ||
      advanceWorkflowRunMutation.isPending ||
      revertWorkflowRunMutation.isPending,
  };
};

export default useWorkflowNodeStatus;
