"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { RiAlertLine, RiDeleteBinLine, RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDocsTree } from "@/hooks/useDocApi";
import { useIssues } from "@/hooks/useIssueApi";
import { Project } from "@/lib/fetchers/project";

interface DeleteProjectDialogProps {
  open: boolean;
  workspaceId: string;
  project: Project | null;
  isDeleting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (project: Project) => void | Promise<void>;
}

export function DeleteProjectDialog({
  open,
  workspaceId,
  project,
  isDeleting = false,
  onOpenChange,
  onConfirm,
}: DeleteProjectDialogProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [confirmationName, setConfirmationName] = useState("");
  const { data: projectIssues = [], isLoading: isLoadingIssues } = useIssues(
    workspaceId,
    { projectId: project?.id },
    {
      enabled: open && !!workspaceId && !!project?.id,
      fetchAll: true,
    },
  );
  const { data: projectDocs = [], isLoading: isLoadingDocs } = useDocsTree(
    workspaceId,
    {
      projectId: project?.id,
      includeArchived: true,
    },
    { enabled: open && !!workspaceId && !!project?.id },
  );

  useEffect(() => {
    if (!open) {
      setConfirmationName("");
    }
  }, [open, project?.id]);

  const resourceCounts = useMemo(
    () => ({
      issues: projectIssues.length,
      docs: projectDocs.filter((doc) => doc.type === "document").length,
      folders: projectDocs.filter((doc) => doc.type === "folder").length,
    }),
    [projectDocs, projectIssues.length],
  );

  const isCountingResources = isLoadingIssues || isLoadingDocs;
  const isMatched = confirmationName === project?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg border-app-border/70 bg-app-content-bg p-0 shadow-2xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-app-border/60 px-6 py-5">
          <DialogTitle className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <span className="flex size-10 items-center justify-center rounded-xl bg-red-500/10">
              <RiAlertLine className="size-5" />
            </span>
            {t("deleteDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-app-text-secondary">
            {t("deleteDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-xl bg-red-500/10 p-4">
            <div className="text-sm font-medium text-app-text-primary">
              {t("deleteDialog.aboutToDelete")}
            </div>
            <div className="mt-2 text-base font-semibold text-app-text-primary">
              {project?.name || t("deleteDialog.missingProject")}
            </div>
            <div className="mt-2 text-sm leading-6 text-app-text-secondary">
              {project?.description || t("deleteDialog.missingProjectDescription")}
            </div>
          </div>

          <div className="rounded-xl bg-app-bg/70 px-4 py-4">
            {isCountingResources ? (
              <div className="flex items-center gap-2">
                <RiLoader4Line className="size-4 animate-spin" />
                <span className="text-sm text-app-text-secondary">
                  {t("deleteDialog.countingResources")}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-medium text-app-text-primary">
                  {t("deleteDialog.cascadeWarning")}
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-lg bg-app-content-bg px-3 py-3">
                    <div className="text-lg font-semibold text-app-text-primary">
                      {resourceCounts.issues}
                    </div>
                    <div className="text-xs text-app-text-secondary">
                      {t("deleteDialog.issueCountLabel")}
                    </div>
                  </div>
                  <div className="rounded-lg bg-app-content-bg px-3 py-3">
                    <div className="text-lg font-semibold text-app-text-primary">
                      {resourceCounts.docs}
                    </div>
                    <div className="text-xs text-app-text-secondary">
                      {t("deleteDialog.docCountLabel")}
                    </div>
                  </div>
                  <div className="rounded-lg bg-app-content-bg px-3 py-3">
                    <div className="text-lg font-semibold text-app-text-primary">
                      {resourceCounts.folders}
                    </div>
                    <div className="text-xs text-app-text-secondary">
                      {t("deleteDialog.folderCountLabel")}
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-6 text-app-text-secondary">
                  {t("deleteDialog.resourceSummary", {
                    issues: resourceCounts.issues,
                    docs: resourceCounts.docs,
                    folders: resourceCounts.folders,
                  })}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-app-text-primary">
              {t("deleteDialog.confirmLabel")}
            </label>
            <Input
              value={confirmationName}
              onChange={(event) => setConfirmationName(event.target.value)}
              placeholder={project?.name || t("deleteDialog.confirmPlaceholder")}
              className="border-app-border bg-app-bg text-app-text-primary"
            />
            <div className="text-xs text-app-text-muted">
              {t("deleteDialog.confirmHint")}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-app-border/60 px-6 py-5">
          <Button
            type="button"
            variant="outline"
            className="border-app-border bg-transparent text-app-text-primary"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {tCommon("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-500"
            disabled={!project || !isMatched || isDeleting}
            onClick={() => project && onConfirm(project)}
          >
            <RiDeleteBinLine className="size-4" />
            {isDeleting
              ? t("deleteDialog.deleting")
              : t("deleteDialog.confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
