"use client";

import React from "react";
import { cn } from "@/lib/utils";
import SettingNavItem from "./SettingNavItem";
import { type SettingSection as SettingSectionType } from "@/lib/data/settingData";

interface SettingSectionProps {
  section: SettingSectionType;
  className?: string;
}

const SettingSection = React.memo(
  ({ section, className }: SettingSectionProps) => {
    return (
      <div className={cn("py-2", className)}>
        <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {section.title}
        </div>
        <div className="space-y-1 mt-2">
          {section.items.map((item) => (
            <SettingNavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              href={item.href}
              action={item.action}
            />
          ))}
        </div>
      </div>
    );
  }
);

SettingSection.displayName = "SettingSection";

export default SettingSection;
