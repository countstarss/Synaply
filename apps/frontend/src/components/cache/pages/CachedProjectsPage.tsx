"use client";

import React from "react";
import ProjectsPageContent from "@/components/projects/ProjectsPageContent";

export const CachedProjectsPage = React.memo(() => {
  return (
    <div className="h-full w-full">
      <ProjectsPageContent />
    </div>
  );
});

CachedProjectsPage.displayName = "CachedProjectsPage";
