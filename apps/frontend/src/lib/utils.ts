import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isRouteActive(pathname: string, href: string) {
  const [routePath = "/"] = href.split(/[?#]/);

  if (routePath === "/") {
    return pathname === "/";
  }

  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}
