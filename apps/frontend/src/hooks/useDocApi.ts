"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  CreateDocInput,
  CreateDocRevisionInput,
  CreateFolderInput,
  DocRecord,
  QueryDocsTreeParams,
  UpdateDocMetaInput,
  createDoc,
  createDocRevision,
  createFolder,
  deleteDoc,
  getDocsTree,
  updateDocMeta,
} from "@/lib/fetchers/doc";

export const getDocsQueryKey = (
  workspaceId: string,
  params: QueryDocsTreeParams = {}
) => [
  "docs",
  workspaceId,
  params.context ?? "all",
  params.workspaceType ?? "all",
  params.projectId ?? "all",
  params.issueId ?? "all",
  params.workflowId ?? "all",
  params.includeArchived ? "archived" : "active",
] as const;

export function useDocsTree(
  workspaceId: string,
  params: QueryDocsTreeParams = {},
  options?: {
    enabled?: boolean;
  }
) {
  const { session } = useAuth();

  return useQuery({
    queryKey: getDocsQueryKey(workspaceId, params),
    queryFn: async () => {
      if (!session?.access_token) {
        return [] as DocRecord[];
      }

      return getDocsTree(workspaceId, session.access_token, params);
    },
    enabled:
      (options?.enabled ?? true) && !!workspaceId && !!session?.access_token,
  });
}

export function useCreateDocMutation() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: CreateDocInput;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return createDoc(workspaceId, data, session.access_token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["docs", variables.workspaceId],
      });
    },
  });
}

export function useCreateFolderMutation() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: CreateFolderInput;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return createFolder(workspaceId, data, session.access_token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["docs", variables.workspaceId],
      });
    },
  });
}

export function useUpdateDocMetaMutation() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      docId,
      data,
    }: {
      workspaceId: string;
      docId: string;
      data: UpdateDocMetaInput;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return updateDocMeta(workspaceId, docId, data, session.access_token);
    },
    onSuccess: (updatedDoc, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["docs", variables.workspaceId],
      });
      queryClient.setQueryData(["doc", variables.workspaceId, variables.docId], updatedDoc);
    },
  });
}

export function useCreateDocRevisionMutation() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      docId,
      data,
    }: {
      workspaceId: string;
      docId: string;
      data: CreateDocRevisionInput;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return createDocRevision(workspaceId, docId, data, session.access_token);
    },
    onSuccess: (result, variables) => {
      if (result.status === "applied" || result.status === "noop") {
        queryClient.invalidateQueries({
          queryKey: ["docs", variables.workspaceId],
        });
        queryClient.setQueryData(
          ["doc", variables.workspaceId, variables.docId],
          result.doc
        );
      }
    },
  });
}

export function useDeleteDocMutation() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      docId,
    }: {
      workspaceId: string;
      docId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return deleteDoc(workspaceId, docId, session.access_token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["docs", variables.workspaceId],
      });
    },
  });
}
