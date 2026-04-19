"use client";

import { useTranslations } from "next-intl";
import type { AiToolResultPart } from "@/lib/ai/types";

interface AiToolResultCardProps {
  part: AiToolResultPart;
}

function getToolSummary(
  part: AiToolResultPart,
  tAi: (key: string, values?: Record<string, string | number>) => string,
) {
  if (
    part.output &&
    typeof part.output === "object" &&
    !Array.isArray(part.output)
  ) {
    const output = part.output as {
      message?: unknown;
      summary?: unknown;
      status?: unknown;
    };

    const lines = [
      typeof output.status === "string"
        ? tAi("thread.toolResult.status", { value: output.status })
        : null,
      typeof output.summary === "string"
        ? tAi("thread.toolResult.summary", { value: output.summary })
        : null,
      typeof output.message === "string"
        ? tAi("thread.toolResult.message", { value: output.message })
        : null,
    ];

    const text = lines.filter(Boolean).join("\n");

    if (text) {
      return text;
    }
  }

  return part.isError
    ? tAi("thread.toolResult.toolFailed")
    : tAi("thread.toolResult.toolCompleted");
}

function getPrettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AiToolResultCard({ part }: AiToolResultCardProps) {
  const tAi = useTranslations("ai");
  return (
    <div
      className={
        part.isError
          ? "rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950 shadow-sm"
          : "rounded-2xl border border-app-border bg-app-content-bg p-4 text-sm text-app-text-primary shadow-sm"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-app-border bg-app-bg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-app-text-secondary">
          Tool
        </span>
        <span className="font-mono text-xs">{part.toolName}</span>
      </div>

      <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6">
        {getToolSummary(part, tAi)}
      </pre>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-app-text-secondary">
          {tAi("thread.toolResult.details")}
        </summary>
        <pre className="mt-2 overflow-auto rounded-xl border border-app-border bg-app-bg p-3 text-xs leading-5 text-app-text-secondary">
          {getPrettyJson(part.output)}
        </pre>
      </details>
    </div>
  );
}
