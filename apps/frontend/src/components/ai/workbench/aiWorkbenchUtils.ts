"use client";

import type { AiThreadRecord } from "@/lib/ai/types";
import type { Issue } from "@/lib/fetchers/issue";

export function getIssueLabel(issue: Issue) {
  return issue.key ? `${issue.key} · ${issue.title}` : issue.title;
}

export function buildDraftThreadTitle(text: string, maxLength = 80) {
  return buildDraftThreadTitleWithFallback(text, "New conversation", maxLength);
}

export function buildDraftThreadTitleWithFallback(
  text: string,
  fallbackTitle: string,
  maxLength = 80,
) {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return fallbackTitle;
  }

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return normalizedText.slice(0, maxLength).trimEnd();
}

export function getAiThreadPath(threadId: string) {
  return `/intelligence/${encodeURIComponent(threadId)}`;
}

export function getAiComposePath(
  projectId?: string | null,
  issueId?: string | null,
) {
  const searchParams = new URLSearchParams();

  if (projectId) {
    searchParams.set("projectId", projectId);
  }

  if (issueId) {
    searchParams.set("issueId", issueId);
  }

  const query = searchParams.toString();

  return query ? `/intelligence?${query}` : "/intelligence";
}

export function getAiThreadDisplayTitle(title?: string | null) {
  return getAiThreadDisplayTitleWithLabels(
    title,
    "Intelligence conversation",
    "AI collaboration thread",
    "Intelligence",
  );
}

export function getAiThreadDisplayTitleWithLabels(
  title: string | null | undefined,
  fallbackTitle: string,
  legacyTitle: string,
  surfaceLabel = "Intelligence",
) {
  const normalizedTitle = title?.trim();

  if (!normalizedTitle) {
    return fallbackTitle;
  }

  const normalizedSurfaceTitle = normalizedTitle.replace(
    / · AI(?: 助手| assistant)$/iu,
    ` · ${surfaceLabel}`,
  );

  if (normalizedSurfaceTitle === legacyTitle) {
    return fallbackTitle;
  }

  return normalizedSurfaceTitle;
}

export function getSelectionFromThread(
  thread: AiThreadRecord,
  issueMap: Map<string, Issue>,
) {
  if (thread.originSurfaceType === "ISSUE" && thread.originSurfaceId) {
    const issue = issueMap.get(thread.originSurfaceId);

    return {
      projectId: issue?.projectId || "",
      issueId: thread.originSurfaceId,
    };
  }

  if (thread.originSurfaceType === "PROJECT" && thread.originSurfaceId) {
    return {
      projectId: thread.originSurfaceId,
      issueId: "",
    };
  }

  return {
    projectId: "",
    issueId: "",
  };
}
