"use client";

import {
  QueryClient,
  type QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  clearInboxItems,
  fetchInbox,
  fetchInboxSummary,
  getInboxQueryKey,
  InboxFeedResponse,
  InboxItem,
  InboxQueryParams,
  markInboxItemDone,
  markInboxItemSeen,
  markInboxItemUnread,
  normalizeInboxQueryParams,
  snoozeInboxItem,
} from "@/lib/fetchers/inbox";

type InboxListQueryKey = ReturnType<typeof getInboxQueryKey>;

function isInboxListQueryKey(
  queryKey: QueryKey,
  workspaceId: string,
): queryKey is InboxListQueryKey {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === "inbox" &&
    queryKey[1] === workspaceId &&
    typeof queryKey[2] === "object" &&
    queryKey[2] !== null
  );
}

function matchesInboxQuery(item: InboxItem, params: InboxQueryParams) {
  if (params.bucket && item.bucket !== params.bucket) {
    return false;
  }

  if (params.status && item.status !== params.status) {
    return false;
  }

  if (params.type && item.type !== params.type) {
    return false;
  }

  if (params.projectId && item.projectId !== params.projectId) {
    return false;
  }

  if (
    params.requiresAction !== undefined &&
    item.requiresAction !== params.requiresAction
  ) {
    return false;
  }

  return true;
}

function updateInboxListCaches(
  queryClient: QueryClient,
  workspaceId: string,
  updatedItem: InboxItem,
) {
  const queries = queryClient.getQueriesData<InboxFeedResponse>({
    queryKey: ["inbox", workspaceId],
  });
  const keysToInvalidate: QueryKey[] = [];

  for (const [queryKey, data] of queries) {
    if (!data || !isInboxListQueryKey(queryKey, workspaceId)) {
      continue;
    }

    const params = normalizeInboxQueryParams(queryKey[2]);
    const itemIndex = data.items.findIndex((item) => item.id === updatedItem.id);
    const matches = matchesInboxQuery(updatedItem, params);

    if (itemIndex >= 0) {
      if (matches) {
        queryClient.setQueryData<InboxFeedResponse>(queryKey, {
          ...data,
          items: data.items.map((item) =>
            item.id === updatedItem.id ? updatedItem : item,
          ),
        });
      } else {
        queryClient.setQueryData<InboxFeedResponse>(queryKey, {
          ...data,
          items: data.items.filter((item) => item.id !== updatedItem.id),
        });
        keysToInvalidate.push(queryKey);
      }

      continue;
    }

    if (matches) {
      keysToInvalidate.push(queryKey);
    }
  }

  for (const queryKey of keysToInvalidate) {
    void queryClient.invalidateQueries({
      queryKey,
      exact: true,
    });
  }
}

function clearInboxListCaches(
  queryClient: QueryClient,
  workspaceId: string,
  itemIds: string[],
) {
  const itemIdSet = new Set(itemIds);
  const queries = queryClient.getQueriesData<InboxFeedResponse>({
    queryKey: ["inbox", workspaceId],
  });

  for (const [queryKey, data] of queries) {
    if (!data || !isInboxListQueryKey(queryKey, workspaceId)) {
      continue;
    }

    const nextItems = data.items.filter((item) => !itemIdSet.has(item.id));

    if (nextItems.length === data.items.length) {
      continue;
    }

    queryClient.setQueryData<InboxFeedResponse>(queryKey, {
      ...data,
      items: nextItems,
    });
    void queryClient.invalidateQueries({
      queryKey,
      exact: true,
    });
  }
}

export function useInbox(
  workspaceId: string,
  params: InboxQueryParams = {},
  options: { enabled?: boolean } = {},
) {
  const { session } = useAuth();

  return useQuery({
    queryKey: getInboxQueryKey(workspaceId, params),
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
    onSuccess: (updatedItem, variables) => {
      updateInboxListCaches(queryClient, variables.workspaceId, updatedItem);
      void queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
        exact: true,
      });
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
    onSuccess: (updatedItem, variables) => {
      updateInboxListCaches(queryClient, variables.workspaceId, updatedItem);
      void queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
        exact: true,
      });
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
    onSuccess: (updatedItem, variables) => {
      updateInboxListCaches(queryClient, variables.workspaceId, updatedItem);
      void queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
        exact: true,
      });
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
    onSuccess: (updatedItem, variables) => {
      updateInboxListCaches(queryClient, variables.workspaceId, updatedItem);
      void queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
        exact: true,
      });
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
      clearInboxListCaches(queryClient, variables.workspaceId, variables.itemIds);
      void queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
        exact: true,
      });
      void queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
        exact: true,
      });
    },
  });
}
