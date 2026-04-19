import {
  User,
  Bell,
  Palette,
  Building2,
  Users,
  UserCheck,
  BotIcon,
  Shield,
  Smartphone,
  CreditCard,
  Plus,
  type LucideIcon,
} from "lucide-react";
import type { Team } from "@/lib/fetchers/team";

export interface SettingItem {
  id: string;
  label: string;
  labelKey?: string;
  icon: LucideIcon;
  href?: string;
  action?: () => void;
}

export interface SettingSection {
  id: string;
  title: string;
  titleKey?: string;
  items: SettingItem[];
}

type TranslationFn = (key: string) => string;

export const baseSettingSections: SettingSection[] = [
  {
    id: "general",
    title: "",
    titleKey: "sidebar.sections.general",
    items: [
      {
        id: "profile",
        label: "",
        labelKey: "settingsNav.profile",
        icon: User,
        href: "/settings/general#profile",
      },
      {
        id: "notifications",
        label: "",
        labelKey: "settingsNav.notifications",
        icon: Bell,
        href: "/settings/general#notifications",
      },
      {
        id: "appearance",
        label: "",
        labelKey: "settingsNav.appearance",
        icon: Palette,
        href: "/settings/general#appearance",
      },
    ],
  },
  {
    id: "administration",
    title: "",
    titleKey: "sidebar.sections.administration",
    items: [
      {
        id: "workspace",
        label: "",
        labelKey: "settingsNav.workspace",
        icon: Building2,
        href: "/settings/admin#workspace",
      },
      {
        id: "teams",
        label: "",
        labelKey: "settingsNav.teams",
        icon: Users,
        href: "/settings/admin#teams",
      },
      {
        id: "members",
        label: "",
        labelKey: "settingsNav.members",
        icon: UserCheck,
        href: "/settings/admin#members",
      },
      {
        id: "ai-execution",
        label: "",
        labelKey: "settingsNav.aiExecution",
        icon: BotIcon,
        href: "/settings/admin#ai-execution",
      },
      {
        id: "security",
        label: "",
        labelKey: "settingsNav.security",
        icon: Shield,
        href: "/settings/admin#security",
      },
      {
        id: "application",
        label: "",
        labelKey: "settingsNav.application",
        icon: Smartphone,
        href: "/settings/admin#application",
      },
      {
        id: "billing",
        label: "",
        labelKey: "settingsNav.billing",
        icon: CreditCard,
        href: "/settings/admin#billing",
      },
    ],
  },
];

export const buildSettingsSections = (
  t: TranslationFn,
  teams: Team[] = [],
  onCreateTeam?: () => void,
): SettingSection[] => [
  ...baseSettingSections.map((section) => ({
    ...section,
    title: section.titleKey ? t(section.titleKey) : section.title,
    items: section.items.map((item) => ({
      ...item,
      label: item.labelKey ? t(item.labelKey) : item.label,
    })),
  })),
  {
    id: "team",
    title: t("sidebar.sections.team"),
    items: [
      ...teams.map((team) => ({
        id: team.id,
        label: team.name,
        icon: Building2,
        href: `/settings/team/${team.id}`,
      })),
      {
        id: "create-team",
        label: t("sidebar.createTeam"),
        icon: Plus,
        action: onCreateTeam,
      },
    ],
  },
];
