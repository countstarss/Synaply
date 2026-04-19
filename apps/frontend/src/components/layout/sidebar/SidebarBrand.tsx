"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Users,
  Plus,
  Settings,
  LogOut,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useRouter } from "@/i18n/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import { InviteMemberDialog } from "@/components/dialogs/InviteMemberDialog";
import { CreateTeamDialog } from "@/components/dialogs/CreateTeamDialog";
import type { Team } from "@/lib/fetchers/team";

interface SidebarBrandProps {
  className?: string;
}

const SidebarBrand = ({ className }: SidebarBrandProps) => {
  const tShell = useTranslations("shell");
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { setCurrentWorkspaceId } = useWorkspaceStore();
  const {
    workspaces,
    currentWorkspace,
    currentWorkspaceContext,
    loading,
    error,
    refetch,
    switchWorkspace,
  } = useWorkspace();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);

  const fallbackWorkspaceName =
    user?.user_metadata.name ||
    user?.email?.split("@")[0] ||
    tShell("sidebar.brand.fallbackWorkspaceName");
  const displayWorkspace = currentWorkspace ?? {
    id: "fallback-workspace",
    name: fallbackWorkspaceName,
    type: "PERSONAL" as const,
    memberCount: 1,
    isActive: true,
    avatarUrl: user?.user_metadata.avatar_url,
  };
  const workspaceLoadFailed = !loading && !currentWorkspace;

  const handleLogout = async () => {
    await signOut();
  };

  const handleInviteMember = () => {
    setShowInviteDialog(true);
  };

  const handleCreateWorkspace = () => {
    setShowCreateTeamDialog(true);
  };

  const handleSettings = () => {
    router.push("/settings/general");
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    const targetWorkspace = workspaces.find((w) => w.id === workspaceId);
    const currentType = currentWorkspace?.type;
    const targetType = targetWorkspace?.type;
    switchWorkspace(workspaceId);

    if (currentType !== targetType) {
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }
  };

  const handleTeamCreated = async (team: Team) => {
    if (!team.workspace?.id) {
      return;
    }

    setCurrentWorkspaceId(team.workspace.id);
    localStorage.setItem("currentWorkspaceId", team.workspace.id);
    router.push(`/settings/team/${team.id}`);
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-3 p-4", className)}>
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1 flex items-center gap-4 pr-1">
          <div className="h-8 bg-gray-200 rounded animate-pulse flex-1 " />
          <ChevronDown className="h-4 w-4 text-muted-foreground animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="w-full px-2 pt-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between px-4 py-2 h-auto hover:bg-app-button-hover",
              className
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={displayWorkspace.avatarUrl} />
                <AvatarFallback className="bg-white text-black font-bold text-sm">
                  {displayWorkspace.type === "PERSONAL"
                    ? user?.user_metadata.name?.slice(0, 1) ||
                      user?.email?.slice(0, 1).toUpperCase()
                    : displayWorkspace.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start select-none">
                <span className="font-semibold text-lg truncate">
                  {displayWorkspace.type === "PERSONAL"
                    ? user?.user_metadata.name || user?.email?.split("@")[0]
                    : displayWorkspace.name.split(" ")[0]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {workspaceLoadFailed
                    ? tShell("sidebar.brand.loadFailed")
                    : displayWorkspace.type === "PERSONAL"
                      ? tShell("sidebar.brand.personal")
                      : tShell("sidebar.brand.team")}
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-72 p-2 bg-app-content-bg"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="px-1">
          {workspaceLoadFailed && (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-2">
                  <p>
                    {tShell("sidebar.brand.loadFailedDescription")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => void refetch()}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    {tShell("sidebar.brand.retry")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={displayWorkspace.avatarUrl} />
              <AvatarFallback className="bg-blue-500 text-white font-bold">
                {displayWorkspace.type === "PERSONAL"
                  ? user?.user_metadata.name?.slice(0, 1) ||
                    user?.email?.slice(0, 1).toUpperCase()
                  : displayWorkspace.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{displayWorkspace.name}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Users className="h-3 w-3" />
                <span>
                  {tShell("sidebar.brand.memberCount", {
                    count: displayWorkspace.memberCount || 1,
                  })}
                </span>
                {currentWorkspaceContext.canInviteMembers && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 py-0 text-xs"
                    onClick={handleInviteMember}
                  >
                    {tShell("sidebar.brand.inviteMember")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-2 py-2">
          <div className="text-sm text-muted-foreground">
            {user?.email || tShell("sidebar.brand.emailFallback")}
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="space-y-1">
          {workspaces.length > 0 ? (
            workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                className="flex items-center gap-3 px-2 py-2 cursor-pointer"
                onClick={() => handleSwitchWorkspace(workspace.id)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={workspace.avatarUrl} />
                  <AvatarFallback className="bg-gray-500 text-white text-xs">
                    {workspace.type === "PERSONAL"
                      ? user?.user_metadata.name?.slice(0, 1) ||
                        user?.email?.slice(0, 1).toUpperCase()
                      : workspace.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-sm">{workspace.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {workspace.type === "PERSONAL"
                      ? tShell("sidebar.brand.personal")
                      : tShell("sidebar.brand.team")}
                  </div>
                </div>
                {workspace.isActive && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-2 text-xs text-muted-foreground">
              {error
                ? tShell("sidebar.brand.workspaceListFailed")
                : tShell("sidebar.brand.workspaceEmpty")}
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex items-center gap-3 px-2 py-2 cursor-pointer"
          onClick={handleCreateWorkspace}
        >
          <Plus className="h-4 w-4" />
          <span>{tShell("sidebar.brand.createWorkspace")}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex items-center gap-3 px-2 py-2 cursor-pointer"
          onClick={handleSettings}
        >
          <Settings className="h-4 w-4" />
          <span>{tShell("sidebar.brand.settings")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-center gap-3 px-2 py-2 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>{tShell("sidebar.brand.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      {currentWorkspace?.type === "TEAM" && (
        <InviteMemberDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          teamName={currentWorkspace.name}
        />
      )}

      <CreateTeamDialog
        open={showCreateTeamDialog}
        onOpenChange={setShowCreateTeamDialog}
        onCreated={handleTeamCreated}
      />
    </DropdownMenu>
  );
};

export default SidebarBrand;
