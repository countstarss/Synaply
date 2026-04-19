const DEFAULT_BACKEND_URL = "http://localhost:5678";

export function getBackendBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_DEV_URL ||
    DEFAULT_BACKEND_URL
  ).replace(/\/+$/, "");
}
