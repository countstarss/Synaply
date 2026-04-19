"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";
import { useCreateDocMutation } from "@/hooks/useDocApi";
import type { Issue } from "@/lib/fetchers/issue";
import type { DocRecord } from "@/lib/fetchers/doc";
import { useDocStore } from "@/stores/doc-store";
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

const ISSUE_DOC_SLOTS: DocKindCardSlot[] = [
  { kind: "REVIEW_PACKET", templateKey: "review-packet-v1" },
  { kind: "HANDOFF_PACKET", templateKey: "handoff-packet-v1" },
  { kind: "DECISION_LOG", templateKey: "decision-log-v1" },
];

export function IssueDocKindPanel({
  workspaceId,
  workspaceType,
  issue,
  docs,
  locale,
  canCreate,
  variant = "card",
}: {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  issue: Issue;
  docs: DocRecord[];
  locale: string;
  canCreate: boolean;
  variant?: "card" | "embedded";
}) {
  const tIssues = useTranslations("issues");
  const tDocs = useTranslations("docs");
  const router = useRouter();
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);
  const createDocMutation = useCreateDocMutation();
  const docsContext = workspaceType === "TEAM" ? "team" : "personal";

  const openDoc = (doc: DocRecord) => {
    openDocRoute({
      workspaceId,
      workspaceType,
      context: docsContext,
      docId: doc._id,
      projectId: doc.projectId ?? issue.projectId ?? null,
      router,
      setActiveDocId,
    });
  };

  const handleCreateDoc = async (slot: DocKindCardSlot) => {
    if (!canCreate) {
      toast.error(tIssues("normalDetail.docCards.createForbidden"));
      return;
    }

    const template = findDocTemplateDefinition(slot.templateKey);

    try {
      const createdDoc = await createDocMutation.mutateAsync({
        workspaceId,
        data: {
          title: resolveDocTemplateTitle(slot.templateKey, tDocs, {
            projectName: issue.project?.name ?? undefined,
          }),
          kind: template?.kind ?? slot.kind,
          templateKey: slot.templateKey,
          issueId: issue.id,
          projectId: issue.projectId ?? undefined,
          visibility:
            workspaceType === "TEAM"
              ? VisibilityType.TEAM_EDITABLE
              : VisibilityType.PRIVATE,
          content: buildDocTemplateContent(slot.templateKey, tDocs),
        },
      });

      toast.success(tIssues("normalDetail.docCards.created"));
      openDoc(createdDoc);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tIssues("normalDetail.docCards.createFailed"),
      );
    }
  };

  const title = tIssues("normalDetail.docCards.title");
  const subtitle = tIssues("normalDetail.docCards.subtitle");

  const panelContent = (
    <>
      {variant === "embedded" ? (
        <div className="space-y-1 px-4 pt-4">
          <h3 className="text-lg font-semibold text-app-text-primary">{title}</h3>
          <p className="text-xs leading-5 text-app-text-muted">{subtitle}</p>
        </div>
      ) : null}

      <div className={variant === "embedded" ? "p-4 pt-3" : ""}>
        <DocKindCards
          docs={docs}
          slots={ISSUE_DOC_SLOTS}
          locale={locale}
          tDocs={tDocs}
          onOpenDoc={openDoc}
          onCreateDoc={handleCreateDoc}
        />
      </div>
    </>
  );

  if (variant === "embedded") {
    return panelContent;
  }

  return (
    <Card className="border-app-border bg-app-content-bg shadow-none">
      <CardHeader className="border-b border-app-border p-4">
        <CardTitle className="text-lg text-app-text-primary">{title}</CardTitle>
        <p className="text-xs leading-5 text-app-text-muted">
          {subtitle}
        </p>
      </CardHeader>
      <CardContent className="p-4">{panelContent}</CardContent>
    </Card>
  );
}
