import { NextResponse } from "next/server";
import { z } from "zod";
import { extractBearerToken } from "@/lib/ai/runtime/context";
import { confirmAndExecuteApproval } from "@/lib/ai/runtime/approval-helpers";

const approvalActionSchema = z.object({
  workspaceId: z.string().trim().min(1),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string; approvalId: string }> },
) {
  try {
    const token = extractBearerToken(request);
    const payload = approvalActionSchema.parse(await request.json());
    const { approvalId, threadId } = await context.params;
    const backendOptions = {
      token,
      workspaceId: payload.workspaceId,
      signal: request.signal,
    };
    const result = await confirmAndExecuteApproval(
      backendOptions,
      threadId,
      approvalId,
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "确认审批失败" },
      { status: 500 },
    );
  }
}
