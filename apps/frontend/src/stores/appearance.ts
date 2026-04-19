import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface GlowPreset {
  id: string;
  label: string;
  colors: [string, string, string];
}

export type GlowMode =
  | "glow"
  | "aurora"
  | "ribbon"
  | "prism";

export interface GlowModeOption {
  id: GlowMode;
}

export const GLOW_MODES: GlowModeOption[] = [
  { id: "glow" },
  { id: "aurora" },
  { id: "ribbon" },
  { id: "prism" },
];

const LEGACY_GLOW_MODE_ALIASES = {
  mist: "prism",
  softwave: "ribbon",
  edgeglow: "glow",
  pulse: "ribbon",
  corona: "glow",
} as const;

// Each preset defines three hues. The primary color fills the three larger
// blobs and the accent color fills the fourth — matching the reference SVG
// (three blue circles + one purple accent).
export const GLOW_PRESETS: GlowPreset[] = [
  {
    id: "azure",
    label: "Azure",
    colors: ["#0788FF", "#7C33FF", "#38bdf8"],
  },
  {
    id: "violet",
    label: "Violet",
    colors: ["#8b5cf6", "#ec4899", "#a855f7"],
  },
  {
    id: "emerald",
    label: "Emerald",
    colors: ["#10b981", "#06b6d4", "#34d399"],
  },
  {
    id: "sunset",
    label: "Sunset",
    colors: ["#f97316", "#f43f5e", "#facc15"],
  },
  {
    id: "rose",
    label: "Rose",
    colors: ["#f472b6", "#a855f7", "#fb7185"],
  },
  {
    id: "slate",
    label: "Slate",
    colors: ["#64748b", "#94a3b8", "#cbd5f5"],
  },
];

interface AppearancePreferences {
  presetId: string;
  mode: GlowMode;
  animated: boolean;
  enabled: boolean;
  intensity: number;
}

const DEFAULT_PREFERENCES: AppearancePreferences = {
  presetId: "azure",
  mode: "glow",
  animated: false,
  enabled: true,
  intensity: 1,
};

export const FIRST_APP_APPEARANCE_DEFAULTS: AppearancePreferences = {
  presetId: "emerald",
  mode: "aurora",
  animated: true,
  enabled: true,
  intensity: 1.8,
};

interface AppearanceScope {
  userId: string | null;
  workspaceId: string | null;
}

interface AppearanceState extends AppearancePreferences {
  scope: AppearanceScope;
  scopedPreferences: Record<string, AppearancePreferences>;
  setScope: (scope: AppearanceScope) => void;
  ensureScopedPreferences: (
    scope: AppearanceScope,
    defaults?: Partial<AppearancePreferences>,
  ) => void;
  setPresetId: (presetId: string) => void;
  setMode: (mode: GlowMode) => void;
  setAnimated: (animated: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  setIntensity: (intensity: number) => void;
}

function scopeKey(scope: AppearanceScope) {
  return `${scope.userId ?? "anon"}::${scope.workspaceId ?? "global"}`;
}

function readPreferences(
  scopedPreferences: Record<string, AppearancePreferences>,
  scope: AppearanceScope,
): AppearancePreferences {
  return normalizePreferences(scopedPreferences[scopeKey(scope)]);
}

function isGlowMode(value: unknown): value is GlowMode {
  return GLOW_MODES.some((mode) => mode.id === value);
}

function coerceGlowMode(value: unknown): GlowMode | null {
  if (isGlowMode(value)) {
    return value;
  }

  if (typeof value === "string" && value in LEGACY_GLOW_MODE_ALIASES) {
    return LEGACY_GLOW_MODE_ALIASES[
      value as keyof typeof LEGACY_GLOW_MODE_ALIASES
    ];
  }

  return null;
}

function normalizePreferences(
  preferences?: Partial<AppearancePreferences>,
): AppearancePreferences {
  return {
    ...DEFAULT_PREFERENCES,
    ...preferences,
    mode: coerceGlowMode(preferences?.mode) ?? DEFAULT_PREFERENCES.mode,
  };
}

function writePreferences(
  scopedPreferences: Record<string, AppearancePreferences>,
  scope: AppearanceScope,
  patch: Partial<AppearancePreferences>,
): Record<string, AppearancePreferences> {
  const key = scopeKey(scope);
  const current = readPreferences(scopedPreferences, scope);
  return {
    ...scopedPreferences,
    [key]: { ...current, ...patch },
  };
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,
      scope: { userId: null, workspaceId: null },
      scopedPreferences: {},
      setScope: (scope) => {
        const { scopedPreferences } = get();
        const prefs = readPreferences(scopedPreferences, scope);
        set({ scope, ...prefs });
      },
      ensureScopedPreferences: (scope, defaults) => {
        const { scopedPreferences } = get();
        const key = scopeKey(scope);
        const existing = scopedPreferences[key];

        if (existing) {
          if (scopeKey(get().scope) === key) {
            set({ scope, ...readPreferences(scopedPreferences, scope) });
          }
          return;
        }

        const seeded = normalizePreferences(defaults);
        const next = {
          ...scopedPreferences,
          [key]: seeded,
        };

        if (scopeKey(get().scope) === key) {
          set({ scope, scopedPreferences: next, ...seeded });
          return;
        }

        set({ scopedPreferences: next });
      },
      setPresetId: (presetId) => {
        const { scope, scopedPreferences } = get();
        const next = writePreferences(scopedPreferences, scope, { presetId });
        set({ presetId, scopedPreferences: next });
      },
      setMode: (mode) => {
        const { scope, scopedPreferences } = get();
        const next = writePreferences(scopedPreferences, scope, { mode });
        set({ mode, scopedPreferences: next });
      },
      setAnimated: (animated) => {
        const { scope, scopedPreferences } = get();
        const next = writePreferences(scopedPreferences, scope, { animated });
        set({ animated, scopedPreferences: next });
      },
      setEnabled: (enabled) => {
        const { scope, scopedPreferences } = get();
        const next = writePreferences(scopedPreferences, scope, { enabled });
        set({ enabled, scopedPreferences: next });
      },
      setIntensity: (intensity) => {
        const { scope, scopedPreferences } = get();
        const next = writePreferences(scopedPreferences, scope, { intensity });
        set({ intensity, scopedPreferences: next });
      },
    }),
    {
      name: "synaply.appearance",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ scopedPreferences: state.scopedPreferences }),
    },
  ),
);

export function getGlowPreset(presetId: string): GlowPreset {
  return GLOW_PRESETS.find((preset) => preset.id === presetId) ?? GLOW_PRESETS[0];
}
