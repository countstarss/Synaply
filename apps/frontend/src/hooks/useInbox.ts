"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  clearInboxItems,
  fetchInbox,
  fetchInboxSummary,
  InboxQueryParams,
  markInboxItemDone,
  markInboxItemSeen,
  markInboxItemUnread,
  snoozeInboxItem,
} from "@/lib/fetchers/inbox";

function invalidateInboxQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
) {
  queryClient.invalidateQueries({
    queryKey: ["inbox", workspaceId],
  });
  queryClient.invalidateQueries({
    queryKey: ["inbox-summary", workspaceId],
  });
  queryClient.invalidateQueries({
    queryKey: ["my-work", workspaceId],
  });
}

export function useInbox(
  workspaceId: string,
  params: InboxQueryParams = {},
  options: { enabled?: boolean } = {},
) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["inbox", workspaceId, params],
    queryFn: () => fetchInbox(workspaceId, session!.access_token, params),
    enabled:
      (options.enabled ?? true) && !!workspaceId && !!session?.access_token,
    staleTime: 15_000,
  });
}

export function useInboxSummary(
  workspaceId: string,
  options: { enabled?: boolean } = {},
) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["inbox-summary", workspaceId],
    queryFn: () => fetchInboxSummary(workspaceId, session!.access_token),
    enabled:
      (options.enabled ?? true) && !!workspaceId && !!session?.access_token,
    staleTime: 15_000,
  });
}

export function useMarkInboxItemSeen() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      itemId,
    }: {
      workspaceId: string;
      itemId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return markInboxItemSeen(workspaceId, itemId, session.access_token);
    },
    onSuccess: (_, variables) => {
      invalidateInboxQueries(queryClient, variables.workspaceId);
    },
  });
}

export function useMarkInboxItemDone() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      itemId,
    }: {
      workspaceId: string;
      itemId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return markInboxItemDone(workspaceId, itemId, session.access_token);
    },
    onSuccess: (_, variables) => {
      invalidateInboxQueries(queryClient, variables.workspaceId);
    },
  });
}

export function useMarkInboxItemUnread() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      itemId,
    }: {
      workspaceId: string;
      itemId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return markInboxItemUnread(workspaceId, itemId, session.access_token);
    },
    onSuccess: (_, variables) => {
      invalidateInboxQueries(queryClient, variables.workspaceId);
    },
  });
}

export function useSnoozeInboxItem() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      itemId,
      until,
    }: {
      workspaceId: string;
      itemId: string;
      until?: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return snoozeInboxItem(workspaceId, itemId, session.access_token, until);
    },
    onSuccess: (_, variables) => {
      invalidateInboxQueries(queryClient, variables.workspaceId);
    },
  });
}

export function useClearInboxItems() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      itemIds,
    }: {
      workspaceId: string;
      itemIds: string[];
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return clearInboxItems(workspaceId, itemIds, session.access_token);
    },
    onSuccess: (_, variables) => {
      invalidateInboxQueries(queryClient, variables.workspaceId);
    },
  });
}
