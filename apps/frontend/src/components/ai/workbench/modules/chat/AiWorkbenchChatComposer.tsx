"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { RiSendPlane2Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_COMPOSER_HEIGHT = 40;
const MAX_COMPOSER_HEIGHT = 200;

interface AiWorkbenchChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => Promise<void> | void;
  disabled?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  variant?: "hero" | "docked";
}

export function AiWorkbenchChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  isSubmitting = false,
  error = null,
  variant = "docked",
}: AiWorkbenchChatComposerProps) {
  const tAi = useTranslations("ai");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isHero = variant === "hero";
  const minComposerHeight = isHero ? 92 : MIN_COMPOSER_HEIGHT;

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, minComposerHeight),
      MAX_COMPOSER_HEIGHT,
    );

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_COMPOSER_HEIGHT ? "auto" : "hidden";
  }, [minComposerHeight, value]);

  const canSend = Boolean(value.trim()) && !disabled && !isSubmitting;

  return (
    <div className="w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canSend) {
            void onSend();
          }
        }}
        className={cn(
          "mx-auto grid w-full grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border backdrop-blur-sm transition-all duration-300",
          isHero
            ? "max-w-3xl rounded-[30px] border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,250,252,0.98))] p-4 shadow-[0_28px_80px_-44px_rgba(15,23,42,0.24)] ring-1 ring-black/[0.04] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(29,29,33,0.92),rgba(18,18,21,0.98))] dark:ring-white/[0.06] dark:shadow-[0_28px_80px_-44px_rgba(0,0,0,0.88)]"
            : "max-w-4xl rounded-[28px] border-black/[0.08] bg-white/88 p-3 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.24)] ring-1 ring-black/[0.04] hover:scale-[1.01] dark:border-white/10 dark:bg-[rgba(24,24,27,0.92)] dark:ring-white/[0.06] dark:shadow-[0_18px_44px_-28px_rgba(0,0,0,0.86)]",
          error && "border-amber-400/50 ring-amber-400/20",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (canSend) {
                void onSend();
              }
            }
          }}
          disabled={disabled || isSubmitting}
          placeholder={tAi("workbench.composer.placeholder")}
          rows={1}
          className={cn(
            "scrollbar-hidden max-h-[200px] min-w-0 w-full resize-none border-none outline-none",
            isHero
              ? "min-h-[92px] rounded-[24px] px-5 py-4 text-[17px] leading-7"
              : "min-h-[40px] rounded-xl px-4 py-2 text-base leading-6",
            "bg-transparent text-slate-950 [overflow-wrap:anywhere] dark:text-white",
            "placeholder:text-slate-400 dark:placeholder:text-white/28",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        />

        <div className="flex items-end self-end">
          <Button
            type="submit"
            disabled={!canSend}
            className={cn(
              "rounded-full text-white ring-inset transition-all duration-300 hover:scale-[1.02]",
              isHero ? "px-5 py-2.5" : "px-4 py-2",
              "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
            )}
          >
            <RiSendPlane2Line className="size-4" />
            {isSubmitting
              ? tAi("workbench.composer.sending")
              : tAi("workbench.composer.send")}
          </Button>
        </div>
      </form>
    </div>
  );
}
