import { NextResponse } from "next/server";
import { getAiThread } from "@/lib/ai/backend";
import { extractBearerToken } from "@/lib/ai/runtime/context";

export async function GET(
  request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  try {
    const token = extractBearerToken(request);
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const { threadId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { message: "缺少 workspaceId。" },
        { status: 400 },
      );
    }

    const thread = await getAiThread(
      {
        token,
        workspaceId,
        signal: request.signal,
      },
      threadId,
    );

    return NextResponse.json(thread);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "获取 AI 线程失败" },
      { status: 500 },
    );
  }
}
