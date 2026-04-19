"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn, isRouteActive } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import { getWorkspaceNavItems } from "@/lib/navigation/page-registry";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function TabList() {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const { setActiveTab } = useSidebarStore();
  const { currentWorkspace } = useWorkspace();
  const tabItems = getWorkspaceNavItems(t, currentWorkspace?.type);

  return (
    <div className="flex items-center gap-2 animate-in slide-in-from-left-5 duration-300">
      {tabItems.map((item) => {
        const Icon = item.icon;
        const isActive = isRouteActive(pathname, item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setActiveTab(item.label)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
              "transition-all duration-200 hover:scale-105",
              "hover:bg-accent/80 hover:text-accent-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              isActive
                ? "border-transparent bg-[#2b2b2b] text-white shadow-none dark:text-gray-300"
                : "border-border/30 bg-background/60 text-muted-foreground backdrop-blur-sm hover:text-foreground"
            )}
            title={item.label}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isActive && "scale-110"
              )}
            />
            <span className="hidden lg:inline whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
