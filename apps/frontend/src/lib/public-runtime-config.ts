"use client";

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

function getConfiguredHostname(rawUrl: string, envName: string) {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return `${envName} is invalid. Expected a full URL.`;
  }
}

export function getSupabaseRuntimeConfigIssue() {
  if (typeof window === "undefined") {
    return null;
  }

  if (isLocalHostname(window.location.hostname)) {
    return null;
  }

  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredUrl) {
    return "NEXT_PUBLIC_SUPABASE_URL is missing.";
  }

  const configuredHostname = getConfiguredHostname(
    configuredUrl,
    "NEXT_PUBLIC_SUPABASE_URL",
  );

  if (configuredHostname.includes("Expected a full URL")) {
    return configuredHostname;
  }

  if (isLocalHostname(configuredHostname)) {
    return [
      "Invalid production Supabase configuration.",
      "NEXT_PUBLIC_SUPABASE_URL points to a local Supabase instance, but the app is running on a public hostname.",
      "Update the deployed frontend env vars to use the hosted Supabase project URL instead of localhost/127.0.0.1.",
    ].join(" ");
  }

  return null;
}

export function getBackendRuntimeConfigIssue() {
  if (typeof window === "undefined") {
    return null;
  }

  if (isLocalHostname(window.location.hostname)) {
    return null;
  }

  const configuredUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_DEV_URL;

  if (!configuredUrl) {
    return null;
  }

  const configuredHostname = getConfiguredHostname(
    configuredUrl,
    "NEXT_PUBLIC_BACKEND_URL",
  );

  if (configuredHostname.includes("Expected a full URL")) {
    return configuredHostname;
  }

  return null;
}

export function getPublicRuntimeConfigIssue() {
  return getSupabaseRuntimeConfigIssue() || getBackendRuntimeConfigIssue();
}
