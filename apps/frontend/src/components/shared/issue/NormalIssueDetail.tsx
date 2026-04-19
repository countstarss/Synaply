"use client";

import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  RiArrowLeftLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
  RiFileTextLine,
  RiLinkM,
  RiSaveLine,
  RiSparklingLine,
  RiTimeLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { AiThreadShell } from "@/components/ai/thread/AiThreadShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { IssueDescriptionTemplateAction } from "@/components/shared/issue/IssueDescriptionTemplateAction";
import { IssueDocKindPanel } from "@/components/shared/issue/IssueDocKindPanel";
import { useAuth } from "@/context/AuthContext";
import { useIssue, useUpdateIssue } from "@/hooks/useIssueApi";
import { useIssueStates } from "@/hooks/useIssueStates";
import { useProjects } from "@/hooks/useProjectApi";
import { useDocsTree } from "@/hooks/useDocApi";
import { useIssueRealtime } from "@/hooks/realtime/useIssueRealtime";
import { useTeamMemberByUserId, useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import DiscussionTab from "@/components/issue/tabs/DiscussionTab";
import { Issue, IssueAssigneeMember } from "@/lib/fetchers/issue";
import type { TeamMember } from "@/lib/fetchers/team";
import type { DocRecord } from "@/lib/fetchers/doc";
import { cn } from "@/lib/utils";
import {
  IssuePriority,
  IssueStateCategory,
  VisibilityType,
} from "@/types/prisma";

interface NormalIssueDetailProps {
  issueId: string;
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedIssue: Issue) => void;
  displayMode?: "dialog" | "page";
}

interface MemberOption {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

const EMPTY_PRIORITY_VALUE = "__empty_priority__";
const EMPTY_STATE_VALUE = "__empty_state__";
const EMPTY_PROJECT_VALUE = "__empty_project__";
const EMPTY_ASSIGNEE_VALUE = "__empty_assignee__";

const DOC_REFERENCE_PATTERN =
  /\[(?:\u6587\u6863|Doc):([^\]]+)\]\(synaply-doc:\/\/([^)]+)\)/g;

function getPriorityOptions(tIssues: ReturnType<typeof useTranslations>) {
  return [
    {
      value: IssuePriority.LOW,
      label: tIssues("priority.low"),
      color: "bg-gray-100 text-gray-700",
    },
    {
      value: IssuePriority.NORMAL,
      label: tIssues("priority.normal"),
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      value: IssuePriority.HIGH,
      label: tIssues("priority.high"),
      color: "bg-orange-100 text-orange-700",
    },
    {
      value: IssuePriority.URGENT,
      label: tIssues("priority.urgent"),
      color: "bg-red-100 text-red-700",
    },
  ] as const;
}

function getVisibilityOptions(tIssues: ReturnType<typeof useTranslations>) {
  return [
    {
      value: VisibilityType.PRIVATE,
      label: tIssues("visibility.private"),
    },
    {
      value: VisibilityType.TEAM_READONLY,
      label: tIssues("visibility.teamReadonly"),
    },
    {
      value: VisibilityType.TEAM_EDITABLE,
      label: tIssues("visibility.teamEditable"),
    },
    {
      value: VisibilityType.PUBLIC,
      label: tIssues("visibility.public"),
    },
  ] as const;
}

function getTeamMemberName(
  member: TeamMember,
  tIssues: ReturnType<typeof useTranslations>,
) {
  return (
    member.user.name?.trim() ||
    member.user.email?.split("@")[0] ||
    tIssues("normalDetail.memberFallback", { id: member.id.slice(0, 6) })
  );
}

function getIssueMemberName(
  member: IssueAssigneeMember | null | undefined,
  tIssues: ReturnType<typeof useTranslations>,
) {
  return (
    member?.user?.name?.trim() ||
    member?.user?.email?.split("@")[0] ||
    tIssues("normalDetail.memberFallback", {
      id: member?.id?.slice(0, 6) || tIssues("normalDetail.user.unknown"),
    })
  );
}

function formatDate(
  dateString: string | null | undefined,
  locale: string,
  tIssues: ReturnType<typeof useTranslations>,
) {
  if (!dateString) {
    return tIssues("normalDetail.meta.notSet");
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function formatDateOnly(
  dateString: string | null | undefined,
  locale: string,
  tIssues: ReturnType<typeof useTranslations>,
) {
  if (!dateString) {
    return tIssues("normalDetail.meta.notSet");
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(dateString));
}

async function copyTextToClipboard(
  text: string,
  successMessage: string,
  fallbackErrorMessage: string,
) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : fallbackErrorMessage,
    );
  }
}

function toUtcMidnightIso(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();
}

function getPriorityOption(
  priority: IssuePriority | null | undefined,
  options: ReturnType<typeof getPriorityOptions>,
) {
  return options.find((option) => option.value === priority) || null;
}

function getVisibilityLabel(
  visibility: VisibilityType | null | undefined,
  options: ReturnType<typeof getVisibilityOptions>,
  tIssues: ReturnType<typeof useTranslations>,
) {
  return (
    options.find((option) => option.value === visibility)?.label ||
    tIssues("normalDetail.meta.notSet")
  );
}

function extractBlockNoteText(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(extractBlockNoteText).filter(Boolean).join(" ");
  }

  if (typeof value === "object") {
    const record = value as {
      text?: unknown;
      content?: unknown;
      children?: unknown;
    };

    return [
      extractBlockNoteText(record.text),
      extractBlockNoteText(record.content),
      extractBlockNoteText(record.children),
    ]
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function getDocPreviewContent(
  doc: DocRecord | null | undefined,
  tIssues: ReturnType<typeof useTranslations>,
) {
  if (!doc?.content) {
    return tIssues("normalDetail.docReference.previewEmpty");
  }

  try {
    const parsed = JSON.parse(doc.content) as unknown;
    const text = extractBlockNoteText(parsed).replace(/\s+/g, " ").trim();

    return text || tIssues("normalDetail.docReference.previewEmpty");
  } catch {
    return doc.content;
  }
}

function renderInlineMarkdown(
  text: string,
  docsById: Map<string, DocRecord>,
  onOpenDoc: (doc: DocRecord) => void,
  keyPrefix: string,
  tIssues: ReturnType<typeof useTranslations>,
) {
  const nodes: React.ReactNode[] = [];
  const matcher = DOC_REFERENCE_PATTERN;
  let lastIndex = 0;

  for (const match of text.matchAll(matcher)) {
    const [raw, title, docId] = match;
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    const doc = docsById.get(docId);
    nodes.push(
      <button
        key={`${keyPrefix}-${docId}-${index}`}
        type="button"
        disabled={!doc}
        onClick={() => doc && onOpenDoc(doc)}
        className="inline-flex items-center gap-1 rounded-md border border-app-border bg-app-content-bg px-2 py-0.5 text-xs font-medium text-sky-700 transition hover:bg-app-button-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RiFileTextLine className="h-3 w-3" />
        {title || doc?.title || tIssues("normalDetail.docReference.defaultTitle")}
      </button>,
    );

    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
}

function MarkdownDescriptionPreview({
  content,
  docsById,
  onOpenDoc,
  tIssues,
}: {
  content?: string | null;
  docsById: Map<string, DocRecord>;
  onOpenDoc: (doc: DocRecord) => void;
  tIssues: ReturnType<typeof useTranslations>;
}) {
  if (!content?.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-app-border px-4 py-8 text-center text-sm text-app-text-muted">
        {tIssues("normalDetail.description.empty")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm leading-6 text-app-text-secondary">
      {content.split("\n").map((line, index) => {
        const trimmed = line.trim();
        const inline = renderInlineMarkdown(
          trimmed,
          docsById,
          onOpenDoc,
          `line-${index}`,
          tIssues,
        );

        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={index}
              className="text-base font-semibold text-app-text-primary"
            >
              {renderInlineMarkdown(
                trimmed.slice(4),
                docsById,
                onOpenDoc,
                `heading-${index}`,
                tIssues,
              )}
            </h4>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h3
              key={index}
              className="text-lg font-semibold text-app-text-primary"
            >
              {renderInlineMarkdown(
                trimmed.slice(3),
                docsById,
                onOpenDoc,
                `heading-${index}`,
                tIssues,
              )}
            </h3>
          );
        }

        if (trimmed.startsWith("# ")) {
          return (
            <h2
              key={index}
              className="text-xl font-semibold text-app-text-primary"
            >
              {renderInlineMarkdown(
                trimmed.slice(2),
                docsById,
                onOpenDoc,
                `heading-${index}`,
                tIssues,
              )}
            </h2>
          );
        }

        if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ")) {
          return (
            <div key={index} className="flex items-start gap-2">
              <span className="mt-1.5 h-3 w-3 rounded border border-app-border" />
              <span>
                {renderInlineMarkdown(
                  trimmed.slice(6),
                  docsById,
                  onOpenDoc,
                  `todo-${index}`,
                  tIssues,
                )}
              </span>
            </div>
          );
        }

        if (trimmed.startsWith("- ")) {
          return (
            <div key={index} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-app-text-muted" />
              <span>
                {renderInlineMarkdown(
                  trimmed.slice(2),
                  docsById,
                  onOpenDoc,
                  `list-${index}`,
                  tIssues,
                )}
              </span>
            </div>
          );
        }

        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={index}
              className="border-l-2 border-app-border pl-3 text-app-text-muted"
            >
              {renderInlineMarkdown(
                trimmed.slice(2),
                docsById,
                onOpenDoc,
                `quote-${index}`,
                tIssues,
              )}
            </blockquote>
          );
        }

        return <p key={index}>{inline}</p>;
      })}
    </div>
  );
}

// Keep the overall layout and visual hierarchy intact while translating content.
export default function NormalIssueDetail({
  issueId,
  workspaceId,
  isOpen,
  onClose,
  onUpdate,
}: NormalIssueDetailProps) {
  const tIssues = useTranslations("issues");
  const locale = useLocale();
  const { user } = useAuth();
  const { data: issue, isLoading: isLoadingIssue } = useIssue(
    workspaceId,
    issueId,
    {
      enabled: isOpen,
    },
  );
  const { currentWorkspace } = useWorkspace();
  const workspaceType = currentWorkspace?.type || "PERSONAL";
  const teamId = currentWorkspace?.teamId;
  const priorityOptions = React.useMemo(
    () => getPriorityOptions(tIssues),
    [tIssues],
  );
  const visibilityOptions = React.useMemo(
    () => getVisibilityOptions(tIssues),
    [tIssues],
  );
  const currentUserName =
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0] ||
    tIssues("normalDetail.user.anonymous");
  const { getEditorsForField, setEditingField: setRealtimeEditingField } =
    useIssueRealtime(issueId, workspaceId, {
      enabled: isOpen,
    });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [committedIssue, setCommittedIssue] = useState<Issue | null>(
    issue ?? null,
  );
  const [localIssue, setLocalIssue] = useState<Issue | null>(issue ?? null);
  const [isDocPickerOpen, setIsDocPickerOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocRecord | null>(null);
  const [isAiThreadOpen, setIsAiThreadOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"discussion" | "docs">(
    "discussion",
  );

  const { data: projects = [] } = useProjects(workspaceId);
  const { data: issueStates = [] } = useIssueStates(workspaceId, {
    enabled: isOpen,
  });
  const { data: teamMembers = [] } = useTeamMembers(teamId);
  const { data: currentUserTeamMember } = useTeamMemberByUserId(user?.id);
  const docsContext = workspaceType === "TEAM" ? "team" : "personal";
  const { data: workspaceDocs = [], isLoading: isLoadingDocs } = useDocsTree(
    workspaceId,
    {
      context: docsContext,
      workspaceType: workspaceType === "TEAM" ? "TEAM" : "PERSONAL",
      includeArchived: false,
    },
    { enabled: isOpen && !!workspaceId },
  );
  const { data: issueDocs = [] } = useDocsTree(
    workspaceId,
    {
      context: docsContext,
      workspaceType: workspaceType === "TEAM" ? "TEAM" : "PERSONAL",
      issueId,
      includeArchived: false,
    },
    { enabled: isOpen && !!workspaceId && !!issueId },
  );
  const updateIssueMutation = useUpdateIssue();

  const memberMap = new Map<string, MemberOption>();

  for (const member of teamMembers) {
    memberMap.set(member.id, {
      id: member.id,
      name: getTeamMemberName(member, tIssues),
      email: member.user.email,
      avatarUrl: member.user.avatar_url,
    });
  }

  for (const assignee of localIssue?.assignees || []) {
    if (!memberMap.has(assignee.memberId)) {
      memberMap.set(assignee.memberId, {
        id: assignee.memberId,
        name: getIssueMemberName(assignee.member, tIssues),
        email: assignee.member?.user?.email || "",
        avatarUrl:
          assignee.member?.user?.avatar_url ||
          assignee.member?.user?.avatarUrl ||
          undefined,
      });
    }
  }

  const memberOptions = Array.from(memberMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name, locale),
  );
  const currentWorkspaceMember = teamMembers.find(
    (member) => member.user.id === user?.id,
  );
  const currentMemberId =
    currentWorkspaceMember?.id || currentUserTeamMember?.id;
  const canEditIssue = Boolean(
    localIssue &&
      user?.id &&
      (workspaceType === "PERSONAL" ||
        currentWorkspaceMember?.role === "OWNER" ||
        currentWorkspaceMember?.role === "ADMIN" ||
        localIssue.creatorId === user.id ||
        localIssue.creatorMemberId === currentMemberId ||
        localIssue.directAssigneeId === currentMemberId ||
        localIssue.assignees?.some(
          (assignee) =>
            assignee.memberId === currentMemberId ||
            assignee.member?.user?.id === user.id,
        )),
  );
  const discussionMembers = React.useMemo(() => {
    const members = new Map(memberOptions.map((member) => [member.id, member]));

    if (currentUserTeamMember?.id) {
      members.set(currentUserTeamMember.id, {
        id: currentUserTeamMember.id,
        name: currentUserName,
        email: user?.email || "",
        avatarUrl: user?.user_metadata?.avatar_url,
      });
    }

    return Array.from(members.values());
  }, [
    currentUserName,
    currentUserTeamMember?.id,
    memberOptions,
    user?.email,
    user?.user_metadata?.avatar_url,
  ]);
  const personalDirectAssignee =
    workspaceType === "PERSONAL" &&
    localIssue?.directAssigneeId &&
    currentUserTeamMember?.id === localIssue?.directAssigneeId
      ? {
          id: currentUserTeamMember.id,
          name: currentUserName,
          email: user?.email || "",
        }
      : null;
  const directAssignee =
    memberOptions.find(
      (member) => member.id === localIssue?.directAssigneeId,
    ) || personalDirectAssignee;
  const selectedProject = projects.find(
    (project) => project.id === localIssue?.projectId,
  );
  const selectedProjectName =
    selectedProject?.name ?? localIssue?.project?.name ?? null;
  const selectedState = issueStates.find(
    (state) => state.id === localIssue?.stateId,
  );
  const currentPriority = getPriorityOption(localIssue?.priority, priorityOptions);
  const doneState =
    issueStates.find(
      (state) => state.category === IssueStateCategory.DONE && state.isDefault,
    ) ||
    issueStates.find((state) => state.category === IssueStateCategory.DONE) ||
    null;
  const isIssueDone = selectedState?.category === IssueStateCategory.DONE;
  const canQuickComplete = Boolean(
    canEditIssue &&
      doneState &&
      !isIssueDone &&
      (workspaceType === "PERSONAL" ||
        currentWorkspaceMember?.role === "OWNER" ||
        currentWorkspaceMember?.role === "ADMIN" ||
        localIssue?.directAssigneeId === currentMemberId),
  );
  const dueDateValue = localIssue?.dueDate
    ? new Date(localIssue.dueDate ?? "")
    : undefined;
  const documentOptions = React.useMemo(
    () => workspaceDocs.filter((doc) => doc.type === "document"),
    [workspaceDocs],
  );
  const docsById = React.useMemo(
    () => new Map(documentOptions.map((doc) => [doc._id, doc])),
    [documentOptions],
  );
  const referencedDocCount = React.useMemo(
    () =>
      Array.from(
        (localIssue?.description || "").matchAll(DOC_REFERENCE_PATTERN),
      ).length,
    [localIssue?.description],
  );
  const aiHandoffPrompt = localIssue?.aiHandoffPrompt?.trim() || "";

  useEffect(() => {
    if (issue) {
      setCommittedIssue(issue);
      setLocalIssue((current) => (editingField ? (current ?? issue) : issue));
      return;
    }

    if (!isLoadingIssue) {
      setCommittedIssue(null);
      setLocalIssue(null);
      setEditingField(null);
    }
  }, [editingField, isLoadingIssue, issue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setRightPanelTab("discussion");
  }, [isOpen, issueId]);

  useEffect(() => {
    const realtimeField =
      editingField === "stateId"
        ? "state"
        : editingField === "directAssigneeId"
          ? "assignee"
          : editingField === "title" ||
              editingField === "description" ||
              editingField === "priority" ||
              editingField === "dueDate"
            ? editingField
            : null;

    setRealtimeEditingField(realtimeField);

    return () => {
      setRealtimeEditingField(null);
    };
  }, [editingField, setRealtimeEditingField]);

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleCancelEdit = () => {
    if (committedIssue) {
      setLocalIssue(committedIssue);
    }
    setEditingField(null);
  };

  const persistIssuePatch = async (
    patch: Partial<Issue>,
    relationOverrides: Partial<Issue> = {},
  ) => {
    if (!workspaceId || !committedIssue) {
      toast.error(tIssues("normalDetail.toasts.invalidWorkspace"));
      return;
    }

    const sanitizedPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as Partial<Issue>;

    if (Object.keys(sanitizedPatch).length === 0) {
      handleCancelEdit();
      return;
    }

    try {
      const updatedIssue = await updateIssueMutation.mutateAsync({
        workspaceId,
        issueId: committedIssue.id,
        data: sanitizedPatch,
      });

      const mergedIssue: Issue = {
        ...committedIssue,
        ...sanitizedPatch,
        ...updatedIssue,
        ...relationOverrides,
      };

      setCommittedIssue(mergedIssue);
      setLocalIssue(mergedIssue);
      setEditingField(null);
      onUpdate(mergedIssue);
      toast.success(tIssues("normalDetail.toasts.saved"));
    } catch (error) {
      console.error("Failed to update issue:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : tIssues("normalDetail.toasts.updateFailed"),
      );
    }
  };

  const renderEditingHint = (
    field:
      | "title"
      | "state"
      | "priority"
      | "assignee"
      | "dueDate"
      | "description",
  ) => {
    const editors = getEditorsForField(field);

    if (editors.length === 0) {
      return null;
    }

    return (
      <div className="text-xs text-amber-600">
        {tIssues("normalDetail.editingHint", {
          names: editors.map((participant) => participant.name).join(", "),
        })}
      </div>
    );
  };

  const handleInsertDocReference = (doc: DocRecord) => {
    if (!localIssue) {
      return;
    }

    const safeTitle = doc.title.replace(/[\[\]]/g, "");
    const reference = `[${tIssues("normalDetail.docReference.label")}:${safeTitle}](synaply-doc://${doc._id})`;
    const currentDescription = localIssue.description?.trimEnd() || "";
    const nextDescription = currentDescription
      ? `${currentDescription}\n\n${reference}`
      : reference;

    setLocalIssue({
      ...localIssue,
      description: nextDescription,
    });
    setEditingField("description");
    setIsDocPickerOpen(false);
  };

  const handleQuickComplete = () => {
    if (!doneState) {
      toast.error(tIssues("normalDetail.toasts.missingDoneState"));
      return;
    }

    void persistIssuePatch({ stateId: doneState.id }, { state: doneState });
  };

  if (!isOpen) {
    return null;
  }

  if (isLoadingIssue || !localIssue || !committedIssue) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg border border-app-border bg-app-content-bg text-app-text-muted">
        <div>
          {isLoadingIssue
            ? tIssues("normalDetail.states.loading")
            : tIssues("normalDetail.states.notFound")}
        </div>
        {!isLoadingIssue && (
          <Button
            type="button"
            variant="outline"
            className="border-app-border bg-transparent text-app-text-primary"
            onClick={onClose}
          >
            <RiArrowLeftLine className="h-4 w-4" />
            {tIssues("normalDetail.states.back")}
          </Button>
        )}
      </div>
    );
  }

  const content = (
    <div className="flex h-full flex-col gap-2">
      <Card className="flex-shrink-0 border-app-border bg-app-content-bg shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
          <div className="min-w-0 flex-1 space-y-3">
            {editingField === "title" ? (
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={localIssue.title}
                  onChange={(event) =>
                    setLocalIssue({ ...localIssue, title: event.target.value })
                  }
                  className="flex-1 border-app-border bg-app-bg text-app-text-primary"
                  autoFocus
                />
                <Button
                  type="button"
                  className="bg-sky-600 text-white hover:bg-sky-500"
                  onClick={() => persistIssuePatch({ title: localIssue.title })}
                >
                  <RiSaveLine className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-app-border bg-transparent text-app-text-primary"
                  onClick={handleCancelEdit}
                >
                  <RiCloseLine className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <CardTitle className="min-w-0 truncate text-xl text-app-text-primary">
                  {localIssue.title}
                </CardTitle>
                {canEditIssue && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-md text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
                    onClick={() => handleFieldEdit("title")}
                  >
                    <RiEditLine className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            {renderEditingHint("title")}

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-app-border text-app-text-primary"
              >
                {localIssue.key || `#${localIssue.id}`}
              </Badge>

              {canEditIssue ? (
                <Select
                  value={localIssue.stateId ?? EMPTY_STATE_VALUE}
                  onValueChange={(value) => {
                    const nextState =
                      value === EMPTY_STATE_VALUE
                        ? null
                        : issueStates.find((state) => state.id === value) ||
                          null;
                    void persistIssuePatch(
                      { stateId: nextState?.id ?? null },
                      { state: nextState },
                    );
                  }}
                >
                  <SelectTrigger className="h-8 w-auto min-w-[108px] rounded-md border-app-border bg-app-content-bg text-app-text-primary">
                    {selectedState ? (
                      <span data-slot="select-value">
                        {tIssues("normalDetail.badges.state", {
                          value: selectedState.name,
                        })}
                      </span>
                    ) : (
                      <SelectValue
                        placeholder={tIssues(
                          "normalDetail.select.statePlaceholder",
                        )}
                      />
                    )}
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    <SelectGroup>
                      <SelectItem value={EMPTY_STATE_VALUE}>
                        {tIssues("normalDetail.select.statePlaceholder")}
                      </SelectItem>
                      {issueStates.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-app-button-hover text-app-text-primary"
                >
                  {tIssues("normalDetail.badges.state", {
                    value:
                      selectedState?.name || tIssues("normalDetail.meta.notSet"),
                  })}
                </Badge>
              )}

              {canEditIssue ? (
                <Select
                  value={localIssue.priority ?? EMPTY_PRIORITY_VALUE}
                  onValueChange={(value) =>
                    void persistIssuePatch({
                      priority:
                        value === EMPTY_PRIORITY_VALUE
                          ? null
                          : (value as IssuePriority),
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-auto min-w-[100px] rounded-md border-app-border bg-app-content-bg text-app-text-primary">
                    {currentPriority ? (
                      <span data-slot="select-value">
                        {tIssues("normalDetail.badges.priority", {
                          value: currentPriority.label,
                        })}
                      </span>
                    ) : (
                      <SelectValue
                        placeholder={tIssues(
                          "normalDetail.select.priorityPlaceholder",
                        )}
                      />
                    )}
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    <SelectGroup>
                      <SelectItem value={EMPTY_PRIORITY_VALUE}>
                        {tIssues("normalDetail.select.priorityPlaceholder")}
                      </SelectItem>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className={cn("border-transparent", currentPriority?.color)}
                >
                  {tIssues("normalDetail.badges.priority", {
                    value:
                      currentPriority?.label ||
                      tIssues("normalDetail.meta.notSet"),
                  })}
                </Badge>
              )}

              {canEditIssue ? (
                <Select
                  value={localIssue.projectId ?? EMPTY_PROJECT_VALUE}
                  onValueChange={(value) => {
                    const nextProjectId =
                      value === EMPTY_PROJECT_VALUE ? null : value;
                    const nextProject =
                      projects.find(
                        (project) => project.id === nextProjectId,
                      ) || null;
                    void persistIssuePatch(
                      { projectId: nextProjectId },
                      { project: nextProject },
                    );
                  }}
                >
                  <SelectTrigger className="h-8 w-auto min-w-[120px] rounded-md border-app-border bg-app-content-bg text-app-text-primary">
                    {selectedProjectName ? (
                      <span data-slot="select-value">
                        {tIssues("normalDetail.badges.project", {
                          value: selectedProjectName,
                        })}
                      </span>
                    ) : (
                      <SelectValue
                        placeholder={tIssues(
                          "normalDetail.select.projectPlaceholder",
                        )}
                      />
                    )}
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    <SelectGroup>
                      <SelectItem value={EMPTY_PROJECT_VALUE}>
                        {tIssues("normalDetail.select.projectPlaceholder")}
                      </SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className="border-app-border text-app-text-primary"
                >
                  {tIssues("normalDetail.badges.project", {
                    value:
                      selectedProject?.name ||
                      localIssue.project?.name ||
                      tIssues("normalDetail.meta.notSet"),
                  })}
                </Badge>
              )}

              {canEditIssue && workspaceType !== "PERSONAL" ? (
                <Select
                  value={localIssue.directAssigneeId ?? EMPTY_ASSIGNEE_VALUE}
                  onValueChange={(value) =>
                    void persistIssuePatch({
                      directAssigneeId:
                        value === EMPTY_ASSIGNEE_VALUE ? null : value,
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-auto min-w-[130px] rounded-md border-app-border bg-app-content-bg text-app-text-primary">
                    {directAssignee ? (
                      <span data-slot="select-value">
                        {tIssues("normalDetail.badges.assignee", {
                          value: directAssignee.name,
                        })}
                      </span>
                    ) : (
                      <SelectValue
                        placeholder={tIssues(
                          "normalDetail.select.assigneePlaceholder",
                        )}
                      />
                    )}
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    <SelectGroup>
                      <SelectItem value={EMPTY_ASSIGNEE_VALUE}>
                        {tIssues("normalDetail.select.assigneePlaceholder")}
                      </SelectItem>
                      {memberOptions.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className="border-app-border text-app-text-primary"
                >
                  {tIssues("normalDetail.badges.assignee", {
                    value:
                      directAssignee?.name ||
                      currentUserName ||
                      tIssues("normalDetail.meta.unassigned"),
                  })}
                </Badge>
              )}

              {canEditIssue ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-app-border bg-app-content-bg text-app-text-primary"
                    >
                      <RiCalendarLine className="h-3 w-3" />
                      {tIssues("normalDetail.badges.dueDate", {
                        value: formatDateOnly(localIssue.dueDate, locale, tIssues),
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-auto border-app-border bg-app-content-bg p-0"
                  >
                    <Calendar
                      mode="single"
                      selected={dueDateValue}
                      onSelect={(date) =>
                        void persistIssuePatch({
                          dueDate: date ? toUtcMidnightIso(date) : null,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <Badge
                  variant="outline"
                  className="border-app-border text-app-text-primary"
                >
                  {tIssues("normalDetail.badges.dueDate", {
                    value: formatDateOnly(localIssue.dueDate, locale, tIssues),
                  })}
                </Badge>
              )}

              {canEditIssue ? (
                <Select
                  value={localIssue.visibility ?? VisibilityType.PRIVATE}
                  onValueChange={(value) =>
                    void persistIssuePatch({
                      visibility: value as VisibilityType,
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-auto min-w-[130px] rounded-md border-app-border bg-app-content-bg text-app-text-primary">
                    <span data-slot="select-value">
                      {tIssues("normalDetail.badges.visibility", {
                        value: getVisibilityLabel(
                          localIssue.visibility,
                          visibilityOptions,
                          tIssues,
                        ),
                      })}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    <SelectGroup>
                      {visibilityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className="border-app-border text-app-text-primary"
                >
                  {tIssues("normalDetail.badges.visibility", {
                    value: getVisibilityLabel(
                      localIssue.visibility,
                      visibilityOptions,
                      tIssues,
                    ),
                  })}
                </Badge>
              )}

              {localIssue.assignees?.map((assignee) => (
                <Badge
                  key={assignee.id}
                  variant="secondary"
                  className="bg-app-button-hover text-app-text-primary"
                >
                  {tIssues("normalDetail.badges.collaborator", {
                    value:
                      memberOptions.find(
                        (member) => member.id === assignee.memberId,
                      )?.name || getIssueMemberName(assignee.member, tIssues),
                  })}
                </Badge>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-app-border bg-transparent text-app-text-primary"
                onClick={() => setIsAiThreadOpen(true)}
              >
                <RiSparklingLine className="h-4 w-4 text-sky-600" />
                {tIssues("normalDetail.actions.openAi")}
              </Button>
            </div>

            {canEditIssue && canQuickComplete && (
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-500"
                disabled={updateIssueMutation.isPending}
                onClick={handleQuickComplete}
              >
                <RiCheckLine className="h-4 w-4" />
                {tIssues("normalDetail.actions.markComplete")}
              </Button>
            )}

          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-lg text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
            onClick={onClose}
          >
            <RiCloseLine className="h-5 w-5" />
          </Button>
        </CardHeader>
      </Card>

      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="flex min-h-0 flex-col overflow-hidden border-app-border bg-app-content-bg shadow-none">
          <CardHeader className="flex flex-col gap-3 border-b border-app-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg text-app-text-primary">
                {tIssues("normalDetail.description.title")}
              </CardTitle>
              <p className="text-xs text-app-text-muted">
                {referencedDocCount > 0
                  ? tIssues("normalDetail.description.referencedDocs", {
                      count: referencedDocCount,
                    })
                  : ""}
              </p>
            </div>
            {canEditIssue && (
              <div className="flex flex-wrap gap-2">
                <IssueDescriptionTemplateAction
                  tIssues={tIssues}
                  value={localIssue.description || ""}
                  onApply={(nextDescription) => {
                    setLocalIssue({
                      ...localIssue,
                      description: nextDescription,
                    });
                    setEditingField("description");
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-app-border bg-transparent text-app-text-primary"
                  onClick={() => setIsDocPickerOpen(true)}
                >
                  <RiLinkM className="h-4 w-4" />
                  {tIssues("normalDetail.description.insertDoc")}
                </Button>
                {editingField === "description" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-sky-600 text-white hover:bg-sky-500"
                      onClick={() =>
                        persistIssuePatch({
                          description: localIssue.description,
                        })
                      }
                    >
                      {tIssues("normalDetail.description.save")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-app-border bg-transparent text-app-text-primary"
                      onClick={handleCancelEdit}
                    >
                      {tIssues("normalDetail.description.cancel")}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-app-border bg-transparent text-app-text-primary"
                    onClick={() => handleFieldEdit("description")}
                  >
                    <RiEditLine className="h-4 w-4" />
                    {tIssues("normalDetail.description.edit")}
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <ScrollArea className="min-h-0 flex-1 overflow-hidden">
            <CardContent className="flex flex-col gap-4 p-4">
              {aiHandoffPrompt ? (
                <div className="rounded-xl border border-app-border bg-app-bg px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-app-text-primary">
                        {tIssues("normalDetail.aiHandoff.title")}
                      </p>
                      <p className="mt-1 text-xs text-app-text-muted">
                        {localIssue.aiHandoffPromptUpdatedAt
                          ? tIssues("normalDetail.aiHandoff.updatedAt", {
                              time: formatDate(
                                localIssue.aiHandoffPromptUpdatedAt,
                                locale,
                                tIssues,
                              ),
                            })
                          : tIssues("normalDetail.aiHandoff.fallback")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-app-border bg-transparent text-app-text-primary"
                      onClick={() =>
                        void copyTextToClipboard(
                          aiHandoffPrompt,
                          tIssues("normalDetail.aiHandoff.copySuccess"),
                          tIssues("normalDetail.toasts.copyFailed"),
                        )
                      }
                    >
                      {tIssues("normalDetail.aiHandoff.copyAction")}
                    </Button>
                  </div>

                  <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-app-border bg-app-content-bg p-3 text-xs leading-6 text-app-text-secondary">
                    {aiHandoffPrompt}
                  </pre>
                </div>
              ) : null}

              {renderEditingHint("description")}
              {editingField === "description" ? (
                <Textarea
                  value={localIssue.description || ""}
                  onChange={(event) =>
                    setLocalIssue({
                      ...localIssue,
                      description: event.target.value,
                    })
                  }
                  className="min-h-[360px] resize-none border-app-border bg-app-bg text-app-text-primary"
                  placeholder={tIssues("normalDetail.description.placeholder")}
                />
              ) : (
                <MarkdownDescriptionPreview
                  content={localIssue.description}
                  docsById={docsById}
                  onOpenDoc={setPreviewDoc}
                  tIssues={tIssues}
                />
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        <Tabs
          value={rightPanelTab}
          onValueChange={(value) =>
            setRightPanelTab(value as "discussion" | "docs")
          }
          className="min-h-[320px] xl:min-h-0"
        >
          <Card className="flex h-full min-h-[320px] flex-col overflow-hidden border-app-border bg-app-content-bg shadow-none xl:min-h-0">
            <CardHeader className="border-b border-app-border p-4">
              <TabsList
                variant="line"
                className="h-auto w-full gap-2 bg-transparent p-0"
              >
                <TabsTrigger
                  value="discussion"
                  className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700"
                >
                  {tIssues("tabs.discussion.title")}
                </TabsTrigger>
                <TabsTrigger
                  value="docs"
                  className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700"
                >
                  {tIssues("normalDetail.docCards.title")}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="min-h-0 flex flex-1 flex-col p-0">
              <TabsContent value="discussion" className="mt-0 min-h-0 flex-1">
                <DiscussionTab
                  issueId={issueId}
                  workspaceId={workspaceId}
                  members={discussionMembers}
                />
              </TabsContent>
              <TabsContent
                value="docs"
                className="mt-0 min-h-0 flex-1 overflow-y-auto"
              >
                <IssueDocKindPanel
                  workspaceId={workspaceId}
                  workspaceType={workspaceType === "TEAM" ? "TEAM" : "PERSONAL"}
                  issue={localIssue}
                  docs={issueDocs}
                  locale={locale}
                  canCreate={canEditIssue}
                  variant="embedded"
                />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-app-border bg-app-content-bg px-4 py-2 text-xs text-app-text-muted">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1">
            <RiTimeLine className="h-3 w-3" />
            {tIssues("normalDetail.footer.createdAt", {
              value: formatDate(localIssue.createdAt, locale, tIssues),
            })}
          </span>
          <span className="flex items-center gap-1">
            <RiTimeLine className="h-3 w-3" />
            {tIssues("normalDetail.footer.updatedAt", {
              value: formatDate(localIssue.updatedAt, locale, tIssues),
            })}
          </span>
        </div>
        {updateIssueMutation.isPending && (
          <span className="text-sky-600">
            {tIssues("normalDetail.states.saving")}
          </span>
        )}
      </div>

      <Dialog open={isDocPickerOpen} onOpenChange={setIsDocPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {tIssues("normalDetail.docReference.pickerTitle")}
            </DialogTitle>
            <DialogDescription>
              {tIssues("normalDetail.docReference.pickerDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto rounded-lg border border-app-border">
            {isLoadingDocs ? (
              <div className="p-4 text-sm text-app-text-muted">
                {tIssues("normalDetail.docReference.loading")}
              </div>
            ) : documentOptions.length === 0 ? (
              <div className="p-4 text-sm text-app-text-muted">
                {tIssues("normalDetail.docReference.empty")}
              </div>
            ) : (
              documentOptions.map((doc) => (
                <button
                  key={doc._id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 border-b border-app-border px-4 py-3 text-left last:border-b-0 hover:bg-app-button-hover"
                  onClick={() => handleInsertDocReference(doc)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-app-text-primary">
                      {doc.title}
                    </span>
                    <span className="mt-1 block text-xs text-app-text-muted">
                      {doc.projectId
                        ? tIssues("normalDetail.docReference.projectDoc")
                        : tIssues("normalDetail.docReference.teamDoc")}
                    </span>
                  </span>
                  <RiFileTextLine className="h-4 w-4 text-app-text-secondary" />
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDocPickerOpen(false)}
            >
              {tIssues("normalDetail.docReference.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(previewDoc)}
        onOpenChange={(open) => {
          if (!open) setPreviewDoc(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewDoc?.title ||
                tIssues("normalDetail.docReference.defaultTitle")}
            </DialogTitle>
            <DialogDescription>
              {tIssues("normalDetail.docReference.previewDescription")}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[520px] rounded-lg border border-app-border bg-app-bg">
            <div className="whitespace-pre-wrap p-4 text-sm leading-6 text-app-text-secondary">
              {getDocPreviewContent(previewDoc, tIssues)}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AiThreadShell
        open={isAiThreadOpen}
        onOpenChange={setIsAiThreadOpen}
        workspaceId={workspaceId}
        originSurfaceType="ISSUE"
        originSurfaceId={issueId}
        originTitle={localIssue?.title}
      />
    </div>
  );

  return <div className="h-full w-full overflow-hidden">{content}</div>;
}
