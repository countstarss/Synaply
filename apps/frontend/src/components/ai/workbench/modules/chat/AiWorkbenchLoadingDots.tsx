"use client";

import { cn } from "@/lib/utils";

interface AiWorkbenchLoadingDotsProps {
  className?: string;
}

export function AiWorkbenchLoadingDots({
  className,
}: AiWorkbenchLoadingDotsProps) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <span className="animate-[loading-dot_1.4s_ease-in-out_infinite]">.</span>
      <span className="animate-[loading-dot_1.4s_ease-in-out_0.2s_infinite]">.</span>
      <span className="animate-[loading-dot_1.4s_ease-in-out_0.4s_infinite]">.</span>
    </span>
  );
}
