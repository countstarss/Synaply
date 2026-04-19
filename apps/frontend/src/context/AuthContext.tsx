// synaply-frontend/src/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type AuthError, type Session, type User } from "@supabase/supabase-js";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  AUTH_CALLBACK_ROUTE,
  AUTH_ROUTE,
  DEFAULT_POST_LOGIN_ROUTE,
  DEFAULT_SIGNED_OUT_ROUTE,
  RESET_PASSWORD_ROUTE,
  SESSION_EXPIRED_REASON,
  buildAbsoluteAppUrl,
  buildAuthRouteWithReason,
} from "@/lib/auth-utils";
import {
  createClientComponentClient,
  removeAllRealtimeChannels,
} from "@/lib/supabase";

const SESSION_REFRESH_INTERVAL_MS = 60_000;
const SESSION_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClientComponentClient());
  const forcedRedirectReasonRef = useRef<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    let mounted = true;

    const redirectAuthenticatedUser = () => {
      if (pathname === AUTH_ROUTE) {
        router.replace(DEFAULT_POST_LOGIN_ROUTE);
      }
    };

    const syncRealtimeAuthToken = async (accessToken?: string | null) => {
      if (!accessToken) {
        await removeAllRealtimeChannels(supabase);
        return;
      }

      await supabase.realtime.setAuth(accessToken);
    };

    const scheduleRealtimeAuthTokenSync = (accessToken?: string | null) => {
      window.setTimeout(() => {
        void syncRealtimeAuthToken(accessToken);
      }, 0);
    };

    const handleSessionExpiry = async () => {
      forcedRedirectReasonRef.current = SESSION_EXPIRED_REASON;

      if (mounted) {
        setSession(null);
        setUser(null);
        setError(null);
      }

      const { error: signOutError } = await supabase.auth.signOut({
        scope: "local",
      });

      if (signOutError) {
        console.error("清理过期会话时出错:", signOutError);
        forcedRedirectReasonRef.current = null;
        router.replace(buildAuthRouteWithReason(SESSION_EXPIRED_REASON));
      }
    };

    const getInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (sessionError) {
          console.error("获取会话时出错:", sessionError);
          setError(sessionError.message);
          return;
        }

        await syncRealtimeAuthToken(initialSession?.access_token);
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession) {
          redirectAuthenticatedUser();
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error("获取会话时发生异常:", err);
        setError("获取会话时发生未知错误");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Supabase 官方文档明确提到：不要在 onAuthStateChange 回调里直接执行异步 Supabase 调用，
      // 否则可能导致后续请求挂起。这里把 Realtime token 同步延后到事件循环下一轮。
      scheduleRealtimeAuthTokenSync(nextSession?.access_token);

      if (!mounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setError(null);

      if (event === "SIGNED_OUT") {
        const reason = forcedRedirectReasonRef.current;
        forcedRedirectReasonRef.current = null;

        if (reason) {
          router.replace(buildAuthRouteWithReason(reason));
          return;
        }

        if (!pathname.startsWith(AUTH_ROUTE)) {
          router.replace(DEFAULT_SIGNED_OUT_ROUTE);
        }

        return;
      }

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && nextSession) {
        redirectAuthenticatedUser();
      }
    });

    const refreshInterval = window.setInterval(async () => {
      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("检查会话时出错:", sessionError);
          return;
        }

        if (!currentSession?.expires_at) {
          return;
        }

        const tokenExpiry = currentSession.expires_at * 1000;
        const expiresSoon =
          tokenExpiry - Date.now() < SESSION_REFRESH_THRESHOLD_MS;

        if (!expiresSoon) {
          return;
        }

        const { data, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error("Token 刷新失败:", refreshError);
          await handleSessionExpiry();
          return;
        }

        if (mounted && data.session) {
          await syncRealtimeAuthToken(data.session.access_token);
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (err) {
        console.error("检查 token 状态时出错:", err);
      }
    }, SESSION_REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.clearInterval(refreshInterval);
    };
  }, [pathname, router, supabase]);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildAbsoluteAppUrl(AUTH_CALLBACK_ROUTE, locale),
        },
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      console.error("注册时发生异常:", err);
      const errorMessage = "注册时发生未知错误";
      setError(errorMessage);
      return { error: new Error(errorMessage) as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      console.error("登录时发生异常:", err);
      const errorMessage = "登录时发生未知错误";
      setError(errorMessage);
      return { error: new Error(errorMessage) as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildAbsoluteAppUrl(AUTH_CALLBACK_ROUTE, locale),
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      console.error("Google登录时发生异常:", err);
      const errorMessage = "Google登录时发生未知错误";
      setError(errorMessage);
      return { error: new Error(errorMessage) as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      console.error("登出时发生异常:", err);
      const errorMessage = "登出时发生未知错误";
      setError(errorMessage);
      return { error: new Error(errorMessage) as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildAbsoluteAppUrl(RESET_PASSWORD_ROUTE, locale),
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      console.error("重置密码时发生异常:", err);
      const errorMessage = "重置密码时发生未知错误";
      setError(errorMessage);
      return { error: new Error(errorMessage) as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        error,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
