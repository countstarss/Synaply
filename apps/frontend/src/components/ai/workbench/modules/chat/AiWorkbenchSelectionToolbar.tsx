"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Combine, Layers, ToggleLeft, ToggleRight, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAiMessageSelectionText } from "@/components/ai/workbench/modules/chat/AiWorkbenchChatUtils";
import { useAiWorkbenchSelectionStore } from "@/components/ai/workbench/modules/chat/AiWorkbenchSelectionStore";

export function AiWorkbenchSelectionToolbar() {
  const tAi = useTranslations("ai");
  const isSelectionMode = useAiWorkbenchSelectionStore(
    (state) => state.isSelectionMode,
  );
  const selectedMessages = useAiWorkbenchSelectionStore(
    (state) => state.selectedMessages,
  );
  const autoSelectEnabled = useAiWorkbenchSelectionStore(
    (state) => state.autoSelectEnabled,
  );
  const clearSelection = useAiWorkbenchSelectionStore(
    (state) => state.clearSelection,
  );
  const setAutoSelectEnabled = useAiWorkbenchSelectionStore(
    (state) => state.setAutoSelectEnabled,
  );
  const toggleSelectionMode = useAiWorkbenchSelectionStore(
    (state) => state.exitSelectionMode,
  );
  const [isCopying, setIsCopying] = useState(false);

  if (!isSelectionMode) {
    return null;
  }

  const selectionCount = selectedMessages.length;

  const handleCopyCombined = async () => {
    if (selectionCount === 0 || isCopying) {
      return;
    }

    setIsCopying(true);

    try {
      const content = [...selectedMessages]
        .sort(
          (left, right) =>
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
        )
        .map((message) => getAiMessageSelectionText(message, tAi))
        .join("\n\n---\n\n");

      await navigator.clipboard.writeText(content);
      toast.success(tAi("workbench.chat.copySuccess"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tAi("shared.copyFailed"));
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="selection-toolbar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        <div className="rounded-[28px] border border-black/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] p-4 shadow-[0_24px_90px_-48px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(26,26,29,0.98),rgba(14,14,16,0.99))] dark:shadow-[0_24px_90px_-48px_rgba(0,0,0,0.9)]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100">
              <Layers className="mr-2 h-4 w-4" />
              {tAi("workbench.chat.selected", { count: selectionCount })}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAutoSelectEnabled(!autoSelectEnabled)}
              className="gap-1.5 rounded-full border border-black/[0.06] bg-black/[0.03] text-slate-600 hover:bg-black/[0.05] hover:text-slate-900 dark:border-white/8 dark:bg-white/[0.03] dark:text-white/72 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              {autoSelectEnabled ? (
                <>
                  <ToggleRight className="h-4 w-4" />
                  {tAi("workbench.chat.autoSelect")}
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4" />
                  {tAi("workbench.chat.autoSelect")}
                </>
              )}
            </Button>

            <div className="hidden h-6 border-l border-black/[0.08] dark:border-white/10 sm:block" />

            <Button
              type="button"
              size="sm"
              disabled={selectionCount === 0 || isCopying}
              onClick={() => void handleCopyCombined()}
              className={cn(
                "gap-1.5 rounded-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/92",
                selectionCount === 0 && "opacity-50",
              )}
            >
              <Combine className="h-4 w-4" />
              {isCopying
                ? tAi("workbench.chat.copying")
                : tAi("workbench.chat.mergeCopy")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={selectionCount === 0}
              onClick={clearSelection}
              className="gap-1.5 rounded-full border border-black/[0.06] bg-black/[0.03] text-slate-600 hover:bg-black/[0.05] hover:text-slate-900 dark:border-white/8 dark:bg-white/[0.03] dark:text-white/72 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              {tAi("workbench.chat.clearSelection")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleSelectionMode}
              className="gap-1.5 rounded-full border border-rose-500/18 bg-rose-500/8 text-rose-700 hover:bg-rose-500/12 hover:text-rose-800 dark:text-rose-200 dark:hover:text-rose-100"
            >
              <X className="h-4 w-4" />
              {tAi("workbench.chat.exit")}
            </Button>
          </div>

          <div className="mt-3 text-xs leading-6 text-slate-500 dark:text-white/34">
            {tAi("workbench.chat.selectionHint")}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
