"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  AuthCard,
  AuthMessage,
  AuthShell,
  AuthStatusCard,
} from "@/components/auth/auth-shell";
import { useSiteCopy } from "@/components/marketing/site-copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { AUTH_ROUTE, getAuthParam } from "@/lib/auth-utils";
import { createClientComponentClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  const copy = useSiteCopy();
  const t = useTranslations();

  useEffect(() => {
    let mounted = true;
    let verificationTimer: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: (() => void) | null = null;

    const clearAuthUrl = () => {
      window.history.replaceState({}, "", window.location.pathname);
    };

    const markInvalid = (text: string) => {
      if (!mounted) {
        return;
      }

      if (verificationTimer) {
        clearTimeout(verificationTimer);
        verificationTimer = null;
      }

      unsubscribe?.();
      unsubscribe = null;
      setIsValidToken(false);
      setMessage({ type: "error", text });
    };

    const markValid = () => {
      if (!mounted) {
        return;
      }

      if (verificationTimer) {
        clearTimeout(verificationTimer);
        verificationTimer = null;
      }

      unsubscribe?.();
      unsubscribe = null;
      setIsValidToken(true);
      setMessage(null);
    };

    const resolveExistingSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Failed to check reset session:", error);
        markInvalid(error.message || t("auth.linkExpired"));
        return true;
      }

      if (session) {
        clearAuthUrl();
        markValid();
        return true;
      }

      return false;
    };

    const checkResetToken = async () => {
      try {
        const urlError = getAuthParam("error_description") ?? getAuthParam("error");

        if (urlError) {
          markInvalid(urlError);
          return;
        }

        const code = getAuthParam("code");
        const accessToken = getAuthParam("access_token");
        const refreshToken = getAuthParam("refresh_token");

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error("Failed to set reset session:", setSessionError);
            markInvalid(setSessionError.message || t("auth.linkExpired"));
            return;
          }

          clearAuthUrl();
          markValid();
          return;
        }

        if (await resolveExistingSession()) {
          return;
        }

        if (!code) {
          markInvalid(t("auth.missingResetToken"));
          return;
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!mounted || !nextSession) {
            return;
          }

          clearAuthUrl();
          markValid();
        });

        unsubscribe = () => subscription.unsubscribe();

        verificationTimer = setTimeout(async () => {
          if (await resolveExistingSession()) {
            return;
          }

          markInvalid(t("auth.linkExpired"));
        }, 5000);
      } catch (tokenError) {
        console.error("Failed to verify reset token:", tokenError);
        markInvalid(t("auth.linkInvalid"));
      }
    };

    void checkResetToken();

    return () => {
      mounted = false;
      unsubscribe?.();

      if (verificationTimer) {
        clearTimeout(verificationTimer);
      }
    };
  }, [supabase, t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      setMessage({ type: "error", text: t("auth.fillAllFields") });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: t("auth.passwordTooShort") });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: t("auth.passwordsNotMatch") });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }

      setMessage({ type: "success", text: t("auth.passwordResetSuccess") });
      await supabase.auth.signOut({ scope: "local" });
      window.setTimeout(() => {
        router.replace(AUTH_ROUTE);
      }, 1500);
    } catch (resetError) {
      console.error("Failed to reset password:", resetError);
      setMessage({ type: "error", text: t("auth.linkInvalid") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell copy={copy} homeLabel={t("nav.home")}>
      {isValidToken === null ? (
        <AuthStatusCard
          icon={<Loader2 className="h-7 w-7 animate-spin" />}
          title={t("auth.verifying")}
          description={t("auth.verifyingAccount")}
        />
      ) : null}

      {isValidToken === false ? (
        <AuthStatusCard
          icon={<AlertCircle className="h-7 w-7 text-red-300" />}
          title={t("auth.verificationFailed")}
          description={message?.text || t("auth.linkInvalid")}
          footer={
            <Button
              onClick={() => router.replace(AUTH_ROUTE)}
              className="h-11 border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white hover:bg-white/[0.08]"
            >
              {t("auth.returnToLogin")}
            </Button>
          }
        />
      ) : null}

      {isValidToken ? (
        <AuthCard>
          <div className="space-y-7">
            <div className="space-y-4">
              <div className="inline-flex border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/62">
                {t("auth.recoveryBadge")}
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
                  {t("auth.resetPasswordTitle")}
                </h1>
                <p className="text-sm leading-7 text-white/60">
                  {t("auth.enterNewPassword")}
                </p>
              </div>
            </div>

            {message ? (
              <AuthMessage tone={message.type}>
                <div className="flex items-start gap-3">
                  {message.type === "error" ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              </AuthMessage>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm text-white/72">{t("auth.newPassword")}</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                    className="h-12 border-white/10 bg-white/[0.03] pl-11 pr-12 text-white placeholder:text-white/26 focus-visible:border-white/16 focus-visible:ring-white/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/36 transition hover:text-white/78"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-white/72">
                  {t("auth.confirmNewPassword")}
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                    className="h-12 border-white/10 bg-white/[0.03] pl-11 pr-12 text-white placeholder:text-white/26 focus-visible:border-white/16 focus-visible:ring-white/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/36 transition hover:text-white/78"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full border border-white/12 bg-white/[0.05] text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    {t("auth.resetPassword")}
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-white/48">
              <button
                type="button"
                onClick={() => router.replace(AUTH_ROUTE)}
                className="transition hover:text-white/76"
              >
                {t("auth.backToLogin")}
              </button>
            </div>
          </div>
        </AuthCard>
      ) : null}
    </AuthShell>
  );
}
