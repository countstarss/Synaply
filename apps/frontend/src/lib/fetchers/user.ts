// MARK: - ✅用户信息
export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfilePayload {
  name?: string | null;
  avatarUrl?: string | null;
}

// MARK: - 用户公开信息
export interface PublicUserInfo {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

import { getBackendBaseUrl } from "@/lib/backend-url";

const API_BASE_URL = getBackendBaseUrl();

const getErrorMessage = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  const rawText = await response.text();

  if (!rawText) {
    return fallbackMessage;
  }

  try {
    const parsed = JSON.parse(rawText) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(parsed.message)) {
      return parsed.message.join(", ");
    }

    if (typeof parsed.message === "string") {
      return parsed.message;
    }

    if (typeof parsed.error === "string") {
      return parsed.error;
    }
  } catch {
    return rawText;
  }

  return fallbackMessage;
};

/**
 * MARK: - ✅获取用户公开信息
 */
export const fetchUserById = async (
  userId: string,
  token: string
): Promise<PublicUserInfo> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "获取用户信息失败"));
  }

  return response.json();
};

/**
 * MARK: - 获取当前用户资料
 */
export const fetchCurrentUser = async (token: string): Promise<UserInfo> => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "获取当前用户资料失败"));
  }

  return response.json();
};

/**
 * MARK: - 更新当前用户资料
 */
export const updateCurrentUser = async (
  token: string,
  payload: UpdateUserProfilePayload,
): Promise<UserInfo> => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "更新用户资料失败"));
  }

  return response.json();
};

/**
 * 从邮箱中提取用户名作为fallback
 */
export const getUserNameFallback = (email: string): string => {
  return email.split("@")[0];
};
