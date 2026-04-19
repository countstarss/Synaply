import { NextResponse } from "next/server";
import { z } from "zod";
import { extractBearerToken } from "@/lib/ai/runtime/context";
import { rejectApprovalWithMessage } from "@/lib/ai/runtime/approval-helpers";

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
    const approval = await rejectApprovalWithMessage(
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
      { message: error instanceof Error ? error.message : "拒绝审批失败" },
      { status: 500 },
    );
  }
}
