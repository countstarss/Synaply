"use client";

import { getSupabasePublicConfig } from "@/lib/supabase";
import {
  REALTIME_EVENTS,
  type IssueDeletedPayload,
  type RealtimeEventName,
} from "./events";
import { buildIssueTopic } from "./topics";

type RealtimePayload = IssueDeletedPayload;

function logBroadcastDebug(message: string, payload?: unknown) {
  void message;
  void payload;
  return;
}

function buildBroadcastEndpoint() {
  const { url } = getSupabasePublicConfig();
  return `${url.replace(/\/+$/, "")}/realtime/v1/api/broadcast`;
}

async function sendBroadcast(
  topic: string,
  event: RealtimeEventName,
  payload: RealtimePayload,
  accessToken: string,
) {
  const { anonKey } = getSupabasePublicConfig();

  try {
    logBroadcastDebug("send via rest", { topic, event, payload });

    const response = await fetch(buildBroadcastEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        messages: [
          {
            topic,
            event,
            payload,
            private: true,
          },
        ],
      }),
    });

    if (response.ok) {
      logBroadcastDebug("sent via rest", { topic, event });
      return;
    }

    let errorMessage = response.statusText || "Broadcast failed";

    try {
      const errorBody = await response.json();
      errorMessage =
        errorBody?.error ||
        errorBody?.message ||
        (typeof errorBody === "string" ? errorBody : errorMessage);
    } catch {
      const errorText = await response.text().catch(() => "");
      errorMessage = errorText || errorMessage;
    }

    void errorMessage;

  } catch {
    return;
  }
}

export async function broadcastIssueDeleted(
  payload: IssueDeletedPayload,
  accessToken: string,
) {
  await sendBroadcast(
    buildIssueTopic(payload.issueId),
    REALTIME_EVENTS.ISSUE_DELETED,
    payload,
    accessToken,
  );
}
