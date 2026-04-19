"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  RiAddLine,
  RiArrowRightUpLine,
  RiFileTextLine,
  RiFolder3Line,
  RiSparklingLine,
  RiTeamLine,
  RiTimeLine,
} from "react-icons/ri";
import { toast } from "sonner";
import DocsProvider, {
  useDocs,
  type DocsDocument,
  type DocumentContext,
} from "./DocsContext";
import DocsSidebar from "./DocsSidebar";
import DocsTabs from "./DocsTabs";
import DocsEditor from "./DocsEditor";
import DocCreateDialog from "./DocCreateDialog";
import { DocKindCards, type DocKindCardSlot } from "./DocKindCards";
import {
  getDefaultDocTemplateKey,
  type DocTemplateKey,
} from "./doc-template-config";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useDocStore } from "@/stores/doc-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logo from "@/assets/icons/logo.png";
import { cn } from "@/lib/utils";

interface DocsPageProps {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  userId: string;
  context?: DocumentContext;
  projectId?: string;
}

interface DocsSourceOption {
  value: DocumentContext;
  label: string;
}

const DOCS_SIDEBAR_WIDTH = 268;

const STRUCTURED_DOC_SLOTS: DocKindCardSlot[] = [
  { kind: "PROJECT_BRIEF", templateKey: "project-brief-v1" },
  { kind: "DECISION_LOG", templateKey: "decision-log-v1" },
  { kind: "REVIEW_PACKET", templateKey: "review-packet-v1" },
  { kind: "HANDOFF_PACKET", templateKey: "handoff-packet-v1" },
  { kind: "RELEASE_CHECKLIST", templateKey: "release-checklist-v1" },
];

function DocsPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full min-h-0 overflow-hidden bg-app-bg">
      <div className="h-full min-h-0">{children}</div>
    </div>
  );
}

function formatDocDate(value: number, locale: string, withTime = false) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(new Date(value));
}

function resolveDocumentContext(
  providedContext: DocumentContext | undefined,
  workspaceType: "PERSONAL" | "TEAM",
  currentWorkspaceType?: "PERSONAL" | "TEAM",
): DocumentContext {
  if (providedContext) {
    return providedContext;
  }

  if (currentWorkspaceType === "PERSONAL" || workspaceType === "PERSONAL") {
    return "personal";
  }

  return "team";
}

function DocsSourceSwitcher({
  value,
  options,
  onValueChange,
  variant = "header",
}: {
  value: DocumentContext;
  options: DocsSourceOption[];
  onValueChange: (value: DocumentContext) => void;
  variant?: "header" | "sidebar";
}) {
  const tDocs = useTranslations("docs");

  if (variant === "sidebar") {
    return (
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-app-text-muted">
          {tDocs("sourceSwitcher.label")}
        </p>
        <Select value={value} onValueChange={(next) => onValueChange(next as DocumentContext)}>
          <SelectTrigger
            size="sm"
            className="h-10 w-full rounded-xl border-app-border/60 bg-app-bg/70"
          >
            <SelectValue placeholder={tDocs("sourceSwitcher.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-app-border/60 bg-app-content-bg/80 px-3 py-2 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="hidden text-right sm:block">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-app-text-muted">
          {tDocs("sourceSwitcher.label")}
        </p>
        <p className="mt-0.5 text-xs text-app-text-secondary">
          {tDocs("sourceSwitcher.description")}
        </p>
      </div>

      <Select value={value} onValueChange={(next) => onValueChange(next as DocumentContext)}>
        <SelectTrigger size="sm" className="w-[220px] rounded-lg border-app-border/60 bg-app-bg/70">
          <SelectValue placeholder={tDocs("sourceSwitcher.placeholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function isTextInputTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    Boolean(target.closest("input, textarea, select"))
  );
}

function isRichTextEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (isTextInputTarget(target)) {
    return false;
  }

  return (
    target.isContentEditable ||
    Boolean(target.closest("[contenteditable='true']")) ||
    Boolean(target.closest("[role='textbox']"))
  );
}

function OverviewMetricCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-app-bg/60 px-4 py-4 shadow-[0_14px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-app-content-bg text-app-text-primary">
          {icon}
        </span>
        <div>
          <div className="text-2xl font-semibold tracking-tight text-app-text-primary">
            {value}
          </div>
          <div className="text-sm text-app-text-secondary">{label}</div>
        </div>
      </div>
    </div>
  );
}

function OverviewDocCard({
  doc,
  documents,
  locale,
  onOpen,
}: {
  doc: DocsDocument;
  documents: DocsDocument[];
  locale: string;
  onOpen: (doc: DocsDocument) => void;
}) {
  const tDocs = useTranslations("docs");
  const childCount = documents.filter((item) => item.parentDocument === doc._id).length;

  return (
    <button
      type="button"
      onClick={() => onOpen(doc)}
      className="flex w-full flex-col items-start gap-4 rounded-xl bg-app-bg/60 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:bg-app-bg/80"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-app-content-bg text-app-text-primary">
          {doc.type === "folder" ? (
            <RiFolder3Line className="size-5" />
          ) : (
            <RiFileTextLine className="size-5" />
          )}
        </span>
        <Badge
          variant="outline"
          className="rounded-full border-transparent bg-app-content-bg px-2 text-[10px] font-medium text-app-text-muted"
        >
          {doc.type === "folder"
            ? tDocs("editor.meta.folder")
            : tDocs("editor.meta.document")}
        </Badge>
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-app-text-primary">{doc.title}</h3>
        <p className="mt-1 text-sm leading-6 text-app-text-secondary">
          {doc.type === "folder"
            ? tDocs("overview.shared.folderContains", { count: childCount })
            : tDocs("overview.shared.updatedAt", {
                value: formatDocDate(doc.lastEditedAt, locale, true),
              })}
        </p>
      </div>
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-app-text-muted">
        <RiArrowRightUpLine className="size-3.5" />
        {tDocs("overview.shared.openAction")}
      </div>
    </button>
  );
}

function ProjectSpaceCard({
  doc,
  documents,
  locale,
  onOpen,
}: {
  doc: DocsDocument;
  documents: DocsDocument[];
  locale: string;
  onOpen: (doc: DocsDocument) => void;
}) {
  const tDocs = useTranslations("docs");
  const relatedDocs = documents.filter(
    (item) => item.projectId && item.projectId === doc.projectId && item._id !== doc._id,
  );
  const documentCount = relatedDocs.filter((item) => item.type === "document").length;
  const folderCount = relatedDocs.filter((item) => item.type === "folder").length;
  const latestUpdatedAt = relatedDocs.reduce(
    (latest, item) => Math.max(latest, item.lastEditedAt),
    doc.lastEditedAt,
  );

  return (
    <button
      type="button"
      onClick={() => onOpen(doc)}
      className="flex w-full items-start gap-4 rounded-xl bg-app-bg/60 px-4 py-4 text-left transition-colors hover:bg-app-bg/80"
    >
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-app-content-bg text-app-text-primary">
        <RiFolder3Line className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-base font-semibold text-app-text-primary">
            {doc.title}
          </div>
          <Badge
            variant="outline"
            className="rounded-full border-transparent bg-app-content-bg px-2 text-[10px] font-medium text-app-text-muted"
          >
            {tDocs("sidebar.projectSpaceBadge")}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-app-text-secondary">
          {tDocs("overview.shared.projectSpaceMeta", {
            docs: documentCount,
            folders: folderCount,
          })}
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-app-text-muted">
          <RiTimeLine className="size-3.5" />
          {tDocs("overview.shared.updatedAt", {
            value: formatDocDate(latestUpdatedAt, locale, true),
          })}
        </div>
      </div>
      <div className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-app-text-muted">
        <RiArrowRightUpLine className="size-3.5" />
        {tDocs("overview.shared.enterSpace")}
      </div>
    </button>
  );
}

export function DocsOverviewPage({ context }: { context: DocumentContext }) {
  const tDocs = useTranslations("docs");
  const locale = useLocale();
  const { createFolder, documents, openDoc, projectId } = useDocs();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [preferredTemplateKey, setPreferredTemplateKey] = useState<DocTemplateKey>(
    getDefaultDocTemplateKey(projectId) as DocTemplateKey,
  );

  const documentsOnly = documents.filter((doc) => doc.type === "document");
  const rootDocs = documents.filter((doc) => !doc.parentDocument);
  const projectRootDocs = rootDocs.filter((doc) => doc.isProjectRootFolder);
  const otherRootDocs = rootDocs.filter((doc) => !doc.isProjectRootFolder);
  const recentDocs = [...documents]
    .sort((left, right) => right.lastEditedAt - left.lastEditedAt)
    .slice(0, 6);
  const structuredCount = documentsOnly.filter((doc) => doc.kind !== "GENERAL").length;
  const recentWindowCount = documents.filter(
    (doc) => Date.now() - doc.lastEditedAt < 1000 * 60 * 60 * 24 * 7,
  ).length;

  const overviewCopy = (() => {
    switch (context) {
      case "team":
        return {
          eyebrow: tDocs("overview.team.eyebrow"),
          title: tDocs("overview.team.title"),
          subtitle: tDocs("overview.team.subtitle", { count: documents.length }),
          description: tDocs("overview.team.heroDescription"),
          icon: <RiTeamLine className="size-4" />,
        };
      case "team-personal":
        return {
          eyebrow: tDocs("overview.teamPersonal.eyebrow"),
          title: tDocs("overview.teamPersonal.title"),
          subtitle: tDocs("overview.teamPersonal.subtitle", { count: documents.length }),
          description: tDocs("overview.teamPersonal.heroDescription"),
          icon: <RiSparklingLine className="size-4" />,
        };
      default:
        return {
          eyebrow: tDocs("overview.personal.eyebrow"),
          title: tDocs("overview.personal.title"),
          subtitle: tDocs("overview.personal.subtitle", { count: documents.length }),
          description: tDocs("overview.personal.heroDescription"),
          icon: <RiFileTextLine className="size-4" />,
        };
    }
  })();

  const openCreateDialog = (
    templateKey: DocTemplateKey = getDefaultDocTemplateKey(projectId) as DocTemplateKey,
  ) => {
    setPreferredTemplateKey(templateKey);
    setIsCreateDialogOpen(true);
  };

  return (
    <DocsPageFrame>
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6">
        <div className="rounded-[24px] border border-app-border/60 bg-app-content-bg/78 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 overflow-y-auto">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="rounded-[20px] bg-app-bg/60 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <Badge
                variant="outline"
                className="rounded-full border-transparent bg-app-content-bg px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-app-text-secondary"
              >
                {overviewCopy.icon}
                {overviewCopy.eyebrow}
              </Badge>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-app-text-primary sm:text-[2.6rem]">
                {overviewCopy.title}
              </h1>
              <p className="mt-3 text-base text-app-text-secondary">{overviewCopy.subtitle}</p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-app-text-secondary sm:text-[15px]">
                {overviewCopy.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => openCreateDialog()}
                  className="rounded-lg bg-sky-600 px-4 text-white hover:bg-sky-500"
                >
                  <RiAddLine className="size-4" />
                  {tDocs("overview.shared.newDocTitle")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void createFolder(tDocs("creation.newFolder"))}
                  className="rounded-lg border-app-border/60 bg-app-content-bg/70 text-app-text-primary hover:bg-app-button-hover"
                >
                  <RiFolder3Line className="size-4" />
                  {tDocs("creation.newFolder")}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <OverviewMetricCard
                icon={<RiFileTextLine className="size-5" />}
                value={documentsOnly.length}
                label={
                  context === "team"
                    ? tDocs("overview.team.documentMetric")
                    : context === "team-personal"
                      ? tDocs("overview.teamPersonal.documentMetric")
                      : tDocs("overview.shared.documentMetric")
                }
              />
              <OverviewMetricCard
                icon={<RiFolder3Line className="size-5" />}
                value={documents.length - documentsOnly.length}
                label={tDocs("overview.shared.folderMetric")}
              />
              <OverviewMetricCard
                icon={<RiSparklingLine className="size-5" />}
                value={structuredCount || recentWindowCount}
                label={
                  structuredCount > 0
                    ? tDocs("overview.shared.structuredMetric")
                    : tDocs("overview.shared.recentMetric")
                }
              />
            </div>
          </div>

          {context === "team" && !projectId && projectRootDocs.length > 0 ? (
            <>
              <section className="mt-6 rounded-[20px] bg-app-bg/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-app-text-primary">
                      {tDocs("overview.shared.projectSpacesTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-app-text-secondary">
                      {tDocs("overview.shared.projectSpacesDescription")}
                    </p>
                  </div>
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-app-text-muted">
                    {tDocs("overview.shared.totalCount", { count: projectRootDocs.length })}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  {projectRootDocs.slice(0, 6).map((doc) => (
                    <ProjectSpaceCard
                      key={doc._id}
                      doc={doc}
                      documents={documents}
                      locale={locale}
                      onOpen={openDoc}
                    />
                  ))}
                </div>
              </section>

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
                <section className="rounded-[20px] bg-app-bg/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-app-text-primary">
                        {tDocs("overview.shared.structuredTitle")}
                      </h2>
                      <p className="mt-1 text-sm text-app-text-secondary">
                        {tDocs("overview.shared.structuredDescription")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openCreateDialog("decision-log-v1")}
                      className="rounded-lg border-app-border/60 bg-app-content-bg/70 text-app-text-primary hover:bg-app-button-hover"
                    >
                      <RiSparklingLine className="size-4" />
                      {tDocs("consumption.createDoc")}
                    </Button>
                  </div>

                  <DocKindCards
                    docs={documentsOnly}
                    slots={STRUCTURED_DOC_SLOTS}
                    locale={locale}
                    tDocs={tDocs}
                    onOpenDoc={openDoc}
                    onCreateDoc={(slot) => openCreateDialog(slot.templateKey)}
                    className="mt-5"
                  />
                </section>

                <section className="rounded-[20px] bg-app-bg/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <h2 className="text-xl font-semibold tracking-tight text-app-text-primary">
                    {tDocs("overview.shared.recentTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-app-text-secondary">
                    {tDocs("overview.shared.recentDescription")}
                  </p>

                  <div className="mt-5 space-y-3">
                    {recentDocs.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-app-border px-4 py-10 text-center text-sm text-app-text-muted">
                        {tDocs("welcome.emptyDescription")}
                      </div>
                    ) : (
                      recentDocs.map((doc) => {
                        const parentTitle = doc.parentDocument
                          ? documents.find((item) => item._id === doc.parentDocument)?.title
                          : null;

                        return (
                          <button
                            key={doc._id}
                            type="button"
                            onClick={() => openDoc(doc)}
                            className="flex w-full items-center gap-3 rounded-xl bg-app-content-bg/72 px-3 py-3 text-left transition-colors hover:bg-app-bg/80"
                          >
                            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-app-bg text-app-text-primary">
                              {doc.type === "folder" ? (
                                <RiFolder3Line className="size-4" />
                              ) : (
                                <RiFileTextLine className="size-4" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-app-text-primary">
                                {doc.title}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
                                <span className="inline-flex items-center gap-1">
                                  <RiTimeLine className="size-3.5" />
                                  {formatDocDate(doc.lastEditedAt, locale, true)}
                                </span>
                                {parentTitle ? (
                                  <span className="truncate rounded-full bg-app-bg/70 px-2 py-0.5">
                                    {parentTitle}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <RiArrowRightUpLine className="size-4 shrink-0 text-app-text-muted" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>

              {otherRootDocs.length > 0 ? (
                <section className="mt-6 rounded-[20px] bg-app-bg/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-app-text-primary">
                        {tDocs("overview.shared.otherSpacesTitle")}
                      </h2>
                      <p className="mt-1 text-sm text-app-text-secondary">
                        {tDocs("overview.shared.otherSpacesDescription")}
                      </p>
                    </div>
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-app-text-muted">
                      {tDocs("overview.shared.totalCount", { count: otherRootDocs.length })}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {otherRootDocs.slice(0, 6).map((doc) => (
                      <OverviewDocCard
                        key={doc._id}
                        doc={doc}
                        documents={documents}
                        locale={locale}
                        onOpen={openDoc}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <>
              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
                <section className="rounded-[20px] bg-app-bg/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-app-text-primary">
                        {tDocs("overview.shared.structuredTitle")}
                      </h2>
                      <p className="mt-1 text-sm text-app-text-secondary">
                        {tDocs("overview.shared.structuredDescription")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openCreateDialog("decision-log-v1")}
                      className="rounded-lg border-app-border/60 bg-app-content-bg/70 text-app-text-primary hover:bg-app-button-hover"
                    >
                      <RiSparklingLine className="size-4" />
                      {tDocs("consumption.createDoc")}
                    </Button>
                  </div>

                  <DocKindCards
                    docs={documentsOnly}
                    slots={STRUCTURED_DOC_SLOTS}
                    locale={locale}
                    tDocs={tDocs}
                    onOpenDoc={openDoc}
                    onCreateDoc={(slot) => openCreateDialog(slot.templateKey)}
                    className="mt-5"
                  />
                </section>

                <section className="rounded-[20px] bg-app-bg/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                  <h2 className="text-xl font-semibold tracking-tight text-app-text-primary">
                    {tDocs("overview.shared.recentTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-app-text-secondary">
                    {tDocs("overview.shared.recentDescription")}
                  </p>

                  <div className="mt-5 space-y-3">
                    {recentDocs.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-app-border px-4 py-10 text-center text-sm text-app-text-muted">
                        {tDocs("welcome.emptyDescription")}
                      </div>
                    ) : (
                      recentDocs.map((doc) => {
                        const parentTitle = doc.parentDocument
                          ? documents.find((item) => item._id === doc.parentDocument)?.title
                          : null;

                        return (
                          <button
                            key={doc._id}
                            type="button"
                            onClick={() => openDoc(doc)}
                            className="flex w-full items-center gap-3 rounded-xl bg-app-content-bg/72 px-3 py-3 text-left transition-colors hover:bg-app-bg/80"
                          >
                            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-app-bg text-app-text-primary">
                              {doc.type === "folder" ? (
                                <RiFolder3Line className="size-4" />
                              ) : (
                                <RiFileTextLine className="size-4" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-app-text-primary">
                                {doc.title}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
                                <span className="inline-flex items-center gap-1">
                                  <RiTimeLine className="size-3.5" />
                                  {formatDocDate(doc.lastEditedAt, locale, true)}
                                </span>
                                {parentTitle ? (
                                  <span className="truncate rounded-full bg-app-bg/70 px-2 py-0.5">
                                    {parentTitle}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <RiArrowRightUpLine className="size-4 shrink-0 text-app-text-muted" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>

              <section className="mt-6 rounded-[20px] bg-app-bg/60 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-app-text-primary">
                      {tDocs("overview.shared.workspaceTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-app-text-secondary">
                      {tDocs("overview.shared.workspaceDescription")}
                    </p>
                  </div>
                  {documents.length > 0 ? (
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-app-text-muted">
                      {tDocs("overview.shared.totalCount", { count: documents.length })}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5">
                  {rootDocs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-app-border px-5 py-12 text-center">
                      <p className="text-sm font-medium text-app-text-primary">
                        {tDocs(
                          context === "team"
                            ? "overview.team.emptyTitle"
                            : context === "team-personal"
                              ? "overview.teamPersonal.emptyTitle"
                              : "overview.personal.emptyTitle",
                        )}
                      </p>
                      <p className="mt-2 text-sm text-app-text-muted">
                        {tDocs(
                          context === "team"
                            ? "overview.team.emptyDescription"
                            : context === "team-personal"
                              ? "overview.teamPersonal.emptyDescription"
                              : "overview.personal.emptyDescription",
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {rootDocs.slice(0, 6).map((doc) => (
                        <OverviewDocCard
                          key={doc._id}
                          doc={doc}
                          documents={documents}
                          locale={locale}
                          onOpen={openDoc}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      <DocCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
        defaultTemplateKey={preferredTemplateKey}
      />
    </DocsPageFrame>
  );
}

function ShortcutKey({ value }: { value: string }) {
  return (
    <span className="inline-flex min-w-9 items-center justify-center rounded-md border border-app-border/60 bg-app-bg/80 px-2.5 py-1.5 text-xs font-semibold text-app-text-secondary shadow-sm">
      {value}
    </span>
  );
}

function DocsShortcutPlaceholder() {
  const tDocs = useTranslations("docs");
  const shortcuts = [
    {
      id: "new-doc",
      label: tDocs("emptyState.shortcuts.newDoc"),
      keys: ["Cmd", "N"],
    },
    {
      id: "toggle-sidebar",
      label: tDocs("emptyState.shortcuts.toggleSidebar"),
      keys: ["Cmd", "B"],
    },
    {
      id: "save-doc",
      label: tDocs("emptyState.shortcuts.saveDoc"),
      keys: ["Cmd", "S"],
    },
  ];

  return (
    <div className="flex h-full items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg px-8 py-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-app-bg/80">
              <Image
                src={logo}
                alt="Synaply"
                width={30}
                height={30}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-semibold tracking-tight text-app-text-primary">
                Synaply
              </h2>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.id}
              className="flex items-center justify-between gap-4 rounded-xl bg-app-content-bg/72 px-4 py-3"
            >
              <span className="text-sm font-medium text-app-text-primary">
                {shortcut.label}
              </span>
              <div className="flex items-center gap-2">
                {shortcut.keys.map((key) => (
                  <ShortcutKey key={`${shortcut.id}-${key}`} value={key} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocsPageContent({
  sourceSwitcher,
  sidebarSourceSwitcher,
}: {
  sourceSwitcher?: React.ReactNode;
  sidebarSourceSwitcher?: React.ReactNode;
}) {
  const tDocs = useTranslations("docs");
  const {
    createDoc,
    isLoading,
    openDoc,
    openDocs,
    activeDocId,
    projectId,
  } = useDocs();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeDoc = openDocs.find((doc) => doc._id === activeDocId);

  const handleSelectDoc = (doc: DocsDocument) => {
    openDoc(doc);
  };

  const handleQuickCreateDoc = React.useCallback(async () => {
    try {
      await createDoc(tDocs("creation.template.blank.title"), {
        parentId:
          activeDoc?.type === "folder"
            ? activeDoc._id
            : activeDoc?.parentDocument,
        projectId: activeDoc?.projectId ?? projectId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tDocs("creation.dialog.createFailed"),
      );
    }
  }, [activeDoc, createDoc, projectId, tDocs]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
        return;
      }

      if (event.defaultPrevented || event.repeat) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key !== "b" && key !== "n") {
        return;
      }

      if (document.querySelector("[role='dialog']")) {
        return;
      }

      const activeElement = document.activeElement;
      const isTextInputActive = isTextInputTarget(activeElement);
      const isRichTextActive = isRichTextEditableTarget(activeElement);

      if (key === "b") {
        if (isTextInputActive) {
          return;
        }

        event.preventDefault();
        setIsExpanded((current) => !current);
        return;
      }

      if (isTextInputActive || isRichTextActive) {
        return;
      }

      event.preventDefault();
      void handleQuickCreateDoc();
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [handleQuickCreateDoc]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-app-bg">
        {sourceSwitcher ? (
          <div className="border-b border-app-border/60 px-4 py-3 sm:px-6">
            <div className="flex justify-end">{sourceSwitcher}</div>
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="rounded-[16px] border border-app-border/60 bg-app-content-bg px-10 py-12 text-center shadow-none">
            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-b-2 border-sky-600" />
            <p className="text-sm text-app-text-muted">{tDocs("states.loadingPage")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-app-bg">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div
          style={
            {
              "--docs-sidebar-width": `${DOCS_SIDEBAR_WIDTH}px`,
            } as React.CSSProperties
          }
          className={cn(
            "grid h-full min-h-0 gap-2",
            isExpanded
              ? "grid-cols-1"
              : "md:[grid-template-columns:var(--docs-sidebar-width)_minmax(0,1fr)]",
          )}
        >
          {!isExpanded ? (
            <div className="flex min-h-0 min-w-0 md:w-[var(--docs-sidebar-width)] md:min-w-[var(--docs-sidebar-width)] md:max-w-[var(--docs-sidebar-width)]">
              <DocsSidebar
                onSelectDoc={handleSelectDoc}
                sourceSwitcher={sidebarSourceSwitcher}
              />
            </div>
          ) : null}

          <div className="flex min-h-[62vh] flex-1 flex-col overflow-hidden rounded-[16px] border border-app-border/60 bg-app-content-bg shadow-none md:min-h-0">
            <DocsTabs onSelectDoc={handleSelectDoc} />
            <div className="min-h-0 flex-1 overflow-hidden bg-app-content-bg">
              {activeDoc ? (
                <DocsEditor
                  doc={activeDoc}
                  isExpanded={isExpanded}
                  onToggleExpand={() => setIsExpanded((current) => !current)}
                />
              ) : (
                <DocsShortcutPlaceholder />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage({
  workspaceId,
  workspaceType,
  userId,
  context,
  projectId,
}: DocsPageProps) {
  const tDocs = useTranslations("docs");
  const { currentWorkspace } = useWorkspace();
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);
  const defaultDocumentContext = useMemo(
    () =>
      resolveDocumentContext(context, workspaceType, currentWorkspace?.type),
    [context, currentWorkspace?.type, workspaceType],
  );
  const canSwitchSource = workspaceType === "TEAM" && !projectId;
  const [selectedContext, setSelectedContext] =
    useState<DocumentContext>(defaultDocumentContext);

  useEffect(() => {
    setSelectedContext(defaultDocumentContext);
  }, [defaultDocumentContext, workspaceId, projectId]);

  useEffect(() => {
    setActiveDocId(null);
  }, [projectId, selectedContext, setActiveDocId, workspaceId]);

  const activeContext = canSwitchSource ? selectedContext : defaultDocumentContext;
  const providerKey = `${workspaceId}-${workspaceType}-${activeContext}-${projectId ?? "root"}`;
  const teamDocSourceOptions: DocsSourceOption[] = [
    { value: "team", label: tDocs("source.team") },
    { value: "team-personal", label: tDocs("source.teamPersonal") },
  ];
  const sourceSwitcher = canSwitchSource ? (
    <DocsSourceSwitcher
      value={activeContext}
      options={teamDocSourceOptions}
      onValueChange={setSelectedContext}
    />
  ) : null;
  const sidebarSourceSwitcher = canSwitchSource ? (
    <DocsSourceSwitcher
      value={activeContext}
      options={teamDocSourceOptions}
      onValueChange={setSelectedContext}
      variant="sidebar"
    />
  ) : null;

  return (
    <DocsProvider
      key={providerKey}
      context={activeContext}
      workspaceId={workspaceId}
      workspaceType={workspaceType}
      userId={userId}
      projectId={projectId}
    >
      <DocsPageContent
        sourceSwitcher={sourceSwitcher}
        sidebarSourceSwitcher={sidebarSourceSwitcher}
      />
    </DocsProvider>
  );
}
