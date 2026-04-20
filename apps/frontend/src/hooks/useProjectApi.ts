"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  CreateProjectDto,
  UpdateProjectDto,
  createProject,
  deleteProject,
  getProject,
  getProjectSummary,
  getProjects,
  updateProject,
  type Project,
} from "@/lib/fetchers/project";
import {
  ProjectRiskLevel,
  ProjectStatus,
  VisibilityType,
} from "@/types/prisma";

const OPTIMISTIC_PROJECT_ID_PREFIX = "optimistic-project-";

function createOptimisticProject(
  workspaceId: string,
  creatorId: string,
  data: CreateProjectDto,
): Project {
  const now = new Date().toISOString();

  return {
    id: `${OPTIMISTIC_PROJECT_ID_PREFIX}${Date.now()}`,
    name: data.name,
    description: data.description ?? null,
    brief: data.brief ?? null,
    status: data.status ?? ProjectStatus.PLANNING,
    phase: data.phase ?? null,
    riskLevel: data.riskLevel ?? ProjectRiskLevel.LOW,
    workspaceId,
    creatorId,
    ownerMemberId: data.ownerMemberId ?? "",
    lastSyncAt: data.lastSyncAt ?? null,
    visibility: data.visibility ?? VisibilityType.PRIVATE,
    createdAt: now,
    updatedAt: now,
  };
}

interface QueryEnabledOptions {
  enabled?: boolean;
}

export const useProjects = (
  workspaceId: string,
  options: QueryEnabledOptions = {},
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      if (!session?.access_token) return [];
      return getProjects(workspaceId, session.access_token);
    },
    enabled:
      (options.enabled ?? true) && !!session?.access_token && !!workspaceId,
  });
};

export const useProject = (
  workspaceId: string,
  projectId: string,
  options: QueryEnabledOptions = {},
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["project", workspaceId, projectId],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return getProject(workspaceId, projectId, session.access_token);
    },
    enabled:
      (options.enabled ?? true) &&
      !!session?.access_token &&
      !!workspaceId &&
      !!projectId,
  });
};

export const useProjectSummary = (
  workspaceId: string,
  projectId: string,
  options: QueryEnabledOptions = {},
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["project-summary", workspaceId, projectId],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return getProjectSummary(workspaceId, projectId, session.access_token);
    },
    enabled:
      (options.enabled ?? true) &&
      !!session?.access_token &&
      !!workspaceId &&
      !!projectId,
  });
};

export const useCreateProject = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: CreateProjectDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return createProject(workspaceId, data, session.access_token);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["projects", variables.workspaceId],
      });

      const previousProjects =
        queryClient.getQueryData<Project[]>(["projects", variables.workspaceId]) ?? [];
      const optimisticProject = createOptimisticProject(
        variables.workspaceId,
        session?.user?.id ?? "",
        variables.data,
      );

      queryClient.setQueryData<Project[]>(
        ["projects", variables.workspaceId],
        (current = []) => [optimisticProject, ...current],
      );

      return {
        previousProjects,
        optimisticProjectId: optimisticProject.id,
      };
    },
    onError: (_error, variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData(
        ["projects", variables.workspaceId],
        context.previousProjects,
      );
    },
    onSuccess: (createdProject, variables, context) => {
      queryClient.setQueryData<Project[]>(
        ["projects", variables.workspaceId],
        (current = []) => {
          const nextProjects = current.map((project) =>
            project.id === context?.optimisticProjectId ? createdProject : project,
          );

          if (
            !nextProjects.some((project) => project.id === createdProject.id)
          ) {
            nextProjects.unshift(createdProject);
          }

          return nextProjects;
        },
      );
      queryClient.setQueryData(
        ["project", variables.workspaceId, createdProject.id],
        createdProject,
      );
      void queryClient.invalidateQueries({
        queryKey: ["docs", variables.workspaceId],
      });
    },
  });
};

export const useUpdateProject = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      projectId,
      data,
    }: {
      workspaceId: string;
      projectId: string;
      data: UpdateProjectDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return updateProject(workspaceId, projectId, data, session.access_token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["docs", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.workspaceId, variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId, variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
      });
    },
  });
};

export const useDeleteProject = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      projectId,
    }: {
      workspaceId: string;
      projectId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return deleteProject(workspaceId, projectId, session.access_token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["docs", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.workspaceId, variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId, variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
      });
    },
  });
};
