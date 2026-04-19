"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import SidebarSection from "./SidebarSection";

interface UtilityShortcut {
  id: string;
  label: string;
  route: string;
}

type ShortcutDialogState =
  | { mode: "create" }
  | { mode: "edit"; shortcut: UtilityShortcut }
  | null;

const MAX_UTILITY_SHORTCUTS = 5;
const STORAGE_KEY_PREFIX = "synaply:sidebar-utils-shortcuts:v2";

const buildStorageKey = (userId: string, workspaceId: string) =>
  `${STORAGE_KEY_PREFIX}:${userId}:${workspaceId}`;

const isExternalRoute = (route: string) => {
  const trimmedRoute = route.trim();

  return (
    /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedRoute) ||
    trimmedRoute.startsWith("//")
  );
};

const normalizeRoute = (route: string) => {
  const trimmedRoute = route.trim();

  if (!trimmedRoute) {
    return "";
  }

  return trimmedRoute.startsWith("/") ? trimmedRoute : `/${trimmedRoute}`;
};

const normalizeShortcutLabel = (label: string, fallbackRoute: string) => {
  const trimmedLabel = label.trim();

  return trimmedLabel || fallbackRoute;
};

const createShortcutId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const readStoredShortcuts = (storageKey: string): UtilityShortcut[] => {
  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .reduce<UtilityShortcut[]>((validShortcuts, item) => {
        if (typeof item?.id !== "string" || typeof item?.route !== "string") {
          return validShortcuts;
        }

        if (isExternalRoute(item.route)) {
          return validShortcuts;
        }

        const normalizedRoute = normalizeRoute(item.route);

        if (!normalizedRoute) {
          return validShortcuts;
        }

        validShortcuts.push({
          id: item.id,
          label:
            typeof item.label === "string"
              ? normalizeShortcutLabel(item.label, normalizedRoute)
              : normalizedRoute,
          route: normalizedRoute,
        });

        return validShortcuts;
      }, [])
      .slice(0, MAX_UTILITY_SHORTCUTS);
  } catch (error) {
    console.error("Failed to read sidebar shortcuts:", error);
    return [];
  }
};

const UtilsSidebarSection = () => {
  const tShell = useTranslations("shell");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const userId = user?.id ?? null;
  const workspaceId = currentWorkspace?.id ?? null;
  const storageKey = useMemo(
    () => (userId && workspaceId ? buildStorageKey(userId, workspaceId) : null),
    [userId, workspaceId],
  );

  const [shortcuts, setShortcuts] = useState<UtilityShortcut[]>([]);
  const [hasLoadedShortcuts, setHasLoadedShortcuts] = useState(false);
  const [dialogState, setDialogState] = useState<ShortcutDialogState>(null);
  const [labelInput, setLabelInput] = useState("");
  const [routeInput, setRouteInput] = useState("");
  const canAddShortcut =
    storageKey !== null && shortcuts.length < MAX_UTILITY_SHORTCUTS;
  const isDialogOpen = dialogState !== null;

  useEffect(() => {
    if (!storageKey) {
      setShortcuts([]);
      setHasLoadedShortcuts(false);
      return;
    }

    setShortcuts(readStoredShortcuts(storageKey));
    setHasLoadedShortcuts(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoadedShortcuts || !storageKey) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(shortcuts));
    } catch (error) {
      console.error("Failed to save sidebar shortcuts:", error);
    }
  }, [hasLoadedShortcuts, shortcuts, storageKey]);

  const dialogCopy = useMemo(() => {
    if (dialogState?.mode === "edit") {
      return {
        title: tShell("sidebar.utils.dialog.editTitle"),
        description: tShell("sidebar.utils.dialog.editDescription"),
        submitLabel: tShell("sidebar.utils.dialog.save"),
      };
    }

    return {
      title: tShell("sidebar.utils.dialog.createTitle"),
      description: tShell("sidebar.utils.dialog.createDescription"),
      submitLabel: tShell("sidebar.utils.dialog.add"),
    };
  }, [dialogState, tShell]);

  const routeExists = (route: string, ignoredShortcutId?: string) =>
    shortcuts.some(
      (shortcut) =>
        shortcut.route === route && shortcut.id !== ignoredShortcutId,
    );

  const handleOpenAddDialog = () => {
    if (!canAddShortcut || !storageKey) {
      return;
    }

    setLabelInput("");
    setRouteInput("");
    setDialogState({ mode: "create" });
  };

  const handleOpenEditDialog = (shortcut: UtilityShortcut) => {
    setLabelInput(shortcut.label);
    setRouteInput(shortcut.route);
    setDialogState({ mode: "edit", shortcut });
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDialogState(null);
      setLabelInput("");
      setRouteInput("");
    }
  };

  const handleSubmitShortcutDialog = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!dialogState) {
      return;
    }

    const normalizedRoute = normalizeRoute(routeInput);

    if (!normalizedRoute) {
      toast.error(tShell("sidebar.utils.validation.routeRequired"));
      return;
    }

    if (isExternalRoute(routeInput)) {
      toast.error(tShell("sidebar.utils.validation.routeInternalOnly"));
      return;
    }

    if (
      routeExists(
        normalizedRoute,
        dialogState.mode === "edit" ? dialogState.shortcut.id : undefined,
      )
    ) {
      toast.error(tShell("sidebar.utils.validation.duplicateRoute"));
      return;
    }

    const nextLabel = normalizeShortcutLabel(labelInput, normalizedRoute);

    if (dialogState.mode === "edit") {
      setShortcuts((currentShortcuts) =>
        currentShortcuts.map((shortcut) =>
          shortcut.id === dialogState.shortcut.id
            ? { ...shortcut, label: nextLabel, route: normalizedRoute }
            : shortcut,
        ),
      );
      handleDialogOpenChange(false);
      return;
    }

    if (!canAddShortcut) {
      toast.error(tShell("sidebar.utils.validation.maxReached"));
      return;
    }

    setShortcuts((currentShortcuts) => [
      ...currentShortcuts,
      {
        id: createShortcutId(),
        label: nextLabel,
        route: normalizedRoute,
      },
    ]);
    handleDialogOpenChange(false);
  };

  const handleRemoveShortcut = (shortcutId: string) => {
    setShortcuts((currentShortcuts) =>
      currentShortcuts.filter((shortcut) => shortcut.id !== shortcutId),
    );
  };

  const handleNavigateToShortcut = (route: string) => {
    router.push(route);
  };

  if (!storageKey) {
    return null;
  }

  return (
    <>
      <SidebarSection title={tShell("sidebar.utils.title")}>
        <div className="flex flex-col gap-1">
          {shortcuts.map((shortcut) => {
            const shortcutButton = (
              <button
                type="button"
                onClick={() => handleNavigateToShortcut(shortcut.route)}
                className={cn(
                  "mx-2 flex min-w-0 items-center gap-3 rounded-md px-4 py-2 text-left text-gray-600 transition-colors hover:bg-[#2b2b2b] hover:text-white",
                  "dark:text-gray-300 dark:hover:text-white",
                )}
                title={shortcut.route}
              >
                <Wrench className="size-4 shrink-0" />
                <span className="truncate text-sm font-medium">
                  {shortcut.label}
                </span>
              </button>
            );

            return (
              <ContextMenu key={shortcut.id}>
                <ContextMenuTrigger asChild>{shortcutButton}</ContextMenuTrigger>
                <ContextMenuContent className="w-40">
                  <ContextMenuItem
                    onSelect={() => handleOpenEditDialog(shortcut)}
                  >
                    <Pencil />
                    {tCommon("actions.edit")}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    variant="destructive"
                    onSelect={() => handleRemoveShortcut(shortcut.id)}
                  >
                    <Trash2 />
                    {tCommon("actions.delete")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}

          {canAddShortcut ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mx-2 justify-start text-muted-foreground"
              onClick={handleOpenAddDialog}
            >
              <Plus data-icon="inline-start" />
              {tShell("sidebar.utils.actions.addShortcut")}
            </Button>
          ) : null}
        </div>
      </SidebarSection>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogCopy.title}</DialogTitle>
            <DialogDescription>{dialogCopy.description}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitShortcutDialog}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="utility-shortcut-label">
                {tShell("sidebar.utils.fields.label")}
              </Label>
              <Input
                id="utility-shortcut-label"
                value={labelInput}
                onChange={(event) => setLabelInput(event.target.value)}
                placeholder={tShell("sidebar.utils.fields.labelPlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="utility-shortcut-route">
                {tShell("sidebar.utils.fields.route")}
              </Label>
              <Input
                id="utility-shortcut-route"
                value={routeInput}
                onChange={(event) => setRouteInput(event.target.value)}
                placeholder={tShell("sidebar.utils.fields.routePlaceholder")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
              >
                {tCommon("actions.cancel")}
              </Button>
              <Button type="submit">{dialogCopy.submitLabel}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UtilsSidebarSection;
