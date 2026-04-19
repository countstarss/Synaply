import assert from "node:assert/strict";
import test from "node:test";

import {
  AiProviderError,
  generateAiText,
  getAiRuntimeErrorMessage,
} from "./agent";

const TEST_RUNTIME_CONTEXT = {
  workspaceId: "workspace-test",
  surface: null,
} as const;

function setProviderEnv() {
  process.env.LLM_API_KEY = "test-api-key";
  process.env.LLM_BASE_URL = "https://example.com";
}

function restoreProviderEnv(previousEnv: {
  LLM_API_KEY?: string;
  LLM_BASE_URL?: string;
}) {
  if (previousEnv.LLM_API_KEY === undefined) {
    delete process.env.LLM_API_KEY;
  } else {
    process.env.LLM_API_KEY = previousEnv.LLM_API_KEY;
  }

  if (previousEnv.LLM_BASE_URL === undefined) {
    delete process.env.LLM_BASE_URL;
  } else {
    process.env.LLM_BASE_URL = previousEnv.LLM_BASE_URL;
  }
}

function createOverloadedResponse() {
  return new Response(
    JSON.stringify({
      type: "error",
      error: {
        type: "overloaded_error",
        message: "overloaded_error (529)",
      },
      request_id: "req_test_529",
    }),
    {
      status: 529,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "0",
      },
    },
  );
}

test("generateAiText retries overloaded provider responses before succeeding", async () => {
  const previousFetch = global.fetch;
  const previousWarn = console.warn;
  const previousError = console.error;
  const previousEnv = {
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_BASE_URL: process.env.LLM_BASE_URL,
  };
  let fetchCalls = 0;

  setProviderEnv();
  console.warn = () => undefined;
  console.error = () => undefined;
  global.fetch = (async () => {
    fetchCalls += 1;

    if (fetchCalls === 1) {
      return createOverloadedResponse();
    }

    return new Response(
      JSON.stringify({
        content: [
          {
            type: "text",
            text: "恢复成功",
          },
        ],
        usage: {
          input_tokens: 12,
          output_tokens: 8,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  try {
    const result = await generateAiText({
      system: "You are helpful.",
      messages: [{ role: "user", content: "hello" }],
      runtimeContext: TEST_RUNTIME_CONTEXT,
    });

    assert.equal(fetchCalls, 2);
    assert.equal(result.text, "恢复成功");
    assert.deepEqual(result.usage, {
      inputTokens: 12,
      outputTokens: 8,
      totalTokens: 20,
    });
  } finally {
    global.fetch = previousFetch;
    console.warn = previousWarn;
    console.error = previousError;
    restoreProviderEnv(previousEnv);
  }
});

test("generateAiText surfaces provider overload as a transient error after retries", async () => {
  const previousFetch = global.fetch;
  const previousWarn = console.warn;
  const previousError = console.error;
  const previousEnv = {
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_BASE_URL: process.env.LLM_BASE_URL,
  };
  let fetchCalls = 0;

  setProviderEnv();
  console.warn = () => undefined;
  console.error = () => undefined;
  global.fetch = (async () => {
    fetchCalls += 1;
    return createOverloadedResponse();
  }) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        generateAiText({
          system: "You are helpful.",
          messages: [{ role: "user", content: "hello" }],
          runtimeContext: TEST_RUNTIME_CONTEXT,
        }),
      (error: unknown) => {
        assert.equal(fetchCalls, 3);
        assert.ok(error instanceof AiProviderError);
        assert.equal(error.status, 529);
        assert.equal(error.errorType, "overloaded_error");
        assert.equal(error.requestId, "req_test_529");
        assert.equal(error.isTransient, true);
        return true;
      },
    );
  } finally {
    global.fetch = previousFetch;
    console.warn = previousWarn;
    console.error = previousError;
    restoreProviderEnv(previousEnv);
  }
});

test("getAiRuntimeErrorMessage returns a stable fallback for transient provider failures", () => {
  const error = new AiProviderError("overloaded_error (529)", {
    status: 529,
    errorType: "overloaded_error",
    requestId: "req_test_529",
    isTransient: true,
  });

  assert.equal(getAiRuntimeErrorMessage(error), "AI 服务当前较忙，请稍后再试。");
});
