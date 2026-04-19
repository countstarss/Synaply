"use client";

import React from "react";
import { RiListCheck3 } from "react-icons/ri";
import { Button } from "@/components/ui/button";

type IssueTranslationFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function buildIssueDescriptionTemplate(tIssues: IssueTranslationFn) {
  return [
    `## ${tIssues("descriptionTemplate.sections.background")}`,
    `- ${tIssues("descriptionTemplate.placeholders.background")}`,
    "",
    `## ${tIssues("descriptionTemplate.sections.acceptance")}`,
    `- [ ] ${tIssues("descriptionTemplate.placeholders.acceptance")}`,
    "",
    `## ${tIssues("descriptionTemplate.sections.risks")}`,
    `- ${tIssues("descriptionTemplate.placeholders.risks")}`,
    "",
    `## ${tIssues("descriptionTemplate.sections.nextStep")}`,
    `- ${tIssues("descriptionTemplate.placeholders.nextStep")}`,
  ].join("\n");
}

function mergeIssueDescriptionTemplate(
  value: string,
  tIssues: IssueTranslationFn,
) {
  const trimmedValue = value.trimEnd();
  const template = buildIssueDescriptionTemplate(tIssues);

  return trimmedValue ? `${trimmedValue}\n\n${template}` : template;
}

export function IssueDescriptionTemplateAction({
  tIssues,
  value,
  onApply,
}: {
  tIssues: IssueTranslationFn;
  value: string;
  onApply: (nextValue: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-app-border bg-transparent text-app-text-primary"
      onClick={() => onApply(mergeIssueDescriptionTemplate(value, tIssues))}
    >
      <RiListCheck3 className="h-4 w-4" />
      {tIssues("descriptionTemplate.actions.insert")}
    </Button>
  );
}
