"use client";

import type {
  AiApprovalRequestPart,
  AiMessagePart,
  AiMessageRecord,
  AiToolResultPart,
} from "@/lib/ai/types";

type AiTranslate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function getPrettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getToolSummary(part: AiToolResultPart, tAi: AiTranslate) {
  if (
    part.output &&
    typeof part.output === "object" &&
    !Array.isArray(part.output)
  ) {
    const output = part.output as {
      message?: unknown;
      summary?: unknown;
      status?: unknown;
    };

    const lines = [
      typeof output.status === "string"
        ? tAi("workbench.plainText.status", { value: output.status })
        : null,
      typeof output.summary === "string"
        ? tAi("workbench.plainText.summary", { value: output.summary })
        : null,
      typeof output.message === "string"
        ? tAi("workbench.plainText.message", { value: output.message })
        : null,
    ].filter(Boolean);

    if (lines.length > 0) {
      return lines.join("\n");
    }
  }

  return part.isError
    ? tAi("workbench.plainText.toolFailed")
    : tAi("workbench.plainText.toolCompleted");
}

function getApprovalSummary(part: AiApprovalRequestPart, tAi: AiTranslate) {
  const lines = [
    part.summary ? tAi("workbench.plainText.summary", { value: part.summary }) : null,
    tAi("workbench.plainText.action", { value: part.actionKey }),
    Array.isArray(part.items) && part.items.length > 0
      ? tAi("workbench.plainText.batchActions", { count: part.items.length })
      : null,
  ].filter(Boolean);

  return lines.join("\n");
}

function getPartText(part: AiMessagePart, tAi: AiTranslate) {
  switch (part.type) {
    case "text":
      return part.text;
    case "error":
      return tAi("workbench.plainText.error", { value: part.message });
    case "context-chip":
      return tAi("workbench.plainText.context", { value: part.label });
    case "tool-result":
      return `${tAi("workbench.plainText.tool", { name: part.toolName })}\n${getToolSummary(part, tAi)}\n${getPrettyJson(part.output)}`;
    case "approval-request":
      return `${tAi("workbench.plainText.approval")}\n${getApprovalSummary(part, tAi)}`;
    case "coding-prompt":
      return `${tAi("workbench.plainText.codingPrompt")}\n${part.prompt}`;
    case "clarification-options":
      return `${tAi("workbench.plainText.options")}\n${part.options
        .map((option) =>
          option.description
            ? `- ${option.label} (${option.description})`
            : `- ${option.label}`,
        )
        .join("\n")}`;
    case "tool-call":
      return "";
    default:
      return "";
  }
}

export function getAiMessagePlainText(message: AiMessageRecord, tAi: AiTranslate) {
  const body = message.parts
    .map((part) => getPartText(part, tAi))
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return body || tAi("workbench.plainText.noContent");
}

export function getAiMessageRoleLabel(message: AiMessageRecord, tAi: AiTranslate) {
  switch (message.role) {
    case "USER":
      return tAi("workbench.roles.user");
    case "ASSISTANT":
      return tAi("workbench.roles.assistant");
    case "SYSTEM":
      return tAi("workbench.roles.system");
    case "TOOL":
      return tAi("workbench.roles.tool");
    default:
      return tAi("workbench.roles.message");
  }
}

export function getAiMessageSelectionText(
  message: AiMessageRecord,
  tAi: AiTranslate,
) {
  return `${getAiMessageRoleLabel(message, tAi)}:\n${getAiMessagePlainText(message, tAi)}`;
}

export function getAiMessagePreviewTitle(message: AiMessageRecord, tAi: AiTranslate) {
  const text = getAiMessagePlainText(message, tAi)
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return getAiMessageRoleLabel(message, tAi);
  }

  return text.length > 56 ? `${text.slice(0, 56)}...` : text;
}
