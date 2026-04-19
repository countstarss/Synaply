"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  removeTeamMember,
  updateTeamMemberRole,
  type TeamMember,
} from "@/lib/fetchers/team";

const ROLE_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
};

const resolveMemberUserId = (member: TeamMember) =>
  member.user?.id ?? member.userId;

export default function MembersSettingsSection() {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const { session } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const teamId = currentWorkspace?.teamId;
  const queryClient = useQueryClient();
  const { data: members, isLoading, error } = useTeamMembers(teamId);
  const [pendingRemoveMember, setPendingRemoveMember] =
    React.useState<TeamMember | null>(null);

  const currentMember = members?.find((member) => {
    const memberUserId = resolveMemberUserId(member);
    return memberUserId === session?.user?.id;
  });
  const isOwner = currentMember?.role === "OWNER";
  const roleLabels = {
    OWNER: tSettings("members.roles.OWNER"),
    ADMIN: tSettings("members.roles.ADMIN"),
    MEMBER: tSettings("members.roles.MEMBER"),
  } as const;

  const updateRoleMutation = useMutation({
    mutationFn: (payload: {
      memberUserId: string;
      role: "OWNER" | "ADMIN" | "MEMBER";
    }) =>
      updateTeamMemberRole(
        teamId || "",
        payload.memberUserId,
        payload.role,
        session?.access_token || "",
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberUserId: string) =>
      removeTeamMember(teamId || "", memberUserId, session?.access_token || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    },
  });

  const handleConfirmRemoveMember = () => {
    if (!pendingRemoveMember) return;
    const memberUserId = resolveMemberUserId(pendingRemoveMember);
    if (!memberUserId) return;
    removeMemberMutation.mutate(memberUserId);
    setPendingRemoveMember(null);
  };

  if (!teamId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{tSettings("members.noTeam.title")}</CardTitle>
            <CardDescription>
              {tSettings("members.noTeam.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {tSettings("members.noTeam.body")}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 py-1">
      {!isOwner && (
        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("members.notOwner.title")}</CardTitle>
            <CardDescription>
              {tSettings("members.notOwner.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {tSettings("members.notOwner.body")}
          </CardContent>
        </Card>
      )}

      <Card className="border-none">
        <CardHeader>
          <CardTitle>{tSettings("members.list.title")}</CardTitle>
          <CardDescription>
            {tSettings("members.list.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pb-6">
          {isLoading && (
            <div className="text-sm text-muted-foreground">
              {tSettings("members.list.loading")}
            </div>
          )}
          {error && (
            <div className="text-sm text-destructive">
              {(error as Error).message || tSettings("members.list.loadFailed")}
            </div>
          )}
          {members?.map((member) => {
            const memberUserId = resolveMemberUserId(member);
            const isSelf = memberUserId === session?.user?.id;
            return (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-md border p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {member.user?.name ||
                        member.user?.email ||
                        tSettings("members.list.unknownMember")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.user?.email}
                    </div>
                  </div>
                  <Badge variant={ROLE_BADGE[member.role]}>{roleLabels[member.role]}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {tSettings("members.list.joinedAt", {
                    value: format(new Date(member.createdAt), "PPpp"),
                  })}
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      memberUserId &&
                      updateRoleMutation.mutate({
                        memberUserId,
                        role: value as "OWNER" | "ADMIN" | "MEMBER",
                      })
                    }
                    disabled={
                      !isOwner ||
                      isSelf ||
                      updateRoleMutation.isPending ||
                      !memberUserId
                    }
                  >
                    <SelectTrigger size="sm" className="w-[160px]">
                      <SelectValue
                        placeholder={tSettings("members.list.rolePlaceholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">{roleLabels.OWNER}</SelectItem>
                      <SelectItem value="ADMIN">{roleLabels.ADMIN}</SelectItem>
                      <SelectItem value="MEMBER">{roleLabels.MEMBER}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      !isOwner ||
                      isSelf ||
                      removeMemberMutation.isPending ||
                      !memberUserId
                    }
                    onClick={() => setPendingRemoveMember(member)}
                  >
                    {tSettings("members.list.remove")}
                  </Button>
                  {isSelf && (
                    <span className="text-xs text-muted-foreground">
                      {tSettings("members.list.selfRestriction")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2">
          {(updateRoleMutation.error || removeMemberMutation.error) && (
            <div className="text-sm text-destructive">
              {(updateRoleMutation.error as Error)?.message ||
                (removeMemberMutation.error as Error)?.message ||
                tSettings("members.list.actionFailed")}
            </div>
          )}
        </CardFooter>
      </Card>
      </div>

      <Dialog
        open={Boolean(pendingRemoveMember)}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tSettings("members.removeDialog.title")}</DialogTitle>
            <DialogDescription>
              {tSettings("members.removeDialog.description", {
                name:
                  pendingRemoveMember?.user?.email ||
                  pendingRemoveMember?.user?.name ||
                  tSettings("members.removeDialog.fallbackName"),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRemoveMember(null)}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRemoveMember}
            >
              {tSettings("members.removeDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
