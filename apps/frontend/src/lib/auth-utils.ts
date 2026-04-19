import { routing } from "@/i18n/routing";

export const AUTH_ROUTE = "/auth";
export const AUTH_CALLBACK_ROUTE = "/auth/callback";
export const RESET_PASSWORD_ROUTE = "/auth/reset-password";
export const DEFAULT_POST_LOGIN_ROUTE = "/tasks";
export const DEFAULT_SIGNED_OUT_ROUTE = "/landing";
export const SESSION_EXPIRED_REASON = "session-expired";

export function getLocalizedAppPath(path: string, locale: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return locale === routing.defaultLocale
    ? normalizedPath
    : `/${locale}${normalizedPath}`;
}

export function buildAbsoluteAppUrl(path: string, locale: string) {
  return `${window.location.origin}${getLocalizedAppPath(path, locale)}`;
}

export function buildAuthRouteWithReason(reason: string) {
  return `${AUTH_ROUTE}?reason=${encodeURIComponent(reason)}`;
}

export function getAuthParam(name: string) {
  const searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has(name)) {
    return searchParams.get(name);
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  if (!hash) {
    return null;
  }

  return new URLSearchParams(hash).get(name);
}
