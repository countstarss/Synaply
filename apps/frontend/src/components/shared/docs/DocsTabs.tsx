"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { RiCloseLine, RiFileTextLine, RiFolder3Line } from "react-icons/ri";
import { useDocs, DocsDocument } from "./DocsContext";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

interface DocsTabsProps {
  onSelectDoc: (doc: DocsDocument) => void;
}

export default function DocsTabs({ onSelectDoc }: DocsTabsProps) {
  const tDocs = useTranslations("docs");
  const { openDocs, activeDocId, closeAllDocs, closeDoc, closeOtherDocs } = useDocs();

  if (openDocs.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-app-border/60 bg-app-content-bg px-2 py-1">
      <div className="overflow-x-auto scrollbar-hidden">
        <div className="flex min-w-full w-max items-center gap-2 select-none">
          {openDocs.map((doc) => {
            const isActive = doc._id === activeDocId;

            return (
              <ContextMenu key={doc._id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      "group relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 whitespace-nowrap transition-all",
                      isActive
                        ? "text-app-text-primary"
                        : "text-app-text-secondary hover:bg-app-bg/70 hover:text-app-text-primary",
                    )}
                    onClick={() => onSelectDoc(doc)}
                  >
                    <span
                      className={cn(
                        "inline-flex size-7 shrink-0 items-center justify-center rounded-lg",
                        isActive
                          ? "text-app-text-primary"
                          : "bg-app-bg/65 text-app-text-secondary",
                      )}
                    >
                      {doc.type === "folder" ? (
                        <RiFolder3Line className="size-4" />
                      ) : (
                        <RiFileTextLine className="size-4" />
                      )}
                    </span>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {doc.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDoc(doc._id);
                      }}
                      className={cn(
                        "flex-shrink-0 rounded-md p-1 transition-all",
                        isActive
                          ? "text-app-text-primary/80 opacity-100 hover:bg-app-button-hover hover:text-app-text-primary"
                          : "opacity-0 hover:bg-app-button-hover group-hover:opacity-100",
                      )}
                      title={tDocs("tabs.close")}
                    >
                      <RiCloseLine className="size-3.5" />
                    </button>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-opacity",
                        isActive
                          ? "bg-app-text-primary opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="min-w-[176px]">
                  <ContextMenuItem onSelect={() => closeDoc(doc._id)}>
                    {tDocs("tabs.close")}
                  </ContextMenuItem>
                  <ContextMenuItem
                    disabled={openDocs.length <= 1}
                    onSelect={() => closeOtherDocs(doc._id)}
                  >
                    {tDocs("tabs.closeOthers")}
                  </ContextMenuItem>
                  <ContextMenuItem
                    disabled={openDocs.length === 0}
                    onSelect={() => closeAllDocs()}
                  >
                    {tDocs("tabs.closeAll")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </div>
    </div>
  );
}
