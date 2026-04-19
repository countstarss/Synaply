"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import SettingsPlaceholderSection from "@/components/settings/sections/SettingsPlaceholderSection";

export default function NotificationsSettingsSection() {
  const tSettings = useTranslations("settings");

  return (
    <SettingsPlaceholderSection
      title={tSettings("general.sections.notifications.label")}
      description={tSettings(
        "general.sections.notifications.placeholderDescription",
      )}
      icon={Bell}
      highlights={[
        tSettings("general.sections.notifications.highlights.digestFrequency"),
        tSettings("general.sections.notifications.highlights.reminders"),
        tSettings("general.sections.notifications.highlights.bridges"),
        tSettings("general.sections.notifications.highlights.quietHours"),
      ]}
    />
  );
}
