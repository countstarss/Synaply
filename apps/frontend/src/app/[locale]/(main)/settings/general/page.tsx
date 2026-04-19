import { getTranslations } from "next-intl/server";
import SettingsScrollPage from "@/components/settings/SettingsScrollPage";
import ProfileSettingsSection from "@/components/settings/sections/ProfileSettingsSection";
import NotificationsSettingsSection from "@/components/settings/sections/NotificationsSettingsSection";
import LanguageSettingsSection from "@/components/settings/sections/LanguageSettingsSection";
import AppearanceSettingsSection from "@/components/settings/sections/AppearanceSettingsSection";

export default async function GeneralSettingsPage() {
  const tSettings = await getTranslations("settings");

  return (
    <SettingsScrollPage
      title={tSettings("general.pageTitle")}
      // sectionGroupLabel="Settings"
      description={tSettings("general.description")}
      sections={[
        {
          id: "profile",
          label: tSettings("general.sections.profile.label"),
          description: tSettings("general.sections.profile.description"),
          content: <ProfileSettingsSection />,
        },
        {
          id: "notifications",
          label: tSettings("general.sections.notifications.label"),
          description: tSettings("general.sections.notifications.description"),
          content: <NotificationsSettingsSection />,
        },
        {
          id: "language",
          label: tSettings("general.sections.language.label"),
          description: tSettings("general.sections.language.description"),
          content: <LanguageSettingsSection />,
        },
        {
          id: "appearance",
          label: tSettings("general.sections.appearance.label"),
          description: tSettings("general.sections.appearance.description"),
          content: <AppearanceSettingsSection />,
        },
      ]}
    />
  );
}
