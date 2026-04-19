"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2, Plus, Users } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTeam } from "@/hooks/useTeam";
import { CreateTeamDialog } from "@/components/dialogs/CreateTeamDialog";
import { useRouter } from "@/i18n/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Team } from "@/lib/fetchers/team";

const getInitials = (teamName: string) => {
  const normalized = teamName.trim();
  return normalized ? normalized.charAt(0).toUpperCase() : "T";
};

export default function TeamsSettingsSection() {
  const tSettings = useTranslations("settings");
  const router = useRouter();
  const { setCurrentWorkspaceId } = useWorkspaceStore();
  const { teams = [], isLoadingTeams, teamsError } = useTeam();
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = React.useState(false);

  const activateTeamWorkspace = React.useCallback(
    (team: Team) => {
      if (!team.workspace?.id) {
        return;
      }

      setCurrentWorkspaceId(team.workspace.id);
      localStorage.setItem("currentWorkspaceId", team.workspace.id);
    },
    [setCurrentWorkspaceId],
  );

  const openTeamSettings = React.useCallback(
    (team: Team) => {
      activateTeamWorkspace(team);
      router.push(`/settings/team/${team.id}`);
    },
    [activateTeamWorkspace, router],
  );

  const handleTeamCreated = React.useCallback(
    async (team: Team) => {
      openTeamSettings(team);
    },
    [openTeamSettings],
  );

  return (
    <div className="space-y-5 py-1">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {tSettings("teams.description")}
        </div>
        <Button type="button" onClick={() => setIsCreateTeamDialogOpen(true)}>
          <Plus className="size-4" />
          {tSettings("teams.create")}
        </Button>
      </div>

      {isLoadingTeams ? (
        <Card className="border-none">
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {tSettings("teams.loading")}
          </CardContent>
        </Card>
      ) : teamsError ? (
        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("teams.loadFailedTitle")}</CardTitle>
            <CardDescription>
              {(teamsError as Error).message ||
                tSettings("teams.loadFailedDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : teams.length === 0 ? (
        <Card className="border-none">
          <CardContent className="flex flex-col items-start gap-4 py-10">
            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
              <Users className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold">
                {tSettings("teams.emptyTitle")}
              </div>
              <div className="text-sm text-muted-foreground">
                {tSettings("teams.emptyDescription")}
              </div>
            </div>
            <Button type="button" onClick={() => setIsCreateTeamDialogOpen(true)}>
              <Plus className="size-4" />
              {tSettings("teams.create")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="border-none transition-colors hover:bg-accent/40"
            >
              <CardContent className="flex h-full flex-col gap-5 p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="size-12 border border-border/70">
                    <AvatarImage src={team.avatarUrl ?? undefined} alt={team.name} />
                    <AvatarFallback>{getInitials(team.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold">
                      {team.name}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {tSettings("teams.membersCount", {
                        count: team.members.length,
                      })}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-auto justify-between"
                  onClick={() => openTeamSettings(team)}
                >
                  {tSettings("teams.open")}
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamDialog
        open={isCreateTeamDialogOpen}
        onOpenChange={setIsCreateTeamDialogOpen}
        onCreated={handleTeamCreated}
      />
    </div>
  );
}
