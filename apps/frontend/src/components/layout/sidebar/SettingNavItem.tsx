"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

interface SettingNavItemProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  action?: () => void;
  isActive?: boolean;
  className?: string;
}

const DEFAULT_HASH_BY_PATH: Record<string, string> = {
  "/settings/general": "profile",
  "/settings/admin": "workspace",
};

const SettingNavItem = React.memo(
  ({
    icon: Icon,
    label,
    href,
    action,
    isActive = false,
    className,
  }: SettingNavItemProps) => {
    const pathname = usePathname();
    const [currentHash, setCurrentHash] = React.useState("");

    React.useEffect(() => {
      const syncHash = () => {
        setCurrentHash(window.location.hash.replace(/^#/, ""));
      };

      syncHash();

      window.addEventListener("hashchange", syncHash);
      window.addEventListener("settings:hash-update", syncHash as EventListener);

      return () => {
        window.removeEventListener("hashchange", syncHash);
        window.removeEventListener(
          "settings:hash-update",
          syncHash as EventListener,
        );
      };
    }, [pathname]);

    const [hrefPath, hrefHash] = href?.split("#") ?? [];
    const handleHashNavigation = React.useCallback(
      (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (
          !href ||
          !hrefHash ||
          pathname !== hrefPath ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();

        const nextUrl = `${window.location.pathname}${window.location.search}#${hrefHash}`;
        window.history.pushState(null, "", nextUrl);
        window.dispatchEvent(new CustomEvent("settings:hash-update"));
      },
      [href, hrefHash, hrefPath, pathname],
    );

    const resolvedIsActive =
      isActive ||
      (!!href &&
        (hrefHash
          ? pathname === hrefPath &&
            (currentHash === hrefHash ||
              (!currentHash && DEFAULT_HASH_BY_PATH[hrefPath] === hrefHash))
          : pathname === hrefPath || pathname.startsWith(`${hrefPath}/`)));

    const baseClasses = cn(
      "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
      "hover:bg-app-button-hover",
      resolvedIsActive && "bg-app-button-hover",
      className
    );

    const content = (
      <>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground">{label}</span>
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={baseClasses}
          aria-current={resolvedIsActive ? "page" : undefined}
          scroll={href?.includes("#") ? false : undefined}
          onClick={handleHashNavigation}
        >
          {content}
        </Link>
      );
    }

    return (
      <button type="button" onClick={action} className={baseClasses}>
        {content}
      </button>
    );
  }
);

SettingNavItem.displayName = "SettingNavItem";

export default SettingNavItem;
