"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function ProjectSurfaceCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-app-border bg-app-content-bg/80 shadow-sm",
        className,
      )}
    >
      <div className="shrink-0 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-app-text-primary">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-xs leading-5 text-app-text-secondary">
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      </div>
      <div className="min-h-0 flex-1 px-5 pb-5">{children}</div>
    </section>
  );
}
