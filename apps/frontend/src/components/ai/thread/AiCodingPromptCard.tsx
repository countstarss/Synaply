"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AiCodingPromptPart } from "@/lib/ai/types";

interface AiCodingPromptCardProps {
  part: AiCodingPromptPart;
}

export function AiCodingPromptCard({ part }: AiCodingPromptCardProps) {
  const tAi = useTranslations("ai");
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(part.prompt);
      toast.success(tAi("thread.codingPrompt.copied"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tAi("shared.copyFailed"));
    }
  };

  return (
    <div className="rounded-2xl border border-app-border bg-app-content-bg p-4 text-sm text-app-text-primary shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{tAi("thread.codingPrompt.title")}</p>
          <p className="mt-1 text-xs text-app-text-secondary">
            {part.issueId
              ? tAi("thread.codingPrompt.issueLabel", { id: part.issueId })
              : tAi("thread.codingPrompt.unbound")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-app-border bg-transparent text-app-text-primary"
          onClick={() => void copyPrompt()}
        >
          {tAi("thread.codingPrompt.copy")}
        </Button>
      </div>

      <pre className="mt-3 max-h-80 overflow-auto rounded-xl border border-app-border bg-app-bg p-3 text-xs leading-6 text-app-text-secondary">
        {part.prompt}
      </pre>
    </div>
  );
}
