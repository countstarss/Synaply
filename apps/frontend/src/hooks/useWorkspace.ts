"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  fetchUserWorkspaces,
  Workspace as APIWorkspace,
} from "@/lib/fetchers/workspace";
import {
  createTeam as createTeamFetcher,
  inviteTeamMember,
} from "@/lib/fetchers/team";

export interface Workspace {
  id: string;
  name: string;
  type: "PERSONAL" | "TEAM";
  memberCount?: number;
  isActive: boolean;
  avatarUrl?: string;
  teamId?: string;
  userId?: string;
}

type WorkspaceMemberRole = "OWNER" | "ADMIN" | "MEMBER";

export interface WorkspaceActorContext {
  workspaceId: string | null;
  workspaceType: "PERSONAL" | "TEAM" | null;
  teamId: string | null;
  workspaceUserId: string | null;
  currentUserId: string | null;
  currentUserEmail: string | null;
  currentMemberRole: WorkspaceMemberRole | null;
  memberCount: number;
  isPersonalWorkspace: boolean;
  isTeamWorkspace: boolean;
  canInviteMembers: boolean;
  canManageWorkspace: boolean;
}

const WORKSPACE_MEMBER_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;

const isWorkspaceMemberRole = (
  role: string | undefined
): role is WorkspaceMemberRole =>
  !!role &&
  WORKSPACE_MEMBER_ROLES.includes(role as (typeof WORKSPACE_MEMBER_ROLES)[number]);

export function useWorkspace() {
  const tDialogs = useTranslations("dialogs");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspaceStore();

  // 获取用户所有工作空间
  const {
    data: apiWorkspaces,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspaces", session?.user?.id],
    queryFn: () => fetchUserWorkspaces(session!.access_token),
    enabled: !!session?.access_token,
    retry: 1,
  });

  // 转换API数据为前端格式
  const workspaces: Workspace[] = (apiWorkspaces || []).map(
    (workspace: APIWorkspace) => ({
      id: workspace.id,
      name:
        workspace.type === "TEAM"
          ? workspace.team?.name || workspace.name
          : workspace.name,
      type: workspace.type,
      memberCount:
        workspace.type === "TEAM" ? workspace.team?.members?.length || 1 : 1,
      isActive: workspace.id === currentWorkspaceId,
      avatarUrl:
        workspace.type === "TEAM"
          ? workspace.team?.avatarUrl || undefined
          : workspace.user?.avatarUrl || undefined,
      teamId: workspace.teamId,
      userId: workspace.userId,
    })
  );

  const currentApiWorkspace =
    (apiWorkspaces || []).find(
      (workspace: APIWorkspace) => workspace.id === currentWorkspaceId
    ) || null;

  const currentTeamMember =
    currentApiWorkspace?.team?.members.find(
      (member) => member.userId === session?.user?.id
    ) || null;

  const currentMemberRole = isWorkspaceMemberRole(currentTeamMember?.role)
    ? currentTeamMember.role
    : null;

  // 初始化当前工作空间
  useEffect(() => {
    if (workspaces.length === 0) {
      return;
    }

    const matchedWorkspace = currentWorkspaceId
      ? workspaces.find((workspace) => workspace.id === currentWorkspaceId)
      : null;

    if (matchedWorkspace) {
      return;
    }

    const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
    const savedWorkspace = workspaces.find((workspace) => workspace.id === savedWorkspaceId);
    const personalWorkspace = workspaces.find((workspace) => workspace.type === "PERSONAL");
    const nextWorkspace = savedWorkspace || personalWorkspace || workspaces[0];

    setCurrentWorkspaceId(nextWorkspace.id);
    localStorage.setItem("currentWorkspaceId", nextWorkspace.id);
  }, [workspaces, currentWorkspaceId, setCurrentWorkspaceId]);

  // 获取当前工作空间
  const currentWorkspace =
    workspaces.find((w) => w.id === currentWorkspaceId) || null;

  const currentWorkspaceContext: WorkspaceActorContext = {
    workspaceId: currentWorkspace?.id || null,
    workspaceType: currentWorkspace?.type || null,
    teamId: currentWorkspace?.teamId || null,
    workspaceUserId: currentWorkspace?.userId || null,
    currentUserId: session?.user?.id || null,
    currentUserEmail: session?.user?.email || null,
    currentMemberRole,
    memberCount: currentWorkspace?.memberCount || 0,
    isPersonalWorkspace: currentWorkspace?.type === "PERSONAL",
    isTeamWorkspace: currentWorkspace?.type === "TEAM",
    canInviteMembers:
      currentWorkspace?.type === "TEAM" &&
      (currentMemberRole === "OWNER" || currentMemberRole === "ADMIN"),
    canManageWorkspace:
      currentWorkspace?.type === "PERSONAL" ||
      (currentWorkspace?.type === "TEAM" &&
        (currentMemberRole === "OWNER" || currentMemberRole === "ADMIN")),
  };

  // 切换工作空间
  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspaceId(workspaceId);
      localStorage.setItem("currentWorkspaceId", workspaceId);
    }
  };

  // 创建新工作空间
  const createWorkspace = async (name: string, type: "PERSONAL" | "TEAM") => {
    if (!session?.access_token) {
      throw new Error(tDialogs("workspace.errors.createAuthRequired"));
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new Error(tDialogs("createTeam.validation.nameRequired"));
    }

    if (type === "PERSONAL") {
      throw new Error(tDialogs("workspace.errors.personalUnsupported"));
    }

    const createdTeam = await createTeamFetcher(
      { name: normalizedName },
      session.access_token
    );

    if (createdTeam.workspace?.id) {
      setCurrentWorkspaceId(createdTeam.workspace.id);
      localStorage.setItem("currentWorkspaceId", createdTeam.workspace.id);
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["teams"] }),
      queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
    ]);

    return {
      id: createdTeam.workspace?.id || createdTeam.id,
      name: createdTeam.name,
      type: "TEAM" as const,
      memberCount: createdTeam.members.length || 1,
      isActive: true,
      avatarUrl: createdTeam.avatarUrl || undefined,
      teamId: createdTeam.id,
    };
  };

  // 邀请成员到当前工作空间
  const inviteMember = async (email: string) => {
    if (!session?.access_token) {
      throw new Error(tDialogs("workspace.errors.inviteAuthRequired"));
    }

    if (!currentWorkspaceContext.isTeamWorkspace || !currentWorkspace?.teamId) {
      throw new Error(tDialogs("workspace.errors.teamInviteOnly"));
    }

    if (!currentWorkspaceContext.canInviteMembers) {
      throw new Error(tDialogs("workspace.errors.invitePermissionDenied"));
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      throw new Error(tDialogs("inviteMember.validation.emailRequired"));
    }

    const result = await inviteTeamMember(
      currentWorkspace.teamId,
      { email: normalizedEmail },
      session.access_token
    );

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["team-members", currentWorkspace.teamId] }),
      queryClient.invalidateQueries({ queryKey: ["teams"] }),
      queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
    ]);

    return result;
  };

  return {
    workspaces,
    currentWorkspace,
    currentWorkspaceContext,
    loading,
    error,
    refetch,
    switchWorkspace,
    createWorkspace,
    inviteMember,
  };
}
