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
} from "@/lib/fetchers/project";

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["docs", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId],
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
