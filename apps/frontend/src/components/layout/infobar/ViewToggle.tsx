"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { List, LayoutGrid } from "lucide-react";

interface ViewOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ViewToggleProps {
  views: ViewOption[];
  activeView: string;
  onViewChange: (viewId: string) => void;
  className?: string;
}

const ViewToggle = ({
  views,
  activeView,
  onViewChange,
  className,
}: ViewToggleProps) => {
  return (
    <div
      className={cn(
        "flex items-center bg-app-content-bg rounded-md p-1 border border-app-border",
        className
      )}
    >
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors cursor-pointer",
            activeView === view.id ? "bg-app-bg shadow-sm" : "text-gray-600"
          )}
        >
          {view.icon}
          <span>{view.label}</span>
        </button>
      ))}
    </div>
  );
};

// 预定义的视图选项
export const defaultViews: ViewOption[] = [
  {
    id: "list",
    label: "List",
    icon: <List size={16} />,
  },
  {
    id: "board",
    label: "Board",
    icon: <LayoutGrid size={16} />,
  },
];

export default ViewToggle;
