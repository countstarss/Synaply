"use client";

import React from "react";
import { AiWorkbenchPage } from "@/components/ai/workbench/AiWorkbenchPage";

export const CachedIntelligencePage = React.memo(() => {
  return (
    <div className="h-full w-full">
      <AiWorkbenchPage />
    </div>
  );
});

CachedIntelligencePage.displayName = "CachedIntelligencePage";
