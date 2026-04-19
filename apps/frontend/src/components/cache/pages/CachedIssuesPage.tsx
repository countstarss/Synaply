"use client";

import React from "react";
import IssuesPageContent from "@/components/issue/IssuesPageContent";

export const CachedIssuesPage = React.memo(() => {
  return (
    <div className="h-full w-full">
      <IssuesPageContent />
    </div>
  );
});

CachedIssuesPage.displayName = "CachedIssuesPage";
