"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { requestAppEntryIntroReplay } from "@/lib/app-entry-intro";
import { cn } from "@/lib/utils";
import {
  GLOW_MODES,
  GLOW_PRESETS,
  useAppearanceStore,
  type GlowMode,
  type GlowPreset,
} from "@/stores/appearance";
import AmbientGlow from "@/components/global/AmbientGlow";
import { Button } from "@/components/ui/button";

function getModePreviewBackground(
  mode: GlowMode,
  colors: GlowPreset["colors"],
) {
  const [a, b, c] = colors;

  if (mode === "aurora") {
    return [
      `linear-gradient(115deg, transparent 4%, ${a}40 26%, ${b}4d 52%, transparent 78%)`,
      `linear-gradient(74deg, transparent 12%, ${c}38 38%, transparent 72%)`,
      `radial-gradient(circle at 50% 30%, ${a}33, transparent 54%)`,
    ].join(", ");
  }

  if (mode === "ribbon") {
    return [
      `linear-gradient(145deg, transparent 4%, ${b}40 28%, transparent 58%)`,
      `linear-gradient(28deg, transparent 16%, ${a}47 46%, transparent 76%)`,
      `radial-gradient(circle at 20% 72%, ${c}38, transparent 44%)`,
    ].join(", ");
  }

  if (mode === "prism") {
    return [
      `linear-gradient(134deg, transparent 8%, ${a}26 26%, transparent 42%)`,
      `linear-gradient(146deg, transparent 18%, ${b}3a 42%, transparent 62%)`,
      `linear-gradient(158deg, transparent 28%, ${c}30 58%, transparent 76%)`,
      `radial-gradient(circle at 76% 20%, ${a}1e, transparent 26%)`,
    ].join(", ");
  }

  return [
    `radial-gradient(circle at 92% 55%, ${a}33, transparent 55%)`,
    `radial-gradient(circle at 19% 75%, ${b}33, transparent 55%)`,
    `radial-gradient(circle at 24% 11%, ${a}33, transparent 55%)`,
    `radial-gradient(circle at 38% 97%, ${c}33, transparent 55%)`,
  ].join(", ");
}

function PresetSwatch({
  preset,
  selected,
  onSelect,
}: {
  preset: GlowPreset;
  selected: boolean;
  onSelect: () => void;
}) {
  const [a, b, c] = preset.colors;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-app-text-primary/40 bg-app-button-hover"
          : "border-app-border bg-app-bg/40 hover:bg-app-button-hover/60",
      )}
    >
      <div
        className="h-14 w-full overflow-hidden rounded-md"
        style={{
          backgroundImage: [
            `radial-gradient(circle at 92% 55%, ${a}33, transparent 55%)`,
            `radial-gradient(circle at 19% 75%, ${b}33, transparent 55%)`,
            `radial-gradient(circle at 24% 11%, ${a}33, transparent 55%)`,
            `radial-gradient(circle at 38% 97%, ${c}33, transparent 55%)`,
          ].join(", "),
          backgroundColor: "#0b1220",
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {preset.label}
        </span>
        {selected && <Check className="size-4 text-foreground" />}
      </div>
    </button>
  );
}

function ModeOption({
  mode,
  label,
  description,
  colors,
  selected,
  onSelect,
}: {
  mode: GlowMode;
  label: string;
  description: string;
  colors: GlowPreset["colors"];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "h-auto w-full flex-col items-stretch justify-start gap-3 rounded-lg p-3 text-left",
        selected
          ? "border-app-text-primary/40 bg-app-button-hover"
          : "border-app-border bg-app-bg/40 hover:bg-app-button-hover/60",
      )}
    >
      <span
        className="h-14 w-full overflow-hidden rounded-md"
        style={{
          backgroundImage: getModePreviewBackground(mode, colors),
          backgroundColor: "#0b1220",
        }}
      />
      <span className="flex flex-col gap-1 whitespace-normal">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </Button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-lg border border-app-border bg-app-bg/30 px-4 py-3 text-left transition-colors hover:bg-app-button-hover/60"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </div>
      </div>
      <span
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          checked
            ? "border-sky-400/60 bg-sky-500/60"
            : "border-app-border bg-app-bg/70",
        )}
      >
        <span
          className={cn(
            "inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export default function AppearanceSettingsSection() {
  const tSettings = useTranslations("settings");
  const { user } = useAuth();
  const enabled = useAppearanceStore((s) => s.enabled);
  const animated = useAppearanceStore((s) => s.animated);
  const presetId = useAppearanceStore((s) => s.presetId);
  const mode = useAppearanceStore((s) => s.mode);
  const intensity = useAppearanceStore((s) => s.intensity);
  const setEnabled = useAppearanceStore((s) => s.setEnabled);
  const setAnimated = useAppearanceStore((s) => s.setAnimated);
  const setPresetId = useAppearanceStore((s) => s.setPresetId);
  const setMode = useAppearanceStore((s) => s.setMode);
  const setIntensity = useAppearanceStore((s) => s.setIntensity);
  const selectedPreset =
    GLOW_PRESETS.find((preset) => preset.id === presetId) ?? GLOW_PRESETS[0];
  const getModeCopy = React.useCallback(
    (modeOption: GlowMode) => ({
      label: tSettings(`appearance.modes.${modeOption}.label`),
      description: tSettings(`appearance.modes.${modeOption}.description`),
    }),
    [tSettings],
  );
  const handleReplayIntro = React.useCallback(() => {
    if (!user) {
      return;
    }

    requestAppEntryIntroReplay(user.id);
  }, [user]);

  return (
    <div className="space-y-6 py-1">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="border border-app-border bg-app-bg/40 p-3 text-muted-foreground">
            <Sparkles className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="text-lg font-semibold text-foreground">
              {tSettings("appearance.title")}
            </div>
            <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {tSettings("appearance.description")}
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleReplayIntro}
          disabled={!user}
          className="h-10 rounded-none shrink-0 self-start border-app-border bg-black/80 hover:bg-app-button-hover/60"
        >
          {tSettings("appearance.replayIntro")}
        </Button>
      </div>

      <div className="relative h-40 overflow-hidden rounded-lg border border-app-border bg-app-bg">
        <AmbientGlow />
        <div className="relative z-10 flex h-full items-end p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {tSettings("appearance.preview")}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {tSettings("appearance.modeLabel")}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GLOW_MODES.map((modeOption) => {
            const copy = getModeCopy(modeOption.id);

            return (
              <ModeOption
                key={modeOption.id}
                mode={modeOption.id}
                label={copy.label}
                description={copy.description}
                colors={selectedPreset.colors}
                selected={modeOption.id === mode}
                onSelect={() => setMode(modeOption.id)}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {tSettings("appearance.presetLabel")}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {GLOW_PRESETS.map((preset) => (
            <PresetSwatch
              key={preset.id}
              preset={preset}
              selected={preset.id === presetId}
              onSelect={() => setPresetId(preset.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-row gap-3">
        <ToggleRow
          label={tSettings("appearance.enabledLabel")}
          description={tSettings("appearance.enabledDescription")}
          checked={enabled}
          onChange={setEnabled}
        />
        <ToggleRow
          label={tSettings("appearance.animatedLabel")}
          description={tSettings("appearance.animatedDescription")}
          checked={animated}
          onChange={setAnimated}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {tSettings("appearance.intensity")}
          </div>
          <div className="text-xs text-muted-foreground">
            {Math.round(intensity * 100)}%
          </div>
        </div>
        <input
          type="range"
          min={0.3}
          max={1.8}
          step={0.05}
          value={intensity}
          onChange={(event) => setIntensity(Number(event.target.value))}
          className="w-full accent-sky-500"
        />
      </div>
    </div>
  );
}
