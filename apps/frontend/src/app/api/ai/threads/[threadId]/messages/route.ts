import { NextResponse } from "next/server";
import { z } from "zod";
import {
  generateAiText,
  getAiRuntimeErrorMessage,
  isTransientAiProviderError,
  type AiRuntimeMessage,
} from "@/lib/ai/agent";
import { DEFAULT_AI_MODEL_ID } from "@/lib/ai/models";
import {
  appendAiMessage,
  assembleAiCodingPrompt,
  createAiApproval,
  executeAiAction,
  finishAiRun,
  getAiApproval,
  getAiActorContext,
  getAiExecutionCapabilities,
  getAiExecutionManifest,
  getAiThread,
  listAiIssues,
  getAiWorkspaceSummary,
  getAiProjectDetail,
  getAiIssueDetail,
  getAiWorkflowRunDetail,
  getAiDocDetail,
  listAiThreadMessages,
  postAiSurfaceSummaries,
  recordAiRunStep,
  searchAiDocs,
  searchAiIssues,
  searchAiProjects,
  searchAiWorkflows,
  searchAiWorkspaceMembers,
  startAiRun,
  type ServerFetchOptions,
} from "@/lib/ai/backend";
import {
  createRuntimeContext,
  extractBearerToken,
} from "@/lib/ai/runtime/context";
import {
  confirmAndExecuteApproval,
  rejectApprovalWithMessage,
  type ApprovalBundleItem,
} from "@/lib/ai/runtime/approval-helpers";
import { buildAiSystemPrompt } from "@/lib/ai/runtime/system-prompt";
import { buildPlannerSystemPrompt } from "@/lib/ai/runtime/execution-policy";
import {
  compileIntentPlan,
  parseIntentPlan,
  type IntentPlan,
} from "@/lib/ai/runtime/intent-compiler";
import {
  type AiCodingPromptAssembly,
  type AiApprovalRecord,
  type AiExecutionActionResult,
  type AiMessagePart,
  type AiMessageRecord,
} from "@/lib/ai/types";

const MAX_AGENT_STEPS = 6;
const EXECUTION_ACTION_ALLOWLIST = new Set([
  "create_project",
  "create_issue",
  "create_comment",
  "update_issue",
  "advance_workflow_run",
  "request_workflow_review",
  "attach_coding_prompt_to_issue",
  "create_workflow_run",
]);
const READ_TOOL_NAMES = [
  "get_workspace_summary",
  "get_current_actor_context",
  "search_projects",
  "get_project_detail",
  "list_issues",
  "search_issues",
  "get_issue_detail",
  "search_workflows",
  "get_workflow_run_detail",
  "search_docs",
  "get_doc_detail",
  "search_workspace_members",
  "assemble_coding_prompt",
] as const;

const sendMessageSchema = z.object({
  workspaceId: z.string().trim().min(1),
  text: z.string().trim().min(1).max(4000),
});

type ReadToolName = (typeof READ_TOOL_NAMES)[number];

interface ToolEvent {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  isError?: boolean;
  text: string;
}

function describeMessagePartForRuntime(part: AiMessagePart) {
  switch (part.type) {
    case "text":
      return part.text.trim();
    case "error":
      return `[系统错误] ${part.message}`.trim();
    case "coding-prompt":
      return `[编码交接 Prompt] issue=${part.issueId ?? "unknown"}`;
    case "approval-request":
      return `[待确认动作] ${part.summary} (approvalId=${part.approvalId}, action=${part.actionKey})`;
    case "tool-result":
      if (part.output && typeof part.output === "object") {
        const output = part.output as {
          status?: unknown;
          summary?: unknown;
          message?: unknown;
        };

        return clipText(
          [
            `[工具结果 ${part.toolName}]`,
            typeof output.status === "string" ? `status=${output.status}` : null,
            typeof output.summary === "string"
              ? `summary=${output.summary}`
              : null,
            typeof output.message === "string"
              ? `message=${output.message}`
              : null,
          ]
            .filter(Boolean)
            .join(" "),
          600,
        );
      }

      return `[工具结果 ${part.toolName}]`;
    case "clarification-options":
      return `[候选项] ${part.options.map((item) => item.label).join(" / ")}`;
    default:
      return "";
  }
}

function toRuntimeMessages(messages: AiMessageRecord[]): AiRuntimeMessage[] {
  return messages.reduce<AiRuntimeMessage[]>((accumulator, message) => {
    const text = message.parts
      .map((part) => describeMessagePartForRuntime(part))
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!text) {
      return accumulator;
    }

    if (message.role === "USER") {
      accumulator.push({ role: "user", content: text });
      return accumulator;
    }

    if (message.role === "ASSISTANT") {
      accumulator.push({ role: "assistant", content: text });
      return accumulator;
    }

    if (message.role === "SYSTEM" || message.role === "TOOL") {
      accumulator.push({ role: "system", content: text });
      return accumulator;
    }

    return accumulator;
  }, []);
}

function buildSummaryMessage(summaries: Array<{ text: string }>) {
  return summaries
    .map((summary) => summary.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

function clipText(value: string, maxLength = 2200) {
  const text = value.trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(maxLength - 1, 0)).trimEnd()}…`;
}

function safeJson(value: unknown, maxLength = 2600) {
  try {
    const raw = JSON.stringify(
      value,
      (_, currentValue) =>
        currentValue instanceof Date
          ? currentValue.toISOString()
          : typeof currentValue === "bigint"
            ? Number(currentValue)
            : currentValue,
      2,
    );

    return clipText(raw, maxLength);
  } catch {
    return clipText(String(value), maxLength);
  }
}

function toErrorPayload(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    message: "发生未知错误",
    detail: String(error),
  };
}

function buildReadToolResultText(toolName: ReadToolName, output: unknown) {
  const text =
    output && typeof output === "object" && "text" in output
      ? String((output as { text?: unknown }).text ?? "")
      : "";

  switch (toolName) {
    case "assemble_coding_prompt":
      return clipText(
        text || "已组装 coding handoff prompt，可直接复制给外部编码 agent。",
      );
    case "search_projects":
      return clipText(text || "已完成项目搜索。");
    case "list_issues":
      return clipText(text || "已按条件列出 issue。");
    case "search_issues":
      return clipText(text || "已完成 issue 搜索。");
    case "search_workflows":
      return clipText(text || "已完成 workflow 搜索。");
    case "search_docs":
      return clipText(text || "已完成文档搜索。");
    case "search_workspace_members":
      return clipText(text || "已完成成员搜索。");
    default:
      return clipText(text || `已读取 ${toolName}。`);
  }
}

function buildExecutionResultText(actionKey: string, output: {
  status: string;
  message: string;
  summary: string;
  result?: unknown;
  error?: { message?: string };
}) {
  const lines = [
    `动作 ${actionKey} 返回状态：${output.status}`,
    output.summary ? `摘要：${output.summary}` : null,
    output.message ? `消息：${output.message}` : null,
    output.error?.message ? `错误：${output.error.message}` : null,
    output.result ? `结果：${safeJson(output.result, 1800)}` : null,
  ];

  return clipText(lines.filter(Boolean).join("\n"));
}

function buildToolEventParts(event: ToolEvent): AiMessagePart[] {
  return [
    {
      type: "tool-call",
      toolCallId: event.toolCallId,
      toolName: event.toolName,
      input: event.input,
    },
    {
      type: "tool-result",
      toolCallId: event.toolCallId,
      toolName: event.toolName,
      output: event.output,
      isError: event.isError,
    },
    {
      type: "text",
      text: event.text,
    },
  ];
}

function readStringArg(input: Record<string, unknown>, key: string) {
  const value = input[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function invokeReadTool(
  toolName: ReadToolName,
  args: Record<string, unknown>,
  opts: ServerFetchOptions,
) {
  switch (toolName) {
    case "get_workspace_summary":
      return getAiWorkspaceSummary(opts);
    case "get_current_actor_context":
      return getAiActorContext(opts);
    case "search_projects":
      return searchAiProjects(opts, {
        query:
          typeof args.query === "string" ? args.query.trim() : undefined,
        limit:
          typeof args.limit === "number" && Number.isFinite(args.limit)
            ? args.limit
            : undefined,
      });
    case "get_project_detail": {
      const projectId = readStringArg(args, "projectId");
      if (!projectId) {
        throw new Error("get_project_detail 需要 projectId");
      }
      return getAiProjectDetail(opts, projectId);
    }
    case "list_issues":
      return listAiIssues(opts, {
        projectId: readStringArg(args, "projectId") ?? undefined,
        assigneeScope:
          args.assigneeScope === "ME" || args.assigneeScope === "ANY"
            ? args.assigneeScope
            : undefined,
        stateCategories: Array.isArray(args.stateCategories)
          ? args.stateCategories.filter(
              (item): item is string =>
                typeof item === "string" && item.trim().length > 0,
            )
          : undefined,
        limit:
          typeof args.limit === "number" && Number.isFinite(args.limit)
            ? args.limit
            : undefined,
      });
    case "search_issues":
      return searchAiIssues(opts, {
        query:
          typeof args.query === "string" ? args.query.trim() : undefined,
        projectId: readStringArg(args, "projectId") ?? undefined,
        limit:
          typeof args.limit === "number" && Number.isFinite(args.limit)
            ? args.limit
            : undefined,
      });
    case "search_workflows":
      return searchAiWorkflows(opts, {
        query:
          typeof args.query === "string" ? args.query.trim() : undefined,
        limit:
          typeof args.limit === "number" && Number.isFinite(args.limit)
            ? args.limit
            : undefined,
      });
    case "get_issue_detail": {
      const issueId = readStringArg(args, "issueId");
      if (!issueId) {
        throw new Error("get_issue_detail 需要 issueId");
      }
      return getAiIssueDetail(opts, issueId);
    }
    case "get_workflow_run_detail": {
      const issueId = readStringArg(args, "issueId");
      if (!issueId) {
        throw new Error("get_workflow_run_detail 需要 issueId");
      }
      return getAiWorkflowRunDetail(opts, issueId);
    }
    case "search_docs":
      return searchAiDocs(opts, {
        query:
          typeof args.query === "string" ? args.query.trim() : undefined,
        limit:
          typeof args.limit === "number" && Number.isFinite(args.limit)
            ? args.limit
            : undefined,
      });
    case "get_doc_detail": {
      const docId = readStringArg(args, "docId");
      if (!docId) {
        throw new Error("get_doc_detail 需要 docId");
      }
      return getAiDocDetail(opts, docId);
    }
    case "search_workspace_members":
      return searchAiWorkspaceMembers(opts, {
        query:
          typeof args.query === "string" ? args.query.trim() : undefined,
        limit:
          typeof args.limit === "number" && Number.isFinite(args.limit)
            ? args.limit
            : undefined,
      });
    case "assemble_coding_prompt": {
      const issueId = readStringArg(args, "issueId");
      if (!issueId) {
        throw new Error("assemble_coding_prompt 需要 issueId");
      }
      return assembleAiCodingPrompt(opts, issueId);
    }
    default:
      throw new Error(`未知 read tool: ${String(toolName)}`);
  }
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

  const issueId = readStringArg(input, "issueId");
  const existingPrompt = readStringArg(input, "prompt");

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

type ApprovalIntent = "confirm" | "reject" | null;

interface PreviewBundleItem {
  actionKey: string;
  input: Record<string, unknown>;
  summary: string;
  status: AiExecutionActionResult["status"];
  needsConfirmation: boolean;
  message: string;
  preview?: unknown;
  error?: AiExecutionActionResult["error"];
}

function isQuestionLike(text: string) {
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  return /[?？]|(为什么|怎么|如何|能不能|可不可以|可以吗|是否|要不要|需不需要|解释一下|说明一下|先.*吗)/i.test(
    normalized,
  );
}

function detectApprovalIntent(text: string): ApprovalIntent {
  const normalized = text.trim().toLowerCase();

  if (!normalized || isQuestionLike(normalized)) {
    return null;
  }

  if (/^(拒绝|取消|先别|不要执行|算了|不执行|reject|cancel)\b/i.test(normalized)) {
    return "reject";
  }

  if (
    /^(可以|好的|好|行|那就|请)?[\s，,]*(执行|确认|继续|继续执行|继续创建|开始执行|开始创建|直接执行|直接创建|同意|批准|approve|confirm|run|go ahead)\b/i.test(
      normalized,
    ) ||
    /^根据.*(执行|确认)/i.test(normalized)
  ) {
    return "confirm";
  }

  return null;
}

function allowsDirectExecution(text: string) {
  const normalized = text.trim().toLowerCase();

  if (!normalized || isQuestionLike(normalized)) {
    return false;
  }

  return /(直接执行|直接创建|直接批量创建|直接帮我创建|不用确认|无需确认|你可以直接执行|你可以直接创建|一次创建|一次性创建|一并创建|一次生成创建|batch create|go ahead|without confirmation)/i.test(
    normalized,
  );
}

function getScopedProjectId(
  runtimeContext: ReturnType<typeof createRuntimeContext>,
  thread: Awaited<ReturnType<typeof getAiThread>>,
) {
  const projectIds = new Set<string>();

  if (runtimeContext.surface?.type === "PROJECT") {
    projectIds.add(runtimeContext.surface.id);
  }

  if (
    thread.originSurfaceType === "PROJECT" &&
    typeof thread.originSurfaceId === "string"
  ) {
    projectIds.add(thread.originSurfaceId);
  }

  for (const pin of thread.pins ?? []) {
    if (pin.surfaceType === "PROJECT" && pin.surfaceId) {
      projectIds.add(pin.surfaceId);
    }
  }

  return projectIds.size === 1 ? Array.from(projectIds)[0] : undefined;
}

function detectScopedIssueReadPlan(params: {
  text: string;
  runtimeContext: ReturnType<typeof createRuntimeContext>;
  thread: Awaited<ReturnType<typeof getAiThread>>;
}): IntentPlan | null {
  const normalized = params.text.trim().toLowerCase();
  const scopedProjectId = getScopedProjectId(
    params.runtimeContext,
    params.thread,
  );
  const asksMyIssues = /(我负责|我的|assigned to me|我在跟)/i.test(normalized);

  if (!normalized) {
    return null;
  }

  if (
    /(创建|新建|添加|评论|回复|review|评审|推进|写回|prompt|交接|更新|标记|完成它|完成这个)/i.test(
      normalized,
    )
  ) {
    return null;
  }

  const mentionsIssues = /(任务|issue|issues|流程任务)/i.test(normalized);
  const asksForScopedRead =
    /(多少|几条|几个|列出|看看|看下|有哪些|哪些|清单|列表|还剩|未完成|进行中|已完成|统计)/i.test(
      normalized,
    );

  if (!mentionsIssues || !asksForScopedRead) {
    return null;
  }

  if (!scopedProjectId && !asksMyIssues) {
    return null;
  }

  const stateCategories: string[] = [];

  if (/(未完成|没完成|开放|open|待办|还剩)/i.test(normalized)) {
    stateCategories.push("BACKLOG", "TODO", "IN_PROGRESS");
  } else if (/(已完成|完成了|done)/i.test(normalized)) {
    stateCategories.push("DONE");
  } else if (/(已取消|取消了|canceled)/i.test(normalized)) {
    stateCategories.push("CANCELED");
  } else if (/(进行中|推进中|in progress)/i.test(normalized)) {
    stateCategories.push("IN_PROGRESS");
  }

  return {
    type: "read",
    tool: "list_issues",
    arguments: {
      projectId: scopedProjectId,
      assigneeScope: asksMyIssues ? "ME" : "ANY",
      stateCategories: stateCategories.length > 0 ? stateCategories : undefined,
      limit: 50,
    },
  };
}

function looksLikePlainTextPlannerReply(rawText: string) {
  const trimmed = rawText.trim();
  const looksLikeEmbeddedJson = /\{[\s\S]*"type"\s*:/.test(trimmed);

  return Boolean(
    trimmed &&
      !trimmed.startsWith("{") &&
      !trimmed.startsWith("```json") &&
      !trimmed.startsWith("```") &&
      !looksLikeEmbeddedJson,
  );
}

function getLatestUserText(messages: AiRuntimeMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.role === "user" && message.content.trim()) {
      return message.content.trim();
    }
  }

  return "";
}

function requiresStructuredPlannerOutput(text: string) {
  const mentionsStructuredObject =
    /(项目|project|任务|issue|issues|workflow|流程|文档|doc|评论|comment|review|评审|prompt|成员|负责人|assignee)/i.test(
      text,
    );
  const asksStructuredRead =
    /(多少|几条|几个|列出|看看|看下|有哪些|哪些|清单|列表|统计|搜索|查找|状态|进度|谁负责|谁在跟|未完成|已完成|进行中)/i.test(
      text,
    );
  const asksStructuredWrite =
    /(创建|新建|添加|更新|修改|标记|完成|取消|推进|指派|分配|写回|评论|回复|review|评审|handoff|交接|attach|生成)/i.test(
      text,
    );

  return mentionsStructuredObject && (asksStructuredRead || asksStructuredWrite);
}

async function findPendingApprovals(
  backendOptions: ServerFetchOptions,
  threadId: string,
  messages: AiMessageRecord[],
) {
  const approvalIds = Array.from(
    new Set(
      messages
        .flatMap((message) =>
          message.parts.flatMap((part) =>
            part.type === "approval-request" ? [part.approvalId] : [],
          ),
        )
        .reverse(),
    ),
  ).slice(0, 12);

  const approvals = await Promise.all(
    approvalIds.map(async (approvalId) => {
      try {
        return await getAiApproval(backendOptions, threadId, approvalId);
      } catch {
        return null;
      }
    }),
  );

  return approvals.filter(
    (approval: AiApprovalRecord | null): approval is AiApprovalRecord =>
      approval?.status === "PENDING",
  );
}

async function previewExecutionItems(
  items: ApprovalBundleItem[],
  backendOptions: ServerFetchOptions,
  threadId: string,
) {
  const previewItems: PreviewBundleItem[] = [];
  let latestCodingPrompt: AiCodingPromptAssembly | null = null;

  for (const item of items) {
    const { resolvedInput, codingPromptAssembly } = await resolveExecutionInput(
      item.actionKey,
      item.input,
      backendOptions,
    );

    if (codingPromptAssembly) {
      latestCodingPrompt = codingPromptAssembly;
    }

    const execution = await executeAiAction(backendOptions, item.actionKey, {
      input: resolvedInput,
      dryRun: true,
      conversationId: threadId,
    });

    previewItems.push({
      actionKey: item.actionKey,
      input: resolvedInput,
      summary: item.summary ?? execution.summary,
      status: execution.status,
      needsConfirmation: execution.needsConfirmation,
      message: execution.message,
      preview: execution.result,
      error: execution.error,
    });
  }

  return {
    previewItems,
    latestCodingPrompt,
  };
}

async function executeExecutionItems(
  items: ApprovalBundleItem[],
  backendOptions: ServerFetchOptions,
  threadId: string,
  confirmed: boolean,
) {
  const executedItems: Array<{
    actionKey: string;
    input: Record<string, unknown>;
    summary: string;
    execution: AiExecutionActionResult;
  }> = [];
  let latestCodingPrompt: AiCodingPromptAssembly | null = null;

  for (const item of items) {
    const { resolvedInput, codingPromptAssembly } = await resolveExecutionInput(
      item.actionKey,
      item.input,
      backendOptions,
    );

    if (codingPromptAssembly) {
      latestCodingPrompt = codingPromptAssembly;
    }

    const execution = await executeAiAction(backendOptions, item.actionKey, {
      input: resolvedInput,
      confirmed,
      conversationId: threadId,
    });

    executedItems.push({
      actionKey: item.actionKey,
      input: resolvedInput,
      summary: item.summary ?? execution.summary,
      execution,
    });
  }

  return {
    executedItems,
    latestCodingPrompt,
  };
}

function buildBatchToolText(summary: string, items: PreviewBundleItem[]) {
  return clipText(
    [
      "批量动作已完成预演。",
      `摘要：${summary}`,
      `共 ${items.length} 项，等待你的统一确认。`,
      ...items.map((item, index) => {
        const title =
          readStringArg(item.input, "title") ||
          readStringArg(item.input, "name") ||
          item.summary ||
          item.actionKey;
        return `${index + 1}. ${title}`;
      }),
    ].join("\n"),
    2400,
  );
}

function buildBatchToolOutput(summary: string, items: PreviewBundleItem[]) {
  return {
    status: "preview" as const,
    message: "已完成批量预演，等待确认。",
    summary,
    needsConfirmation: true,
    targetId: null,
    approvalMode: "CONFIRM" as const,
    action: {
      key: "execute_many",
      label: "批量执行动作",
      description: "按顺序执行一组动作。",
      area: "issue" as const,
      targetType: "WORKSPACE" as const,
      approvalMode: "CONFIRM" as const,
      requiresTargetId: false,
      fields: [],
      sampleInput: {},
    },
    result: {
      total: items.length,
      items,
    },
  };
}

function buildBatchAssistantText(
  items: Array<{
    actionKey: string;
    summary: string;
    input: Record<string, unknown>;
    execution: AiExecutionActionResult;
  }>,
) {
  const successCount = items.filter(
    (item) => item.execution.status === "succeeded",
  ).length;
  const failedCount = items.length - successCount;

  if (failedCount === 0) {
    return `这批动作已经执行完成，共 ${items.length} 项。`;
  }

  return `这批动作已执行完毕，共 ${items.length} 项，成功 ${successCount} 项，失败 ${failedCount} 项。`;
}

function buildExecutedBatchToolText(
  summary: string,
  items: Array<{
    actionKey: string;
    summary: string;
    input: Record<string, unknown>;
    execution: AiExecutionActionResult;
  }>,
) {
  const successCount = items.filter(
    (item) => item.execution.status === "succeeded",
  ).length;
  const failedCount = items.length - successCount;

  return clipText(
    [
      "批量动作已执行完成。",
      `摘要：${summary}`,
      `共 ${items.length} 项，成功 ${successCount} 项，失败 ${failedCount} 项。`,
      ...items.map((item, index) => {
        const title =
          readStringArg(item.input, "title") ||
          readStringArg(item.input, "name") ||
          item.summary ||
          item.actionKey;
        const suffix =
          item.execution.status === "succeeded"
            ? "成功"
            : `失败：${item.execution.error?.message ?? item.execution.message}`;
        return `${index + 1}. ${title} - ${suffix}`;
      }),
    ].join("\n"),
    2600,
  );
}

function buildExecutedBatchToolOutput(
  summary: string,
  items: Array<{
    actionKey: string;
    summary: string;
    input: Record<string, unknown>;
    execution: AiExecutionActionResult;
  }>,
) {
  const successCount = items.filter(
    (item) => item.execution.status === "succeeded",
  ).length;
  const failedCount = items.length - successCount;

  return {
    status: failedCount === 0 ? "succeeded" : "failed",
    message:
      failedCount === 0
        ? `批量动作执行成功，共 ${items.length} 项。`
        : `批量动作执行完成，共 ${items.length} 项，失败 ${failedCount} 项。`,
    summary,
    needsConfirmation: false,
    targetId: null,
    approvalMode: "CONFIRM" as const,
    action: {
      key: "execute_many",
      label: "批量执行动作",
      description: "按顺序执行一组动作。",
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

async function requestIntentPlan(params: {
  systemPrompt: string;
  messages: AiRuntimeMessage[];
  runtimeContext: ReturnType<typeof createRuntimeContext>;
  signal: AbortSignal;
  durableBackendOptions: ServerFetchOptions;
  threadId: string;
  runId: string;
  stepIndex: number;
}) {
  let attempts = 0;
  let stepIndex = params.stepIndex;
  let totalTokensUsed = 0;
  let retryInstruction = "";
  const latestUserText = getLatestUserText(params.messages);

  while (attempts < 2) {
    const effectiveSystemPrompt = retryInstruction
      ? `${params.systemPrompt}\n\n${retryInstruction}`
      : params.systemPrompt;
    const llmResult = await generateAiText({
      system: effectiveSystemPrompt,
      messages: params.messages,
      runtimeContext: params.runtimeContext,
      signal: params.signal,
      maxTokens: 1400,
      temperature: 0.1,
    });

    totalTokensUsed += llmResult.usage?.totalTokens ?? 0;

    await recordAiRunStep(
      params.durableBackendOptions,
      params.threadId,
      params.runId,
      {
        kind: "LLM_CALL",
        stepIndex,
        model: DEFAULT_AI_MODEL_ID,
        promptSnapshot: {
          system: effectiveSystemPrompt,
          messages: params.messages,
        },
        responseSnapshot: {
          text: llmResult.text,
        },
        tokensIn: llmResult.usage?.inputTokens,
        tokensOut: llmResult.usage?.outputTokens,
      },
    );
    stepIndex += 1;

    try {
      const plan = parseIntentPlan(llmResult.text);
      return {
        plan,
        stepIndex,
        totalTokensUsed,
      };
    } catch {
      if (
        looksLikePlainTextPlannerReply(llmResult.text) &&
        latestUserText &&
        !requiresStructuredPlannerOutput(latestUserText)
      ) {
        return {
          plan: {
            type: "final",
            reply: llmResult.text.trim(),
          } satisfies IntentPlan,
          stepIndex,
          totalTokensUsed,
        };
      }

      attempts += 1;
      retryInstruction =
        "上一次输出无法被 runtime 解析。请严格只返回一个合法 JSON object，并且 type 必须是 final / clarify / read / prepare_execute / prepare_execute_many 之一。";
    }
  }

  return {
    plan: {
      type: "final",
      reply:
        "我刚才没能稳定解析规划结果，但不会执行任何动作。你可以继续直接提问，或更明确地说明要操作的对象和目标。",
    } satisfies IntentPlan,
    stepIndex,
    totalTokensUsed,
  };
}

function buildAssistantParts(params: {
  text: string;
  codingPrompt?: AiCodingPromptAssembly | null;
  options?: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
}) {
  const parts: AiMessagePart[] = [
    {
      type: "text",
      text: params.text,
    },
  ];

  if (params.options && params.options.length > 0) {
    parts.push({
      type: "clarification-options",
      title: "请直接点击选择一个目标",
      options: params.options,
    });
  }

  if (params.codingPrompt) {
    parts.push({
      type: "coding-prompt",
      issueId: params.codingPrompt.issueId,
      prompt: params.codingPrompt.prompt,
      generatedAt: new Date().toISOString(),
    });
  }

  return parts;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  try {
    const token = extractBearerToken(request);
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const cursor = searchParams.get("cursor") || undefined;
    const { threadId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { message: "缺少 workspaceId。" },
        { status: 400 },
      );
    }

    const messages = await listAiThreadMessages(
      {
        token,
        workspaceId,
        signal: request.signal,
      },
      threadId,
      cursor,
    );

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "获取消息历史失败" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await context.params;
  let runId: string | null = null;
  let workspaceId = "";
  let token = "";

  const finishRunAsFailed = async (error: unknown) => {
    if (!runId || !workspaceId || !token) {
      return;
    }

    try {
      await finishAiRun(
        {
          token,
          workspaceId,
        },
        threadId,
        runId,
        {
          status: "FAILED",
          lastError: toErrorPayload(error),
        },
      );
    } catch (finishError) {
      console.error("[ai-runtime] finish failed run error", finishError);
    }
  };

  try {
    token = extractBearerToken(request);
    const payload = sendMessageSchema.parse(await request.json());
    workspaceId = payload.workspaceId;

    const backendOptions = {
      token,
      workspaceId,
      signal: request.signal,
    } satisfies ServerFetchOptions;
    const durableBackendOptions = {
      token,
      workspaceId,
    } satisfies ServerFetchOptions;

    const thread = await getAiThread(backendOptions, threadId);

    await appendAiMessage(backendOptions, threadId, {
      role: "USER",
      parts: [
        {
          type: "text",
          text: payload.text,
        },
      ],
    });

    const historyPage = await listAiThreadMessages(backendOptions, threadId);
    const approvalIntent = detectApprovalIntent(payload.text);
    const directExecutionAllowed = allowsDirectExecution(payload.text);

    if (approvalIntent) {
      const pendingApprovals = await findPendingApprovals(
        backendOptions,
        threadId,
        historyPage.items,
      );

      if (pendingApprovals.length === 1) {
        if (approvalIntent === "confirm") {
          const result = await confirmAndExecuteApproval(
            durableBackendOptions,
            threadId,
            pendingApprovals[0].id,
          );

          return new Response(result.assistantText, {
            headers: {
              "Cache-Control": "no-store",
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        }

        await rejectApprovalWithMessage(
          durableBackendOptions,
          threadId,
          pendingApprovals[0].id,
        );

        return new Response("已经按你的要求取消待执行动作。", {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      if (pendingApprovals.length > 1) {
        const clarificationText =
          "当前线程里还有多个待确认动作。请直接点击对应确认卡，或明确说明要执行哪一组动作。";

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "ASSISTANT",
          parts: [
            {
              type: "text",
              text: clarificationText,
            },
          ],
        });

        return new Response(clarificationText, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }
    }

    const run = await startAiRun(backendOptions, threadId, {
      model: DEFAULT_AI_MODEL_ID,
      maxSteps: MAX_AGENT_STEPS,
    });
    runId = run.id;

    const [manifest, capabilities] = await Promise.all([
      getAiExecutionManifest(backendOptions),
      getAiExecutionCapabilities(backendOptions),
    ]);

    let surfaceSummaryText = "";

    const threadPins = Array.isArray(thread.pins) ? thread.pins : [];

    if (threadPins.length > 0) {
      try {
        const summaries = await postAiSurfaceSummaries(backendOptions, {
          pins: threadPins.map((pin) => ({
            surfaceType: pin.surfaceType,
            surfaceId: pin.surfaceId,
          })),
        });
        surfaceSummaryText = buildSummaryMessage(summaries);
      } catch (summaryError) {
        console.warn("[ai-runtime] surface summaries unavailable", summaryError);
      }
    }

    const runtimeContext = createRuntimeContext({
      workspaceId,
      thread,
    });
    const baseSystemPrompt = buildAiSystemPrompt(runtimeContext);
    const agentSystemPrompt = buildPlannerSystemPrompt({
      baseSystemPrompt,
      manifest,
      capabilities,
      allowlist: EXECUTION_ACTION_ALLOWLIST,
    });

    const historyMessages = toRuntimeMessages(historyPage.items);
    const toolContextMessages: AiRuntimeMessage[] = surfaceSummaryText
      ? [{ role: "system", content: surfaceSummaryText }]
      : [];
    let stepIndex = 0;
    let totalTokensUsed = 0;
    let latestCodingPrompt: AiCodingPromptAssembly | null = null;
    let lastToolText = "";
    let actorContextPromise: ReturnType<typeof getAiActorContext> | null = null;

    const compilerContext = {
      manifest,
      allowlist: EXECUTION_ACTION_ALLOWLIST,
      runtimeContext,
      thread,
      getCurrentActor: () => {
        if (!actorContextPromise) {
          actorContextPromise = getAiActorContext(backendOptions);
        }
        return actorContextPromise;
      },
      searchProjects: (params: { query: string; limit?: number }) =>
        searchAiProjects(backendOptions, params),
      searchIssues: (params: {
        query: string;
        projectId?: string;
        limit?: number;
      }) => searchAiIssues(backendOptions, params),
      listIssues: (params: {
        projectId?: string;
        assigneeScope?: "ANY" | "ME";
        stateCategories?: string[];
        limit?: number;
      }) => listAiIssues(backendOptions, params),
      searchWorkflows: (params: { query: string; limit?: number }) =>
        searchAiWorkflows(backendOptions, params),
      searchWorkspaceMembers: (params: { query: string; limit?: number }) =>
        searchAiWorkspaceMembers(backendOptions, params),
    };

    const deterministicReadPlan = detectScopedIssueReadPlan({
      text: payload.text,
      runtimeContext,
      thread,
    });

    for (let iteration = 0; iteration < MAX_AGENT_STEPS; iteration += 1) {
      const llmMessages = [...toolContextMessages, ...historyMessages];
      let plan: IntentPlan;

      if (iteration === 0 && deterministicReadPlan) {
        plan = deterministicReadPlan;
      } else {
        const plannedStep = await requestIntentPlan({
          systemPrompt: agentSystemPrompt,
          messages: llmMessages,
          runtimeContext,
          signal: request.signal,
          durableBackendOptions,
          threadId,
          runId: run.id,
          stepIndex,
        });

        stepIndex = plannedStep.stepIndex;
        totalTokensUsed += plannedStep.totalTokensUsed;
        plan = plannedStep.plan;
      }

      if (plan.type === "final" || plan.type === "clarify") {
        const assistantText =
          plan.type === "final"
            ? plan.reply
            : [plan.question, plan.reason].filter(Boolean).join("\n");
        const assistantParts = buildAssistantParts({
          text: assistantText,
          codingPrompt: latestCodingPrompt,
        });

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "ASSISTANT",
          runId: run.id,
          parts: assistantParts,
        });

        await finishAiRun(durableBackendOptions, threadId, run.id, {
          status: "COMPLETED",
          tokensUsed: totalTokensUsed,
        });

        return new Response(assistantText, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      if (plan.type === "read") {
        if (!READ_TOOL_NAMES.includes(plan.tool as ReadToolName)) {
          const clarificationText = `当前 runtime 暂不支持读取工具 ${plan.tool}。请换一种方式描述你的目标，或让我先搜索项目 / issue / 成员。`;

          await appendAiMessage(durableBackendOptions, threadId, {
            role: "ASSISTANT",
            runId: run.id,
            parts: [
              {
                type: "text",
                text: clarificationText,
              },
            ],
          });

          await finishAiRun(durableBackendOptions, threadId, run.id, {
            status: "COMPLETED",
            tokensUsed: totalTokensUsed,
          });

          return new Response(clarificationText, {
            headers: {
              "Cache-Control": "no-store",
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        }

        const toolOutput = await invokeReadTool(
          plan.tool as ReadToolName,
          plan.arguments,
          backendOptions,
        );
        const toolText = buildReadToolResultText(
          plan.tool as ReadToolName,
          toolOutput,
        );
        const toolEvent: ToolEvent = {
          toolCallId: `tool-${run.id}-${stepIndex}`,
          toolName: plan.tool,
          input: plan.arguments,
          output: toolOutput,
          text: toolText,
        };

        if (plan.tool === "assemble_coding_prompt") {
          latestCodingPrompt = toolOutput as AiCodingPromptAssembly;
        }

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "TOOL",
          runId: run.id,
          parts: buildToolEventParts(toolEvent),
        });

        await recordAiRunStep(durableBackendOptions, threadId, run.id, {
          kind: "TOOL_CALL",
          stepIndex,
          toolName: plan.tool,
          toolInput: plan.arguments,
          toolOutput,
        });
        stepIndex += 1;

        toolContextMessages.unshift({
          role: "system",
          content: `工具 ${plan.tool} 返回：\n${toolText}`,
        });
        lastToolText = toolText;
        continue;
      }

      const compiledPlan = await compileIntentPlan(plan, compilerContext);

      if (compiledPlan?.type === "clarify") {
        const assistantParts = buildAssistantParts({
          text: compiledPlan.reply,
          codingPrompt: latestCodingPrompt,
          options: compiledPlan.options,
        });

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "ASSISTANT",
          runId: run.id,
          parts: assistantParts,
        });

        await finishAiRun(durableBackendOptions, threadId, run.id, {
          status: "COMPLETED",
          tokensUsed: totalTokensUsed,
        });

        return new Response(compiledPlan.reply, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      if (compiledPlan?.type === "execute_many") {
        const batchItems = compiledPlan.items.map(
          (item): ApprovalBundleItem => ({
            actionKey: item.actionKey,
            input: item.input,
            summary: item.summary,
          }),
        );

        for (const item of batchItems) {
          if (!EXECUTION_ACTION_ALLOWLIST.has(item.actionKey)) {
            throw new Error(`当前 runtime 暂未开放动作 ${item.actionKey}`);
          }
        }

        const batchSummary =
          compiledPlan.summary?.trim() || `批量执行 ${batchItems.length} 个动作`;

        if (directExecutionAllowed) {
          const { executedItems, latestCodingPrompt: batchCodingPrompt } =
            await executeExecutionItems(
              batchItems,
              backendOptions,
              threadId,
              true,
            );

          if (batchCodingPrompt) {
            latestCodingPrompt = batchCodingPrompt;
          }

          const toolOutput = buildExecutedBatchToolOutput(
            batchSummary,
            executedItems,
          );
          const toolText = buildExecutedBatchToolText(
            batchSummary,
            executedItems,
          );
          const toolEvent: ToolEvent = {
            toolCallId: `tool-${run.id}-${stepIndex}`,
            toolName: "action:execute_many",
            input: {
              items: executedItems.map((item) => ({
                actionKey: item.actionKey,
                input: item.input,
                summary: item.summary,
              })),
            },
            output: toolOutput,
            isError: toolOutput.status !== "succeeded",
            text: toolText,
          };

          await appendAiMessage(durableBackendOptions, threadId, {
            role: "TOOL",
            runId: run.id,
            parts: buildToolEventParts(toolEvent),
          });

          await recordAiRunStep(durableBackendOptions, threadId, run.id, {
            kind: "TOOL_CALL",
            stepIndex,
            toolName: "execute_many",
            toolInput: toolEvent.input,
            toolOutput,
          });
          stepIndex += 1;

          const assistantText = buildBatchAssistantText(executedItems);
          const assistantParts: AiMessagePart[] = [
            {
              type: "text",
              text: assistantText,
            },
          ];

          if (latestCodingPrompt) {
            assistantParts.push({
              type: "coding-prompt",
              issueId: latestCodingPrompt.issueId,
              prompt: latestCodingPrompt.prompt,
              generatedAt: new Date().toISOString(),
            });
          }

          await appendAiMessage(durableBackendOptions, threadId, {
            role: "ASSISTANT",
            runId: run.id,
            parts: assistantParts,
          });

          await finishAiRun(durableBackendOptions, threadId, run.id, {
            status:
              toolOutput.status === "succeeded" ? "COMPLETED" : "FAILED",
            tokensUsed: totalTokensUsed,
          });

          return new Response(assistantText, {
            headers: {
              "Cache-Control": "no-store",
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        }

        const { previewItems, latestCodingPrompt: batchCodingPrompt } =
          await previewExecutionItems(batchItems, backendOptions, threadId);

        if (batchCodingPrompt) {
          latestCodingPrompt = batchCodingPrompt;
        }

        const previewNeedsApproval = previewItems.some(
          (item) => item.needsConfirmation,
        );

        if (!previewNeedsApproval) {
          const { executedItems, latestCodingPrompt: directBatchCodingPrompt } =
            await executeExecutionItems(
              batchItems,
              backendOptions,
              threadId,
              false,
            );

          if (directBatchCodingPrompt) {
            latestCodingPrompt = directBatchCodingPrompt;
          }

          const toolOutput = buildExecutedBatchToolOutput(
            batchSummary,
            executedItems,
          );
          const toolText = buildExecutedBatchToolText(
            batchSummary,
            executedItems,
          );
          const toolEvent: ToolEvent = {
            toolCallId: `tool-${run.id}-${stepIndex}`,
            toolName: "action:execute_many",
            input: {
              items: executedItems.map((item) => ({
                actionKey: item.actionKey,
                input: item.input,
                summary: item.summary,
              })),
            },
            output: toolOutput,
            isError: toolOutput.status !== "succeeded",
            text: toolText,
          };

          await appendAiMessage(durableBackendOptions, threadId, {
            role: "TOOL",
            runId: run.id,
            parts: buildToolEventParts(toolEvent),
          });

          await recordAiRunStep(durableBackendOptions, threadId, run.id, {
            kind: "TOOL_CALL",
            stepIndex,
            toolName: "execute_many",
            toolInput: toolEvent.input,
            toolOutput,
          });
          stepIndex += 1;

          toolContextMessages.unshift({
            role: "system",
            content: `动作 execute_many 返回：\n${toolText}`,
          });
          lastToolText = toolText;
          continue;
        }

        const previewOutput = buildBatchToolOutput(batchSummary, previewItems);
        const previewText = buildBatchToolText(batchSummary, previewItems);
        const previewInput = {
          kind: "batch" as const,
          summary: batchSummary,
          items: previewItems.map((item) => ({
            actionKey: item.actionKey,
            input: item.input,
            summary: item.summary,
          })),
        };
        const previewEvent: ToolEvent = {
          toolCallId: `tool-${run.id}-${stepIndex}`,
          toolName: "action:execute_many",
          input: {
            items: batchItems,
          },
          output: previewOutput,
          text: previewText,
        };

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "TOOL",
          runId: run.id,
          parts: buildToolEventParts(previewEvent),
        });

        await recordAiRunStep(durableBackendOptions, threadId, run.id, {
          kind: "TOOL_CALL",
          stepIndex,
          toolName: "execute_many",
          toolInput: previewEvent.input,
          toolOutput: previewOutput,
        });
        stepIndex += 1;

        const approval = await createAiApproval(
          durableBackendOptions,
          threadId,
          {
            runId: run.id,
            actionKey: "execute_many",
            summary: batchSummary,
            input: previewInput,
            previewResult: previewOutput.result,
          },
        );

        const assistantText = "这批动作已经准备好，确认一次后我会一起执行。";
        const assistantParts: AiMessagePart[] = [
          {
            type: "text",
            text: assistantText,
          },
          {
            type: "approval-request",
            approvalId: approval.id,
            actionKey: "execute_many",
            summary: batchSummary,
            input: previewInput,
            preview: previewOutput.result,
            items: previewItems.map((item) => ({
              actionKey: item.actionKey,
              summary: item.summary,
              input: item.input,
              preview: item.preview,
              status: item.status,
              message: item.message,
              error: item.error,
            })),
            status: "PENDING",
          },
        ];

        if (latestCodingPrompt) {
          assistantParts.push({
            type: "coding-prompt",
            issueId: latestCodingPrompt.issueId,
            prompt: latestCodingPrompt.prompt,
            generatedAt: new Date().toISOString(),
          });
        }

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "ASSISTANT",
          runId: run.id,
          parts: assistantParts,
        });

        await finishAiRun(durableBackendOptions, threadId, run.id, {
          status: "WAITING_APPROVAL",
          tokensUsed: totalTokensUsed,
        });

        return new Response(assistantText, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      if (!compiledPlan || compiledPlan.type !== "execute") {
        throw new Error("planner 没有产出可执行动作。");
      }

      if (!EXECUTION_ACTION_ALLOWLIST.has(compiledPlan.actionKey)) {
        throw new Error(`当前 runtime 暂未开放动作 ${compiledPlan.actionKey}`);
      }

      const { resolvedInput, codingPromptAssembly } = await resolveExecutionInput(
        compiledPlan.actionKey,
        compiledPlan.input,
        backendOptions,
      );

      if (codingPromptAssembly) {
        latestCodingPrompt = codingPromptAssembly;
      }

      const execution = await executeAiAction(
        backendOptions,
        compiledPlan.actionKey,
        {
          input: resolvedInput,
          confirmed: directExecutionAllowed,
          conversationId: threadId,
        },
      );

      const toolText = buildExecutionResultText(
        compiledPlan.actionKey,
        execution,
      );
      const toolEvent: ToolEvent = {
        toolCallId: `tool-${run.id}-${stepIndex}`,
        toolName: `action:${compiledPlan.actionKey}`,
        input: resolvedInput,
        output: execution,
        isError:
          execution.status === "failed" || execution.status === "blocked",
        text: toolText,
      };

      await appendAiMessage(durableBackendOptions, threadId, {
        role: "TOOL",
        runId: run.id,
        parts: buildToolEventParts(toolEvent),
      });

      await recordAiRunStep(durableBackendOptions, threadId, run.id, {
        kind: "TOOL_CALL",
        stepIndex,
        toolName: compiledPlan.actionKey,
        toolInput: resolvedInput,
        toolOutput: execution,
      });
      stepIndex += 1;

      toolContextMessages.unshift({
        role: "system",
        content: `动作 ${compiledPlan.actionKey} 返回：\n${toolText}`,
      });
      lastToolText = toolText;

      if (execution.needsConfirmation) {
        const approvalPreview = {
          summary: execution.summary,
          message: execution.message,
          input: resolvedInput,
          preview: execution.result ?? null,
        };

        const approval = await createAiApproval(
          durableBackendOptions,
          threadId,
          {
            runId: run.id,
            actionKey: compiledPlan.actionKey,
            summary: execution.summary,
            input: resolvedInput,
            previewResult: approvalPreview,
          },
        );

        const assistantText =
          execution.message || "我已经准备好一个需要你确认的动作。";
        const assistantParts: AiMessagePart[] = [
          {
            type: "text",
            text: assistantText,
          },
          {
            type: "approval-request",
            approvalId: approval.id,
            actionKey: compiledPlan.actionKey,
            summary: execution.summary,
            input: resolvedInput,
            preview: approvalPreview,
            status: "PENDING",
          },
        ];

        if (latestCodingPrompt) {
          assistantParts.push({
            type: "coding-prompt",
            issueId: latestCodingPrompt.issueId,
            prompt: latestCodingPrompt.prompt,
            generatedAt: new Date().toISOString(),
          });
        }

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "ASSISTANT",
          runId: run.id,
          parts: assistantParts,
        });

        await finishAiRun(durableBackendOptions, threadId, run.id, {
          status: "WAITING_APPROVAL",
          tokensUsed: totalTokensUsed,
        });

        return new Response(assistantText, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }
    }

    const fallbackText =
      lastToolText ||
      "我已经处理完本轮上下文，但还没有得到更明确的下一步。你可以继续补充要创建的对象、目标项目，或确认我刚才读取到的信息。";
    const fallbackParts: AiMessagePart[] = [
      {
        type: "text",
        text: fallbackText,
      },
    ];

    if (latestCodingPrompt) {
      fallbackParts.push({
        type: "coding-prompt",
        issueId: latestCodingPrompt.issueId,
        prompt: latestCodingPrompt.prompt,
        generatedAt: new Date().toISOString(),
      });
    }

    await appendAiMessage(durableBackendOptions, threadId, {
      role: "ASSISTANT",
      runId: run.id,
      parts: fallbackParts,
    });

    await finishAiRun(durableBackendOptions, threadId, run.id, {
      status: "COMPLETED",
      tokensUsed: totalTokensUsed,
    });

    return new Response(fallbackText, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    await finishRunAsFailed(error);

    const responseHeaders = new Headers({
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });

    if (
      isTransientAiProviderError(error) &&
      typeof error.retryAfterMs === "number" &&
      error.retryAfterMs >= 1000
    ) {
      responseHeaders.set(
        "Retry-After",
        String(Math.ceil(error.retryAfterMs / 1000)),
      );
    }

    return new Response(getAiRuntimeErrorMessage(error), {
      status: isTransientAiProviderError(error) ? 503 : 500,
      headers: responseHeaders,
    });
  }
}
