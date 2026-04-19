import { InviteMemberDto } from "@/api";

export interface CreateTeamPayload {
  name: string;
}

export interface UpdateTeamPayload {
  name?: string | null;
  avatarUrl?: string | null;
}

// MARK: - ✅团队
export interface Team {
  id: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  workspace?: {
    id: string;
    name: string;
    type: string;
    userId?: string | null;
    teamId?: string | null;
  };
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    name?: string;
    email: string;
    avatarUrl?: string;
    avatar_url?: string;
  };
  createdAt: string;
  updatedAt: string;
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

const normalizeTeamMember = (member: TeamMember): TeamMember => ({
  ...member,
  user: {
    id: member.user?.id ?? member.userId,
    email: member.user?.email ?? "",
    name: member.user?.name ?? undefined,
    avatarUrl:
      member.user?.avatarUrl ?? member.user?.avatar_url ?? undefined,
    avatar_url:
      member.user?.avatar_url ?? member.user?.avatarUrl ?? undefined,
  },
});

const normalizeTeam = (team: Team): Team => ({
  ...team,
  avatarUrl: team.avatarUrl ?? null,
  members: Array.isArray(team.members)
    ? team.members.map(normalizeTeamMember)
    : [],
});

/**
 * MARK: - ✅获取用户团队
 */
export const fetchUserTeams = async (token: string): Promise<Team[]> => {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "获取团队列表失败"));
  }

  const teams = (await response.json()) as Team[];
  return teams.map(normalizeTeam);
};

/**
 * MARK: - ✅创建新团队
 */
export const createTeam = async (
  data: CreateTeamPayload,
  token: string
): Promise<Team> => {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "创建团队失败"));
  }

  return normalizeTeam((await response.json()) as Team);
};

/**
 * MARK: - ✅更新团队资料
 */
export const updateTeam = async (
  teamId: string,
  data: UpdateTeamPayload,
  token: string
): Promise<Team> => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "更新团队资料失败"));
  }

  return normalizeTeam((await response.json()) as Team);
};

/**
 * MARK: - ✅邀请团队成员
 */

export const inviteTeamMember = async (
  teamId: string,
  data: InviteMemberDto,
  token: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "邀请成员失败"));
  }

  return response.json();
};

/**
 * MARK: - ✅获取团队成员
 */
export const fetchTeamMembers = async (
  teamId: string,
  token: string
): Promise<TeamMember[]> => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "获取团队成员失败"));
  }

  const members = (await response.json()) as TeamMember[];
  return members.map(normalizeTeamMember);
};

/**
 * MARK: - ✅根据用户 ID 获取默认团队成员
 */
export const fetchTeamMemberByUserId = async (
  userId: string,
  token: string
): Promise<TeamMember | null> => {
  const response = await fetch(`${API_BASE_URL}/teams/by-user-id/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "获取默认成员失败"));
  }

  return normalizeTeamMember((await response.json()) as TeamMember);
};

/**
 * MARK: - ✅更新团队成员角色
 */
export const updateTeamMemberRole = async (
  teamId: string,
  memberUserId: string,
  role: "OWNER" | "ADMIN" | "MEMBER",
  token: string
): Promise<TeamMember> => {
  const response = await fetch(
    `${API_BASE_URL}/teams/${teamId}/members/${memberUserId}/role`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "更新成员角色失败"));
  }

  return normalizeTeamMember((await response.json()) as TeamMember);
};

/**
 * MARK: - ✅移除团队成员
 */
export const removeTeamMember = async (
  teamId: string,
  memberUserId: string,
  token: string
): Promise<{ message: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/teams/${teamId}/members/${memberUserId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "移除成员失败"));
  }

  return response.json();
};

/**
 * MARK: - ✅获取团队详情
 */
export const fetchTeamById = async (
  teamId: string,
  token: string
): Promise<Team> => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "获取团队详情失败"));
  }

  return normalizeTeam((await response.json()) as Team);
};
