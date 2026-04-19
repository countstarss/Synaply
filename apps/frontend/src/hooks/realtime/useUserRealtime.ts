"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  REALTIME_EVENTS,
  USER_REALTIME_EVENTS,
  type InboxUpdatedPayload,
  type RealtimeEventName,
  type RealtimePayloadMap,
} from "@/lib/realtime/events";
import { buildUserTopic } from "@/lib/realtime/topics";
import { useRealtimeChannel } from "./useRealtimeChannel";

interface UseUserRealtimeOptions {
  enabled?: boolean;
}

/**
 * Subscribes to the per-user realtime channel `user:{userId}` to receive
 * push events targeted at the current user. Currently this delivers
 * inbox updates the moment a backend service writes/updates an
 * inbox_items row (via the realtime_inbox_item_broadcast trigger).
 *
 * The hook is intentionally narrow: it only invalidates inbox-related
 * react-query caches. Workspace-scoped invalidation continues to flow
 * through useWorkspaceRealtime.
 */
export function useUserRealtime(
  userId: string | null | undefined,
  workspaceId: string | null | undefined,
  { enabled = true }: UseUserRealtimeOptions = {},
) {
  const queryClient = useQueryClient();

  const handleBroadcast = useCallback(
    (event: RealtimeEventName, payload: RealtimePayloadMap[RealtimeEventName]) => {
      if (event !== REALTIME_EVENTS.INBOX_UPDATED) {
        return;
      }

      const inboxPayload = payload as InboxUpdatedPayload;
      const targetWorkspaceId = inboxPayload.workspaceId || workspaceId;

      if (!targetWorkspaceId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ["inbox", targetWorkspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["inbox-summary", targetWorkspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["my-work", targetWorkspaceId],
      });
    },
    [queryClient, workspaceId],
  );

  useRealtimeChannel({
    topic: userId ? buildUserTopic(userId) : "",
    enabled: enabled && !!userId,
    events: USER_REALTIME_EVENTS,
    onBroadcast: handleBroadcast,
  });
}
