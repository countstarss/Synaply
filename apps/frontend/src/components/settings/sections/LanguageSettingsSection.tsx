"use client";

import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LanguageSettingsSection() {
  const tSettings = useTranslations("settings");

  return (
    <div className="space-y-6 py-1">
      <div className="flex items-start gap-4">
        <div className="border border-app-border bg-app-bg/40 p-3 text-muted-foreground">
          <Languages className="size-5" />
        </div>
        <div className="space-y-1">
          <div className="text-lg font-semibold text-foreground">
            {tSettings("general.sections.language.label")}
          </div>
          <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {tSettings("general.sections.language.description")}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-app-border bg-app-bg/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl space-y-1">
          <div className="text-sm font-medium text-foreground">
            {tSettings("general.sections.language.selectorLabel")}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {tSettings("general.sections.language.selectorDescription")}
          </p>
        </div>

        <div className="shrink-0">
          <LanguageSwitcher variant="surface" />
        </div>
      </div>
    </div>
  );
}
