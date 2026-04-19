"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { AuthCard, AuthMessage, AuthShell } from "@/components/auth/auth-shell";
import { useSiteCopy } from "@/components/marketing/site-copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { SESSION_EXPIRED_REASON } from "@/lib/auth-utils";

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

type AuthMode = "login" | "register" | "reset";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    error,
    clearError,
    loading,
  } = useAuth();
  const copy = useSiteCopy();
  const t = useTranslations();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reason") === SESSION_EXPIRED_REASON) {
      setMode("login");
      setMessage({ type: "error", text: t("auth.sessionExpired") });
    }
  }, [searchParams, t]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || (!password && mode !== "reset")) {
      setMessage({ type: "error", text: t("auth.fillAllFields") });
      return;
    }

    setIsSubmitting(true);
    clearError();
    setMessage(null);

    try {
      switch (mode) {
        case "login": {
          const result = await signIn(email, password);
          if (!result.error) {
            setMessage({ type: "success", text: t("auth.loginSuccess") });
          }
          break;
        }
        case "register": {
          const result = await signUp(email, password);
          if (!result.error) {
            setMessage({ type: "success", text: t("auth.registerSuccess") });
            setMode("login");
          }
          break;
        }
        case "reset": {
          const result = await resetPassword(email);
          if (!result.error) {
            setMessage({ type: "success", text: t("auth.resetEmailSent") });
            setMode("login");
          }
          break;
        }
      }
    } catch (submitError) {
      console.error("Failed to submit auth form:", submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    clearError();
    setMessage(null);

    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setMessage({ type: "error", text: t("auth.googleAuthError") });
      }
    } catch (signInError) {
      console.error("Google sign-in failed:", signInError);
      setMessage({ type: "error", text: t("auth.googleAuthError") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentError = error || (message?.type === "error" ? message.text : null);
  const currentSuccess = message?.type === "success" ? message.text : null;
  const modeCopy = copy.auth.modes[mode];

  return (
    <AuthShell copy={copy} homeLabel={t("nav.home")}>
      <AuthCard>
        <div className="space-y-7">
          <div className="space-y-4">
            <div className="inline-flex border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/62">
              {t("auth.accessBadge")}
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">
                {modeCopy.title}
              </h1>
              <p className="text-sm leading-7 text-white/60">
                {modeCopy.description}
              </p>
            </div>
          </div>

          <Tabs
            value={mode}
            onValueChange={(value) => {
              const nextMode = value as AuthMode;
              clearError();
              setMessage(null);
              setMode(nextMode);
            }}
            className="gap-4"
          >
            <TabsList className="h-auto w-full border border-white/10 bg-white/[0.03] p-1">
              <TabsTrigger value="login" className="py-2.5">
                {t("auth.login")}
              </TabsTrigger>
              <TabsTrigger value="register" className="py-2.5">
                {t("auth.register")}
              </TabsTrigger>
              <TabsTrigger value="reset" className="py-2.5">
                {t("auth.resetPassword")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {(currentError || currentSuccess) && (
            <AuthMessage tone={currentError ? "error" : "success"}>
              <div className="flex items-start gap-3">
                {currentError ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{currentError || currentSuccess}</span>
              </div>
            </AuthMessage>
          )}

          {mode !== "reset" ? (
            <>
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || loading}
                variant="ghost"
                className="h-12 w-full border border-white/10 bg-white/[0.04] text-white/84 hover:bg-white/[0.06] hover:text-white"
              >
                {isSubmitting || loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <GoogleIcon className="h-5 w-5" />
                    {mode === "login"
                      ? t("auth.signInWithGoogle")
                      : t("auth.continueWithGoogle")}
                  </>
                )}
              </Button>
              <div className="flex items-center gap-4">
                <Separator className="flex-1 bg-white/8" />
                <span className="text-xs uppercase tracking-[0.24em] text-white/34">
                  {t("auth.orDivider")}
                </span>
                <Separator className="flex-1 bg-white/8" />
              </div>
            </>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-white/72">{t("auth.emailAddress")}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className="h-12 border-white/10 bg-white/[0.03] pl-11 text-white placeholder:text-white/26 focus-visible:border-white/16 focus-visible:ring-white/10"
                  required
                />
              </div>
            </div>

            {mode !== "reset" ? (
              <div className="space-y-2">
                <Label className="text-sm text-white/72">{t("auth.password")}</Label>
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
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="h-12 w-full border border-white/12 bg-white/[0.05] text-sm font-medium text-white hover:bg-white/[0.08]"
            >
              {isSubmitting || loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" && t("auth.signIn")}
                  {mode === "register" && t("auth.signUp")}
                  {mode === "reset" && t("auth.sendResetEmail")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="space-y-2 text-center text-sm text-white/48">
            {mode === "login" ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="transition hover:text-white/76"
                >
                  {t("auth.noAccount")}{" "}
                  <span className="font-medium text-white/86">
                    {t("auth.registerNow")}
                  </span>
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="transition hover:text-white/76"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
              </>
            ) : null}

            {mode === "register" ? (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="transition hover:text-white/76"
              >
                {t("auth.hasAccount")}{" "}
                <span className="font-medium text-white/86">{t("auth.loginNow")}</span>
              </button>
            ) : null}

            {mode === "reset" ? (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="transition hover:text-white/76"
              >
                {t("auth.backToLogin")}
              </button>
            ) : null}
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
