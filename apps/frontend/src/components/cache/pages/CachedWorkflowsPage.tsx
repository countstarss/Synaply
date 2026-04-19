"use client";

import React from "react";
import WorkflowsPageContent from "@/components/workflow/WorkflowsPageContent";

export const CachedWorkflowsPage = React.memo(() => {
  return (
    <div className="h-full w-full">
      <WorkflowsPageContent />
    </div>
  );
});

CachedWorkflowsPage.displayName = "CachedWorkflowsPage";
