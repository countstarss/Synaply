"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { RiLayoutGridLine, RiListUnordered } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type IssueViewMode = "list" | "board";

interface IssueViewModeToggleProps {
  value: IssueViewMode;
  onValueChange: (value: IssueViewMode) => void;
  className?: string;
}

export function IssueViewModeToggle({
  value,
  onValueChange,
  className,
}: IssueViewModeToggleProps) {
  const tIssues = useTranslations("issues");
  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-app-border bg-app-bg/70 p-0.5",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onValueChange("list")}
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition hover:bg-transparent",
          value === "list"
            ? "bg-app-content-bg text-app-text-primary shadow-sm hover:bg-app-content-bg"
            : "text-app-text-secondary hover:text-app-text-primary",
        )}
      >
        <RiListUnordered className="size-3.5" />
        {tIssues("page.viewMode.list")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onValueChange("board")}
        className={cn(
          "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition hover:bg-transparent",
          value === "board"
            ? "bg-app-content-bg text-app-text-primary shadow-sm hover:bg-app-content-bg"
            : "text-app-text-secondary hover:text-app-text-primary",
        )}
      >
        <RiLayoutGridLine className="size-3.5" />
        {tIssues("page.viewMode.board")}
      </Button>
    </div>
  );
}
