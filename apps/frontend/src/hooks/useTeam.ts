"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  fetchUserTeams,
  createTeam,
  updateTeam,
  fetchTeamMembers,
  fetchTeamById,
  fetchTeamMemberByUserId,
  CreateTeamPayload,
  UpdateTeamPayload,
  Team,
  TeamMember,
} from "@/lib/fetchers/team";

export const useTeam = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();

  // MARK: - 获取用户所有团队
  const {
    data: teams,
    isLoading: isLoadingTeams,
    error: teamsError,
  } = useQuery({
    queryKey: ["teams", session?.user?.id],
    queryFn: () => fetchUserTeams(session!.access_token),
    enabled: !!session?.access_token,
  });

  // MARK: - 创建团队
  const createTeamMutation = useMutation({
    mutationFn: (data: CreateTeamPayload) =>
      createTeam(data, session!.access_token),
    onSuccess: () => {
      // 成功后重新获取团队列表
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });

  // MARK: - 当前用户团队状态
  const hasTeams = teams && teams.length > 0;
  const currentTeam =
    currentWorkspace?.teamId && teams
      ? teams.find((team) => team.id === currentWorkspace.teamId) || null
      : null;

  // MARK: -获取当前团队成员信息;
  // const currentTeamMember =
  //   currentTeam && session?.user?.id
  //     ? currentTeam.members.find((member) => member.user.id === session.user.id)
  //     : null;

  return {
    teams,
    isLoadingTeams,
    teamsError,
    createTeam: createTeamMutation.mutateAsync,
    isCreatingTeam: createTeamMutation.isPending,
    createTeamError: createTeamMutation.error,
    hasTeams,
    currentTeam,
    // currentTeamMember,
  };
};

export const useUpdateTeam = (teamId: string | undefined) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTeamPayload) =>
      updateTeam(teamId!, data, session!.access_token),
    onSuccess: (updatedTeam) => {
      queryClient.setQueryData(["team", teamId], updatedTeam);
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

/**
 * MARK: 获取当前工作空间对应团队
 */
export const useCurrentTeam = () => {
  const { currentTeam, isLoadingTeams, teamsError } = useTeam();

  return {
    team: currentTeam,
    isLoading: isLoadingTeams,
    error: teamsError,
  };
};

/**
 * MARK: 获取团队成员列表
 */
export const useTeamMembers = (
  teamId: string | undefined,
  options: { enabled?: boolean } = {},
) => {
  const { session } = useAuth();

  return useQuery<TeamMember[]>({
    queryKey: ["team-members", teamId],
    queryFn: () => fetchTeamMembers(teamId!, session?.access_token || ""),
    enabled: (options.enabled ?? true) && !!session?.access_token && !!teamId,
    staleTime: 2 * 60 * 1000, // 2分钟内认为数据新鲜
    retry: 2,
  });
};

/**
 * MARK: 获取团队详情
 */
export const useTeamById = (teamId: string | undefined) => {
  const { session } = useAuth();

  return useQuery<Team>({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeamById(teamId!, session?.access_token || ""),
    enabled: !!session?.access_token && !!teamId,
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据新鲜
    retry: 2,
  });
};

/**
 * MARK: 获取当前用户默认 TeamMember
 */
export const useTeamMemberByUserId = (userId: string | undefined) => {
  const { session } = useAuth();

  return useQuery<TeamMember | null>({
    queryKey: ["team-member-by-user-id", userId],
    queryFn: () =>
      fetchTeamMemberByUserId(userId!, session?.access_token || ""),
    enabled: !!session?.access_token && !!userId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
