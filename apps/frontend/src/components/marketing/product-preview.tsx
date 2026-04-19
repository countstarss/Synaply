"use client";

import {
  ArrowUpRight,
  CircleDot,
  FileText,
  GitBranch,
  Layers3,
  MessageSquareText,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useMarketingCopy } from "@/components/marketing/site-copy";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { cn } from "@/lib/utils";

interface ProductPreviewProps {
  className?: string;
  compact?: boolean;
}

const PREVIEW_CANVAS = {
  regular: {
    width: 948,
    height: 742,
    sidebarWidth: 320,
    gap: 18,
  },
  compact: {
    width: 892,
    height: 714,
    sidebarWidth: 300,
    gap: 16,
  },
} as const;

export function ProductPreview({
  className,
  compact = false,
}: ProductPreviewProps) {
  const { landing } = useMarketingCopy();
  const preview = landing.productPreview;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas = compact ? PREVIEW_CANVAS.compact : PREVIEW_CANVAS.regular;
  const [containerWidth, setContainerWidth] = useState<number>(canvas.width);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = element.clientWidth;

      if (nextWidth > 0) {
        setContainerWidth(nextWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const scale = Math.min(containerWidth / canvas.width, 1);
  const frameHeight = canvas.height * scale;
  const contentColumns = `grid-cols-[minmax(0,1fr)_${canvas.sidebarWidth}px]`;
  const rowColumns = compact
    ? "grid-cols-[minmax(0,1fr)_72px_100px_108px]"
    : "grid-cols-[minmax(0,1fr)_76px_108px_116px]";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full",
        className,
      )}
      style={{ height: `${frameHeight}px` }}
    >
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <div
          className="origin-top"
          style={{
            width: `${canvas.width}px`,
            height: `${canvas.height}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <div className="relative h-full overflow-hidden rounded-[18px] border border-white/10 bg-[#080a0f]/96 shadow-[0_40px_140px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
            <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-white/5 blur-[90px]" />

            <div className="relative h-full p-[18px]">
              <div className="flex items-center justify-between gap-3 border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-white/[0.04] text-white/86">
                    <Layers3 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {preview.workspaceTitle}
                    </p>
                    <p className="truncate text-xs text-white/48">
                      {preview.workspaceSubtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-white/34">
                  <EncryptedText
                    text={preview.syncStatus}
                    encryptedClassName="text-white/18"
                    revealedClassName="text-white/54"
                    revealDelayMs={22}
                    flipDelayMs={24}
                  />
                </div>
              </div>

              <div
                className={cn("mt-[18px] grid", contentColumns)}
                style={{ gap: `${canvas.gap}px` }}
              >
                <section className="flex h-full flex-col border border-white/10 bg-[#0a0d12]">
                  <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                        {preview.execution.eyebrow}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-white">
                        {preview.execution.title}
                      </h3>
                    </div>
                    <div className="inline-flex shrink-0 items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/72">
                      <CircleDot className="h-3.5 w-3.5 text-emerald-200/70" />
                      {preview.execution.status}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "grid border-b border-white/8 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/28",
                      rowColumns,
                    )}
                  >
                    <span className="truncate">
                      {preview.execution.columns.issue}
                    </span>
                    <span className="truncate">
                      {preview.execution.columns.owner}
                    </span>
                    <span className="truncate">
                      {preview.execution.columns.state}
                    </span>
                    <span className="truncate">
                      {preview.execution.columns.doc}
                    </span>
                  </div>

                  <div className="divide-y divide-white/8">
                    {preview.execution.rows.map((row, index) => (
                      <div
                        key={row.name}
                        className={cn(
                          "grid min-h-[88px] items-center gap-3 px-4 py-4 text-sm",
                          rowColumns,
                          index === 0 && "bg-white/[0.02]",
                        )}
                      >
                        <div className="min-w-0 pr-4">
                          <p className="truncate font-medium text-white">
                            {row.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-white/42">
                            {preview.execution.rowHint}
                          </p>
                        </div>
                        <span className="truncate text-xs font-medium tracking-[0.18em] text-white/60">
                          {row.owner}
                        </span>
                        <span
                          className={cn(
                            "inline-flex w-fit max-w-full items-center truncate border px-2.5 py-1 text-[11px] font-medium",
                            index === 0
                              ? "border-white/10 bg-white/[0.03] text-white/76"
                              : "border-white/10 bg-white/[0.03] text-white/68",
                          )}
                        >
                          {row.state}
                        </span>
                        <span className="truncate text-xs text-white/54">
                          {row.doc}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  className="grid h-full"
                  style={{
                    gap: `${canvas.gap}px`,
                    gridTemplateRows: "minmax(0, 1fr) minmax(0, 1fr)",
                  }}
                >
                  <div className="flex h-full flex-col border border-white/10 bg-white/[0.03]">
                    <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                          {preview.workflow.eyebrow}
                        </p>
                        <h4 className="mt-1 text-sm font-semibold text-white">
                          {preview.workflow.title}
                        </h4>
                      </div>
                      <GitBranch className="h-4 w-4 shrink-0 text-white/56" />
                    </div>

                    <div className="flex flex-1 flex-col justify-between px-4 py-4">
                      {preview.workflow.steps.map((item, index) => (
                        <div key={item} className="flex gap-3">
                          <div className="flex w-6 shrink-0 flex-col items-center">
                            <div className="flex h-6 w-6 items-center justify-center border border-white/10 bg-white/[0.04] text-[11px] text-white/72">
                              {index + 1}
                            </div>
                            {index < preview.workflow.steps.length - 1 ? (
                              <div className="mt-1 h-full w-px bg-gradient-to-b from-white/16 to-transparent" />
                            ) : null}
                          </div>
                          <div className="pt-1 text-xs leading-6 text-white/62">
                            {item}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex h-full flex-col border border-white/10 bg-white/[0.03]">
                    <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                          {preview.context.eyebrow}
                        </p>
                        <h4 className="mt-1 text-sm font-semibold text-white">
                          {preview.context.title}
                        </h4>
                      </div>
                      <FileText className="h-4 w-4 shrink-0 text-white/56" />
                    </div>

                    <div className="flex flex-1 flex-col justify-between space-y-4 px-4 py-4">
                      <div className="border border-white/8 bg-[#0b0e14] p-4">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/32">
                          {preview.context.snippetEyebrow}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-white/70">
                          {preview.context.snippetBody}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-xs text-white/46">
                        <div className="flex items-center gap-2">
                          {["PM", "DS", "ENG", "OPS"].map((label) => (
                            <div
                              key={label}
                              className="flex h-8 w-8 items-center justify-center border border-white/10 bg-white/[0.04] text-[10px] font-semibold tracking-[0.14em] text-white/74"
                            >
                              {label}
                            </div>
                          ))}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <MessageSquareText className="h-4 w-4" />
                          {preview.context.sharedBy}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
