"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCurrentUser,
  getUserNameFallback,
  updateCurrentUser,
  type UserInfo,
} from "@/lib/fetchers/user";
import {
  createClientComponentClient,
  SUPABASE_AVATAR_BUCKET,
} from "@/lib/supabase";

const CURRENT_USER_QUERY_KEY = ["current-user-profile"] as const;
const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const getInitials = (profile?: Pick<UserInfo, "name" | "email"> | null) => {
  const nameSource = profile?.name?.trim();
  const emailSource = profile?.email ? getUserNameFallback(profile.email) : "U";
  const firstCharacter = (nameSource || emailSource).charAt(0);
  return firstCharacter ? firstCharacter.toUpperCase() : "U";
};

interface UploadedAvatarState {
  fileName: string;
  path: string;
  url: string;
}

const createAvatarPath = (userId: string, fileName: string) => {
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

  return `${userId}/${uniqueId}-${safeFileName}`;
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

const resolveProfileErrorMessage = (
  error: unknown,
  tSettings: (key: string) => string,
) => {
  if (!(error instanceof Error)) {
    return tSettings("profile.errors.updateFailed");
  }

  if (error.message.includes("Bucket not found")) {
    return tSettings("profile.errors.bucketMissing");
  }

  if (error.message.includes("row-level security policy")) {
    return tSettings("profile.errors.storageBlocked");
  }

  return error.message;
};

export default function ProfileSettingsSection() {
  const tSettings = useTranslations("settings");
  const { session, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const supabase = React.useMemo(() => createClientComponentClient(), []);
  const initializedUserIdRef = React.useRef<string | null>(null);

  const [displayName, setDisplayName] = React.useState("");
  const [savedDisplayName, setSavedDisplayName] = React.useState("");
  const [storedAvatarUrl, setStoredAvatarUrl] = React.useState<string | null>(
    null,
  );
  const [pendingUploadedAvatar, setPendingUploadedAvatar] =
    React.useState<UploadedAvatarState | null>(null);
  const [avatarMarkedForRemoval, setAvatarMarkedForRemoval] =
    React.useState(false);

  const profileQuery = useQuery({
    queryKey: [...CURRENT_USER_QUERY_KEY, session?.user?.id],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error(tSettings("profile.errors.sessionExpired"));
      }

      return fetchCurrentUser(session.access_token);
    },
    enabled: !!session?.access_token,
    staleTime: 60 * 1000,
  });

  React.useEffect(() => {
    const profile = profileQuery.data;

    if (!profile?.id || initializedUserIdRef.current === profile.id) {
      return;
    }

    initializedUserIdRef.current = profile.id;
    setDisplayName(profile.name ?? "");
    setSavedDisplayName(profile.name ?? "");
    setStoredAvatarUrl(profile.avatarUrl ?? null);
    setPendingUploadedAvatar(null);
    setAvatarMarkedForRemoval(false);
  }, [profileQuery.data]);

  const uploadAvatarMutation = useMutation({
    onMutate: (file: File) => {
      const toastId = toast.loading(
        tSettings("profile.toasts.uploading", { fileName: file.name }),
      );
      return { toastId };
    },
    mutationFn: async (file: File) => {
      if (!session?.user?.id) {
        throw new Error(tSettings("profile.errors.sessionExpired"));
      }

      if (pendingUploadedAvatar?.path) {
        const { error: cleanupError } = await supabase.storage
          .from(SUPABASE_AVATAR_BUCKET)
          .remove([pendingUploadedAvatar.path]);

        if (cleanupError) {
          console.warn("Failed to clean up the pending avatar:", cleanupError);
        }
      }

      const nextPath = createAvatarPath(session.user.id, file.name);
      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_AVATAR_BUCKET)
        .upload(nextPath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          uploadError.message || tSettings("profile.errors.updateFailed"),
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_AVATAR_BUCKET)
        .getPublicUrl(nextPath);

      return {
        fileName: file.name,
        path: nextPath,
        url: `${publicUrlData.publicUrl}?v=${Date.now()}`,
      } satisfies UploadedAvatarState;
    },
    onSuccess: (uploadedAvatar, _file, context) => {
      setPendingUploadedAvatar(uploadedAvatar);
      setAvatarMarkedForRemoval(false);
      toast.success(tSettings("profile.toasts.uploadSuccess"), {
        id: context?.toastId,
      });
    },
    onError: (error, _file, context) => {
      toast.error(resolveProfileErrorMessage(error, tSettings), {
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
        toast.error(tSettings("profile.validation.invalidType"));
        return;
      }

      if (file.size > MAX_AVATAR_SIZE_BYTES) {
        toast.error(tSettings("profile.validation.fileTooLarge"));
        return;
      }

      uploadAvatarMutation.mutate(file);
    },
    [tSettings, uploadAvatarMutation],
  );

  const currentProfile = profileQuery.data;
  const normalizedDisplayName = displayName.trim();
  const hasAvatarChange = avatarMarkedForRemoval || !!pendingUploadedAvatar;
  const isDirty =
    normalizedDisplayName !== savedDisplayName.trim() || hasAvatarChange;
  const resolvedAvatarUrl = avatarMarkedForRemoval
    ? null
    : pendingUploadedAvatar?.url ?? storedAvatarUrl ?? null;

  const updateProfileMutation = useMutation({
    onMutate: () => {
      const toastId = toast.loading(tSettings("profile.toasts.saving"));

      return { toastId };
    },
    mutationFn: async () => {
      if (!session?.access_token || !session.user?.id) {
        throw new Error(tSettings("profile.errors.sessionExpired"));
      }

      const normalizedName = normalizedDisplayName || null;
      const nextAvatarUrl = avatarMarkedForRemoval
        ? null
        : pendingUploadedAvatar?.url ?? storedAvatarUrl;

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: normalizedName,
          name: normalizedName,
          avatar_url: nextAvatarUrl,
        },
      });

      if (authUpdateError) {
        throw new Error(
          authUpdateError.message || tSettings("profile.errors.syncAuthFailed"),
        );
      }

      return updateCurrentUser(session.access_token, {
        name: normalizedName,
        avatarUrl: nextAvatarUrl,
      });
    },
    onSuccess: (updatedProfile, _variables, context) => {
      const previousStoredAvatarPath = getStoragePathFromUrl(storedAvatarUrl);
      const nextAvatarPath = pendingUploadedAvatar?.path ?? null;

      queryClient.setQueryData(
        [...CURRENT_USER_QUERY_KEY, session?.user?.id],
        updatedProfile,
      );
      queryClient.invalidateQueries({
        queryKey: ["user", session?.user?.id],
      });

      setDisplayName(updatedProfile.name ?? "");
      setSavedDisplayName(updatedProfile.name ?? "");
      setStoredAvatarUrl(updatedProfile.avatarUrl ?? null);
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
              console.warn("Failed to clean up the previous avatar:", error);
            }
          });
      }

      toast.success(tSettings("profile.toasts.saveSuccess"), {
        id: context?.toastId,
      });
    },
    onError: (error, _variables, context) => {
      toast.error(resolveProfileErrorMessage(error, tSettings), {
        id: context?.toastId,
      });
    },
  });

  const handleRemoveAvatar = React.useCallback(() => {
    if (uploadAvatarMutation.isPending || updateProfileMutation.isPending) {
      return;
    }

    if (pendingUploadedAvatar) {
      void supabase.storage
        .from(SUPABASE_AVATAR_BUCKET)
        .remove([pendingUploadedAvatar.path])
        .then(({ error }) => {
          if (error) {
            console.warn("Failed to clean up the pending avatar:", error);
          }
        });

      setPendingUploadedAvatar(null);
      setAvatarMarkedForRemoval(false);
      toast.success(tSettings("profile.toasts.cancelNewAvatar"));
      return;
    }

    if (avatarMarkedForRemoval) {
      setAvatarMarkedForRemoval(false);
      toast.success(tSettings("profile.toasts.undoRemoveAvatar"));
      return;
    }

    if (!storedAvatarUrl) {
      return;
    }

    setAvatarMarkedForRemoval(true);
    toast.success(tSettings("profile.toasts.markRemoveAvatar"));
  }, [
    avatarMarkedForRemoval,
    pendingUploadedAvatar,
    storedAvatarUrl,
    supabase.storage,
    tSettings,
    updateProfileMutation.isPending,
    uploadAvatarMutation.isPending,
  ]);

  const isAvatarOperationPending =
    uploadAvatarMutation.isPending || (updateProfileMutation.isPending && hasAvatarChange);
  const avatarStatusMessage = uploadAvatarMutation.isPending
    ? tSettings("profile.avatar.statusUploading")
    : pendingUploadedAvatar
      ? tSettings("profile.avatar.statusUploaded", {
          fileName: pendingUploadedAvatar.fileName,
        })
    : avatarMarkedForRemoval
      ? tSettings("profile.avatar.statusMarked")
      : tSettings("profile.avatar.statusHint");

  if (!session && !authLoading) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("profile.states.authRequiredTitle")}</CardTitle>
            <CardDescription>
              {tSettings("profile.states.authRequiredDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (authLoading || profileQuery.isLoading) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {tSettings("profile.states.loading")}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileQuery.error) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("profile.states.loadFailedTitle")}</CardTitle>
            <CardDescription>
              {(profileQuery.error as Error).message ||
                tSettings("profile.states.loadFailedDescription")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-1">
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();

          if (
            !isDirty ||
            uploadAvatarMutation.isPending ||
            updateProfileMutation.isPending
          ) {
            return;
          }

          updateProfileMutation.mutate();
        }}
      >
        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("profile.avatar.title")}</CardTitle>
            <CardDescription>
              {tSettings("profile.avatar.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center pb-6">
            <div className="relative">
              <Avatar className="size-24 border border-border/70 shadow-sm">
                <AvatarImage
                  src={resolvedAvatarUrl ?? undefined}
                  alt={tSettings("profile.avatar.alt")}
                />
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(currentProfile)}
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
                  {tSettings("profile.avatar.recommendation")}
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
                  disabled={uploadAvatarMutation.isPending || updateProfileMutation.isPending}
                >
                  {uploadAvatarMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {uploadAvatarMutation.isPending
                    ? tSettings("profile.avatar.uploading")
                    : tSettings("profile.avatar.upload")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveAvatar}
                  disabled={
                    uploadAvatarMutation.isPending ||
                    updateProfileMutation.isPending ||
                    (!storedAvatarUrl &&
                      !pendingUploadedAvatar &&
                      !avatarMarkedForRemoval)
                  }
                >
                  <Trash2 className="size-4" />
                  {pendingUploadedAvatar
                    ? tSettings("profile.avatar.cancelNew")
                    : avatarMarkedForRemoval
                      ? tSettings("profile.avatar.undoRemove")
                      : tSettings("profile.avatar.remove")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none">
          <CardHeader>
            <CardTitle>{tSettings("profile.info.title")}</CardTitle>
            <CardDescription>
              {tSettings("profile.info.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="display-name">
                {tSettings("profile.info.displayNameLabel")}
              </Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={80}
                placeholder={tSettings("profile.info.displayNamePlaceholder")}
                disabled={updateProfileMutation.isPending}
              />
            </div>

            <Separator />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">{tSettings("profile.info.emailLabel")}</Label>
                <Input
                  id="email"
                  value={currentProfile?.email ?? session?.user?.email ?? ""}
                  readOnly
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="created-at">
                  {tSettings("profile.info.createdAtLabel")}
                </Label>
                <Input
                  id="created-at"
                  value={
                    currentProfile?.createdAt
                      ? format(
                          new Date(currentProfile.createdAt),
                          "yyyy-MM-dd HH:mm",
                        )
                      : "-"
                  }
                  readOnly
                  disabled
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between p-6">
            <div className="text-sm text-muted-foreground">
              {isDirty
                ? tSettings("profile.info.dirty")
                : tSettings("profile.info.clean")}
            </div>

            <Button
              type="submit"
              disabled={
                !isDirty ||
                uploadAvatarMutation.isPending ||
                updateProfileMutation.isPending
              }
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {tSettings("profile.info.save")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
