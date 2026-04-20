"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { RiArrowLeftLine, RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useIssue } from "@/hooks/useIssueApi";
import { isWorkflowIssue } from "@/lib/fetchers/issue";

const WorkflowIssueDetail = dynamic(
  () => import("@/components/issue/WorkflowIssueDetail"),
  { loading: () => null },
);
const NormalIssueDetail = dynamic(
  () => import("@/components/shared/issue/NormalIssueDetail"),
  { loading: () => null },
);

interface IssueDetailPageSurfaceProps {
  issueId: string;
  workspaceId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface IssueDetailFallbackProps {
  title: string;
  description: string;
  isLoading?: boolean;
  onClose: () => void;
}

function IssueDetailFallback({
  title,
  description,
  isLoading = false,
  onClose,
}: IssueDetailFallbackProps) {
  const tIssues = useTranslations("issues");
  return (
    <div className="flex h-full w-full items-center justify-center bg-app-bg px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        {isLoading && (
          <RiLoader4Line className="mb-4 size-6 animate-spin text-app-text-secondary" />
        )}
        <h2 className="text-base font-semibold text-app-text-primary">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-app-text-secondary">
          {description}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5 rounded-lg border-app-border bg-transparent text-app-text-primary"
          onClick={onClose}
        >
          <RiArrowLeftLine className="h-4 w-4" />
          {tIssues("detailPage.backToList")}
        </Button>
      </div>
    </div>
  );
}

export default function IssueDetailPageSurface({
  issueId,
  workspaceId,
  onClose,
  onUpdate,
}: IssueDetailPageSurfaceProps) {
  const tIssues = useTranslations("issues");
  const { loading: isAuthLoading } = useAuth();
  const { data: issue, isLoading } = useIssue(workspaceId, issueId, {
    enabled: Boolean(workspaceId && issueId),
  });

  if (!workspaceId) {
    return (
      <IssueDetailFallback
        title={tIssues("detailPage.missingWorkspaceTitle")}
        description={tIssues("detailPage.missingWorkspaceDescription")}
        onClose={onClose}
      />
    );
  }

  if (isAuthLoading || isLoading || !issue) {
    return (
      <IssueDetailFallback
        title={
          isAuthLoading || isLoading
            ? tIssues("detailPage.loadingTitle")
            : tIssues("detailPage.notFoundTitle")
        }
        description={
          isAuthLoading || isLoading
            ? tIssues("detailPage.loadingDescription")
            : tIssues("detailPage.notFoundDescription")
        }
        isLoading={isAuthLoading || isLoading}
        onClose={onClose}
      />
    );
  }

  if (isWorkflowIssue(issue)) {
    return (
      <WorkflowIssueDetail
        issueId={issue.id}
        workspaceId={workspaceId}
        isOpen
        onClose={onClose}
        onUpdate={onUpdate}
        displayMode="page"
      />
    );
  }

  return (
    <NormalIssueDetail
      issueId={issue.id}
      workspaceId={workspaceId}
      isOpen
      onClose={onClose}
      onUpdate={(updatedIssue) => {
        void updatedIssue;
        onUpdate();
      }}
      displayMode="page"
    />
  );
}
