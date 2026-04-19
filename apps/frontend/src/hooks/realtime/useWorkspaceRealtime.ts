"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  REALTIME_EVENTS,
  WORKSPACE_REALTIME_EVENTS,
  type RealtimeEventName,
} from "@/lib/realtime/events";
import { buildWorkspaceTopic } from "@/lib/realtime/topics";
import { useRealtimeChannel } from "./useRealtimeChannel";
import { useUserRealtime } from "./useUserRealtime";

interface UseWorkspaceRealtimeOptions {
  enabled?: boolean;
  userEnabled?: boolean;
}

export function useWorkspaceRealtime(
  workspaceId: string,
  { enabled = true, userEnabled = enabled }: UseWorkspaceRealtimeOptions = {},
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleWorkspaceBroadcast = useCallback(
    (event: RealtimeEventName) => {
      // Project summary changes need a narrower invalidation set than
      // generic issue events, but invalidating both is cheap and avoids
      // missing edge cases.
      void queryClient.invalidateQueries({
        queryKey: ["issues", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["my-work", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["inbox", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["inbox-summary", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["project-summary", workspaceId],
      });

      if (event === REALTIME_EVENTS.PROJECT_SUMMARY_INVALIDATED) {
        void queryClient.invalidateQueries({
          queryKey: ["projects", workspaceId],
        });
      }
    },
    [queryClient, workspaceId],
  );

  useRealtimeChannel({
    topic: buildWorkspaceTopic(workspaceId),
    enabled: enabled && !!workspaceId,
    events: WORKSPACE_REALTIME_EVENTS,
    onBroadcast: handleWorkspaceBroadcast,
  });

  // Per-user inbox push: backend triggers emit `inbox.updated` on
  // user:{userId} as soon as inbox_items rows are written or status
  // changes (see realtime_inbox_item_broadcast trigger).
  useUserRealtime(user?.id ?? null, workspaceId, {
    enabled: userEnabled && !!workspaceId,
  });
}
