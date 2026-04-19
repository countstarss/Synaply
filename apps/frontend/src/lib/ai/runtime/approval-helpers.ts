import {
  appendAiMessage,
  assembleAiCodingPrompt,
  confirmAiApproval,
  executeAiAction,
  finishAiRun,
  rejectAiApproval,
  type ServerFetchOptions,
} from "@/lib/ai/backend";
import type {
  AiApprovalRecord,
  AiCodingPromptAssembly,
  AiExecutionActionResult,
  AiMessagePart,
} from "@/lib/ai/types";

export interface ApprovalBundleItem {
  actionKey: string;
  input: Record<string, unknown>;
  summary?: string | null;
}

interface ApprovalBundlePayload {
  kind: "batch";
  items: ApprovalBundleItem[];
  summary?: string | null;
}

interface ExecutedApprovalItem {
  actionKey: string;
  input: Record<string, unknown>;
  summary: string;
  execution: AiExecutionActionResult;
}

function clipText(value: string, maxLength = 2200) {
  const text = value.trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(maxLength - 1, 0)).trimEnd()}…`;
}

function safeJson(value: unknown, maxLength = 1800) {
  try {
    return clipText(JSON.stringify(value, null, 2), maxLength);
  } catch {
    return clipText(String(value), maxLength);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(input: Record<string, unknown>, key: string) {
  const value = input[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isApprovalBundlePayload(value: unknown): value is ApprovalBundlePayload {
  if (!isRecord(value) || value.kind !== "batch" || !Array.isArray(value.items)) {
    return false;
  }

  return value.items.every(
    (item) =>
      isRecord(item) &&
      typeof item.actionKey === "string" &&
      isRecord(item.input),
  );
}

async function resolveExecutionInput(
  actionKey: string,
  input: Record<string, unknown>,
  opts: ServerFetchOptions,
): Promise<{
  resolvedInput: Record<string, unknown>;
  codingPromptAssembly: AiCodingPromptAssembly | null;
}> {
  if (actionKey !== "attach_coding_prompt_to_issue") {
    return {
      resolvedInput: input,
      codingPromptAssembly: null,
    };
  }

  const issueId = readString(input, "issueId");
  const existingPrompt = readString(input, "prompt");

  if (!issueId) {
    throw new Error("attach_coding_prompt_to_issue 需要 issueId");
  }

  if (existingPrompt) {
    return {
      resolvedInput: input,
      codingPromptAssembly: null,
    };
  }

  const assembly = await assembleAiCodingPrompt(opts, issueId);

  return {
    resolvedInput: {
      ...input,
      issueId,
      prompt: assembly.prompt,
    },
    codingPromptAssembly: assembly,
  };
}

function getApprovalItems(approval: AiApprovalRecord): {
  items: ApprovalBundleItem[];
  summary: string;
} {
  if (isApprovalBundlePayload(approval.input)) {
    return {
      items: approval.input.items,
      summary: approval.summary ?? approval.input.summary ?? "待确认的批量动作",
    };
  }

  const singleInput = isRecord(approval.input) ? approval.input : {};

  return {
    items: [
      {
        actionKey: approval.actionKey,
        input: singleInput,
        summary: approval.summary,
      },
    ],
    summary: approval.summary ?? `待确认动作 ${approval.actionKey}`,
  };
}

function buildExecutionText(items: ExecutedApprovalItem[], summary: string) {
  if (items.length === 1) {
    const [item] = items;
    return clipText(
      [
        `动作 ${item.actionKey} 已确认执行。`,
        item.summary ? `摘要：${item.summary}` : null,
        item.execution.message ? `消息：${item.execution.message}` : null,
        item.execution.result ? `结果：${safeJson(item.execution.result)}` : null,
        item.execution.error?.message
          ? `错误：${item.execution.error.message}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  const successCount = items.filter(
    (item) => item.execution.status === "succeeded",
  ).length;
  const failedCount = items.length - successCount;

  const lines = [
    `批量动作已确认执行。`,
    `摘要：${summary}`,
    `结果：共 ${items.length} 项，成功 ${successCount} 项，失败 ${failedCount} 项。`,
    ...items.map((item, index) => {
      const title =
        readString(item.input, "title") ||
        readString(item.input, "name") ||
        item.summary ||
        item.actionKey;
      const suffix =
        item.execution.status === "succeeded"
          ? "成功"
          : `失败：${item.execution.error?.message ?? item.execution.message}`;

      return `${index + 1}. ${title} - ${suffix}`;
    }),
  ];

  return clipText(lines.join("\n"), 2600);
}

function buildAssistantText(items: ExecutedApprovalItem[]) {
  if (items.length === 1) {
    return items[0].execution.status === "succeeded"
      ? "已经按你的确认执行完成。"
      : `执行未完成：${items[0].execution.message}`;
  }

  const successCount = items.filter(
    (item) => item.execution.status === "succeeded",
  ).length;
  const failedCount = items.length - successCount;

  if (failedCount === 0) {
    return `已经按你的确认批量执行完成，共 ${items.length} 项。`;
  }

  return `批量执行已完成，共 ${items.length} 项，成功 ${successCount} 项，失败 ${failedCount} 项。`;
}

function buildToolOutput(items: ExecutedApprovalItem[], summary: string) {
  if (items.length === 1) {
    return items[0].execution;
  }

  const successCount = items.filter(
    (item) => item.execution.status === "succeeded",
  ).length;
  const failedCount = items.length - successCount;

  return {
    executionId: items.map((item) => item.execution.executionId).join(","),
    status: failedCount === 0 ? "succeeded" : "failed",
    needsConfirmation: false,
    message:
      failedCount === 0
        ? `批量动作执行成功，共 ${items.length} 项。`
        : `批量动作执行完成，共 ${items.length} 项，失败 ${failedCount} 项。`,
    summary,
    targetId: null,
    approvalMode: "CONFIRM" as const,
    action: {
      key: "execute_many",
      label: "批量执行动作",
      description: "按顺序执行一组已确认动作。",
      area: "issue" as const,
      targetType: "WORKSPACE" as const,
      approvalMode: "CONFIRM" as const,
      requiresTargetId: false,
      fields: [],
      sampleInput: {},
    },
    result: {
      total: items.length,
      succeeded: successCount,
      failed: failedCount,
      items: items.map((item) => ({
        actionKey: item.actionKey,
        summary: item.summary,
        input: item.input,
        status: item.execution.status,
        message: item.execution.message,
        result: item.execution.result,
        error: item.execution.error,
      })),
    },
  };
}

export async function confirmAndExecuteApproval(
  opts: ServerFetchOptions,
  threadId: string,
  approvalId: string,
) {
  const approval = await confirmAiApproval(opts, threadId, approvalId);
  const { items, summary } = getApprovalItems(approval);
  const executedItems: ExecutedApprovalItem[] = [];
  const codingPrompts: AiCodingPromptAssembly[] = [];

  for (const item of items) {
    const { resolvedInput, codingPromptAssembly } = await resolveExecutionInput(
      item.actionKey,
      item.input,
      opts,
    );

    if (codingPromptAssembly) {
      codingPrompts.push(codingPromptAssembly);
    }

    const execution = await executeAiAction(opts, item.actionKey, {
      input: resolvedInput,
      confirmed: true,
      conversationId: threadId,
    });

    executedItems.push({
      actionKey: item.actionKey,
      input: resolvedInput,
      summary: item.summary ?? execution.summary,
      execution,
    });
  }

  const toolOutput = buildToolOutput(executedItems, summary);
  const toolText = buildExecutionText(executedItems, summary);
  const assistantText = buildAssistantText(executedItems);
  const isSuccess = executedItems.every(
    (item) => item.execution.status === "succeeded",
  );
  const toolName =
    executedItems.length === 1
      ? `action:${executedItems[0].actionKey}`
      : "action:execute_many";
  const toolInput =
    executedItems.length === 1
      ? executedItems[0].input
      : {
          items: executedItems.map((item) => ({
            actionKey: item.actionKey,
            input: item.input,
            summary: item.summary,
          })),
        };

  const toolParts: AiMessagePart[] = [
    {
      type: "tool-call",
      toolCallId: `approval-${approval.id}`,
      toolName,
      input: toolInput,
    },
    {
      type: "tool-result",
      toolCallId: `approval-${approval.id}`,
      toolName,
      output: toolOutput,
      isError: !isSuccess,
    },
    {
      type: "text",
      text: toolText,
    },
  ];

  await appendAiMessage(opts, threadId, {
    role: "TOOL",
    runId: approval.runId,
    parts: toolParts,
  });

  const assistantParts: AiMessagePart[] = [
    {
      type: "text",
      text: assistantText,
    },
    ...codingPrompts.map(
      (prompt): AiMessagePart => ({
        type: "coding-prompt",
        issueId: prompt.issueId,
        prompt: prompt.prompt,
        generatedAt: new Date().toISOString(),
      }),
    ),
  ];

  await appendAiMessage(opts, threadId, {
    role: "ASSISTANT",
    runId: approval.runId,
    parts: assistantParts,
  });

  await finishAiRun(opts, threadId, approval.runId, {
    status: isSuccess ? "COMPLETED" : "FAILED",
  });

  return {
    approval,
    execution: toolOutput,
    assistantText,
  };
}

export async function rejectApprovalWithMessage(
  opts: ServerFetchOptions,
  threadId: string,
  approvalId: string,
) {
  const approval = await rejectAiApproval(opts, threadId, approvalId);

  await appendAiMessage(opts, threadId, {
    role: "SYSTEM",
    runId: approval.runId,
    parts: [
      {
        type: "error",
        message: approval.summary
          ? `你已拒绝动作：${approval.summary}`
          : `你已拒绝动作 ${approval.actionKey}`,
      },
    ],
  });

  return approval;
}
