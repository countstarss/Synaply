import { getTranslations } from "next-intl/server";
import {
  Building2,
  CreditCard,
  Shield,
  Smartphone,
} from "lucide-react";
import SettingsScrollPage from "@/components/settings/SettingsScrollPage";
import AiExecutionSettingsSection from "@/components/settings/sections/AiExecutionSettingsSection";
import MembersSettingsSection from "@/components/settings/sections/MembersSettingsSection";
import SettingsPlaceholderSection from "@/components/settings/sections/SettingsPlaceholderSection";
import TeamsSettingsSection from "@/components/settings/sections/TeamsSettingsSection";

export default async function AdminSettingsPage() {
  const tSettings = await getTranslations("settings");

  return (
    <SettingsScrollPage
      title={tSettings("admin.pageTitle")}
      // sectionGroupLabel="Settings"
      sections={[
        {
          id: "workspace",
          label: tSettings("admin.sections.workspace.label"),
          description: tSettings("admin.sections.workspace.description"),
          content: (
            <SettingsPlaceholderSection
              title={tSettings("admin.sections.workspace.label")}
              description={tSettings(
                "admin.sections.workspace.placeholderDescription",
              )}
              icon={Building2}
              highlights={[
                tSettings("admin.sections.workspace.highlights.identity"),
                tSettings("admin.sections.workspace.highlights.rules"),
                tSettings("admin.sections.workspace.highlights.visibility"),
                tSettings("admin.sections.workspace.highlights.invites"),
              ]}
            />
          ),
        },
        {
          id: "teams",
          label: tSettings("admin.sections.teams.label"),
          description: tSettings("admin.sections.teams.description"),
          content: <TeamsSettingsSection />,
        },
        {
          id: "members",
          label: tSettings("admin.sections.members.label"),
          description: tSettings("admin.sections.members.description"),
          content: <MembersSettingsSection />,
        },
        {
          id: "ai-execution",
          label: tSettings("admin.sections.aiExecution.label"),
          description: tSettings("admin.sections.aiExecution.description"),
          content: <AiExecutionSettingsSection />,
        },
        {
          id: "security",
          label: tSettings("admin.sections.security.label"),
          description: tSettings("admin.sections.security.description"),
          content: (
            <SettingsPlaceholderSection
              title={tSettings("admin.sections.security.label")}
              description={tSettings(
                "admin.sections.security.placeholderDescription",
              )}
              icon={Shield}
              highlights={[
                tSettings("admin.sections.security.highlights.sessions"),
                tSettings("admin.sections.security.highlights.confirmations"),
                tSettings("admin.sections.security.highlights.audit"),
                tSettings("admin.sections.security.highlights.permissions"),
              ]}
            />
          ),
        },
        {
          id: "application",
          label: tSettings("admin.sections.application.label"),
          description: tSettings("admin.sections.application.description"),
          content: (
            <SettingsPlaceholderSection
              title={tSettings("admin.sections.application.label")}
              description={tSettings(
                "admin.sections.application.placeholderDescription",
              )}
              icon={Smartphone}
              highlights={[
                tSettings("admin.sections.application.highlights.clients"),
                tSettings("admin.sections.application.highlights.services"),
                tSettings("admin.sections.application.highlights.health"),
                tSettings("admin.sections.application.highlights.defaults"),
              ]}
            />
          ),
        },
        {
          id: "billing",
          label: tSettings("admin.sections.billing.label"),
          description: tSettings("admin.sections.billing.description"),
          content: (
            <SettingsPlaceholderSection
              title={tSettings("admin.sections.billing.label")}
              description={tSettings(
                "admin.sections.billing.placeholderDescription",
              )}
              icon={CreditCard}
              highlights={[
                tSettings("admin.sections.billing.highlights.overview"),
                tSettings("admin.sections.billing.highlights.seats"),
                tSettings("admin.sections.billing.highlights.invoices"),
                tSettings("admin.sections.billing.highlights.upgrades"),
              ]}
            />
          ),
        },
      ]}
    />
  );
}
