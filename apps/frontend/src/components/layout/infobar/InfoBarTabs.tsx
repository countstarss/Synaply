"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: string;
  href?: string;
}

interface InfoBarTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const InfoBarTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}: InfoBarTabsProps) => {
  return (
    <div className={cn("flex items-center gap-6", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "text-sm font-medium px-3 py-1 rounded-md transition-colors cursor-pointer",
            activeTab === tab.id
              ? "text-gray-800 bg-blue-900/20 dark:bg-gray-200"
              : "text-gray-400"
          )}
        >
          <p className="whitespace-nowrap">{tab.label}</p>
        </button>
      ))}
    </div>
  );
};

export default InfoBarTabs;
