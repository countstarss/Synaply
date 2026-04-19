"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
  className?: string;
}

const SidebarFooter = ({ className }: SidebarFooterProps) => {
  const tShell = useTranslations("shell");

  return (
    <div
      className={cn(
        "flex flex-col items-center px-4 py-6 mt-auto text-center",
        className
      )}
      >
      <div className="">
        <h3 className="text-lg font-bold mb-1">
          {tShell("sidebar.footer.title")}
        </h3>
        <p className="text-xs text-gray-400">
          {tShell("sidebar.footer.description")}
        </p>
      </div>
    </div>
  );
};

export default SidebarFooter;
