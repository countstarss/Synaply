"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RiCheckboxCircleLine, RiCloseCircleLine } from "react-icons/ri";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  confirmAiApproval,
  getAiApproval,
  rejectAiApproval,
} from "@/lib/fetchers/ai-thread";
import type { AiApprovalRequestPart } from "@/lib/ai/types";

interface AiApprovalRequestCardProps {
  threadId: string;
  part: AiApprovalRequestPart;
}

function getExecutionStatus(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const status = (value as { status?: unknown }).status;
  return typeof status === "string" ? status : null;
}

function getExecutionMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const message = (value as { message?: unknown }).message;
  return typeof message === "string" ? message : null;
}

export function AiApprovalRequestCard({
  threadId,
  part,
}: AiApprovalRequestCardProps) {
  const tAi = useTranslations("ai");
  const { session } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [resolvedStatus, setResolvedStatus] = useState<
    AiApprovalRequestPart["status"]
  >(part.status ?? "PENDING");

  const workspaceId = currentWorkspace?.id ?? null;
  const approvalQuery = useQuery({
    queryKey: ["ai-approval", workspaceId, threadId, part.approvalId],
    queryFn: async () => {
      if (!workspaceId || !session?.access_token) {
        throw new Error(tAi("thread.approval.readStatusFailed"));
      }

      return getAiApproval(
        workspaceId,
        threadId,
        part.approvalId,
        session.access_token,
      );
    },
    enabled: Boolean(workspaceId && session?.access_token),
  });
  const currentStatus =
    (approvalQuery.data?.status as AiApprovalRequestPart["status"] | undefined) ??
    resolvedStatus;
  const isResolved = currentStatus !== "PENDING";
  const previewItems = Array.isArray(part.items) ? part.items : [];
  const isBatchApproval = previewItems.length > 0;
  const previewText = useMemo(() => {
    if (isBatchApproval) {
      return "";
    }

    try {
      return JSON.stringify(part.preview ?? part.input, null, 2);
    } catch {
      return String(part.preview ?? part.input);
    }
  }, [isBatchApproval, part.input, part.preview]);

  const refreshThread = async () => {
    if (!workspaceId) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["ai-thread", workspaceId, threadId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["ai-thread-messages", workspaceId, threadId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["ai-threads", workspaceId],
      }),
    ]);
  };

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !session?.access_token) {
        throw new Error(tAi("thread.approval.confirmUnavailable"));
      }

      return confirmAiApproval(
        workspaceId,
        threadId,
        part.approvalId,
        session.access_token,
      );
    },
    onSuccess: async (data) => {
      setResolvedStatus("CONFIRMED");
      const status = getExecutionStatus(data.execution);
      const message = getExecutionMessage(data.execution);

      if (status === "failed" || status === "blocked") {
        toast.error(message ?? tAi("thread.approval.actionIncomplete"));
      } else {
        toast.success(tAi("thread.approval.confirmSuccess"));
      }

      await refreshThread();
      await approvalQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : tAi("thread.approval.confirmFailed"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !session?.access_token) {
        throw new Error(tAi("thread.approval.rejectUnavailable"));
      }

      return rejectAiApproval(
        workspaceId,
        threadId,
        part.approvalId,
        session.access_token,
      );
    },
    onSuccess: async () => {
      setResolvedStatus("REJECTED");
      toast.success(tAi("thread.approval.rejectSuccess"));
      await refreshThread();
      await approvalQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : tAi("thread.approval.rejectFailed"));
    },
  });

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
          Approval
        </span>
        <span className="text-xs text-amber-800/80">
          {resolvedStatus === "CONFIRMED"
            ? tAi("thread.approval.statuses.confirmed")
            : currentStatus === "CONFIRMED"
              ? tAi("thread.approval.statuses.confirmed")
              : currentStatus === "REJECTED"
                ? tAi("thread.approval.statuses.rejected")
                : currentStatus === "EXPIRED"
                  ? tAi("thread.approval.statuses.expired")
                  : tAi("thread.approval.statuses.pending")}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium leading-6">{part.summary}</p>
      <p className="mt-2 text-xs leading-5 text-amber-900/75">
        {tAi("thread.approval.action", { value: part.actionKey })}
      </p>
      {isBatchApproval ? (
        <div className="mt-3 rounded-xl border border-amber-200/80 bg-white/70 p-3">
          <p className="text-xs font-medium leading-5 text-amber-900/80">
            {tAi("thread.approval.batchSummary", {
              count: previewItems.length,
            })}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {previewItems.map((item, index) => {
              const title =
                (typeof item.input.title === "string" && item.input.title) ||
                (typeof item.input.name === "string" && item.input.name) ||
                item.summary ||
                item.actionKey;

              return (
                <div
                  key={`${part.approvalId}-${item.actionKey}-${index}`}
                  className="rounded-lg border border-amber-100 bg-white/80 px-3 py-2"
                >
                  <p className="text-sm font-medium leading-5 text-amber-950">
                    {index + 1}. {title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-900/75">
                    {tAi("thread.approval.action", { value: item.actionKey })}
                    {item.status
                      ? ` · ${tAi("thread.approval.previewStatus", {
                          value: item.status,
                        })}`
                      : ""}
                  </p>
                  {item.message ? (
                    <p className="mt-1 text-xs leading-5 text-amber-900/70">
                      {item.message}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {previewText ? (
        <pre className="mt-3 overflow-auto rounded-xl border border-amber-200/80 bg-white/70 p-3 text-xs leading-5 text-amber-950">
          {previewText}
        </pre>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-amber-500 text-white hover:bg-amber-400"
          disabled={
            isResolved || confirmMutation.isPending || rejectMutation.isPending
          }
          onClick={() => void confirmMutation.mutateAsync()}
        >
          <RiCheckboxCircleLine className="mr-2 h-4 w-4" />
          {tAi("thread.approval.confirm")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-200 bg-white/70 text-amber-900 hover:bg-white"
          disabled={
            isResolved || confirmMutation.isPending || rejectMutation.isPending
          }
          onClick={() => void rejectMutation.mutateAsync()}
        >
          <RiCloseCircleLine className="mr-2 h-4 w-4" />
          {tAi("thread.approval.reject")}
        </Button>
      </div>
    </div>
  );
}
