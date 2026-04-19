import type { AiSurfaceType, AiThreadRecord } from "@/lib/ai/types";

export interface AiRuntimeContext {
  workspaceId: string;
  surface: {
    type: AiSurfaceType;
    id: string;
  } | null;
}

export function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("缺少有效的访问令牌。");
  }

  return authorization.slice("Bearer ".length).trim();
}

export function createRuntimeContext({
  workspaceId,
  thread,
}: {
  workspaceId: string;
  thread?: Pick<AiThreadRecord, "originSurfaceType" | "originSurfaceId"> | null;
}): AiRuntimeContext {
  if (thread?.originSurfaceType && thread.originSurfaceId) {
    return {
      workspaceId,
      surface: {
        type: thread.originSurfaceType,
        id: thread.originSurfaceId,
      },
    };
  }

  return {
    workspaceId,
    surface: null,
  };
}
