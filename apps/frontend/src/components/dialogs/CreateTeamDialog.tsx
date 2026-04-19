"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/hooks/useTeam";
import { toast } from "sonner";
import { Users } from "lucide-react";
import type { Team } from "@/lib/fetchers/team";
import { useTranslations } from "next-intl";

interface CreateTeamDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (team: Team) => void | Promise<void>;
}

export const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({
  children,
  open,
  onOpenChange,
  onCreated,
}) => {
  const tDialogs = useTranslations("dialogs");
  const tCommon = useTranslations("common");
  const [internalOpen, setInternalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const { createTeam, isCreatingTeam } = useTeam();
  const resolvedOpen = open ?? internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      setTeamName("");
    }

    onOpenChange?.(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error(tDialogs("createTeam.validation.nameRequired"));
      return;
    }

    try {
      const createdTeam = await createTeam({ name: teamName.trim() });
      toast.success(tDialogs("createTeam.toasts.created"));
      handleOpenChange(false);
      await onCreated?.(createdTeam);
    } catch (error) {
      console.error("Failed to create team:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : tDialogs("createTeam.toasts.createFailed"),
      );
    }
  };

  return (
    <Dialog open={resolvedOpen} onOpenChange={handleOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {tDialogs("createTeam.title")}
          </DialogTitle>
          <DialogDescription>
            {tDialogs("createTeam.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">{tDialogs("createTeam.nameLabel")}</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={tDialogs("createTeam.namePlaceholder")}
              disabled={isCreatingTeam}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreatingTeam}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isCreatingTeam}>
              {isCreatingTeam
                ? tDialogs("createTeam.actions.creating")
                : tDialogs("createTeam.actions.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
