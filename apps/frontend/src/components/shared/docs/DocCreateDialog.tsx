"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDocs, type DocsDocument } from "./DocsContext";
import {
  buildDocTemplateContent,
  findDocTemplateDefinition,
  getDocTemplateDefinitions,
  resolveDocTemplateTitle,
  type DocTemplateKey,
} from "./doc-template-config";
import { clampDocTitle, DOC_TITLE_MAX_LENGTH } from "./doc-title";

interface DocCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectName?: string;
  parentId?: string;
  defaultTemplateKey?: DocTemplateKey;
  onCreated?: (doc: DocsDocument) => void;
}

export default function DocCreateDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  parentId,
  defaultTemplateKey = "blank",
  onCreated,
}: DocCreateDialogProps) {
  const tDocs = useTranslations("docs");
  const { createDoc } = useDocs();
  const templateDefinitions = useMemo(() => getDocTemplateDefinitions(), []);
  const [selectedTemplateKey, setSelectedTemplateKey] =
    useState<DocTemplateKey>(defaultTemplateKey);
  const [title, setTitle] = useState("");
  const [hasEditedTitle, setHasEditedTitle] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedTemplateKey(defaultTemplateKey);
    setTitle(
      clampDocTitle(
        resolveDocTemplateTitle(defaultTemplateKey, tDocs, {
          projectName,
        }),
      )
    );
    setHasEditedTitle(false);
  }, [defaultTemplateKey, open, projectName, tDocs]);

  useEffect(() => {
    if (!open || hasEditedTitle) {
      return;
    }

    setTitle(
      clampDocTitle(
        resolveDocTemplateTitle(selectedTemplateKey, tDocs, {
          projectName,
        }),
      )
    );
  }, [hasEditedTitle, open, projectName, selectedTemplateKey, tDocs]);

  const selectedTemplate = useMemo(
    () => findDocTemplateDefinition(selectedTemplateKey) ?? templateDefinitions[0],
    [selectedTemplateKey, templateDefinitions]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle || isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      const createdDoc = await createDoc(trimmedTitle, {
        parentId,
        projectId,
        content: buildDocTemplateContent(selectedTemplate.key, tDocs),
        kind: selectedTemplate.kind,
        templateKey:
          selectedTemplate.key === "blank" ? undefined : selectedTemplate.key,
      });

      onCreated?.(createdDoc);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tDocs("creation.dialog.createFailed")
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tDocs("creation.dialog.title")}</DialogTitle>
          <DialogDescription>
            {tDocs("creation.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="doc-template-select">
              {tDocs("creation.dialog.templateLabel")}
            </Label>
            <Select
              value={selectedTemplateKey}
              onValueChange={(value) => setSelectedTemplateKey(value as DocTemplateKey)}
            >
              <SelectTrigger id="doc-template-select">
                <SelectValue
                  placeholder={tDocs("creation.dialog.templatePlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {templateDefinitions.map((template) => (
                  <SelectItem key={template.key} value={template.key}>
                    {tDocs(template.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-app-text-secondary">
              {tDocs(selectedTemplate.descriptionKey)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-title-input">
              {tDocs("creation.dialog.titleLabel")}
            </Label>
            <Input
              id="doc-title-input"
              value={title}
              placeholder={tDocs("creation.dialog.titlePlaceholder")}
              maxLength={DOC_TITLE_MAX_LENGTH}
              onChange={(event) => {
                setTitle(clampDocTitle(event.target.value));
                setHasEditedTitle(true);
              }}
              autoFocus
            />
          </div>

          {(projectId || parentId) && (
            <div className="rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-secondary">
              {projectId ? (
                <p>{tDocs("creation.dialog.projectHint")}</p>
              ) : null}
              {parentId ? (
                <p>{tDocs("creation.dialog.parentHint")}</p>
              ) : null}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              {tDocs("creation.dialog.cancel")}
            </Button>
            <Button type="submit" disabled={isCreating || !title.trim()}>
              {isCreating
                ? tDocs("creation.dialog.creating")
                : tDocs("creation.dialog.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
