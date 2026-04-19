"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { RiArrowLeftLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { useIssue } from "@/hooks/useIssueApi";
import { WorkflowIssueDetailFlow } from "./WorkflowIssueDetailFlow";

interface WorkflowIssueDetailProps {
  issueId: string;
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  displayMode?: "dialog" | "page";
}

export default function WorkflowIssueDetail({
  issueId,
  workspaceId,
  isOpen,
  onClose,
  onUpdate,
}: WorkflowIssueDetailProps) {
  const tIssues = useTranslations("issues");
  const { data: issue, isLoading } = useIssue(workspaceId, issueId, {
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const content = (
    <ReactFlowProvider>
      {issue ? (
        <WorkflowIssueDetailFlow
          issue={issue}
          isOpen={isOpen}
          onClose={onClose}
          onUpdate={onUpdate}
        />
      ) : (
        <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 text-app-text-muted">
          <div>
            {isLoading
              ? tIssues("workflowDetail.loading")
              : tIssues("workflowDetail.notFound")}
          </div>
          {!isLoading && (
            <Button
              type="button"
              variant="outline"
              className="border-app-border bg-transparent text-app-text-primary"
              onClick={onClose}
            >
              <RiArrowLeftLine className="h-4 w-4" />
              {tIssues("workflowDetail.back")}
            </Button>
          )}
        </div>
      )}
    </ReactFlowProvider>
  );

  return <div className="h-full w-full overflow-hidden">{content}</div>;
}
