const DEFAULT_BACKEND_URL = "http://localhost:5678";

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local")
  );
}

export function getBackendBaseUrl() {
  const backendUrl = (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_DEV_URL ||
    DEFAULT_BACKEND_URL
  ).replace(/\/+$/, "");

  if (typeof window === "undefined") {
    return backendUrl;
  }

  if (isLocalHostname(window.location.hostname)) {
    return backendUrl;
  }

  let configuredHostname: string;

  try {
    configuredHostname = new URL(backendUrl).hostname;
  } catch {
    throw new Error(
      "Invalid NEXT_PUBLIC_BACKEND_URL. Expected a full backend URL.",
    );
  }

  if (isLocalHostname(configuredHostname)) {
    throw new Error(
      [
        "Invalid production backend configuration.",
        "NEXT_PUBLIC_BACKEND_URL points to a local backend, but the app is running on a public hostname.",
        "Update your deployed frontend env vars to use the deployed backend URL instead of localhost/127.0.0.1.",
      ].join(" "),
    );
  }

  return backendUrl;
}
