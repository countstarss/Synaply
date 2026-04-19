"use client";

import React from "react";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";

import { GlobalPageCache } from "@/components/cache/GlobalPageCache";
import AppEntryIntroGate from "@/components/layout/main/AppEntryIntroGate";
import Infobar from "@/components/layout/main/Infobar";
import Sidebar from "@/components/layout/main/Sidebar";
import { useAppearanceScope } from "@/hooks/useAppearanceScope";
import { shouldUseBorderlessContentShell } from "@/lib/navigation/page-registry";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function MainLayoutClient({ children }: LayoutProps) {
  useAppearanceScope();
  const { isOpen: sidebarOpen } = useSidebarStore();
  const segments = useSelectedLayoutSegments();
  const pathname = usePathname();
  const showCachedPage = segments.includes("(cached)");
  const useBorderlessContentShell = shouldUseBorderlessContentShell(pathname);
  const previousPathnameRef = React.useRef(pathname);
  const shouldBypassShellAnimation =
    pathname.includes("/settings") ||
    previousPathnameRef.current.includes("/settings");

  React.useEffect(() => {
    previousPathnameRef.current = pathname;
  }, [pathname]);

  return (
    <AppEntryIntroGate>
      <div className="flex h-screen overflow-hidden bg-app-bg">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            sidebarOpen ? "w-64 opacity-100" : "w-0 overflow-hidden opacity-0",
          )}
        >
          <Sidebar />
        </div>

        <div
          className={cn(
            "relative flex flex-1 flex-col overflow-hidden",
            sidebarOpen ? "ml-2" : "ml-0",
          )}
        >
          <Infobar />

          <div className="relative flex-1 overflow-hidden">
            <div
              className={cn(
                "absolute inset-0",
                !shouldBypassShellAnimation &&
                  "transition-all duration-300 ease-in-out",
                showCachedPage
                  ? "pointer-events-none translate-x-full opacity-0"
                  : "pointer-events-auto translate-x-0 opacity-100",
              )}
            >
              <main
                className={cn(
                  "mx-2 mb-2 h-[calc(100vh-64px)] overflow-hidden rounded-lg",
                  !useBorderlessContentShell &&
                    "border border-app-border bg-app-content-bg",
                )}
              >
                <div
                  className={cn(
                    "h-full flex-1 overflow-y-auto rounded-lg",
                    !useBorderlessContentShell && "bg-app-content-bg",
                  )}
                >
                  {children}
                </div>
              </main>
            </div>

            <div
              className={cn(
                "absolute inset-0",
                !shouldBypassShellAnimation &&
                  "transition-all duration-300 ease-in-out",
                showCachedPage
                  ? "pointer-events-auto translate-x-0 opacity-100"
                  : "pointer-events-none translate-x-[-100%] opacity-0",
              )}
            >
              <div className="flex h-full flex-col">
                <div
                  className={cn(
                    "mx-2 mb-2 h-[calc(100vh-64px)] overflow-hidden rounded-lg",
                    !useBorderlessContentShell &&
                      "border border-app-border bg-app-content-bg",
                  )}
                >
                  <GlobalPageCache />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppEntryIntroGate>
  );
}
