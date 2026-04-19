"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WorkflowCompletionConfirmDialogProps {
  isOpen: boolean;
  issueTitle: string;
  onClose: () => void;
  onSubmit: (data: {
    completionConfirmed: boolean;
    issueTitleConfirmation: string;
  }) => void;
}

export function WorkflowCompletionConfirmDialog({
  isOpen,
  issueTitle,
  onClose,
  onSubmit,
}: WorkflowCompletionConfirmDialogProps) {
  const tIssues = useTranslations("issues");
  const [hasConfirmedWithTeam, setHasConfirmedWithTeam] = useState(false);
  const [titleConfirmation, setTitleConfirmation] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setHasConfirmedWithTeam(false);
      setTitleConfirmation("");
    }
  }, [isOpen]);

  const normalizedExpectedTitle = issueTitle.trim();
  const normalizedInputTitle = titleConfirmation.trim();
  const isTitleMatched = normalizedInputTitle === normalizedExpectedTitle;
  const canSubmit = hasConfirmedWithTeam && isTitleMatched;
  const shouldShowTitleMismatch =
    normalizedInputTitle.length > 0 && !isTitleMatched;

  const titleHint = useMemo(
    () =>
      tIssues("workflowCompletionDialog.inputHint", {
        title: issueTitle,
      }),
    [issueTitle, tIssues],
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-lg border-app-border bg-app-content-bg p-6"
        showCloseButton={false}
      >
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-lg text-app-text-primary">
            {tIssues("workflowCompletionDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-app-text-secondary">
            {tIssues("workflowCompletionDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex items-start gap-3 rounded-lg border border-app-border bg-app-bg px-3 py-3">
            <Checkbox
              checked={hasConfirmedWithTeam}
              onCheckedChange={(checked) =>
                setHasConfirmedWithTeam(checked === true)
              }
              className="mt-0.5 border-app-border data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
            />
            <div className="space-y-1">
              <div className="text-sm font-medium text-app-text-primary">
                {tIssues("workflowCompletionDialog.confirmLabel")}
              </div>
              <p className="text-xs leading-5 text-app-text-muted">
                {tIssues("workflowCompletionDialog.confirmDescription")}
              </p>
            </div>
          </label>

          <div className="space-y-2">
            <Label
              htmlFor="workflow-completion-title-confirmation"
              className="text-sm text-app-text-primary"
            >
              {tIssues("workflowCompletionDialog.inputLabel")}
            </Label>
            <Input
              id="workflow-completion-title-confirmation"
              value={titleConfirmation}
              onChange={(event) => setTitleConfirmation(event.target.value)}
              placeholder={tIssues("workflowCompletionDialog.inputPlaceholder")}
              className="border-app-border bg-app-bg text-app-text-primary"
              autoFocus
            />
            <p className="text-xs text-app-text-muted">{titleHint}</p>
            {shouldShowTitleMismatch && (
              <p className="text-xs text-rose-500">
                {tIssues("workflowCompletionDialog.inputError")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            className="border-app-border bg-transparent text-app-text-primary"
            onClick={onClose}
          >
            {tIssues("workflowCompletionDialog.cancel")}
          </Button>
          <Button
            type="button"
            className="bg-sky-600 text-white hover:bg-sky-500"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                completionConfirmed: hasConfirmedWithTeam,
                issueTitleConfirmation: normalizedInputTitle,
              })
            }
          >
            {tIssues("workflowCompletionDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WorkflowCompletionConfirmDialog;
