"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import type {
  RealtimeEventName,
  RealtimePayloadMap,
} from "@/lib/realtime/events";
import { createClientComponentClient } from "@/lib/supabase";

type PresenceState<TPresence extends object> = Record<
  string,
  TPresence[]
>;

interface UseRealtimeChannelOptions<
  TEvent extends RealtimeEventName = RealtimeEventName,
> {
  topic: string;
  enabled?: boolean;
  presenceKey?: string;
  events?: readonly TEvent[];
  onBroadcast?: (
    event: TEvent,
    payload: RealtimePayloadMap[TEvent],
  ) => void | Promise<void>;
}

interface UseRealtimeChannelResult<TPresence extends object> {
  isSubscribed: boolean;
  presenceState: PresenceState<TPresence>;
  trackPresence: (presence: TPresence) => Promise<void>;
  untrackPresence: () => Promise<void>;
  channel: RealtimeChannel | null;
}

const pendingChannelCleanup = new Map<string, Promise<void>>();

export function useRealtimeChannel<TPresence extends object>({
  topic,
  enabled = true,
  presenceKey,
  events,
  onBroadcast,
}: UseRealtimeChannelOptions): UseRealtimeChannelResult<TPresence> {
  const { session } = useAuth();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [presenceState, setPresenceState] = useState<PresenceState<TPresence>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const channelStatusRef = useRef<string>("CLOSED");
  const pendingPresenceRef = useRef<TPresence | null>(null);
  const onBroadcastRef = useRef(onBroadcast);
  const eventsKey = events?.join("|") ?? "";

  onBroadcastRef.current = onBroadcast;

  useEffect(() => {
    isSubscribedRef.current = isSubscribed;
  }, [isSubscribed]);

  const flushPendingPresence = useCallback(async () => {
    if (
      !pendingPresenceRef.current ||
      !channelRef.current ||
      !isSubscribedRef.current ||
      channelStatusRef.current !== "SUBSCRIBED"
    ) {
      return;
    }

    try {
      await channelRef.current.track(pendingPresenceRef.current);
    } catch (error) {
      console.error("Flush realtime presence failed", {
        topic,
        error,
      });
    }
  }, [topic]);

  useEffect(() => {
    let cancelled = false;
    let activeChannel: RealtimeChannel | null = null;
    const realtimeTopic = `realtime:${topic}`;

    if (!enabled || !topic || !session?.access_token) {
      setIsSubscribed(false);
      isSubscribedRef.current = false;
      channelStatusRef.current = "CLOSED";
      pendingPresenceRef.current = null;
      setPresenceState({});
      channelRef.current = null;
      return;
    }

    const channelConfig: {
      broadcast: { self: boolean };
      private: boolean;
      presence?: { key: string };
    } = {
      broadcast: { self: false },
      private: true,
    };

    if (presenceKey) {
      channelConfig.presence = { key: presenceKey };
    }

    const setupChannel = async () => {
      const pendingCleanup = pendingChannelCleanup.get(realtimeTopic);

      if (pendingCleanup) {
        try {
          await pendingCleanup;
        } catch {
          // Ignore cleanup failures and rebuild a fresh channel below.
        }
      }

      if (cancelled) {
        return;
      }

      const channel = supabase.channel(topic, {
        config: channelConfig,
      });

      activeChannel = channel;
      channelRef.current = channel;

      const syncPresence = () => {
        if (channelRef.current !== channel) {
          return;
        }

        setPresenceState(channel.presenceState<TPresence>());
      };

      for (const event of events ?? []) {
        channel.on("broadcast", { event }, ({ payload }) => {
          if (channelRef.current !== channel) {
            return;
          }

          void onBroadcastRef.current?.(
            event,
            payload as RealtimePayloadMap[typeof event],
          );
        });
      }

      channel.on("presence", { event: "sync" }, syncPresence);
      channel.on("presence", { event: "join" }, syncPresence);
      channel.on("presence", { event: "leave" }, syncPresence);

      channel.subscribe((status) => {
        if (cancelled || channelRef.current !== channel) {
          return;
        }

        channelStatusRef.current = status;

        if (status === "SUBSCRIBED") {
          isSubscribedRef.current = true;
          setIsSubscribed(true);
          syncPresence();
          void flushPendingPresence();
          return;
        }

        if (
          status === "CLOSED" ||
          status === "TIMED_OUT" ||
          status === "CHANNEL_ERROR"
        ) {
          isSubscribedRef.current = false;
          setIsSubscribed(false);
        }
      });
    };

    void setupChannel();

    return () => {
      cancelled = true;
      channelStatusRef.current = "CLOSED";
      isSubscribedRef.current = false;
      pendingPresenceRef.current = null;

      setIsSubscribed(false);
      setPresenceState({});

      if (channelRef.current === activeChannel) {
        channelRef.current = null;
      }

      if (!activeChannel) {
        return;
      }

      const cleanupPromise = (async () => {
        try {
          await supabase.removeChannel(activeChannel);
        } catch (error) {
          console.error("Cleanup realtime channel failed", {
            topic,
            error,
          });
        }
      })();

      pendingChannelCleanup.set(realtimeTopic, cleanupPromise);

      void cleanupPromise.finally(() => {
        if (pendingChannelCleanup.get(realtimeTopic) === cleanupPromise) {
          pendingChannelCleanup.delete(realtimeTopic);
        }
      });
    };
  }, [
    enabled,
    events,
    eventsKey,
    flushPendingPresence,
    presenceKey,
    session?.access_token,
    supabase,
    topic,
  ]);

  const trackPresence = useCallback(async (presence: TPresence) => {
    pendingPresenceRef.current = presence;

    if (
      !channelRef.current ||
      !isSubscribedRef.current ||
      channelStatusRef.current !== "SUBSCRIBED"
    ) {
      return;
    }

    try {
      await channelRef.current.track(presence);
    } catch (error) {
      console.error("Track realtime presence failed", {
        topic,
        error,
      });
    }
  }, [topic]);

  const untrackPresence = useCallback(async () => {
    pendingPresenceRef.current = null;

    if (
      !channelRef.current ||
      !isSubscribedRef.current ||
      channelStatusRef.current !== "SUBSCRIBED"
    ) {
      return;
    }

    try {
      await channelRef.current.untrack();
    } catch (error) {
      console.error("Untrack realtime presence failed", {
        topic,
        error,
      });
    }
  }, [topic]);

  return {
    isSubscribed,
    presenceState,
    trackPresence,
    untrackPresence,
    channel: channelRef.current,
  };
}
