import { NextResponse } from "next/server";
import { z } from "zod";
import { createAiThread, listAiThreads } from "@/lib/ai/backend";
import { AI_SURFACE_TYPES } from "@/lib/ai/types";
import { extractBearerToken } from "@/lib/ai/runtime/context";

const createThreadSchema = z
  .object({
    workspaceId: z.string().trim().min(1),
    title: z.string().trim().max(200).optional(),
    originSurfaceType: z.enum(AI_SURFACE_TYPES).optional(),
    originSurfaceId: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (Boolean(value.originSurfaceType) !== Boolean(value.originSurfaceId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "originSurfaceType 和 originSurfaceId 必须同时提供。",
      });
    }
  });

export async function GET(request: Request) {
  try {
    const token = extractBearerToken(request);
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { message: "缺少 workspaceId。" },
        { status: 400 },
      );
    }

    const threads = await listAiThreads({
      token,
      workspaceId,
      signal: request.signal,
    });

    return NextResponse.json(threads);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "获取 AI 线程失败" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = extractBearerToken(request);
    const payload = createThreadSchema.parse(await request.json());
    const thread = await createAiThread(
      {
        token,
        workspaceId: payload.workspaceId,
        signal: request.signal,
      },
      {
        title: payload.title,
        originSurfaceType: payload.originSurfaceType,
        originSurfaceId: payload.originSurfaceId,
      },
    );

    return NextResponse.json(thread);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "创建 AI 线程失败" },
      { status: 500 },
    );
  }
}
