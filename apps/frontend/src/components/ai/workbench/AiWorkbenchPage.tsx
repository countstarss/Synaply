"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, MessageSquareText, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAiThread } from "@/hooks/useAiThread";
import { useAiThreadStream } from "@/hooks/useAiThreadStream";
import { useIssues } from "@/hooks/useIssueApi";
import { useProjects } from "@/hooks/useProjectApi";
import { useWorkspaceRealtime } from "@/hooks/realtime/useWorkspaceRealtime";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useCachedPageVisibility } from "@/components/cache/CachedPageVisibility";
import { AiWorkbenchChatPanel } from "@/components/ai/workbench/modules/chat/AiWorkbenchChatPanel";
import type { AiSurfaceType } from "@/lib/ai/types";
import { createAiThread, listAiThreads } from "@/lib/fetchers/ai-thread";
import { useAiThreadStore } from "@/stores/ai-thread";
import { IssueStateCategory } from "@/types/prisma";
import AmbientGlow from "@/components/global/AmbientGlow";
import { useRouter } from "@/i18n/navigation";
import {
  buildDraftThreadTitleWithFallback,
  getAiThreadPath,
  getIssueLabel,
  getSelectionFromThread,
} from "@/components/ai/workbench/aiWorkbenchUtils";
import { cn } from "@/lib/utils";

export function AiWorkbenchPage() {
  const tAi = useTranslations("ai");
  const isPageVisible = useCachedPageVisibility();
  const params = useParams<{ threadId?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { currentWorkspace, loading: isWorkspaceLoading } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const activeThreadId =
    typeof params.threadId === "string" ? params.threadId : null;
  const selectedProjectSeed = searchParams.get("projectId") || "";
  const selectedIssueSeed = searchParams.get("issueId") || "";

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [draft, setDraft] = useState("");
  const [pendingViewportAnchorId, setPendingViewportAnchorId] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const { isStreaming, streamingText, error, setError } = useAiThreadStore();

  useWorkspaceRealtime(workspaceId, {
    enabled: isPageVisible,
  });

  const { data: projects = [], isLoading: isProjectsLoading } =
    useProjects(workspaceId, { enabled: isPageVisible });
  const { data: allIssues = [], isLoading: isIssuesLoading } = useIssues(
    workspaceId,
    { limit: 200 },
    { enabled: !!workspaceId && isPageVisible },
  );
  const threadsQuery = useQuery({
    queryKey: ["ai-threads", workspaceId],
    queryFn: async () => {
      if (!session?.access_token || !workspaceId) {
        return [];
      }

      return listAiThreads(workspaceId, session.access_token);
    },
    enabled: isPageVisible && !!session?.access_token && !!workspaceId,
  });

  const localSelectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );
  const issueMap = useMemo(
    () => new Map(allIssues.map((issue) => [issue.id, issue])),
    [allIssues],
  );
  const localCandidateIssues = useMemo(
    () =>
      allIssues
        .filter(
          (issue) =>
            (!selectedProjectId || issue.projectId === selectedProjectId) &&
            issue.state?.category !== IssueStateCategory.DONE &&
            issue.state?.category !== IssueStateCategory.CANCELED,
        )
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
        ),
    [allIssues, selectedProjectId],
  );
  const projectIdSet = useMemo(
    () => new Set(projects.map((project) => project.id)),
    [projects],
  );
  const localCandidateIssueIdSet = useMemo(
    () => new Set(localCandidateIssues.map((issue) => issue.id)),
    [localCandidateIssues],
  );
  const sortedThreads = useMemo(
    () =>
      [...(threadsQuery.data || [])].sort((left, right) => {
        const leftValue = left.lastMessageAt || left.updatedAt || left.createdAt;
        const rightValue =
          right.lastMessageAt || right.updatedAt || right.createdAt;
        return new Date(rightValue).getTime() - new Date(leftValue).getTime();
      }),
    [threadsQuery.data],
  );

  useEffect(() => {
    if (activeThreadId || isProjectsLoading) {
      return;
    }

    const nextProjectId =
      selectedProjectSeed && projectIdSet.has(selectedProjectSeed)
        ? selectedProjectSeed
        : "";

    setSelectedProjectId((previous) =>
      previous === nextProjectId ? previous : nextProjectId,
    );

    if (!nextProjectId) {
      setSelectedIssueId("");
    }
  }, [
    activeThreadId,
    isProjectsLoading,
    projectIdSet,
    selectedProjectSeed,
  ]);

  useEffect(() => {
    if (activeThreadId || isIssuesLoading) {
      return;
    }

    const nextIssueId =
      selectedIssueSeed && localCandidateIssueIdSet.has(selectedIssueSeed)
        ? selectedIssueSeed
        : "";

    setSelectedIssueId((previous) =>
      previous === nextIssueId ? previous : nextIssueId,
    );
  }, [
    activeThreadId,
    isIssuesLoading,
    localCandidateIssueIdSet,
    selectedIssueSeed,
  ]);

  const localSelectedIssue =
    localCandidateIssues.find((issue) => issue.id === selectedIssueId) ||
    issueMap.get(selectedIssueId);
  const originSurfaceType: AiSurfaceType = localSelectedIssue
    ? "ISSUE"
    : localSelectedProject
      ? "PROJECT"
      : "WORKSPACE";
  const originSurfaceId =
    localSelectedIssue?.id || localSelectedProject?.id || workspaceId;
  const originTitle =
    localSelectedIssue?.title ||
    localSelectedProject?.name ||
    (currentWorkspace
      ? tAi("workbench.page.defaultOriginTitle", {
          name: currentWorkspace.name,
        })
      : tAi("workbench.page.defaultOriginTitle", {
          name: tAi("workbench.page.fallbackWorkspace"),
        }));

  const {
    thread,
    threadId,
    messages,
    isLoading,
  } = useAiThread({
    workspaceId,
    originSurfaceType,
    originSurfaceId,
    originTitle,
    enabled: isPageVisible && !!workspaceId && !!originSurfaceId,
    autoCreate: false,
    threadIdOverride: activeThreadId,
  });
  const { sendMessage } = useAiThreadStream({
    workspaceId,
    threadId,
  });

  const resolvedThread =
    thread || sortedThreads.find((item) => item.id === activeThreadId) || null;
  const threadSelection =
    activeThreadId && resolvedThread
      ? getSelectionFromThread(resolvedThread, issueMap)
      : null;
  const displayProjectId = threadSelection?.projectId ?? selectedProjectId;
  const displayIssueId = threadSelection?.issueId ?? selectedIssueId;
  const displaySelectedProject = projects.find(
    (project) => project.id === displayProjectId,
  );
  const displayCandidateIssues = useMemo(
    () =>
      allIssues
        .filter(
          (issue) =>
            (!displayProjectId || issue.projectId === displayProjectId) &&
            issue.state?.category !== IssueStateCategory.DONE &&
            issue.state?.category !== IssueStateCategory.CANCELED,
        )
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
        ),
    [allIssues, displayProjectId],
  );
  const displaySelectedIssue =
    displayCandidateIssues.find((issue) => issue.id === displayIssueId) ||
    issueMap.get(displayIssueId);

  const currentContextBadges = [
    {
      key: "workspace",
      label: currentWorkspace?.name || tAi("workbench.page.fallbackWorkspace"),
      tone: "workspace",
    },
    displaySelectedProject
      ? {
          key: "project",
          label: displaySelectedProject.name,
          tone: "project",
        }
      : null,
    displaySelectedIssue
      ? {
          key: "issue",
          label: getIssueLabel(displaySelectedIssue),
          tone: "issue",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    tone: "workspace" | "project" | "issue";
  }>;
  const hasConversation = messages.length > 0 || isStreaming;

  const handleSend = async () => {
    const trimmedText = draft.trim();

    if (!trimmedText) {
      return;
    }

    await sendDraftText(trimmedText);
    setDraft("");
  };

  const sendDraftText = async (text: string) => {
    const trimmedText = text.trim();

    if (
      !trimmedText ||
      !workspaceId ||
      !originSurfaceId ||
      isSubmittingRef.current
    ) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      let targetThreadId = activeThreadId;

      if (!targetThreadId) {
        if (!session?.access_token) {
          throw new Error(tAi("workbench.page.unauthorized"));
        }

        const createdThread = await createAiThread(workspaceId, session.access_token, {
          title: buildDraftThreadTitleWithFallback(
            trimmedText,
            tAi("shared.newConversation"),
          ),
          originSurfaceType,
          originSurfaceId,
        });

        targetThreadId = createdThread.id;

        await queryClient.invalidateQueries({
          queryKey: ["ai-threads", workspaceId],
        });
      }

      await sendMessage(trimmedText, targetThreadId, {
        onLocalMessage: (messageId) => {
          setPendingViewportAnchorId(messageId);
        },
      });

      if (activeThreadId !== targetThreadId) {
        router.push(getAiThreadPath(targetThreadId));
      }

      await queryClient.invalidateQueries({
        queryKey: ["ai-threads", workspaceId],
      });
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : tAi("workbench.page.sendFailed"),
      );
    } finally {
      setPendingViewportAnchorId(null);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isWorkspaceLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-app-text-secondary">
        {tAi("workbench.page.loading")}
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-app-text-secondary">
        {tAi("workbench.page.emptyWorkspace")}
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-app-bg text-app-text-primary">
      <AmbientGlow className="opacity-0 dark:opacity-100" />

      <div className="relative z-10 flex h-full min-h-0">
        <main className={cn("min-w-0 flex-1 overflow-hidden", "rounded-lg border border-black/[0.06] bg-white/84 shadow-[0_24px_72px_-56px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.03] backdrop-blur-md dark:border-white/8 dark:bg-[rgba(18,18,20,0.4)] dark:ring-white/[0.04] dark:shadow-[0_24px_72px_-56px_rgba(0,0,0,0.4)]")}>
          <div className="flex h-full min-h-0 flex-col">
            {hasConversation ? (
              <header className="border-b border-black/[0.06] px-5 py-5 dark:border-white/8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-950 dark:text-white">
                      {resolvedThread?.title || originTitle}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentContextBadges.map((item) => (
                      <span
                        key={item.key}
                        className="inline-flex max-w-full items-center gap-2 rounded-full border border-black/[0.06] bg-black/[0.03] px-3 py-1 text-xs text-slate-600 dark:border-white/8 dark:bg-white/[0.04] dark:text-white/62"
                      >
                        {item.tone === "project" ? (
                          <FolderOpen className="size-3.5" />
                        ) : item.tone === "issue" ? (
                          <MessageSquareText className="size-3.5" />
                        ) : (
                          <Sparkles className="size-3.5" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </header>
            ) : null}

            <div className="min-h-0 flex-1">
              <AiWorkbenchChatPanel
                messages={messages}
                draft={draft}
                onDraftChange={setDraft}
                onQuickReply={sendDraftText}
                onSend={handleSend}
                isLoading={isLoading && messages.length === 0}
                isStreaming={isStreaming}
                streamingText={streamingText}
                pendingViewportAnchorId={pendingViewportAnchorId}
                disabled={
                  isSubmitting ||
                  !workspaceId ||
                  !originSurfaceId
                }
                isSubmitting={isSubmitting}
                error={error}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
