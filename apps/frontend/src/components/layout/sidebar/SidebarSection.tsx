"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

const SidebarSection = ({
  title,
  children,
  isCollapsible = true,
  defaultExpanded = true,
  className,
}: SidebarSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    if (isCollapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={cn("mt-2", className)}>
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-xs font-semibold",
          "text-gray-400 tracking-wider select-none",
          isCollapsible && "cursor-pointer",
        )}
        onClick={toggleExpanded}
      >
        {isCollapsible && (
          <>
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </>
        )}
        <span>{title}</span>
      </div>
      {isExpanded && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
};

export default SidebarSection;
