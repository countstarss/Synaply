import { DocKind } from "@/lib/fetchers/doc";

export type DocsTranslationFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export type DocTemplateKey =
  | "blank"
  | "project-brief-v1"
  | "decision-log-v1"
  | "review-packet-v1"
  | "handoff-packet-v1"
  | "release-checklist-v1";

export interface DocTemplateDefinition {
  key: DocTemplateKey;
  kind: DocKind;
  labelKey: string;
  descriptionKey: string;
  suggestedTitleKey: string;
}

const DOC_TEMPLATE_DEFINITIONS: DocTemplateDefinition[] = [
  {
    key: "blank",
    kind: "GENERAL",
    labelKey: "creation.template.blank.label",
    descriptionKey: "creation.template.blank.description",
    suggestedTitleKey: "creation.template.blank.title",
  },
  {
    key: "project-brief-v1",
    kind: "PROJECT_BRIEF",
    labelKey: "creation.template.projectBrief.label",
    descriptionKey: "creation.template.projectBrief.description",
    suggestedTitleKey: "creation.template.projectBrief.title",
  },
  {
    key: "decision-log-v1",
    kind: "DECISION_LOG",
    labelKey: "creation.template.decisionLog.label",
    descriptionKey: "creation.template.decisionLog.description",
    suggestedTitleKey: "creation.template.decisionLog.title",
  },
  {
    key: "review-packet-v1",
    kind: "REVIEW_PACKET",
    labelKey: "creation.template.reviewPacket.label",
    descriptionKey: "creation.template.reviewPacket.description",
    suggestedTitleKey: "creation.template.reviewPacket.title",
  },
  {
    key: "handoff-packet-v1",
    kind: "HANDOFF_PACKET",
    labelKey: "creation.template.handoffPacket.label",
    descriptionKey: "creation.template.handoffPacket.description",
    suggestedTitleKey: "creation.template.handoffPacket.title",
  },
  {
    key: "release-checklist-v1",
    kind: "RELEASE_CHECKLIST",
    labelKey: "creation.template.releaseChecklist.label",
    descriptionKey: "creation.template.releaseChecklist.description",
    suggestedTitleKey: "creation.template.releaseChecklist.title",
  },
];

export function getDocTemplateDefinitions() {
  return DOC_TEMPLATE_DEFINITIONS;
}

export function findDocTemplateDefinition(templateKey?: string | null) {
  return DOC_TEMPLATE_DEFINITIONS.find((template) => template.key === templateKey);
}

export function getDefaultDocTemplateKey(projectId?: string) {
  return projectId ? "project-brief-v1" : "blank";
}

export function getDocKindLabel(kind: DocKind, tDocs: DocsTranslationFn) {
  switch (kind) {
    case "PROJECT_BRIEF":
      return tDocs("docKind.projectBrief");
    case "DECISION_LOG":
      return tDocs("docKind.decisionLog");
    case "REVIEW_PACKET":
      return tDocs("docKind.reviewPacket");
    case "HANDOFF_PACKET":
      return tDocs("docKind.handoffPacket");
    case "RELEASE_CHECKLIST":
      return tDocs("docKind.releaseChecklist");
    case "GENERAL":
    default:
      return tDocs("docKind.general");
  }
}

export function resolveDocTemplateTitle(
  templateKey: DocTemplateKey,
  tDocs: DocsTranslationFn,
  options?: { projectName?: string }
) {
  if (templateKey === "project-brief-v1" && options?.projectName) {
    return `${options.projectName} ${getDocKindLabel("PROJECT_BRIEF", tDocs)}`;
  }

  const definition =
    findDocTemplateDefinition(templateKey) ?? DOC_TEMPLATE_DEFINITIONS[0];

  return tDocs(definition.suggestedTitleKey);
}

function buildParagraphBlock(id: string, text?: string) {
  return {
    id,
    type: "paragraph",
    content: text
      ? [
          {
            type: "text",
            text,
          },
        ]
      : [],
  };
}

export function buildDocTemplateContent(
  templateKey: DocTemplateKey,
  tDocs: DocsTranslationFn
) {
  const templateContentMap: Record<DocTemplateKey, string[]> = {
    blank: [""],
    "project-brief-v1": [
      tDocs("creation.templateContent.projectBrief.intro"),
      "",
      tDocs("creation.templateContent.projectBrief.goal"),
      tDocs("creation.templateContent.projectBrief.scope"),
      tDocs("creation.templateContent.projectBrief.success"),
      tDocs("creation.templateContent.projectBrief.openQuestions"),
    ],
    "decision-log-v1": [
      tDocs("creation.templateContent.decisionLog.intro"),
      "",
      tDocs("creation.templateContent.decisionLog.decision"),
      tDocs("creation.templateContent.decisionLog.context"),
      tDocs("creation.templateContent.decisionLog.rationale"),
      tDocs("creation.templateContent.decisionLog.impact"),
      tDocs("creation.templateContent.decisionLog.followUp"),
    ],
    "review-packet-v1": [
      tDocs("creation.templateContent.reviewPacket.intro"),
      "",
      tDocs("creation.templateContent.reviewPacket.goal"),
      tDocs("creation.templateContent.reviewPacket.changeSummary"),
      tDocs("creation.templateContent.reviewPacket.focusQuestions"),
      tDocs("creation.templateContent.reviewPacket.decision"),
      tDocs("creation.templateContent.reviewPacket.nextStep"),
    ],
    "handoff-packet-v1": [
      tDocs("creation.templateContent.handoffPacket.intro"),
      "",
      tDocs("creation.templateContent.handoffPacket.target"),
      tDocs("creation.templateContent.handoffPacket.readyNow"),
      tDocs("creation.templateContent.handoffPacket.dependencies"),
      tDocs("creation.templateContent.handoffPacket.links"),
      tDocs("creation.templateContent.handoffPacket.receiverChecklist"),
    ],
    "release-checklist-v1": [
      tDocs("creation.templateContent.releaseChecklist.intro"),
      "",
      tDocs("creation.templateContent.releaseChecklist.scope"),
      tDocs("creation.templateContent.releaseChecklist.risk"),
      tDocs("creation.templateContent.releaseChecklist.goNoGo"),
      tDocs("creation.templateContent.releaseChecklist.ownerMap"),
      tDocs("creation.templateContent.releaseChecklist.postRelease"),
    ],
  };

  return JSON.stringify(
    templateContentMap[templateKey].map((text, index) =>
      buildParagraphBlock(`template-${templateKey}-${index}`, text)
    )
  );
}
