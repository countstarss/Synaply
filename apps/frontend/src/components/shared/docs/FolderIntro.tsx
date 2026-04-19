"use client";

import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  RiEditLine,
  RiFolder3Line,
  RiLockLine,
  RiSaveLine,
  RiTimeLine,
} from "react-icons/ri";
import { useDocs, DocsDocument } from "./DocsContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FolderIntroProps {
  folder: DocsDocument;
}

function getVisibilityLabel(
  folder: DocsDocument,
  tDocs: ReturnType<typeof useTranslations>,
) {
  switch (folder.visibility) {
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

export default function FolderIntro({ folder }: FolderIntroProps) {
  const tDocs = useTranslations("docs");
  const locale = useLocale();
  const { updateFolderDescription } = useDocs();
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(folder.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const isProjectRootFolder = Boolean(folder.isProjectRootFolder);

  useEffect(() => {
    setDescription(folder.description || "");
    setIsEditingDescription(false);
  }, [folder._id, folder.description]);

  const handleSaveDescription = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await updateFolderDescription(folder._id, description);
      setIsEditingDescription(false);
    } catch (error) {
      console.error(tDocs("folderIntro.saveFailed"), error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDescription(folder.description || "");
    setIsEditingDescription(false);
  };

  if (folder.type !== "folder") {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-app-content-bg">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
        <div className="w-full">
          <div className="rounded-[16px] border border-app-border/60 bg-app-content-bg p-5 shadow-none">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
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
                    {getVisibilityLabel(folder, tDocs)}
                  </Badge>
                  {isProjectRootFolder ? (
                    <Badge
                      variant="outline"
                      className="h-7 rounded-full border-transparent bg-app-bg/70 px-3 text-[11px] font-medium text-app-text-secondary"
                    >
                      {tDocs("folderIntro.projectRootBadge")}
                    </Badge>
                  ) : null}
                </div>

                <h2 className="mt-4 text-lg font-semibold text-app-text-primary">
                  {tDocs("folderIntro.title")}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-app-text-secondary">
                  <span className="inline-flex items-center gap-1.5 text-app-text-muted">
                    <RiTimeLine className="size-4" />
                    {tDocs("folderIntro.folderMeta", {
                      value: new Date(folder.createdAt).toLocaleString(locale),
                    })}
                  </span>
                </div>
                {isProjectRootFolder ? (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-app-text-secondary">
                    {tDocs("folderIntro.projectRootDescription")}
                  </p>
                ) : null}
              </div>

              {folder.canEdit && !isEditingDescription ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditingDescription(true)}
                  className="rounded-lg border-app-border/60 bg-transparent text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
                >
                  <RiEditLine className="size-4" />
                  {tDocs("folderIntro.editDescription")}
                </Button>
              ) : null}
            </div>

            {isEditingDescription ? (
              <div className="mt-5 space-y-4">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={tDocs("folderIntro.placeholder")}
                  className="min-h-48 rounded-xl border-app-border/60 bg-app-content-bg text-app-text-primary placeholder:text-app-text-muted focus-visible:ring-sky-500/20"
                  autoFocus
                  disabled={isSaving}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveDescription}
                    disabled={isSaving}
                    className="rounded-lg bg-sky-600 text-white hover:bg-sky-500"
                  >
                    <RiSaveLine className="size-4" />
                    {isSaving ? tDocs("folderIntro.saving") : tDocs("folderIntro.save")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="rounded-lg border-app-border/60 bg-transparent text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
                  >
                    {tDocs("folderIntro.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 min-h-[260px] rounded-[16px] bg-app-content-bg px-5 py-4 text-app-text-primary">
                {description ? (
                  <div className="whitespace-pre-wrap leading-7 text-app-text-primary">
                    {description}
                  </div>
                ) : (
                  <span className="italic text-app-text-muted">
                    {folder.canEdit
                      ? tDocs("folderIntro.emptyEditable")
                      : tDocs("folderIntro.emptyReadonly")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
