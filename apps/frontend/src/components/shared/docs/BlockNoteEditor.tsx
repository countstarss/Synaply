"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { BlockNoteEditor } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "./blocknote.css";
import { useDocs, DocsDocument } from "./DocsContext";
import { db } from "@/lib/db";

interface BlockNoteEditorProps {
  doc: DocsDocument;
}

function getEmptyContent() {
  return [
    {
      id: "initial",
      type: "paragraph",
      content: [],
    },
  ];
}

export default function DocsBlockNoteEditor({
  doc,
}: BlockNoteEditorProps) {
  const tDocs = useTranslations("docs");
  const locale = useLocale();
  const { updateDocContent } = useDocs();
  const draftSaveTimeoutRef = useRef<number | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );

  useEffect(() => {
    const updateTheme = () => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const initialContent = useMemo(() => {
    if (!doc.content) {
      return getEmptyContent();
    }

    try {
      return JSON.parse(doc.content);
    } catch (error) {
      console.error("Failed to parse document content:", error);
      return getEmptyContent();
    }
  }, [doc.content]);

  const [hydratedContent, setHydratedContent] = useState(initialContent);
  const [isDraftRecovered, setIsDraftRecovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "ready" | "draft" | "saving" | "saved" | "error" | "conflict"
  >("ready");
  const [lastError, setLastError] = useState<string | null>(null);
  const updatedAtLabel = lastSaved
    ? lastSaved.toLocaleString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date(doc.updatedAt).toLocaleString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: hydratedContent,
  });

  const buildMetadataSnapshot = useCallback(
    () =>
      JSON.stringify({
        title: doc.title,
        icon: doc.icon ?? null,
        coverImage: doc.coverImage ?? null,
        visibility: doc.visibility,
      }),
    [doc.coverImage, doc.icon, doc.title, doc.visibility]
  );

  useEffect(() => {
    let mounted = true;

    const hydrateDraft = async () => {
      setHydratedContent(initialContent);
      setIsDraftRecovered(false);
      setSyncStatus("ready");
      setLastError(null);

      const draft = await db.docDrafts.get(doc._id);
      if (!mounted || !draft) {
        return;
      }

      try {
        setHydratedContent(JSON.parse(draft.localContentSnapshot));
        setIsDraftRecovered(true);
        setSyncStatus("draft");
      } catch (error) {
        console.error("Failed to restore local doc draft:", error);
      }
    };

    void hydrateDraft();

    return () => {
      mounted = false;
    };
  }, [doc._id, initialContent]);

  useEffect(() => {
    setLastSaved(doc.updatedAt ? new Date(doc.updatedAt) : null);
  }, [doc._id, doc.updatedAt]);

  useEffect(() => {
    if (editor && hydratedContent) {
      editor.replaceBlocks(editor.document, hydratedContent);
    }
  }, [editor, hydratedContent]);

  const persistLocalDraft = useCallback(async () => {
    if (!editor || doc.type !== "document") return;

    const content = JSON.stringify(editor.document);

    await db.docDrafts.put({
      docId: doc._id,
      baseRevisionId: doc.latestRevisionId ?? null,
      localContentSnapshot: content,
      localMetadataSnapshot: buildMetadataSnapshot(),
      updatedAt: Date.now(),
    });

    await db.docSyncStates.put({
      docId: doc._id,
      lastSyncedRevisionId: doc.latestRevisionId ?? null,
      syncStatus: "draft",
      lastError: null,
      updatedAt: Date.now(),
    });
  }, [buildMetadataSnapshot, doc._id, doc.latestRevisionId, doc.type, editor]);

  const handleSave = useCallback(async () => {
    if (isSaving || !editor || doc.type !== "document") return;

    setIsSaving(true);
    setSyncStatus("saving");
    setLastError(null);

    try {
      const content = JSON.stringify(editor.document);
      const metadataSnapshot = buildMetadataSnapshot();

      await db.docDrafts.put({
        docId: doc._id,
        baseRevisionId: doc.latestRevisionId ?? null,
        localContentSnapshot: content,
        localMetadataSnapshot: metadataSnapshot,
        updatedAt: Date.now(),
      });

      const result = await updateDocContent(doc._id, content);

      if (result.status === "conflict") {
        await db.docConflicts.add({
          docId: doc._id,
          serverRevisionId: result.serverRevisionId ?? null,
          clientMutationId: null,
          serverSnapshot: result.serverSnapshot ?? null,
          localSnapshot: content,
          updatedAt: Date.now(),
        });

        await db.docSyncStates.put({
          docId: doc._id,
          lastSyncedRevisionId: doc.latestRevisionId ?? null,
          syncStatus: "conflict",
          lastError: tDocs("blocknote.conflict"),
          updatedAt: Date.now(),
        });

        setSyncStatus("conflict");
        setLastError(tDocs("blocknote.conflict"));
        return;
      }

      await db.docDrafts.delete(doc._id);
      await db.docsCache.put({
        docId: doc._id,
        latestRevisionId: result.doc.latestRevisionId ?? null,
        contentSnapshot: content,
        metadataSnapshot,
        updatedAt: Date.now(),
      });
      await db.docSyncStates.put({
        docId: doc._id,
        lastSyncedRevisionId: result.doc.latestRevisionId ?? null,
        lastSyncAt: Date.now(),
        syncStatus: "saved",
        lastError: null,
        updatedAt: Date.now(),
      });

      setLastSaved(new Date());
      setIsDraftRecovered(false);
      setSyncStatus("saved");
    } catch (error) {
      console.error("Failed to save the document:", error);
      const message = error instanceof Error ? error.message : tDocs("blocknote.saveFailed");
      setSyncStatus("error");
      setLastError(message);

      await db.docSyncStates.put({
        docId: doc._id,
        lastSyncedRevisionId: doc.latestRevisionId ?? null,
        syncStatus: "error",
        lastError: message,
        updatedAt: Date.now(),
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    buildMetadataSnapshot,
    doc._id,
    doc.latestRevisionId,
    doc.type,
    editor,
    isSaving,
    tDocs,
    updateDocContent,
  ]);

  const handleDocumentChange = useCallback(() => {
    setSyncStatus((current) => (current === "conflict" ? current : "draft"));

    if (draftSaveTimeoutRef.current) {
      window.clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = window.setTimeout(() => {
      void persistLocalDraft();
    }, 600);
  }, [persistLocalDraft]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        void handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSave]);

  useEffect(() => {
    if (!editor) return;

    const autoSaveInterval = setInterval(() => {
      void handleSave();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [editor, handleSave]);

  useEffect(() => {
    return () => {
      if (draftSaveTimeoutRef.current) {
        window.clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, []);

  if (doc.type !== "document") {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-app-content-bg">
      <div className="min-h-0 flex-1 overflow-hidden">
        <BlockNoteView
          editor={editor}
          theme={theme}
          className="h-full"
          onChange={handleDocumentChange}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-app-border/60 bg-app-content-bg px-5 py-3 text-xs text-app-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isSaving ? (
              <span>{tDocs("blocknote.saving")}</span>
            ) : syncStatus === "conflict" ? (
              <span>{tDocs("blocknote.conflictStatus")}</span>
            ) : syncStatus === "error" ? (
              <span>{tDocs("blocknote.errorStatus")}</span>
            ) : syncStatus === "draft" ? (
              <span>
                {isDraftRecovered
                  ? tDocs("blocknote.recoveredDraft")
                  : tDocs("blocknote.draftPending")}
              </span>
            ) : updatedAtLabel ? (
              <span>{tDocs("blocknote.updatedAt", { value: updatedAtLabel })}</span>
            ) : (
              <span>{tDocs("blocknote.ready")}</span>
            )}
          </div>
        </div>

        <div className="text-left text-xs text-app-text-muted sm:text-right">
          <div>
            {tDocs("blocknote.shortcut", {
              key: navigator.platform.includes("Mac") ? "Cmd" : "Ctrl",
            })}
          </div>
          {lastError && <div className="mt-0.5 text-amber-500">{lastError}</div>}
        </div>
      </div>
    </div>
  );
}
