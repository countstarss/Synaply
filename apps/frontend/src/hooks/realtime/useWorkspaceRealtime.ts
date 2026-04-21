"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  REALTIME_EVENTS,
  WORKSPACE_REALTIME_EVENTS,
  type RealtimeEventName,
  type RealtimePayloadMap,
} from "@/lib/realtime/events";
import { scheduleQueryInvalidations } from "@/lib/query/scheduled-invalidation";
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
    (
      event: RealtimeEventName,
      payload: RealtimePayloadMap[RealtimeEventName],
    ) => {
      if (!workspaceId) {
        return;
      }

      switch (event) {
        case REALTIME_EVENTS.ISSUE_CREATED:
        case REALTIME_EVENTS.ISSUE_DELETED:
          scheduleQueryInvalidations(queryClient, [
            { queryKey: ["issues", workspaceId] },
            { queryKey: ["my-work", workspaceId], exact: true },
            { queryKey: ["project-summary", workspaceId] },
          ]);
          return;
        case REALTIME_EVENTS.ISSUE_UPDATED: {
          const changedFields = Array.isArray(
            (payload as RealtimePayloadMap[typeof REALTIME_EVENTS.ISSUE_UPDATED])
              ?.changedFields,
          )
            ? (
                payload as RealtimePayloadMap[typeof REALTIME_EVENTS.ISSUE_UPDATED]
              ).changedFields
            : [];
          const affectsIssueCollections = changedFields.some((field) =>
            ISSUE_COLLECTION_FIELDS.has(field),
          );
          const affectsProjectSummaries = changedFields.some((field) =>
            PROJECT_SUMMARY_FIELDS.has(field),
          );

          if (!affectsIssueCollections && !affectsProjectSummaries) {
            return;
          }

          scheduleQueryInvalidations(queryClient, [
            ...(affectsIssueCollections
              ? [
                  { queryKey: ["issues", workspaceId] },
                  { queryKey: ["my-work", workspaceId], exact: true },
                ]
              : []),
            ...(affectsProjectSummaries
              ? [{ queryKey: ["project-summary", workspaceId] }]
              : []),
          ]);
          return;
        }
        case REALTIME_EVENTS.WORKFLOW_RUN_CREATED:
        case REALTIME_EVENTS.WORKFLOW_STEP_STATUS_CHANGED:
        case REALTIME_EVENTS.WORKFLOW_STEP_COMPLETED:
        case REALTIME_EVENTS.WORKFLOW_STEP_REVERTED:
        case REALTIME_EVENTS.WORKFLOW_RECORD_SUBMITTED:
        case REALTIME_EVENTS.WORKFLOW_REVIEW_REQUESTED:
        case REALTIME_EVENTS.WORKFLOW_REVIEW_APPROVED:
        case REALTIME_EVENTS.WORKFLOW_REVIEW_CHANGES_REQUESTED:
        case REALTIME_EVENTS.WORKFLOW_HANDOFF_REQUESTED:
        case REALTIME_EVENTS.WORKFLOW_HANDOFF_ACCEPTED:
        case REALTIME_EVENTS.WORKFLOW_BLOCKED:
        case REALTIME_EVENTS.WORKFLOW_UNBLOCKED:
        case REALTIME_EVENTS.WORKFLOW_RUN_COMPLETED:
          scheduleQueryInvalidations(queryClient, [
            { queryKey: ["issues", workspaceId] },
            { queryKey: ["my-work", workspaceId], exact: true },
            { queryKey: ["project-summary", workspaceId] },
          ]);
          return;
        case REALTIME_EVENTS.PROJECT_SUMMARY_INVALIDATED: {
          const projectId = (
            payload as RealtimePayloadMap[typeof REALTIME_EVENTS.PROJECT_SUMMARY_INVALIDATED]
          )?.projectId;

          scheduleQueryInvalidations(queryClient, [
            { queryKey: ["projects", workspaceId], exact: true },
            ...(projectId
              ? [
                  {
                    queryKey: ["project", workspaceId, projectId],
                    exact: true,
                  },
                ]
              : []),
            ...(projectId
              ? [
                  {
                    queryKey: ["project-summary", workspaceId, projectId],
                    exact: true,
                  },
                ]
              : [{ queryKey: ["project-summary", workspaceId] }]),
          ]);
          return;
        }
        default:
          return;
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

const ISSUE_COLLECTION_FIELDS = new Set([
  "created",
  "deleted",
  "workspaceId",
  "title",
  "stateId",
  "projectId",
  "directAssigneeId",
  "dueDate",
  "priority",
  "visibility",
  "issueType",
  "workflowId",
  "workflowSnapshot",
  "totalSteps",
  "currentStepId",
  "currentStepIndex",
  "currentStepStatus",
  "key",
  "sequence",
  "creatorMemberId",
]);

const PROJECT_SUMMARY_FIELDS = new Set([
  "created",
  "deleted",
  "workspaceId",
  "stateId",
  "projectId",
  "directAssigneeId",
  "dueDate",
  "priority",
  "visibility",
  "issueType",
  "workflowId",
  "workflowSnapshot",
  "totalSteps",
  "currentStepId",
  "currentStepIndex",
  "currentStepStatus",
]);
