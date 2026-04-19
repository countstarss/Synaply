export const DEFAULT_AI_MODEL_ID =
  process.env.LLM_MODEL?.trim() || "claude-sonnet-4-6";

function getConfiguredApiKey() {
  return process.env.LLM_API_KEY?.trim() || process.env.ANTHROPIC_API_KEY?.trim();
}

function getConfiguredBaseUrl() {
  return process.env.LLM_BASE_URL?.trim() || process.env.ANTHROPIC_BASE_URL?.trim();
}

function withoutTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getAiProviderConfig() {
  const apiKey = getConfiguredApiKey();

  if (!apiKey) {
    throw new Error(
      "缺少 LLM_API_KEY 或 ANTHROPIC_API_KEY，无法启动 AI runtime。",
    );
  }

  const baseUrl = getConfiguredBaseUrl();

  if (!baseUrl) {
    throw new Error(
      "缺少 LLM_BASE_URL 或 ANTHROPIC_BASE_URL，无法启动 AI runtime。",
    );
  }

  return {
    apiKey,
    baseUrl: withoutTrailingSlash(baseUrl),
    model: DEFAULT_AI_MODEL_ID,
  };
}
