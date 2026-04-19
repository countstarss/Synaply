"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  AuthShell,
  AuthStatusCard,
} from "@/components/auth/auth-shell";
import { useSiteCopy } from "@/components/marketing/site-copy";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import {
  AUTH_ROUTE,
  DEFAULT_POST_LOGIN_ROUTE,
  getAuthParam,
} from "@/lib/auth-utils";
import { createClientComponentClient } from "@/lib/supabase";

type CallbackStatus = "loading" | "success" | "error";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("");
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  const copy = useSiteCopy();
  const t = useTranslations();

  useEffect(() => {
    let mounted = true;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;
    let verificationTimer: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: (() => void) | null = null;

    const clearAuthUrl = () => {
      window.history.replaceState({}, "", window.location.pathname);
    };

    const finishSuccess = () => {
      if (!mounted) {
        return;
      }

      if (verificationTimer) {
        clearTimeout(verificationTimer);
        verificationTimer = null;
      }

      unsubscribe?.();
      unsubscribe = null;
      clearAuthUrl();
      setStatus("success");
      setMessage(t("auth.accountVerificationSuccess"));
      redirectTimer = setTimeout(() => {
        router.replace(DEFAULT_POST_LOGIN_ROUTE);
      }, 1500);
    };

    const finishError = (nextMessage: string) => {
      if (!mounted) {
        return;
      }

      if (verificationTimer) {
        clearTimeout(verificationTimer);
        verificationTimer = null;
      }

      unsubscribe?.();
      unsubscribe = null;
      setStatus("error");
      setMessage(nextMessage);
    };

    const resolveExistingSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        finishError(error.message || t("auth.failedToVerify"));
        return true;
      }

      if (session) {
        finishSuccess();
        return true;
      }

      return false;
    };

    const handleAuthCallback = async () => {
      try {
        const urlError = getAuthParam("error_description") ?? getAuthParam("error");

        if (urlError) {
          finishError(urlError);
          return;
        }

        const code = getAuthParam("code");

        if (await resolveExistingSession()) {
          return;
        }

        if (!code) {
          finishError(t("auth.failedToVerify"));
          return;
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!mounted || !nextSession) {
            return;
          }

          finishSuccess();
        });

        unsubscribe = () => subscription.unsubscribe();

        verificationTimer = setTimeout(async () => {
          if (await resolveExistingSession()) {
            return;
          }

          finishError(t("auth.failedToVerify"));
        }, 5000);
      } catch (callbackError) {
        console.error("Failed to handle auth callback:", callbackError);
        finishError(t("auth.failedToVerify"));
      }
    };

    void handleAuthCallback();

    return () => {
      mounted = false;

      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }

      if (verificationTimer) {
        clearTimeout(verificationTimer);
      }

      unsubscribe?.();
    };
  }, [router, supabase, t]);

  return (
    <AuthShell copy={copy} homeLabel={t("nav.home")}>
      {status === "loading" ? (
        <AuthStatusCard
          icon={<Loader2 className="h-7 w-7 animate-spin" />}
          title={t("auth.verifying")}
          description={t("auth.verifyingAccount")}
        />
      ) : null}

      {status === "success" ? (
        <AuthStatusCard
          icon={<CheckCircle className="h-7 w-7 text-emerald-300" />}
          title={t("auth.verificationSuccess")}
          description={message}
        />
      ) : null}

      {status === "error" ? (
        <AuthStatusCard
          icon={<AlertCircle className="h-7 w-7 text-red-300" />}
          title={t("auth.verificationFailed")}
          description={message}
          footer={
            <Button
              onClick={() => router.replace(AUTH_ROUTE)}
              className="h-11 rounded-full border border-emerald-400/20 bg-emerald-400/15 px-6 text-sm font-medium text-emerald-50 hover:bg-emerald-400/22"
            >
              {t("auth.returnToLogin")}
            </Button>
          }
        />
      ) : null}
    </AuthShell>
  );
}
