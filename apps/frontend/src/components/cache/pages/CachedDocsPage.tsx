"use client";

import React from "react";
import DocsPage from "@/components/shared/docs/DocsPage";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useSearchParams } from "next/navigation";

// 主导出组件
export const CachedDocsPage = React.memo(() => {
  const { currentWorkspace } = useWorkspace();
  const { session } = useAuth();
  const searchParams = useSearchParams();

  const workspaceId = currentWorkspace?.id || "";
  const workspaceType =
    currentWorkspace?.type === "PERSONAL" ? "PERSONAL" : "TEAM";
  const userId = session?.user?.id || currentWorkspace?.userId || "";
  const context = currentWorkspace?.type === "PERSONAL" ? "personal" : "team";
  const projectId = searchParams.get("projectId")?.trim() || undefined;

  return (
    <div className="h-full min-h-0 bg-app-bg">
      <DocsPage
        workspaceId={workspaceId}
        workspaceType={workspaceType}
        userId={userId}
        context={context}
        projectId={projectId}
      />
    </div>
  );
});

CachedDocsPage.displayName = "CachedDocsPage";
