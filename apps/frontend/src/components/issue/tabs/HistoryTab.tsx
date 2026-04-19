"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  type IssueActivity,
  type WorkflowRunActivityMetadata,
} from "@/lib/fetchers/issue";

interface HistoryTabProps {
  activities: IssueActivity[];
}

function isWorkflowRunActivityMetadata(
  metadata: unknown,
): metadata is WorkflowRunActivityMetadata {
  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  const record = metadata as Record<string, unknown>;
  return record.kind === "workflow" && typeof record.eventType === "string";
}

function buildWorkflowHistoryDetails(
  metadata: WorkflowRunActivityMetadata,
  tIssues: (key: string) => string,
) {
  const details: Array<{ label: string; value: string }> = [];

  if (metadata.currentStepName?.trim()) {
    details.push({
      label: tIssues("workflowFlow.history.step"),
      value: metadata.currentStepName.trim(),
    });
  }

  if (metadata.targetName?.trim()) {
    details.push({
      label: tIssues("workflowFlow.history.target"),
      value: metadata.targetName.trim(),
    });
  }

  if (metadata.reason?.trim()) {
    details.push({
      label: tIssues("workflowFlow.history.reason"),
      value: metadata.reason.trim(),
    });
  }

  if (metadata.comment?.trim()) {
    details.push({
      label: tIssues("workflowFlow.history.note"),
      value: metadata.comment.trim(),
    });
  }

  if (metadata.resultText?.trim()) {
    details.push({
      label: tIssues("workflowFlow.history.result"),
      value: metadata.resultText.trim(),
    });
  }

  return details;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ activities }) => {
  const tIssues = useTranslations("issues");
  const locale = useLocale();

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="space-y-3 overflow-y-auto">
        {activities.map((activity) => (
          (() => {
            const workflowDetails = isWorkflowRunActivityMetadata(activity.metadata)
              ? buildWorkflowHistoryDetails(activity.metadata, tIssues)
              : [];

            return (
              <div key={activity.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-app-text-primary">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-app-text-muted">
                    <span>
                      {activity.actor?.user?.name ||
                        activity.actor?.user?.email?.split("@")[0] ||
                        activity.actorId}
                    </span>
                    <span>•</span>
                    <span>{new Date(activity.createdAt).toLocaleString(locale)}</span>
                  </div>
                  {workflowDetails.length > 0 && (
                    <div className="mt-2 space-y-2 rounded-lg border border-app-border bg-app-bg px-3 py-2">
                      {workflowDetails.map((detail) => (
                        <div
                          key={`${activity.id}-${detail.label}`}
                          className="space-y-1"
                        >
                          <div className="text-[11px] font-medium uppercase tracking-wide text-app-text-muted">
                            {detail.label}
                          </div>
                          <div className="whitespace-pre-wrap break-words text-xs leading-5 text-app-text-secondary">
                            {detail.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ))}
        {activities.length === 0 && (
          <div className="text-center text-app-text-muted py-8">
            {tIssues("tabs.history.empty")}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
