"use client";

import React from "react";
import DocsPage from "@/components/shared/docs/DocsPage";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/context/AuthContext";

// NOTE: 主导出组件 - 个人文档页面（在团队工作空间中）
export default function PersonalDocPage() {
  // TODO: 从实际的认证和工作空间上下文中获取这些值
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();

  const workspaceId = currentWorkspace?.id || ""; // 应该从路由或上下文中获取（注意这是团队工作空间ID）
  const workspaceType = currentWorkspace?.type || "TEAM"; // 虽然是个人文档，但在团队工作空间中
  const userId = user?.id || ""; // 应该从认证上下文中获取
  const context = "team-personal" as const; // 团队工作空间中的个人文档上下文

  return (
    <div className="h-full min-h-0 bg-app-bg">
      <DocsPage
        workspaceId={workspaceId}
        workspaceType={workspaceType}
        userId={userId}
        context={context}
      />
    </div>
  );
}
