const DEFAULT_BACKEND_URL = "http://localhost:5678";
const DEPLOYED_BACKEND_URL = "https://synaply-backend.vercel.app";
import { getBackendRuntimeConfigIssue } from "@/lib/public-runtime-config";

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

export function getBackendBaseUrl() {
  const configuredUrl = (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_DEV_URL ||
    DEFAULT_BACKEND_URL
  ).replace(/\/+$/, "");

  if (typeof window === "undefined") {
    return configuredUrl;
  }

  if (isLocalHostname(window.location.hostname)) {
    return configuredUrl;
  }

  try {
    const configuredHostname = new URL(configuredUrl).hostname;
    if (isLocalHostname(configuredHostname)) {
      return DEPLOYED_BACKEND_URL;
    }
  } catch {
    const issue = getBackendRuntimeConfigIssue();
    if (issue) {
      throw new Error(issue);
    }
  }

  return configuredUrl;
}
