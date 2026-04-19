import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SettingsPlaceholderSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badgeLabel?: string;
  highlights: string[];
}

export default function SettingsPlaceholderSection({
  title,
  description,
  icon: Icon,
  badgeLabel = "Planned",
  highlights,
}: SettingsPlaceholderSectionProps) {
  return (
    <div className="space-y-5 py-1">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="border border-app-border bg-app-bg/40 p-3 text-muted-foreground">
            <Icon className="size-5" />
          </div>
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground">{title}</div>
            <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="rounded-sm">
          {badgeLabel}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {highlights.map((highlight) => (
          <div
            key={highlight}
            className="border border-app-border bg-app-bg/30 px-4 py-3 text-sm text-muted-foreground"
          >
            {highlight}
          </div>
        ))}
      </div>
    </div>
  );
}
