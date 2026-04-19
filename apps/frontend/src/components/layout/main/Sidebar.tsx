"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarBrand from "../sidebar/SidebarBrand";
import SidebarNavItem from "../sidebar/SidebarNavItem";
import SettingSection from "../sidebar/SettingSection";
import SidebarFooter from "../sidebar/SidebarFooter";
import UtilsSidebarSection from "../sidebar/UtilsSidebarSection";
import AiSidebarSection from "../sidebar/AiSidebarSection";
import { useSidebarStore } from "@/stores/sidebar";
import { useSidebarMode } from "@/hooks/useSidebarMode";
import { useRouter } from "@/i18n/navigation";
import { getWorkspaceNavItems } from "@/lib/navigation/page-registry";
import { buildSettingsSections } from "@/lib/data/settingData";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTeam } from "@/hooks/useTeam";
import { CreateTeamDialog } from "@/components/dialogs/CreateTeamDialog";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Team } from "@/lib/fetchers/team";
import { useInboxSummary } from "@/hooks/useInbox";

interface SidebarProps {
  className?: string;
}

const Sidebar = React.memo(({ className }: SidebarProps) => {
  const { isOpen: sidebarOpen } = useSidebarStore();
  const t = useTranslations("shell");
  const { mode, switchToMain, returnToMainPath, isModeTransitionEnabled } =
    useSidebarMode();
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { teams = [] } = useTeam();
  const { setCurrentWorkspaceId } = useWorkspaceStore();
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const navItems = getWorkspaceNavItems(t, currentWorkspace?.type);
  const workspaceId = currentWorkspace?.id ?? "";
  const { data: inboxSummary } = useInboxSummary(workspaceId, {
    enabled: Boolean(workspaceId),
  });
  const inboxPendingCount = useMemo(() => {
    if (!inboxSummary) {
      return 0;
    }

    return (
      inboxSummary.needsResponse +
      inboxSummary.needsAttention +
      inboxSummary.following +
      inboxSummary.digest +
      inboxSummary.snoozed
    );
  }, [inboxSummary]);
  const modeTransitionClass = isModeTransitionEnabled
    ? "transition-transform duration-300 ease-in-out"
    : "transition-none";

  const handleBackToMain = useCallback(() => {
    router.push(returnToMainPath);
    switchToMain({ skipAnimation: true });
  }, [returnToMainPath, router, switchToMain]);

  const handleOpenCreateTeamDialog = useCallback(() => {
    setIsCreateTeamDialogOpen(true);
  }, []);

  const handleTeamCreated = useCallback(
    async (team: Team) => {
      if (team.workspace?.id) {
        setCurrentWorkspaceId(team.workspace.id);
        localStorage.setItem("currentWorkspaceId", team.workspace.id);
      }

      router.push(`/settings/team/${team.id}`);
    },
    [router, setCurrentWorkspaceId],
  );

  const settingSections = useMemo(
    () => buildSettingsSections(t, teams, handleOpenCreateTeamDialog),
    [handleOpenCreateTeamDialog, t, teams],
  );

  return (
    <ContextMenuWrapper>
      <div
        className={cn(
          "w-64 h-[calc(100vh-16px)] bg-app-bg md:flex hidden flex-col my-2 ml-2 mr-0 border border-app-border rounded-lg overflow-hidden",
          "transition-transform duration-300 ease-in-out select-none",
          !sidebarOpen && "pointer-events-none",
          className,
        )}
      >
        {/* 品牌标识 - 始终显示 */}
        <SidebarBrand />

        {/* 滑动内容容器 */}
        <div className="flex-1 relative overflow-hidden">
          {/* 主要导航内容 */}
          <div
            className={cn(
              "absolute inset-0",
              modeTransitionClass,
              mode === "settings" ? "-translate-x-full" : "translate-x-0",
            )}
          >
            {/* MARK: Personal导航
             */}
            <div className="h-full overflow-y-auto scrollbar-hidden">
              {currentWorkspace?.type === "PERSONAL" ? (
                /* PERSONAL空间的简化导航 */
                <div className="space-y-1 py-2">
                  {navItems.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      icon={item.icon}
                      label={item.label}
                      href={item.href}
                      badgeCount={
                        item.href === "/inbox" ? inboxPendingCount : undefined
                      }
                    />
                  ))}
                  <AiSidebarSection />
                  <UtilsSidebarSection />
                </div>
              ) : (
                /* MARK: TEAM 导航
                 */
                <>
                  <div className="flex flex-col py-2 gap-1">
                    {navItems.map((item) => (
                      <SidebarNavItem
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        badgeCount={
                          item.href === "/inbox" ? inboxPendingCount : undefined
                        }
                      />
                    ))}
                  </div>

                  <AiSidebarSection />
                  <UtilsSidebarSection />
                </>
              )}
            </div>
          </div>

          {/* MARK: 设置菜单内容
           */}
          <div
            className={cn(
              "absolute inset-0",
              modeTransitionClass,
              mode === "settings" ? "translate-x-0" : "translate-x-full",
            )}
          >
            <div className="h-full overflow-y-auto scrollbar-hidden">
              {/* 返回按钮 */}
              <div className="px-2 py-2 border-b border-app-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToMain}
                  className="flex items-center gap-2 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t("sidebar.backToMain")}</span>
                </Button>
              </div>

              {/* 设置分组 */}
              <div className="py-2 px-2">
                {settingSections.map((section) => (
                  <SettingSection key={section.id} section={section} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 底部品牌信息 - 始终显示 */}
        <SidebarFooter />

        <CreateTeamDialog
          open={isCreateTeamDialogOpen}
          onOpenChange={setIsCreateTeamDialogOpen}
          onCreated={handleTeamCreated}
        />
      </div>
    </ContextMenuWrapper>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
