"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWorkspace } from "@/hooks/useWorkspace";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  teamName,
}: InviteMemberDialogProps) {
  const tDialogs = useTranslations("dialogs");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { inviteMember } = useWorkspace();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      toast.error(tDialogs("inviteMember.validation.emailRequired"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast.error(tDialogs("inviteMember.validation.emailInvalid"));
      return;
    }

    setIsLoading(true);

    try {
      await inviteMember(normalizedEmail);

      toast.success(
        tDialogs("inviteMember.toasts.sent", {
          email: normalizedEmail,
          teamName,
        })
      );

      setEmail("");
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : tDialogs("inviteMember.toasts.sendFailed");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {tDialogs("inviteMember.title")}
          </DialogTitle>
          <DialogDescription>
            {tDialogs("inviteMember.description", { teamName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {tDialogs("inviteMember.emailLabel")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={tDialogs("inviteMember.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {tDialogs("inviteMember.emailHint")}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || !email.trim()}>
              {isLoading
                ? tDialogs("inviteMember.actions.sending")
                : tDialogs("inviteMember.actions.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
