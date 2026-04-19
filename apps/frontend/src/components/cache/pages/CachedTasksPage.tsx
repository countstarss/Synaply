"use client";

import React from "react";
import TasksPageContent from "@/components/tasks/TasksPageContent";

export const CachedTasksPage = React.memo(() => {
  return (
    <div className="h-full w-full">
      <TasksPageContent />
    </div>
  );
});

CachedTasksPage.displayName = "CachedTasksPage";
