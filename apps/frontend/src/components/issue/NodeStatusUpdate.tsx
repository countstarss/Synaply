"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiMessageLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface NodeStatusUpdateProps {
  nodeId: string;
  issueTitle: string;
  currentStatus: string;
  assignee?: string;
  canEdit: boolean;
  onStatusUpdate: (nodeId: string, status: string, comment?: string) => void;
  onAdvance: () => void;
  onPrevious: () => void;
  canAdvance: boolean;
  isFinalNode: boolean;
  canPrevious: boolean;
}

export function NodeStatusUpdate({
  nodeId,
  issueTitle,
  currentStatus,
  assignee,
  canEdit,
  onStatusUpdate,
  onAdvance,
  onPrevious,
  canAdvance,
  isFinalNode,
  canPrevious,
}: NodeStatusUpdateProps) {
  const tIssues = useTranslations("issues");
  const [comment, setComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const canMoveForward = canEdit && canAdvance && currentStatus === "DONE";

  const statusOptions = [
    { value: "TODO", label: tIssues("status.todo") },
    { value: "IN_PROGRESS", label: tIssues("status.inProgress") },
    { value: "AMOST_DONE", label: tIssues("status.almostDone") },
    { value: "DONE", label: tIssues("status.done") },
  ];
  const activeStatusIndex = Math.max(
    statusOptions.findIndex((option) => option.value === currentStatus),
    0,
  );

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== currentStatus) {
      onStatusUpdate(nodeId, newStatus, comment.trim() || undefined);
      setComment("");
      setShowCommentInput(false);
    }
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      onStatusUpdate(nodeId, currentStatus, comment.trim());
      setComment("");
      setShowCommentInput(false);
    }
  };

  return (
    <Card className="border-app-border bg-app-content-bg shadow-none">
      <CardContent className="space-y-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-app-text-primary">
              {tIssues("nodeStatus.title")}
            </div>
            <p className="mt-1 text-xs text-app-text-muted">
              {tIssues("nodeStatus.description")}
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-md border-app-border px-2.5 py-1 text-xs font-normal text-app-text-primary"
          >
            {tIssues("nodeStatus.owner", {
              name: assignee || tIssues("nodeStatus.unassigned"),
            })}
          </Badge>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-app-border bg-transparent px-2 text-app-text-primary"
            disabled={!canPrevious}
            onClick={onPrevious}
          >
            <RiArrowLeftLine className="h-4 w-4" />
            {tIssues("nodeStatus.previous")}
          </Button>

          <div className="relative flex min-w-0 flex-1 items-start justify-between px-2">
            <div className="absolute left-8 right-8 top-3 h-px bg-app-border" />
            {statusOptions.map((option, optionIndex) => {
              const isActive = currentStatus === option.value;
              const isReached = optionIndex <= activeStatusIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={!canEdit}
                  className={cn(
                    "relative z-10 flex min-w-[52px] flex-col items-center gap-1 text-center text-[11px] transition disabled:cursor-not-allowed disabled:opacity-60",
                    isActive
                      ? "text-app-text-primary"
                      : "text-app-text-muted hover:text-app-text-primary",
                  )}
                  onClick={() => handleStatusChange(option.value)}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium transition",
                      isActive
                        ? "border-sky-500 bg-sky-600 text-white shadow-[0_0_0_3px_rgba(14,165,233,0.16)]"
                        : isReached
                          ? "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-200"
                          : "border-app-border bg-app-bg text-app-text-muted",
                    )}
                  >
                    {optionIndex + 1}
                  </span>
                  <span className="leading-4">{option.label}</span>
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            size="sm"
            className="h-8 bg-sky-600 px-2 text-white hover:bg-sky-500"
            disabled={!canMoveForward}
            onClick={onAdvance}
          >
            {isFinalNode
              ? tIssues("nodeStatus.finishWorkflow")
              : tIssues("nodeStatus.next")}
            <RiArrowRightLine className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-app-border pt-2">
          <p className="text-xs leading-5 text-app-text-muted">
            {!canEdit
              ? tIssues("nodeStatus.cannotEdit")
              : currentStatus !== "DONE"
                ? isFinalNode
                  ? tIssues("nodeStatus.finishHint")
                  : tIssues("nodeStatus.completeHint")
                : isFinalNode
                  ? tIssues("nodeStatus.finalReady", { title: issueTitle })
                  : tIssues("nodeStatus.ready")}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-md text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
            onClick={() => setShowCommentInput((value) => !value)}
          >
            <RiMessageLine className="h-4 w-4" />
            {tIssues("nodeStatus.note")}
          </Button>
        </div>

        {showCommentInput && (
          <div className="flex gap-2">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={tIssues("nodeStatus.notePlaceholder")}
              rows={2}
              className="min-h-16 border-app-border bg-app-bg text-app-text-primary"
            />
            <Button
              type="button"
              className="self-end bg-sky-600 text-white hover:bg-sky-500"
              disabled={!canEdit || !comment.trim()}
              onClick={handleAddComment}
            >
              {tIssues("nodeStatus.add")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NodeStatusUpdate;
