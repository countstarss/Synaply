"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FolderKanban,
  Loader2,
  Save,
  Shield,
  Trash2,
  Upload,
  UserPlus,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { InviteMemberDialog } from "@/components/dialogs/InviteMemberDialog";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjects } from "@/hooks/useProjectApi";
import { useTeamById, useUpdateTeam } from "@/hooks/useTeam";
import { useWorkflows } from "@/hooks/useWorkflowApi";
import { useRouter } from "@/i18n/navigation";
import {
  createClientComponentClient,
  SUPABASE_AVATAR_BUCKET,
} from "@/lib/supabase";
import type { Team } from "@/lib/fetchers/team";
import { useWorkspaceStore } from "@/stores/workspace";

const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const getInitials = (team?: Pick<Team, "name"> | null) => {
  const source = team?.name?.trim() || "T";
  return source.charAt(0).toUpperCase();
};

interface UploadedTeamAvatarState {
  fileName: string;
  path: string;
  url: string;
}

const createTeamAvatarPath = (
  userId: string,
  teamId: string,
  fileName: string,
) => {
  const normalizedFileName = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const safeFileName = normalizedFileName || "avatar";
  const uniqueId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`;

  return `${userId}/teams/${teamId}/${uniqueId}-${safeFileName}`;
};

const getStoragePathFromUrl = (avatarUrl: string | null) => {
  if (!avatarUrl) {
    return null;
  }

  const cleanUrl = avatarUrl.split("?")[0];
  const bucketMarker = `/storage/v1/object/public/${SUPABASE_AVATAR_BUCKET}/`;
  const markerIndex = cleanUrl.indexOf(bucketMarker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(cleanUrl.slice(markerIndex + bucketMarker.length));
};

const resolveTeamErrorMessage = (
  error: unknown,
  tSettings: (key: string) => string,
) => {
  if (!(error instanceof Error)) {
    return tSettings("teamPage.errors.updateFailed");
  }

  if (error.message.includes("Bucket not found")) {
    return tSettings("teamPage.errors.bucketMissing");
  }

  if (error.message.includes("row-level security policy")) {
    return tSettings("teamPage.errors.storageBlocked");
  }

  return error.message;
};

export default function TeamSettingsPage() {
  const tSettings = useTranslations("settings");
  const router = useRouter();
  const params = useParams<{ teamId: string }>();
  const teamId = Array.isArray(params.teamId) ? params.teamId[0] : params.teamId;
  const { session, loading: authLoading } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { setCurrentWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const supabase = React.useMemo(() => createClientComponentClient(), []);
  const initializedTeamIdRef = React.useRef<string | null>(null);

  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);
  const [teamName, setTeamName] = React.useState("");
  const [savedTeamName, setSavedTeamName] = React.useState("");
  const [storedAvatarUrl, setStoredAvatarUrl] = React.useState<string | null>(
    null,
  );
  const [pendingUploadedAvatar, setPendingUploadedAvatar] =
    React.useState<UploadedTeamAvatarState | null>(null);
  const [avatarMarkedForRemoval, setAvatarMarkedForRemoval] =
    React.useState(false);

  const teamQuery = useTeamById(teamId);
  const updateTeamMutation = useUpdateTeam(teamId);
  const currentTeam = teamQuery.data;
  const teamWorkspaceId = currentTeam?.workspace?.id;
  const { data: projects = [] } = useProjects(teamWorkspaceId || "", {
    enabled: !!teamWorkspaceId,
  });
  const { data: workflows = [] } = useWorkflows(teamWorkspaceId);

  const ensureTeamWorkspaceSelected = React.useCallback(() => {
    if (!teamWorkspaceId) {
      return;
    }

    setCurrentWorkspaceId(teamWorkspaceId);
    localStorage.setItem("currentWorkspaceId", teamWorkspaceId);
  }, [setCurrentWorkspaceId, teamWorkspaceId]);

  React.useEffect(() => {
    if (!teamWorkspaceId || currentWorkspace?.id === teamWorkspaceId) {
      return;
    }

    ensureTeamWorkspaceSelected();
  }, [currentWorkspace?.id, ensureTeamWorkspaceSelected, teamWorkspaceId]);

  React.useEffect(() => {
    const team = currentTeam;

    if (!team?.id || initializedTeamIdRef.current === team.id) {
      return;
    }

    initializedTeamIdRef.current = team.id;
    setTeamName(team.name);
    setSavedTeamName(team.name);
    setStoredAvatarUrl(team.avatarUrl ?? null);
    setPendingUploadedAvatar(null);
    setAvatarMarkedForRemoval(false);
  }, [currentTeam]);

  const uploadAvatarMutation = useMutation({
    onMutate: (file: File) => {
      const toastId = toast.loading(
        tSettings("teamPage.toasts.uploading", { fileName: file.name }),
      );
      return { toastId };
    },
    mutationFn: async (file: File) => {
      if (!session?.user?.id || !teamId) {
        throw new Error(tSettings("teamPage.errors.sessionExpired"));
      }

      if (pendingUploadedAvatar?.path) {
        const { error: cleanupError } = await supabase.storage
          .from(SUPABASE_AVATAR_BUCKET)
          .remove([pendingUploadedAvatar.path]);

        if (cleanupError) {
          console.warn("Failed to clean up the pending team avatar:", cleanupError);
        }
      }

      const nextPath = createTeamAvatarPath(session.user.id, teamId, file.name);
      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_AVATAR_BUCKET)
        .upload(nextPath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          uploadError.message || tSettings("teamPage.errors.uploadFailed"),
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_AVATAR_BUCKET)
        .getPublicUrl(nextPath);

      return {
        fileName: file.name,
        path: nextPath,
        url: `${publicUrlData.publicUrl}?v=${Date.now()}`,
      } satisfies UploadedTeamAvatarState;
    },
    onSuccess: (uploadedAvatar, _file, context) => {
      setPendingUploadedAvatar(uploadedAvatar);
      setAvatarMarkedForRemoval(false);
      toast.success(tSettings("teamPage.toasts.uploadSuccess"), {
        id: context?.toastId,
      });
    },
    onError: (error, _file, context) => {
      toast.error(resolveTeamErrorMessage(error, tSettings), {
        id: context?.toastId,
      });
    },
  });

  const handleAvatarSelection = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
        toast.error(tSettings("teamPage.validation.invalidType"));
        return;
      }

      if (file.size > MAX_AVATAR_SIZE_BYTES) {
        toast.error(tSettings("teamPage.validation.fileTooLarge"));
        return;
      }

      uploadAvatarMutation.mutate(file);
    },
    [tSettings, uploadAvatarMutation],
  );

  const handleRemoveAvatar = React.useCallback(() => {
    if (uploadAvatarMutation.isPending || updateTeamMutation.isPending) {
      return;
    }

    if (pendingUploadedAvatar) {
      void supabase.storage
        .from(SUPABASE_AVATAR_BUCKET)
        .remove([pendingUploadedAvatar.path])
        .then(({ error }) => {
          if (error) {
            console.warn("Failed to clean up the pending team avatar:", error);
          }
        });

      setPendingUploadedAvatar(null);
      setAvatarMarkedForRemoval(false);
      toast.success(tSettings("teamPage.toasts.cancelNewAvatar"));
      return;
    }

    if (avatarMarkedForRemoval) {
      setAvatarMarkedForRemoval(false);
      toast.success(tSettings("teamPage.toasts.undoRemoveAvatar"));
      return;
    }

    if (!storedAvatarUrl) {
      return;
    }

    setAvatarMarkedForRemoval(true);
    toast.success(tSettings("teamPage.toasts.markRemoveAvatar"));
  }, [
    avatarMarkedForRemoval,
    pendingUploadedAvatar,
    storedAvatarUrl,
    supabase.storage,
    tSettings,
    updateTeamMutation.isPending,
    uploadAvatarMutation.isPending,
  ]);

  const currentMember = currentTeam?.members.find(
    (member) => member.user.id === session?.user?.id,
  );
  const currentRoleLabel = tSettings(
    `members.roles.${currentMember?.role ?? "MEMBER"}`,
  );
  const canManageTeam =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
  const invitedMemberCount = currentTeam?.members.length ?? 0;
  const hasInvitedTeammates = invitedMemberCount > 1;
  const hasCreatedProject = projects.length > 0;
  const hasCreatedWorkflow = workflows.length > 0;
  const onboardingSteps = [
    {
      key: "invite",
      complete: hasInvitedTeammates,
      title: tSettings("teamPage.onboarding.steps.invite.title"),
      description: tSettings("teamPage.onboarding.steps.invite.description", {
        count: invitedMemberCount,
      }),
      actionLabel: tSettings("teamPage.onboarding.steps.invite.action"),
      onAction: () => {
        ensureTeamWorkspaceSelected();
        setIsInviteDialogOpen(true);
      },
      disabled: !canManageTeam || !teamWorkspaceId,
    },
    {
      key: "project",
      complete: hasCreatedProject,
      title: tSettings("teamPage.onboarding.steps.project.title"),
      description: tSettings("teamPage.onboarding.steps.project.description", {
        count: projects.length,
      }),
      actionLabel: tSettings("teamPage.onboarding.steps.project.action"),
      onAction: () => {
        ensureTeamWorkspaceSelected();
        router.push("/projects?intent=create-project");
      },
      disabled: !canManageTeam || !teamWorkspaceId,
    },
    {
      key: "workflow",
      complete: hasCreatedWorkflow,
      title: tSettings("teamPage.onboarding.steps.workflow.title"),
      description: tSettings("teamPage.onboarding.steps.workflow.description", {
        count: workflows.length,
      }),
      actionLabel: tSettings("teamPage.onboarding.steps.workflow.action"),
      onAction: () => {
        ensureTeamWorkspaceSelected();
        router.push("/workflows?intent=create-workflow");
      },
      disabled: !canManageTeam || !teamWorkspaceId,
    },
  ] as const;
  const completedOnboardingStepCount = onboardingSteps.filter(
    (step) => step.complete,
  ).length;
  const shouldShowOnboarding =
    completedOnboardingStepCount < onboardingSteps.length;
  const normalizedTeamName = teamName.trim();
  const teamPageTitle =
    normalizedTeamName || currentTeam?.name || tSettings("teamPage.info.untitled");
  const hasAvatarChange = avatarMarkedForRemoval || !!pendingUploadedAvatar;
  const isDirty =
    normalizedTeamName !== savedTeamName.trim() || hasAvatarChange;
  const resolvedAvatarUrl = avatarMarkedForRemoval
    ? null
    : pendingUploadedAvatar?.url ?? storedAvatarUrl ?? null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canManageTeam) {
      toast.error(tSettings("teamPage.validation.permissionDenied"));
      return;
    }

    if (!normalizedTeamName) {
      toast.error(tSettings("teamPage.validation.nameRequired"));
      return;
    }

    if (!session?.access_token || !teamId) {
      toast.error(tSettings("teamPage.errors.sessionExpired"));
      return;
    }

    if (uploadAvatarMutation.isPending) {
      toast.error(tSettings("teamPage.validation.uploadPending"));
      return;
    }

    const toastId = toast.loading(tSettings("teamPage.toasts.saving"));

    try {
      const nextAvatarUrl = avatarMarkedForRemoval
        ? null
        : pendingUploadedAvatar?.url ?? storedAvatarUrl;

      const updatedTeam = await updateTeamMutation.mutateAsync({
        name: normalizedTeamName,
        avatarUrl: nextAvatarUrl,
      });

      const previousStoredAvatarPath = getStoragePathFromUrl(storedAvatarUrl);
      const nextAvatarPath = pendingUploadedAvatar?.path ?? null;

      queryClient.setQueryData(["team", teamId], updatedTeam);
      setTeamName(updatedTeam.name);
      setSavedTeamName(updatedTeam.name);
      setStoredAvatarUrl(updatedTeam.avatarUrl ?? null);
      setPendingUploadedAvatar(null);
      setAvatarMarkedForRemoval(false);

      if (
        previousStoredAvatarPath &&
        ((avatarMarkedForRemoval && previousStoredAvatarPath) ||
          (nextAvatarPath && previousStoredAvatarPath !== nextAvatarPath))
      ) {
        void supabase.storage
          .from(SUPABASE_AVATAR_BUCKET)
          .remove([previousStoredAvatarPath])
          .then(({ error }) => {
            if (error) {
              console.warn("Failed to clean up the previous team avatar:", error);
            }
          });
      }

      toast.success(tSettings("teamPage.toasts.saveSuccess"), { id: toastId });
    } catch (error) {
      toast.error(resolveTeamErrorMessage(error, tSettings), { id: toastId });
    }
  };

  if (!teamId) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("teamPage.states.missingTeamTitle")}</CardTitle>
            <CardDescription>
              {tSettings("teamPage.states.missingTeamDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session && !authLoading) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("teamPage.states.authRequiredTitle")}</CardTitle>
            <CardDescription>
              {tSettings("teamPage.states.authRequiredDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (authLoading || teamQuery.isLoading) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {tSettings("teamPage.states.loading")}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (teamQuery.error || !currentTeam) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("teamPage.states.loadFailedTitle")}</CardTitle>
            <CardDescription>
              {(teamQuery.error as Error)?.message ||
                tSettings("teamPage.states.loadFailedDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isAvatarOperationPending =
    uploadAvatarMutation.isPending || (updateTeamMutation.isPending && hasAvatarChange);
  const avatarStatusMessage = uploadAvatarMutation.isPending
    ? tSettings("teamPage.avatar.statusUploading")
    : pendingUploadedAvatar
      ? tSettings("teamPage.avatar.statusUploaded", {
          fileName: pendingUploadedAvatar.fileName,
        })
    : avatarMarkedForRemoval
      ? tSettings("teamPage.avatar.statusMarked")
      : tSettings("teamPage.avatar.statusHint");

  return (
    <div className="flex flex-col space-y-6 p-4 max-w-5xl mx-auto">
      <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_42%),linear-gradient(135deg,_rgba(10,37,64,0.96),_rgba(15,118,110,0.88))] text-white">
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {teamPageTitle}
          </CardTitle>
          <CardDescription className="max-w-2xl text-emerald-50/80">
            {tSettings("teamPage.hero.description")}
          </CardDescription>
        </CardHeader>
      </Card>

      {!canManageTeam && (
        <Card className="border-none">
          <CardContent className="flex items-start gap-3 py-5 text-sm text-muted-foreground">
            <Shield className="mt-0.5 size-4 shrink-0" />
            <div>
              {tSettings("teamPage.permissionBanner.message", {
                role: currentRoleLabel,
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {shouldShowOnboarding && (
        <Card className="border-none">
          <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle>{tSettings("teamPage.onboarding.title")}</CardTitle>
              <CardDescription>
                {tSettings("teamPage.onboarding.description")}
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {tSettings("teamPage.onboarding.progress", {
                completed: completedOnboardingStepCount,
                total: onboardingSteps.length,
              })}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {onboardingSteps.map((step) => (
              <div
                key={step.key}
                className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  {step.complete ? (
                    <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                  ) : (
                    <CircleDashed className="mt-0.5 size-5 text-muted-foreground" />
                  )}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{step.title}</div>
                      <Badge variant={step.complete ? "default" : "outline"}>
                        {tSettings(
                          step.complete
                            ? "teamPage.onboarding.status.done"
                            : "teamPage.onboarding.status.pending",
                        )}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {step.description}
                    </div>
                  </div>
                </div>
                {!step.complete && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={step.onAction}
                    disabled={step.disabled}
                    className="shrink-0"
                  >
                    {step.key === "invite" ? (
                      <UserPlus className="size-4" />
                    ) : step.key === "project" ? (
                      <FolderKanban className="size-4" />
                    ) : (
                      <Workflow className="size-4" />
                    )}
                    {step.actionLabel}
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("teamPage.avatar.title")}</CardTitle>
            <CardDescription>
              {tSettings("teamPage.avatar.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 pb-6 md:grid-cols-[auto,1fr] md:items-center">
            <div className="relative">
              <Avatar className="size-24 border border-border/70 shadow-sm">
                <AvatarImage src={resolvedAvatarUrl ?? undefined} alt={currentTeam.name} />
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(currentTeam)}
                </AvatarFallback>
              </Avatar>
              {isAvatarOperationPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">
                  {tSettings("teamPage.avatar.recommendation")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {avatarStatusMessage}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelection}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    uploadAvatarMutation.isPending ||
                    updateTeamMutation.isPending ||
                    !canManageTeam
                  }
                >
                  {uploadAvatarMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {uploadAvatarMutation.isPending
                    ? tSettings("teamPage.avatar.uploading")
                    : tSettings("teamPage.avatar.upload")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveAvatar}
                  disabled={
                    uploadAvatarMutation.isPending ||
                    updateTeamMutation.isPending ||
                    !canManageTeam ||
                    (!storedAvatarUrl &&
                      !pendingUploadedAvatar &&
                      !avatarMarkedForRemoval)
                  }
                >
                  <Trash2 className="size-4" />
                  {pendingUploadedAvatar
                    ? tSettings("teamPage.avatar.cancelNew")
                    : avatarMarkedForRemoval
                      ? tSettings("teamPage.avatar.undoRemove")
                      : tSettings("teamPage.avatar.remove")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("teamPage.info.title")}</CardTitle>
            <CardDescription>
              {tSettings("teamPage.info.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="team-name">{tSettings("teamPage.info.nameLabel")}</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                maxLength={100}
                placeholder={tSettings("teamPage.info.namePlaceholder")}
                disabled={updateTeamMutation.isPending || !canManageTeam}
              />
            </div>

            <Separator />

            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="team-created-at">
                  {tSettings("teamPage.info.createdAtLabel")}
                </Label>
                <Input
                  id="team-created-at"
                  value={format(new Date(currentTeam.createdAt), "yyyy-MM-dd HH:mm")}
                  readOnly
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-members-count">
                  {tSettings("teamPage.info.membersCountLabel")}
                </Label>
                <Input
                  id="team-members-count"
                  value={`${currentTeam.members.length}`}
                  readOnly
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-role">
                  {tSettings("teamPage.info.roleLabel")}
                </Label>
                <Input
                  id="team-role"
                  value={currentRoleLabel}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              {!canManageTeam
                ? tSettings("teamPage.info.readOnly")
                : isDirty
                  ? tSettings("teamPage.info.dirty")
                  : tSettings("teamPage.info.clean")}
            </div>

            <Button
              type="submit"
              disabled={
                !canManageTeam ||
                !isDirty ||
                uploadAvatarMutation.isPending ||
                updateTeamMutation.isPending
              }
            >
              {updateTeamMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {tSettings("teamPage.info.save")}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <InviteMemberDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        teamName={currentTeam.name}
      />
    </div>
  );
}
