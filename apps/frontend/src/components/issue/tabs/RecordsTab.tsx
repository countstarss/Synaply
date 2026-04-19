"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";

interface StepRecord {
  id: string;
  stepName: string;
  index: number;
  resultText?: string;
  createdAt: string;
  assignee?: {
    user?: {
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
}

interface RecordsTabProps {
  records: StepRecord[];
}

export const RecordsTab: React.FC<RecordsTabProps> = ({ records }) => {
  const tIssues = useTranslations("issues");
  const locale = useLocale();

  return (
    <div className="h-full p-4 overflow-y-auto">
      {records.map((rec) => (
        <div key={rec.id} className="border-b border-app-border py-2 text-sm">
          <div className="font-medium">
            {tIssues("tabs.records.stepLabel", {
              name: rec.stepName,
              step: rec.index,
            })}
          </div>
          <div className="text-app-text-secondary mt-1 whitespace-pre-wrap">
            {rec.resultText}
          </div>
          <div className="text-xs text-app-text-muted mt-1">
            {(rec.assignee?.user?.name ||
              rec.assignee?.user?.email?.split("@")[0] ||
              tIssues("tabs.records.unknownMember")) +
              " · " +
              new Date(rec.createdAt).toLocaleString(locale)}
          </div>
        </div>
      ))}
      {records.length === 0 && (
        <div className="text-app-text-muted text-center py-8">
          {tIssues("tabs.records.empty")}
        </div>
      )}
    </div>
  );
};

export default RecordsTab;
