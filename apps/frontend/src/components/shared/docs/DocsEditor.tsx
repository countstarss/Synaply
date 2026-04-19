"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { RiFolder3Line, RiLockLine, RiTimeLine } from "react-icons/ri";
import { DocsDocument } from "./DocsContext";
import DocsToolbar from "./DocsToolbar";
import FolderIntro from "./FolderIntro";
import { Badge } from "@/components/ui/badge";

function DocsEditorLoadingState() {
  const tDocs = useTranslations("docs");

  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-app-text-muted">{tDocs("states.loadingEditor")}</p>
    </div>
  );
}

const DocsBlockNoteEditor = dynamic(() => import("./BlockNoteEditor"), {
  ssr: false,
  loading: () => <DocsEditorLoadingState />,
});

interface DocsEditorProps {
  doc: DocsDocument;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

function getVisibilityLabel(doc: DocsDocument, tDocs: ReturnType<typeof useTranslations>) {
  switch (doc.visibility) {
    case "PRIVATE":
      return tDocs("editor.meta.private");
    case "TEAM_READONLY":
      return tDocs("editor.meta.teamReadonly");
    case "TEAM_EDITABLE":
      return tDocs("editor.meta.teamEditable");
    default:
      return tDocs("editor.meta.public");
  }
}

export default function DocsEditor({
  doc,
  isExpanded = false,
  onToggleExpand,
}: DocsEditorProps) {
  const tDocs = useTranslations("docs");
  const locale = useLocale();

  return (
    <div className="flex h-full min-h-0 flex-col bg-app-content-bg">
      {onToggleExpand ? (
        <div className="flex items-center justify-end border-b border-app-border/60 bg-app-content-bg px-5 py-3 sm:px-6">
          <DocsToolbar
            isExpanded={isExpanded}
            onToggleExpand={onToggleExpand}
          />
        </div>
      ) : null}

      {doc.type === "document" ? (
        <>
          <div className="min-h-0 flex-1 overflow-hidden bg-app-content-bg">
            <DocsBlockNoteEditor doc={doc} />
          </div>
        </>
      ) : (
        <>
          <div className="border-b border-app-border/60 bg-app-content-bg px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="h-7 rounded-full border-transparent bg-app-bg/70 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-app-text-secondary"
                  >
                    <RiFolder3Line className="size-3.5" />
                    {tDocs("editor.meta.folder")}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-7 rounded-full border-transparent bg-app-bg/70 px-3 text-[11px] font-medium text-app-text-secondary"
                  >
                    <RiLockLine className="size-3.5" />
                    {getVisibilityLabel(doc, tDocs)}
                  </Badge>
                  <span className="inline-flex h-7 items-center rounded-full bg-app-bg/60 px-3 text-[11px] font-medium text-app-text-muted">
                    {doc.canEdit ? tDocs("editor.editable") : tDocs("editor.readonly")}
                  </span>
                </div>

                <div className="mt-4">
                  <h1 className="text-3xl font-semibold tracking-tight text-app-text-primary sm:text-[2rem]">
                    {doc.title || tDocs("editor.untitled")}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-app-text-secondary">
                    <span className="inline-flex items-center gap-1.5 text-app-text-muted">
                      <RiTimeLine className="size-4" />
                      {tDocs("editor.updatedAt", {
                        value: new Date(doc.updatedAt).toLocaleString(locale),
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-app-content-bg">
            <FolderIntro folder={doc} />
          </div>
        </>
      )}
    </div>
  );
}
