"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, PanelLeft, PanelRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getWorkspaceNavItems } from "@/lib/navigation/page-registry";
import Link from "next/link";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";
// import RouterIndicator from "@/components/global/RouterIndicator";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import TabList from "../infobar/TabList";
// InfoBar 子组件
// import ViewToggle, { defaultViews } from "../infobar/ViewToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/hooks/useWorkspace";

interface InfoBarProps {
  title?: string;
  subtitle?: string;
  showViewToggle?: boolean;
  showSearch?: boolean;
  className?: string;
}

const InfoBar = ({ showViewToggle = true, className }: InfoBarProps) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("shell");
  // const [activeView, setActiveView] = useState("list");
  const { isOpen, toggleSidebar } = useSidebarStore();
  const { currentWorkspace } = useWorkspace();
  const mobileNavItems = getWorkspaceNavItems(t, currentWorkspace?.type);

  const onGetPayment = async () => {};

  useEffect(() => {
    onGetPayment();
  }, []);

  // const handleViewChange = (viewId: string) => {
  //   setActiveView(viewId);
  //   // 这里可以添加视图切换逻辑
  // };

  return (
    <ContextMenuWrapper>
      <div className={cn("flex flex-col w-full bg-app-bg", className)}>
        {/* 顶部栏 */}
        <div className="flex flex-row justify-between gap-6 items-center p-2 relative min-h-[56px]">
          {/* 左侧区域 */}
          <div
            className={cn("flex flex-row gap-3 items-center min-w-0 flex-1")}
          >
            {/* 侧边栏切换按钮 */}
            <button
              onClick={toggleSidebar}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
                "hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                "text-muted-foreground hover:text-foreground group",
                "md:opacity-100 opacity-0",
                "md:block hidden pl-2"
              )}
              title={
                isOpen ? t("infobar.hideSidebar") : t("infobar.showSidebar")
              }
              disabled={false}
            >
              {isOpen ? (
                <PanelLeft
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    !isOpen && "",
                    "group-hover:scale-110 group-hover:rotate-180"
                  )}
                />
              ) : (
                <PanelRight
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    !isOpen && "",
                    "group-hover:scale-110 group-hover:rotate-180"
                  )}
                />
              )}
            </button>

            {/* NOTE: PC端：侧边栏隐藏时显示TabList */}
            <div
              className={cn(
                "hidden md:block transition-all duration-300",
                isOpen ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              <TabList />
            </div>

            {/* 移动端菜单 */}
            <div className="flex md:hidden gap-4 items-center">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger>
                  <Menu className="text-xl text-white" />
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-1/2 bg-app-bg border-app-border"
                >
                  <DialogTitle className="sr-only">
                    {t("infobar.menu")}
                  </DialogTitle>
                  <div className="flex flex-col gap-4 p-4">
                    {mobileNavItems.map((menuItem) => (
                      <Link
                        href={menuItem.href}
                        key={menuItem.label}
                        onClick={() => setOpen(false)}
                      >
                        <h2 className="text-lg text-white hover:text-blue-400">
                          {menuItem.label}
                        </h2>
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* 右侧区域 */}
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />

            {/* 视图切换 */}
            {showViewToggle && (
              // <ViewToggle
              //   views={defaultViews}
              //   activeView={activeView}
              //   onViewChange={handleViewChange}
              // />
              <></>
            )}
          </div>
        </div>
      </div>
    </ContextMenuWrapper>
  );
};

export default InfoBar;
