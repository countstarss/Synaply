"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRightCircle, LoaderCircle } from "lucide-react";
import type { AiClarificationOptionPart } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiClarificationOptionsCardProps {
  part: AiClarificationOptionPart;
  onSelect?: (value: string) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}

export function AiClarificationOptionsCard({
  part,
  onSelect,
  disabled = false,
  className,
}: AiClarificationOptionsCardProps) {
  const tAi = useTranslations("ai");
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "rounded-[24px] border border-black/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] p-3 shadow-[0_16px_48px_-36px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(26,26,29,0.96),rgba(14,14,16,0.98))] dark:shadow-[0_16px_48px_-36px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <p className="px-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-white/34">
        {part.title || tAi("thread.clarification.fallbackTitle")}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {part.options.map((option) => (
          <Button
            key={`${option.label}-${option.value}`}
            type="button"
            variant="ghost"
            className="h-auto justify-between rounded-[18px] border border-black/[0.06] bg-black/[0.02] px-3 py-3 text-left text-slate-900 hover:bg-black/[0.04] dark:border-white/8 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
            disabled={disabled || pendingValue !== null}
            onClick={async (event) => {
              event.stopPropagation();
              if (!onSelect || disabled || pendingValue !== null) {
                return;
              }

              setPendingValue(option.value);

              try {
                await onSelect(option.value);
              } finally {
                setPendingValue(null);
              }
            }}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium leading-6">
                {option.label}
              </div>
              {option.description ? (
                <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-white/48">
                  {option.description}
                </div>
              ) : null}
            </div>

            {pendingValue === option.value ? (
              <LoaderCircle className="ml-3 size-4 shrink-0 animate-spin text-slate-400 dark:text-white/42" />
            ) : (
              <ArrowRightCircle className="ml-3 size-4 shrink-0 text-slate-400 dark:text-white/42" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
