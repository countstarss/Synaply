"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useCreateDocMutation, useDocsTree } from "@/hooks/useDocApi";
import { useDocStore } from "@/stores/doc-store";
import type { WorkflowResponse } from "@/lib/fetchers/workflow";
import { VisibilityType } from "@/types/prisma";
import {
  DocKindCards,
  type DocKindCardSlot,
} from "@/components/shared/docs/DocKindCards";
import {
  buildDocTemplateContent,
  findDocTemplateDefinition,
  resolveDocTemplateTitle,
} from "@/components/shared/docs/doc-template-config";
import { openDocRoute } from "@/components/shared/docs/doc-navigation";
import { filterWorkflowLevelDocs } from "@/components/workflow/workflow-doc-utils";

const WORKFLOW_DOC_SLOTS: DocKindCardSlot[] = [
  { kind: "HANDOFF_PACKET", templateKey: "handoff-packet-v1" },
  { kind: "REVIEW_PACKET", templateKey: "review-packet-v1" },
  { kind: "RELEASE_CHECKLIST", templateKey: "release-checklist-v1" },
];

export function WorkflowDocKindPanel({
  workspaceId,
  workspaceType,
  workflow,
}: {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  workflow: Pick<WorkflowResponse, "id" | "name">;
}) {
  const locale = useLocale();
  const tDocs = useTranslations("docs");
  const tWorkflows = useTranslations("workflows");
  const router = useRouter();
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);
  const createDocMutation = useCreateDocMutation();
  const docsContext = workspaceType === "TEAM" ? "team" : "personal";
  const { data: rawWorkflowDocs = [] } = useDocsTree(
    workspaceId,
    {
      context: docsContext,
      workspaceType,
      workflowId: workflow.id,
      includeArchived: false,
    },
    {
      enabled: !!workspaceId && !!workflow.id,
    },
  );
  const workflowDocs = React.useMemo(
    () => filterWorkflowLevelDocs(rawWorkflowDocs),
    [rawWorkflowDocs],
  );

  const openDoc = (docId: string, projectId?: string | null) => {
    openDocRoute({
      workspaceId,
      workspaceType,
      context: docsContext,
      docId,
      projectId,
      router,
      setActiveDocId,
    });
  };

  const handleCreateDoc = async (slot: DocKindCardSlot) => {
    const template = findDocTemplateDefinition(slot.templateKey);

    try {
      const createdDoc = await createDocMutation.mutateAsync({
        workspaceId,
        data: {
          title: resolveDocTemplateTitle(slot.templateKey, tDocs),
          kind: template?.kind ?? slot.kind,
          templateKey: slot.templateKey,
          workflowId: workflow.id,
          visibility:
            workspaceType === "TEAM"
              ? VisibilityType.TEAM_EDITABLE
              : VisibilityType.PRIVATE,
          content: buildDocTemplateContent(slot.templateKey, tDocs),
        },
      });

      toast.success(tWorkflows("docCards.created"));
      openDoc(createdDoc._id, createdDoc.projectId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tWorkflows("docCards.createFailed"),
      );
    }
  };

  return (
    <div className="rounded-lg border border-app-border bg-app-bg p-3">
      <div className="mb-3">
        <div className="text-sm font-medium text-app-text-primary">
          {tWorkflows("docCards.title")}
        </div>
        <p className="mt-1 text-xs leading-5 text-app-text-muted">
          {tWorkflows("docCards.subtitle")}
        </p>
      </div>

      <DocKindCards
        docs={workflowDocs}
        slots={WORKFLOW_DOC_SLOTS}
        locale={locale}
        tDocs={tDocs}
        onOpenDoc={(doc) => openDoc(doc._id, doc.projectId)}
        onCreateDoc={handleCreateDoc}
      />
    </div>
  );
}
