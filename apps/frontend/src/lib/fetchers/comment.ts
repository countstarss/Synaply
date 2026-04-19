import { getBackendBaseUrl } from "@/lib/backend-url";

export interface CreateCommentDto {
  content: string;
  issueId: string;
  workspaceId: string;
  parentId?: string;
}

export interface Comment {
  id: string;
  content: string;
  issueId: string;
  authorId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
}

const BACKEND_URL = getBackendBaseUrl();

/**
 * 创建评论
 */
export const createComment = async (data: CreateCommentDto, token: string) => {
  const response = await fetch(`${BACKEND_URL}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("创建评论失败");
  }

  return response.json();
};

/**
 * 获取评论列表
 */
export const getComments = async (
  issueId: string,
  token: string,
  parentId?: string
) => {
  const params = new URLSearchParams({ issueId });
  if (parentId) params.append("parentId", parentId);

  const response = await fetch(`${BACKEND_URL}/comments?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("获取评论失败");
  }

  return response.json();
};
