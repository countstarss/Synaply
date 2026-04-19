import { BookAIcon } from "lucide-react";
import type { NavItem } from "@/lib/navigation/page-registry";

/*
NOTE: 用于提供给滚动条
MARK: - Clients
*/
export const clients = [...new Array(10)].map((_, index) => ({
  href: `/${index + 1}.png`,
}));

// NOTE: Personal 子项
export const personalItems: NavItem[] = [
  { icon: BookAIcon, label: "Docs", href: "/personal/doc" },
];

// MARK: mobileMenu
export const mobileMenu: {
  title: string;
  href: string;
  description: string;
  published: boolean;
}[] = [
  {
    title: "Template",
    href: "/dashboard/template",
    description: "Template",
    published: true,
  },
  {
    title: "Notification",
    href: "/dashboard/notification",
    description: "Notification",
    published: true,
  },
  {
    title: "Security",
    href: "/dashboard/security",
    description: "Security",
    published: false,
  },
  {
    title: "Team",
    href: "/dashboard/team",
    description: "Team",
    published: false,
  },
  {
    title: "Event",
    href: "/dashboard/event",
    description: "Event",
    published: true,
  },
  {
    title: "CRM",
    href: "/dashboard/crm",
    description: "CRM",
    published: false,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    description: "Billing",
    published: false,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    description: "Settings",
    published: true,
  },
  {
    title: "登录",
    href: "/auth",
    description: "用户登录",
    published: true,
  },
];
