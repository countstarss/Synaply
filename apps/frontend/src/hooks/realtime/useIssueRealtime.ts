"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  ISSUE_REALTIME_EVENTS,
  REALTIME_EVENTS,
  WORKFLOW_REALTIME_EVENTS,
  type IssueRealtimeEditingField,
  type IssueRealtimePresence,
  type RealtimeEventName,
} from "@/lib/realtime/events";
import {
  buildIssueTopic,
  buildWorkflowIssueTopic,
} from "@/lib/realtime/topics";
import { useRealtimeChannel } from "./useRealtimeChannel";

interface IssuePresenceDraft {
  editingField: IssueRealtimeEditingField | null;
}

interface WorkflowPresenceDraft {
  focusingNode: string | null;
}

interface UseIssueRealtimeOptions {
  enabled?: boolean;
  workflow?: boolean;
}

const DEFAULT_ISSUE_PRESENCE_DRAFT: IssuePresenceDraft = {
  editingField: null,
};

const DEFAULT_WORKFLOW_PRESENCE_DRAFT: WorkflowPresenceDraft = {
  focusingNode: null,
};

const REALTIME_SESSION_STORAGE_KEY = "synaply.realtime.client-session-id";

function getRealtimeClientSessionId() {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existingSessionId = window.sessionStorage.getItem(
    REALTIME_SESSION_STORAGE_KEY,
  );

  if (existingSessionId) {
    return existingSessionId;
  }

  const nextSessionId =
    window.crypto?.randomUUID?.() ||
    `realtime-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.sessionStorage.setItem(REALTIME_SESSION_STORAGE_KEY, nextSessionId);
  return nextSessionId;
}

function flattenPresenceState(
  presenceState: Record<string, IssueRealtimePresence[]>,
) {
  const participants = new Map<string, IssueRealtimePresence>();

  for (const presences of Object.values(presenceState)) {
    for (const presence of presences) {
      participants.set(presence.clientSessionId, presence);
    }
  }

  return Array.from(participants.values());
}

export function useIssueRealtime(
  issueId: string,
  workspaceId: string,
  { enabled = true, workflow = false }: UseIssueRealtimeOptions = {},
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const clientSessionIdRef = useRef<string>(getRealtimeClientSessionId());
  const [issuePresenceDraft, setIssuePresenceDraft] =
    useState<IssuePresenceDraft>(DEFAULT_ISSUE_PRESENCE_DRAFT);
  const [workflowPresenceDraft, setWorkflowPresenceDraft] =
    useState<WorkflowPresenceDraft>(DEFAULT_WORKFLOW_PRESENCE_DRAFT);

  const handleIssueBroadcast = useCallback(
    (event: RealtimeEventName) => {
      switch (event) {
        case REALTIME_EVENTS.COMMENT_CREATED:
          void queryClient.invalidateQueries({ queryKey: ["comments", issueId] });
          return;
        case REALTIME_EVENTS.ISSUE_DELETED:
          queryClient.setQueryData(["issue", workspaceId, issueId], null);
          void queryClient.invalidateQueries({
            queryKey: ["issues", workspaceId],
          });
          return;
        case REALTIME_EVENTS.ISSUE_UPDATED:
          void queryClient.invalidateQueries({
            queryKey: ["issue", workspaceId, issueId],
          });
          void queryClient.invalidateQueries({
            queryKey: ["issues", workspaceId],
          });
          return;
        case REALTIME_EVENTS.ISSUE_ACTIVITY_CREATED:
          void queryClient.invalidateQueries({
            queryKey: ["issue-activities", issueId],
          });
          return;
        default:
          return;
      }
    },
    [issueId, queryClient, workspaceId],
  );

  const handleWorkflowBroadcast = useCallback(
    (event: RealtimeEventName) => {
      if (
        event === REALTIME_EVENTS.ISSUE_STEP_RECORD_CREATED ||
        event === REALTIME_EVENTS.WORKFLOW_RUN_CREATED ||
        event === REALTIME_EVENTS.WORKFLOW_STEP_STATUS_CHANGED ||
        event === REALTIME_EVENTS.WORKFLOW_STEP_COMPLETED ||
        event === REALTIME_EVENTS.WORKFLOW_STEP_REVERTED ||
        event === REALTIME_EVENTS.WORKFLOW_RECORD_SUBMITTED ||
        event === REALTIME_EVENTS.WORKFLOW_REVIEW_REQUESTED ||
        event === REALTIME_EVENTS.WORKFLOW_REVIEW_APPROVED ||
        event === REALTIME_EVENTS.WORKFLOW_REVIEW_CHANGES_REQUESTED ||
        event === REALTIME_EVENTS.WORKFLOW_HANDOFF_REQUESTED ||
        event === REALTIME_EVENTS.WORKFLOW_HANDOFF_ACCEPTED ||
        event === REALTIME_EVENTS.WORKFLOW_BLOCKED ||
        event === REALTIME_EVENTS.WORKFLOW_UNBLOCKED ||
        event === REALTIME_EVENTS.WORKFLOW_RUN_COMPLETED
      ) {
        void queryClient.invalidateQueries({
          queryKey: ["issue", workspaceId, issueId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["workflow-run", workspaceId, issueId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["issue-step-records", issueId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["issue-activities", issueId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["issues", workspaceId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["project-summary", workspaceId],
        });
      }
    },
    [issueId, queryClient, workspaceId],
  );

  const issueChannel = useRealtimeChannel<IssueRealtimePresence>({
    topic: buildIssueTopic(issueId),
    enabled: enabled && !!issueId && !!workspaceId,
    presenceKey: clientSessionIdRef.current,
    events: ISSUE_REALTIME_EVENTS,
    onBroadcast: handleIssueBroadcast,
  });

  const workflowChannel = useRealtimeChannel<IssueRealtimePresence>({
    topic: buildWorkflowIssueTopic(issueId),
    enabled: enabled && workflow && !!issueId && !!workspaceId,
    presenceKey: clientSessionIdRef.current,
    events: WORKFLOW_REALTIME_EVENTS,
    onBroadcast: handleWorkflowBroadcast,
  });
  const {
    presenceState: issuePresenceState,
    trackPresence: trackIssuePresence,
    untrackPresence: untrackIssuePresence,
  } = issueChannel;
  const {
    presenceState: workflowPresenceState,
    trackPresence: trackWorkflowPresence,
    untrackPresence: untrackWorkflowPresence,
  } = workflowChannel;

  useEffect(() => {
    setIssuePresenceDraft(DEFAULT_ISSUE_PRESENCE_DRAFT);
    setWorkflowPresenceDraft(DEFAULT_WORKFLOW_PRESENCE_DRAFT);
  }, [issueId, workflow]);

  const currentUserPresence = useMemo<IssueRealtimePresence | null>(() => {
    if (!user?.id) {
      return null;
    }

    return {
      clientSessionId: clientSessionIdRef.current,
      userId: user.id,
      name:
        user.user_metadata?.name?.trim() ||
        user.user_metadata?.full_name?.trim() ||
        user.email?.split("@")[0] ||
        "匿名用户",
      avatarUrl: user.user_metadata?.avatar_url || null,
      editingField: issuePresenceDraft.editingField,
      focusingNode: null,
    };
  }, [issuePresenceDraft, user]);

  const currentWorkflowPresence = useMemo<IssueRealtimePresence | null>(() => {
    if (!user?.id) {
      return null;
    }

    return {
      clientSessionId: clientSessionIdRef.current,
      userId: user.id,
      name:
        user.user_metadata?.name?.trim() ||
        user.user_metadata?.full_name?.trim() ||
        user.email?.split("@")[0] ||
        "匿名用户",
      avatarUrl: user.user_metadata?.avatar_url || null,
      editingField: null,
      focusingNode: workflowPresenceDraft.focusingNode,
    };
  }, [user, workflowPresenceDraft]);

  useEffect(() => {
    if (!currentUserPresence?.editingField) {
      void untrackIssuePresence();
      return;
    }

    void trackIssuePresence(currentUserPresence);
  }, [currentUserPresence, trackIssuePresence, untrackIssuePresence]);

  useEffect(() => {
    if (!workflow || !currentWorkflowPresence?.focusingNode) {
      void untrackWorkflowPresence();
      return;
    }

    void trackWorkflowPresence(currentWorkflowPresence);
  }, [
    currentWorkflowPresence,
    trackWorkflowPresence,
    untrackWorkflowPresence,
    workflow,
  ]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        return;
      }

      setIssuePresenceDraft(DEFAULT_ISSUE_PRESENCE_DRAFT);
      setWorkflowPresenceDraft(DEFAULT_WORKFLOW_PRESENCE_DRAFT);
      void untrackIssuePresence();
      void untrackWorkflowPresence();
    };

    const handlePageHide = () => {
      setIssuePresenceDraft(DEFAULT_ISSUE_PRESENCE_DRAFT);
      setWorkflowPresenceDraft(DEFAULT_WORKFLOW_PRESENCE_DRAFT);
      void untrackIssuePresence();
      void untrackWorkflowPresence();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [
    untrackIssuePresence,
    untrackWorkflowPresence,
  ]);

  useEffect(() => {
    return () => {
      void untrackIssuePresence();
      void untrackWorkflowPresence();
    };
  }, [untrackIssuePresence, untrackWorkflowPresence]);

  const otherParticipants = useMemo(
    () =>
      flattenPresenceState(issuePresenceState).filter(
        (participant) =>
          participant.clientSessionId !== clientSessionIdRef.current,
      ),
    [issuePresenceState],
  );

  const editingUsers = useMemo(
    () => otherParticipants.filter((participant) => participant.editingField),
    [otherParticipants],
  );

  const focusedUsers = useMemo(
    () =>
      flattenPresenceState(workflowPresenceState).filter(
        (participant) =>
          participant.clientSessionId !== clientSessionIdRef.current &&
          Boolean(participant.focusingNode),
      ),
    [workflowPresenceState],
  );

  const getEditorsForField = useCallback(
    (field: IssueRealtimeEditingField) =>
      editingUsers.filter((participant) => participant.editingField === field),
    [editingUsers],
  );

  const getFocusedUsersForNode = useCallback(
    (nodeId: string) =>
      focusedUsers.filter((participant) => participant.focusingNode === nodeId),
    [focusedUsers],
  );

  const setEditingField = useCallback(
    (editingField: IssueRealtimeEditingField | null) => {
      setIssuePresenceDraft((current) =>
        current.editingField === editingField
          ? current
          : { ...current, editingField },
      );
    },
    [],
  );

  const setFocusingNode = useCallback((focusingNode: string | null) => {
    setWorkflowPresenceDraft((current) =>
      current.focusingNode === focusingNode
        ? current
        : { ...current, focusingNode },
    );
  }, []);

  return {
    editingUsers,
    focusedUsers,
    getEditorsForField,
    getFocusedUsersForNode,
    setEditingField,
    setFocusingNode,
  };
}
