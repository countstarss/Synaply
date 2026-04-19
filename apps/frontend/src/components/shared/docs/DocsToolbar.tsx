"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { RiExpandLeftRightLine, RiContractLeftRightLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocsToolbarProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  className?: string;
}

export default function DocsToolbar({
  isExpanded,
  onToggleExpand,
  className,
}: DocsToolbarProps) {
  const tDocs = useTranslations("docs");

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onToggleExpand}
      title={
        isExpanded
          ? tDocs("toolbar.collapseTitle")
          : tDocs("toolbar.expandTitle")
      }
      className={cn(
        "h-9 rounded-lg border-app-border/60 bg-app-bg/70 px-3 text-app-text-secondary shadow-none backdrop-blur hover:bg-app-button-hover hover:text-app-text-primary",
        className,
      )}
    >
      {isExpanded ? (
        <RiContractLeftRightLine className="size-4" />
      ) : (
        <RiExpandLeftRightLine className="size-4" />
      )}
      <span className="hidden sm:inline">
        {isExpanded ? tDocs("toolbar.collapse") : tDocs("toolbar.expand")}
      </span>
    </Button>
  );
}
