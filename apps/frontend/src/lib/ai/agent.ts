import { getAiProviderConfig } from "@/lib/ai/models";
import type { AiRuntimeContext } from "@/lib/ai/runtime/context";

const MAX_PROVIDER_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAYS_MS = [400, 1200];
const RETRYABLE_PROVIDER_STATUS_CODES = new Set([
  408,
  429,
  500,
  502,
  503,
  504,
  529,
]);

export interface AiRuntimeMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RunOnceInput {
  system: string;
  messages: AiRuntimeMessage[];
  runtimeContext: AiRuntimeContext;
  signal?: AbortSignal;
  maxTokens?: number;
  temperature?: number;
}

interface AnthropicContentBlock {
  type?: string;
  text?: string;
}

interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  usage?: AnthropicUsage;
  type?: string;
  request_id?: string;
  error?: {
    type?: string;
    message?: string;
  };
}

interface AiProviderErrorOptions {
  status?: number;
  errorType?: string;
  requestId?: string;
  retryAfterMs?: number;
  isTransient?: boolean;
}

export class AiProviderError extends Error {
  readonly status?: number;
  readonly errorType?: string;
  readonly requestId?: string;
  readonly retryAfterMs?: number;
  readonly isTransient: boolean;

  constructor(message: string, options: AiProviderErrorOptions = {}) {
    super(message);
    this.name = "AiProviderError";
    Object.setPrototypeOf(this, AiProviderError.prototype);
    this.status = options.status;
    this.errorType = options.errorType;
    this.requestId = options.requestId;
    this.retryAfterMs = options.retryAfterMs;
    this.isTransient = options.isTransient ?? false;
  }
}

function normalizeMessages(messages: AiRuntimeMessage[]) {
  const normalized: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const message of messages) {
    const content = message.content.trim();

    if (!content || message.role === "system") {
      continue;
    }

    const previousMessage = normalized.at(-1);

    if (previousMessage?.role === message.role) {
      previousMessage.content = `${previousMessage.content}\n\n${content}`;
      continue;
    }

    normalized.push({
      role: message.role,
      content,
    });
  }

  return normalized;
}

function buildSystemPrompt(system: string, messages: AiRuntimeMessage[]) {
  return [
    system,
    ...messages
      .filter((message) => message.role === "system")
      .map((message) => message.content.trim()),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildMessagesUrl(baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, "");

  if (base.endsWith("/v1/messages") || base.endsWith("/messages")) {
    return base;
  }

  if (base.endsWith("/v1")) {
    return `${base}/messages`;
  }

  return `${base}/v1/messages`;
}

function parseRetryAfterMs(value: string | null) {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }

  const retryAt = Date.parse(value);

  if (Number.isNaN(retryAt)) {
    return undefined;
  }

  return Math.max(retryAt - Date.now(), 0);
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function createAbortError() {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

async function waitForRetry(delayMs: number, signal?: AbortSignal) {
  if (delayMs <= 0) {
    return;
  }

  if (signal?.aborted) {
    throw createAbortError();
  }

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(createAbortError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function isRetryableProviderStatus(status?: number) {
  return (
    typeof status === "number" &&
    (RETRYABLE_PROVIDER_STATUS_CODES.has(status) ||
      (status >= 500 && status < 600))
  );
}

function looksTransientProviderMessage(message?: string) {
  return Boolean(
    message &&
      /(overloaded_error|overloaded|rate limit|temporar|timeout|unavailable|busy)/i.test(
        message,
      ),
  );
}

function buildAiProviderError(params: {
  status?: number;
  rawText?: string;
  retryAfterMs?: number;
  payload?: AnthropicResponse;
  headers?: Headers;
}) {
  const payload = params.payload;
  const message =
    payload?.error?.message?.trim() ||
    params.rawText?.trim() ||
    (typeof params.status === "number"
      ? `AI 服务请求失败（${params.status}）`
      : "AI 服务请求失败");
  const errorType = payload?.error?.type?.trim() || payload?.type?.trim();
  const requestId =
    payload?.request_id?.trim() ||
    params.headers?.get("request-id") ||
    params.headers?.get("x-request-id") ||
    params.headers?.get("anthropic-request-id") ||
    undefined;

  return new AiProviderError(message, {
    status: params.status,
    errorType,
    requestId,
    retryAfterMs: params.retryAfterMs,
    isTransient:
      isRetryableProviderStatus(params.status) ||
      errorType === "overloaded_error" ||
      looksTransientProviderMessage(message),
  });
}

function parseErrorPayload(rawText: string) {
  if (!rawText.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawText) as AnthropicResponse;
  } catch {
    return null;
  }
}

async function createAiProviderErrorFromResponse(response: Response) {
  const rawText = await response.text();

  return buildAiProviderError({
    status: response.status,
    rawText,
    retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after")),
    payload: parseErrorPayload(rawText) ?? undefined,
    headers: response.headers,
  });
}

function createAiProviderErrorFromPayload(
  payload: AnthropicResponse,
  response: Response,
) {
  return buildAiProviderError({
    status: response.status,
    rawText: JSON.stringify(payload),
    retryAfterMs: parseRetryAfterMs(response.headers.get("retry-after")),
    payload,
    headers: response.headers,
  });
}

function isRetryableAiProviderError(error: unknown) {
  if (isAbortError(error)) {
    return false;
  }

  if (error instanceof AiProviderError) {
    return error.isTransient;
  }

  return error instanceof TypeError;
}

function resolveRetryDelayMs(error: unknown, attempt: number) {
  if (error instanceof AiProviderError && error.retryAfterMs !== undefined) {
    return error.retryAfterMs;
  }

  return DEFAULT_RETRY_DELAYS_MS[attempt] ?? DEFAULT_RETRY_DELAYS_MS.at(-1) ?? 0;
}

export function isTransientAiProviderError(
  error: unknown,
): error is AiProviderError {
  return error instanceof AiProviderError && error.isTransient;
}

export function getAiRuntimeErrorMessage(error: unknown) {
  if (isTransientAiProviderError(error)) {
    return "AI 服务当前较忙，请稍后再试。";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "发送 AI 消息失败";
}

function extractText(response: AnthropicResponse & Record<string, unknown>) {
  if (Array.isArray(response.content)) {
    const text = response.content
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n\n");

    if (text) {
      return text;
    }
  }

  for (const key of ["reply", "output_text", "completion", "text"]) {
    const value = response[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const firstChoice = Array.isArray(response.choices)
    ? response.choices[0]
    : undefined;
  const choiceContent =
    typeof firstChoice?.message?.content === "string"
      ? firstChoice.message.content
      : undefined;

  if (choiceContent?.trim()) {
    return choiceContent.trim();
  }

  throw new Error("AI 服务未返回可用文本内容。");
}

export function runOnce({
  system,
  messages,
  runtimeContext,
  signal,
  maxTokens,
  temperature,
}: RunOnceInput) {
  const responsePromise = generateAiText({
    system,
    messages,
    runtimeContext,
    signal,
    maxTokens,
    temperature,
  });

  return {
    textStream: (async function* () {
      const { text } = await responsePromise;
      yield text;
    })(),
    totalUsage: responsePromise.then((result) => result.usage),
  };
}

export async function generateAiText({
  system,
  messages,
  runtimeContext,
  signal,
  maxTokens = 1024,
  temperature = 0.4,
}: RunOnceInput) {
  const provider = getAiProviderConfig();
  const systemPrompt = buildSystemPrompt(system, messages);
  const requestMessages = normalizeMessages(messages);

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_PROVIDER_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(buildMessagesUrl(provider.baseUrl), {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "x-api-key": provider.apiKey,
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: maxTokens,
          temperature,
          stream: false,
          system: systemPrompt || undefined,
          messages: requestMessages,
        }),
      });

      if (!response.ok) {
        throw await createAiProviderErrorFromResponse(response);
      }

      const payload = (await response.json()) as AnthropicResponse &
        Record<string, unknown>;

      if (payload.error?.message) {
        throw createAiProviderErrorFromPayload(payload, response);
      }

      const text = extractText(payload);
      const usage = payload.usage
        ? {
            inputTokens: payload.usage.input_tokens,
            outputTokens: payload.usage.output_tokens,
            totalTokens:
              (payload.usage.input_tokens ?? 0) +
              (payload.usage.output_tokens ?? 0),
          }
        : undefined;

      return {
        text,
        usage,
      };
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      lastError = error;
      const shouldRetry =
        attempt < MAX_PROVIDER_ATTEMPTS - 1 &&
        isRetryableAiProviderError(error);

      if (!shouldRetry) {
        break;
      }

      const retryDelayMs = resolveRetryDelayMs(error, attempt);

      console.warn("[ai-runtime] direct reply retry", {
        workspaceId: runtimeContext.workspaceId,
        surface: runtimeContext.surface,
        attempt: attempt + 1,
        nextAttempt: attempt + 2,
        retryDelayMs,
        error:
          error instanceof AiProviderError
            ? {
                message: error.message,
                status: error.status,
                errorType: error.errorType,
                requestId: error.requestId,
              }
            : error,
      });

      await waitForRetry(retryDelayMs, signal);
    }
  }

  console.error("[ai-runtime] direct reply error", {
    workspaceId: runtimeContext.workspaceId,
    surface: runtimeContext.surface,
    error:
      lastError instanceof AiProviderError
        ? {
            message: lastError.message,
            status: lastError.status,
            errorType: lastError.errorType,
            requestId: lastError.requestId,
            retryAfterMs: lastError.retryAfterMs,
            isTransient: lastError.isTransient,
          }
        : lastError,
  });

  throw lastError;
}
