"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  RiAddLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFileAddLine,
  RiFileCopyLine,
  RiFileTextLine,
  RiFolder3Line,
  RiFolderAddLine,
  RiFolderOpenLine,
  RiSearchLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { useDocs, DocsDocument } from "./DocsContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DocCreateDialog from "./DocCreateDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  buildDuplicatedDocTitle,
  clampDocTitle,
  DOC_TITLE_MAX_LENGTH,
} from "./doc-title";

interface DocsSidebarProps {
  onSelectDoc: (doc: DocsDocument) => void;
  sourceSwitcher?: React.ReactNode;
}

interface TreeNodeProps {
  doc: DocsDocument;
  level: number;
  onSelectDoc: (doc: DocsDocument) => void;
  expandedIds: Set<string>;
  onToggleExpand: (uid: string) => void;
  childrenByParent: Map<string, DocsDocument[]>;
  newlyCreatedDocId?: string;
  onNewDocCreated?: (docId: string) => void;
}

const ROOT_DOCS_KEY = "__root__";

function getScopeLabel(
  context: ReturnType<typeof useDocs>["context"],
  tDocs: ReturnType<typeof useTranslations>,
) {
  switch (context) {
    case "team":
      return tDocs("source.team");
    case "team-personal":
      return tDocs("source.teamPersonal");
    default:
      return tDocs("source.personal");
  }
}

function getChildDocs(
  childrenByParent: Map<string, DocsDocument[]>,
  parentId?: string,
) {
  return childrenByParent.get(parentId ?? ROOT_DOCS_KEY) ?? [];
}

function TreeNode({
  doc,
  level,
  onSelectDoc,
  expandedIds,
  onToggleExpand,
  childrenByParent,
  newlyCreatedDocId,
  onNewDocCreated,
}: TreeNodeProps) {
  const tDocs = useTranslations("docs");
  const { createDoc, deleteDoc, updateDocTitle, openDoc, activeDocId } = useDocs();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(doc.title);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateChildDialogOpen, setIsCreateChildDialogOpen] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const childDocs = getChildDocs(childrenByParent, doc._id);
  const hasChildren = childDocs.length > 0;
  const isExpanded = expandedIds.has(doc._id);
  const isActive = activeDocId === doc._id;
  const isProjectSpace = Boolean(doc.isProjectRootFolder);

  useEffect(() => {
    if (newlyCreatedDocId === doc._id && doc.type === "document") {
      setIsEditing(true);
      setEditTitle(clampDocTitle(doc.title));
    }
  }, [doc._id, doc.title, doc.type, newlyCreatedDocId]);

  const handleRename = async () => {
    const nextTitle = editTitle.trim();
    if (!nextTitle) {
      setEditTitle(clampDocTitle(doc.title));
      setIsEditing(false);
      return;
    }

    if (nextTitle !== doc.title) {
      await updateDocTitle(doc._id, nextTitle);
    }
    setIsEditing(false);
  };

  const handleConfirmDelete = async () => {
    await deleteDoc(doc._id);
    setIsDeleteDialogOpen(false);
  };

  const handleDuplicateDoc = async () => {
    if (doc.type !== "document") {
      return;
    }

    try {
      await createDoc(
        buildDuplicatedDocTitle(doc.title, tDocs("sidebar.duplicateSuffix")),
        {
          parentId: doc.parentDocument,
          projectId: doc.projectId,
          issueId: doc.issueId,
          workflowId: doc.workflowId,
          content: doc.content,
          kind: doc.kind,
          templateKey: doc.templateKey,
        },
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tDocs("creation.dialog.createFailed"),
      );
    }
  };

  return (
    <>
      <div className="w-full min-w-0 space-y-1">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              ref={nodeRef}
              data-active={isActive ? "true" : "false"}
              className={cn(
                "group relative flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-all",
                isActive
                  ? "bg-app-bg/85 text-app-text-primary"
                  : "text-app-text-secondary hover:bg-app-bg/55 hover:text-app-text-primary",
              )}
              style={{
                paddingLeft: `${level * 14 + 10}px`,
                contentVisibility: "auto",
                containIntrinsicSize: "48px",
              }}
              onClick={() =>
                !isEditing && doc.type === "document" ? onSelectDoc(doc) : openDoc(doc)
              }
            >
              <span
                className={cn(
                  "absolute left-1 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sky-500 transition-opacity",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                )}
              />

              {hasChildren ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleExpand(doc._id);
                  }}
                  className="rounded-md p-0.5 text-app-text-muted transition-colors hover:bg-app-button-hover hover:text-app-text-primary"
                >
                  <RiArrowRightSLine
                    className={cn("size-4 transition-transform", isExpanded && "rotate-90")}
                  />
                </button>
              ) : (
                <span className="w-[2px] shrink-0" />
              )}

              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg",
                  isActive
                    ? "bg-app-content-bg text-app-text-primary"
                    : "bg-app-bg/75 text-app-text-secondary",
                )}
              >
                {doc.type === "folder" ? (
                  isExpanded ? (
                    <RiFolderOpenLine className="size-4" />
                  ) : (
                    <RiFolder3Line className="size-4" />
                  )
                ) : (
                  <RiFileTextLine className="size-4" />
                )}
              </span>

              <div className="min-w-0 flex-1 overflow-hidden">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    maxLength={DOC_TITLE_MAX_LENGTH}
                    onChange={(event) => setEditTitle(clampDocTitle(event.target.value))}
                    onBlur={() => void handleRename()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void handleRename();
                      }
                      if (event.key === "Escape") {
                        setEditTitle(clampDocTitle(doc.title));
                        setIsEditing(false);
                      }
                    }}
                    onClick={(event) => event.stopPropagation()}
                    className="h-8 rounded-xl border-app-border bg-app-content-bg px-3 text-sm text-app-text-primary focus-visible:ring-sky-500/20"
                    autoFocus
                  />
                ) : (
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {doc.title}
                    </span>
                    {isProjectSpace ? (
                      <Badge
                        variant="outline"
                        className="h-5 shrink-0 rounded-full border-transparent bg-app-content-bg px-1.5 text-[10px] font-medium text-app-text-muted"
                      >
                        {tDocs("sidebar.projectSpaceBadge")}
                      </Badge>
                    ) : null}
                    {doc.type === "folder" && childDocs.length > 0 ? (
                      <Badge
                        variant="outline"
                        className="h-5 shrink-0 rounded-full border-transparent bg-app-content-bg px-1.5 text-[10px] font-medium text-app-text-muted"
                      >
                        {childDocs.length}
                      </Badge>
                    ) : null}
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "flex shrink-0 items-center gap-1 transition-opacity",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
              >
                {doc.type === "folder" ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsCreateChildDialogOpen(true);
                    }}
                    className="rounded-lg p-1 text-app-text-muted transition-colors hover:bg-app-button-hover hover:text-app-text-primary"
                    title={tDocs("sidebar.newChildDoc")}
                  >
                    <RiAddLine className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent className="min-w-[176px]">
            {doc.type === "folder" ? (
              <>
                <ContextMenuItem onSelect={() => setIsCreateChildDialogOpen(true)}>
                  <RiFileAddLine className="size-4" />
                  {tDocs("sidebar.newChildDoc")}
                </ContextMenuItem>
                {!isProjectSpace ? (
                  <ContextMenuItem
                    onSelect={() => {
                      setEditTitle(clampDocTitle(doc.title));
                      setIsEditing(true);
                    }}
                  >
                    <RiEditLine className="size-4" />
                    {tDocs("sidebar.rename")}
                  </ContextMenuItem>
                ) : null}
                {doc.canDelete ? (
                  <ContextMenuItem
                    variant="destructive"
                    onSelect={() => setIsDeleteDialogOpen(true)}
                  >
                    <RiDeleteBinLine className="size-4" />
                    {tDocs("sidebar.delete")}
                  </ContextMenuItem>
                ) : null}
              </>
            ) : (
              <>
                <ContextMenuItem onSelect={() => void handleDuplicateDoc()}>
                  <RiFileCopyLine className="size-4" />
                  {tDocs("sidebar.duplicate")}
                </ContextMenuItem>
                {!isProjectSpace ? (
                  <ContextMenuItem
                    onSelect={() => {
                      setEditTitle(clampDocTitle(doc.title));
                      setIsEditing(true);
                    }}
                  >
                    <RiEditLine className="size-4" />
                    {tDocs("sidebar.rename")}
                  </ContextMenuItem>
                ) : null}
                {doc.canDelete ? (
                  <ContextMenuItem
                    variant="destructive"
                    onSelect={() => setIsDeleteDialogOpen(true)}
                  >
                    <RiDeleteBinLine className="size-4" />
                    {tDocs("sidebar.delete")}
                  </ContextMenuItem>
                ) : null}
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>

        {hasChildren && isExpanded ? (
          <div className="space-y-1">
            {childDocs.map((child) => (
              <TreeNode
                key={child._id}
                doc={child}
                level={level + 1}
                onSelectDoc={onSelectDoc}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                childrenByParent={childrenByParent}
                newlyCreatedDocId={newlyCreatedDocId}
                onNewDocCreated={onNewDocCreated}
              />
            ))}
          </div>
        ) : null}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tDocs("sidebar.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {tDocs("sidebar.deleteDialog.description", {
                title: doc.title,
                children: hasChildren ? tDocs("sidebar.deleteDialog.children") : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-app-border bg-transparent text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
            >
              {tDocs("sidebar.deleteDialog.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={() => void handleConfirmDelete()}>
              {tDocs("sidebar.deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocCreateDialog
        open={isCreateChildDialogOpen}
        onOpenChange={setIsCreateChildDialogOpen}
        parentId={doc._id}
        onCreated={(createdDoc) => {
          onNewDocCreated?.(createdDoc._id);
          if (!isExpanded) {
            onToggleExpand(doc._id);
          }
        }}
      />
    </>
  );
}

export default function DocsSidebar({
  onSelectDoc,
  sourceSwitcher,
}: DocsSidebarProps) {
  const tDocs = useTranslations("docs");
  const {
    activeDocId,
    context,
    createFolder,
    documents,
    isLoading,
    projectId,
  } = useDocs();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newlyCreatedDocId, setNewlyCreatedDocId] = useState<string | undefined>();
  const [isCreateRootDocDialogOpen, setIsCreateRootDocDialogOpen] = useState(false);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, DocsDocument[]>();

    for (const doc of documents) {
      const key = doc.parentDocument ?? ROOT_DOCS_KEY;
      const current = map.get(key) ?? [];
      current.push(doc);
      map.set(key, current);
    }

    return map;
  }, [documents]);

  const rootDocs = useMemo(
    () => getChildDocs(childrenByParent),
    [childrenByParent],
  );
  const projectRootDocs = useMemo(
    () => rootDocs.filter((doc) => doc.isProjectRootFolder),
    [rootDocs],
  );
  const otherRootDocs = useMemo(
    () => rootDocs.filter((doc) => !doc.isProjectRootFolder),
    [rootDocs],
  );
  const visibleRootDocs = useMemo(
    () => (projectId ? rootDocs : otherRootDocs),
    [otherRootDocs, projectId, rootDocs],
  );

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) {
      return null;
    }

    const query = searchQuery.trim().toLowerCase();
    return [...documents]
      .filter((doc) => doc.title.toLowerCase().includes(query))
      .sort((left, right) => right.lastEditedAt - left.lastEditedAt);
  }, [documents, searchQuery]);

  useEffect(() => {
    if (!activeDocId) {
      return;
    }

    setExpandedIds((previous) => {
      const next = new Set(previous);
      let changed = false;
      let cursor = documents.find((doc) => doc._id === activeDocId)?.parentDocument;

      while (cursor) {
        if (!next.has(cursor)) {
          next.add(cursor);
          changed = true;
        }
        cursor = documents.find((doc) => doc._id === cursor)?.parentDocument;
      }

      return changed ? next : previous;
    });
  }, [activeDocId, documents]);

  useEffect(() => {
    if (!newlyCreatedDocId) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNewlyCreatedDocId(undefined);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [newlyCreatedDocId]);

  const handleToggleExpand = (uid: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const handleCreateRootFolder = async () => {
    await createFolder(tDocs("creation.newFolder"));
  };

  const scopeLabel = getScopeLabel(context, tDocs);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden rounded-[16px] border border-app-border/60 bg-app-content-bg shadow-none">
        <div className="border-b border-app-border/60 px-4 py-4">
          {sourceSwitcher ? <div className="mb-4 min-w-0">{sourceSwitcher}</div> : null}
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-app-text-muted">
            {tDocs("sidebar.title")}
          </h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8 text-sm text-app-text-muted">
          {tDocs("states.loadingSidebar")}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden rounded-[16px] border border-app-border/60 bg-app-content-bg shadow-none">
          <div className="border-b border-app-border/60 px-4 py-4">
            {sourceSwitcher ? <div className="mb-4 min-w-0">{sourceSwitcher}</div> : null}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-app-text-muted">
                    {tDocs("sidebar.title")}
                  </h2>
                  <Badge
                    variant="outline"
                    className="h-6 shrink-0 rounded-full border-transparent bg-app-bg/70 px-2 text-[11px] font-medium text-app-text-secondary"
                  >
                    {documents.length}
                  </Badge>
                </div>
                {!sourceSwitcher ? (
                  <p className="mt-2 text-sm text-app-text-secondary">{scopeLabel}</p>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCreateRootDocDialogOpen(true)}
                  className="size-9 rounded-lg border-app-border/60 bg-app-bg/70 text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
                  title={tDocs("sidebar.newDoc")}
                >
                  <RiFileAddLine className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void handleCreateRootFolder()}
                  className="size-9 rounded-lg border-app-border/60 bg-app-bg/70 text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
                  title={tDocs("sidebar.newFolder")}
                >
                  <RiFolderAddLine className="size-4" />
                </Button>
              </div>
            </div>

            <div className="relative mt-4">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-app-text-muted" />
              <Input
                type="text"
                placeholder={tDocs("sidebar.searchPlaceholder")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 rounded-xl border-app-border/60 bg-app-bg/70 pl-10 text-app-text-primary placeholder:text-app-text-muted focus-visible:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
            {filteredDocs ? (
              <div className="space-y-2">
                {filteredDocs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-app-border px-4 py-10 text-center text-sm text-app-text-muted">
                    {tDocs("sidebar.emptySearch")}
                  </div>
                ) : (
                  filteredDocs.map((doc) => {
                    const parentTitle = doc.parentDocument
                      ? documents.find((item) => item._id === doc.parentDocument)?.title
                      : null;

                    return (
                     <button
                        key={doc._id}
                        type="button"
                        onClick={() => onSelectDoc(doc)}
                        className="flex w-full items-center gap-3 rounded-xl bg-app-bg/60 px-3 py-3 text-left transition-colors hover:bg-app-bg/80"
                        style={{
                          contentVisibility: "auto",
                          containIntrinsicSize: "88px",
                        }}
                      >
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-app-content-bg text-app-text-primary">
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
                            <span>
                              {new Date(doc.lastEditedAt).toLocaleDateString()}
                            </span>
                            {parentTitle ? (
                              <span className="truncate rounded-full bg-app-content-bg px-2 py-0.5">
                                {parentTitle}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-app-border bg-app-bg/40 px-5 py-10 text-center">
                <p className="text-sm font-medium text-app-text-primary">
                  {tDocs("sidebar.emptyTitle")}
                </p>
                <p className="mt-2 text-sm text-app-text-muted">
                  {tDocs("sidebar.emptyDescription")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {!projectId && projectRootDocs.length > 0 ? (
                  <div className="space-y-2">
                    <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-app-text-muted">
                      {tDocs("sidebar.projectSpaces")}
                    </div>
                    {projectRootDocs.map((doc) => (
                      <TreeNode
                        key={doc._id}
                        doc={doc}
                        level={0}
                        onSelectDoc={onSelectDoc}
                        expandedIds={expandedIds}
                        onToggleExpand={handleToggleExpand}
                        childrenByParent={childrenByParent}
                        newlyCreatedDocId={newlyCreatedDocId}
                        onNewDocCreated={setNewlyCreatedDocId}
                      />
                    ))}
                  </div>
                ) : null}

                {visibleRootDocs.length > 0 ? (
                  <div className="space-y-2">
                    <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-app-text-muted">
                      {!projectId && projectRootDocs.length > 0
                        ? tDocs("sidebar.otherSpaces")
                        : tDocs("overview.shared.workspaceTitle")}
                    </div>
                    {visibleRootDocs.map((doc) => (
                      <TreeNode
                        key={doc._id}
                        doc={doc}
                        level={0}
                        onSelectDoc={onSelectDoc}
                        expandedIds={expandedIds}
                        onToggleExpand={handleToggleExpand}
                        childrenByParent={childrenByParent}
                        newlyCreatedDocId={newlyCreatedDocId}
                        onNewDocCreated={setNewlyCreatedDocId}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
      </div>

      <DocCreateDialog
        open={isCreateRootDocDialogOpen}
        onOpenChange={setIsCreateRootDocDialogOpen}
        projectId={projectId}
        defaultTemplateKey={projectId ? "project-brief-v1" : "blank"}
        onCreated={(createdDoc) => setNewlyCreatedDocId(createdDoc._id)}
      />
    </>
  );
}
