"use client";

import React from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn, isRouteActive } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  badgeCount?: number;
  isActive?: boolean;
  className?: string;
}

const SidebarNavItem = ({
  icon: Icon,
  label,
  href,
  badgeCount,
  isActive,
  className,
}: SidebarNavItemProps) => {
  const pathname = usePathname();
  const active = isActive ?? isRouteActive(pathname, href);
  const visibleBadgeCount =
    typeof badgeCount === "number" && badgeCount > 99 ? "99+" : badgeCount;

  return (
    <Link
      href={href}
      aria-label={
        visibleBadgeCount ? `${label} (${visibleBadgeCount})` : label
      }
    >
      <div
        className={cn(
          "group flex items-center gap-3 px-4 py-2 mx-2 rounded-md cursor-pointer transition-colors",
          "text-gray-600 hover:bg-[#2b2b2b] hover:text-white",
          "dark:text-gray-300 dark:hover:text-white",
          active && "text-white dark:text-gray-300 bg-[#2b2b2b]",
          className
        )}
      >
        <Icon size={18} />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium">{label}</span>
          {visibleBadgeCount ? (
            <Badge
              aria-hidden="true"
              variant="secondary"
              className={cn(
                "ml-auto min-w-6 px-1.5 py-0 text-[11px] font-semibold leading-5 transition-colors",
                active
                  ? "bg-white/15 text-white dark:text-gray-100"
                  : "bg-[#ece8f4] text-[#5a506b] group-hover:bg-white/15 group-hover:text-white dark:bg-white/10 dark:text-gray-200"
              )}
            >
              {visibleBadgeCount}
            </Badge>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export default SidebarNavItem;
