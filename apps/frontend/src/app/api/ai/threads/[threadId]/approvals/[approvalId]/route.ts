import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiApproval } from "@/lib/ai/backend";
import { extractBearerToken } from "@/lib/ai/runtime/context";

const getApprovalSchema = z.object({
  workspaceId: z.string().trim().min(1),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ threadId: string; approvalId: string }> },
) {
  try {
    const token = extractBearerToken(request);
    const { searchParams } = new URL(request.url);
    const payload = getApprovalSchema.parse({
      workspaceId: searchParams.get("workspaceId"),
    });
    const { approvalId, threadId } = await context.params;

    const approval = await getAiApproval(
      {
        token,
        workspaceId: payload.workspaceId,
        signal: request.signal,
      },
      threadId,
      approvalId,
    );

    return NextResponse.json(approval);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "获取审批状态失败" },
      { status: 500 },
    );
  }
}
