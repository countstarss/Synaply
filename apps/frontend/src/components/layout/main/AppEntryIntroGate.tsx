"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import AsciiAuroraBackdrop from "@/components/layout/main/AsciiAuroraBackdrop";
import { useAuth } from "@/context/AuthContext";
import {
  APP_ENTRY_INTRO_REPLAY_EVENT,
  hasCompletedAppEntryIntro,
  markAppEntryIntroSeen,
} from "@/lib/app-entry-intro";
import { cn } from "@/lib/utils";
import { useAppearanceStore, FIRST_APP_APPEARANCE_DEFAULTS } from "@/stores/appearance";
import { useWorkspaceStore } from "@/stores/workspace";

const INTRO_PROMPT_DELAY_MS = 5_000;
const THEME_STORAGE_KEY = "synaply-theme";
const INTRO_WORDMARK_FPS = 24;

const LOGO_LINES = [
  "   _____                         __",
  "  / ___/__  ______  ____ _____  / /_  __",
  "  \\__ \\/ / / / __ \\/ __ `/ __ \\/ / / / /",
  " ___/ / /_/ / / / / /_/ / /_/ / / /_/ /",
  "/____/\\__, /_/ /_/\\__,_/ .___/_/\\__, /",
  "     /____/           /_/      /____/",
];

const LOGO_PALETTE: Array<[number, number, number]> = [
  [26, 142, 88],
  [34, 197, 120],
  [45, 212, 140],
  [110, 255, 192],
  [214, 255, 237],
];

const FLY_STREAKS = [
  { top: "18%", left: "8%", x: [0, 46, 0], y: [0, -18, 12], duration: 3.2, delay: 0.2, width: 58 },
  { top: "24%", right: "10%", x: [0, -34, 10], y: [0, 18, -10], duration: 3.8, delay: 0.8, width: 64 },
  { top: "64%", left: "14%", x: [0, 40, -8], y: [0, -14, 10], duration: 4.2, delay: 1.2, width: 52 },
  { top: "68%", right: "14%", x: [0, -42, 12], y: [0, 16, -12], duration: 3.4, delay: 0.4, width: 74 },
  { top: "42%", left: "2%", x: [0, 26, 4], y: [0, 8, -6], duration: 2.8, delay: 1.5, width: 34 },
  { top: "48%", right: "3%", x: [0, -26, -4], y: [0, -8, 6], duration: 3.1, delay: 1.9, width: 36 },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function interpolateColor(
  palette: Array<[number, number, number]>,
  amount: number,
) {
  const normalized = clamp(amount);
  const scaled = normalized * (palette.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(index + 1, palette.length - 1);
  const blend = scaled - index;
  const [r1, g1, b1] = palette[index];
  const [r2, g2, b2] = palette[nextIndex];

  return [
    Math.round(r1 + (r2 - r1) * blend),
    Math.round(g1 + (g2 - g1) * blend),
    Math.round(b1 + (b2 - b1) * blend),
  ] as const;
}

function SynaplyIntroWordmark() {
  const [time, setTime] = React.useState(0);

  React.useEffect(() => {
    let frameId = 0;
    const start = performance.now();
    let lastTick = 0;

    const tick = (now: number) => {
      if (!lastTick || now - lastTick >= 1000 / INTRO_WORDMARK_FPS) {
        setTime((now - start) / 1000);
        lastTick = now;
      }
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const sweepPosition = ((Math.sin(time * 0.85) * 0.5) + 0.5) * 52 - 6;

  return (
    <div className="relative flex items-center justify-center">
      <div className="pointer-events-none absolute inset-[-10%] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_58%)] blur-3xl" />

      {FLY_STREAKS.map((streak, index) => (
        <motion.span
          key={index}
          className="pointer-events-none absolute h-px rounded-full bg-emerald-200/85 shadow-[0_0_16px_rgba(110,255,192,0.9)]"
          style={{
            top: streak.top,
            left: streak.left,
            right: streak.right,
            width: streak.width,
          }}
          animate={{
            x: streak.x,
            y: streak.y,
            opacity: [0, 0.95, 0],
            scaleX: [0.25, 1, 0.35],
          }}
          transition={{
            duration: streak.duration,
            delay: streak.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.pre
        aria-hidden="true"
        className={cn(
          "relative z-10 m-0 overflow-x-auto px-4 text-[clamp(0.58rem,1.35vw,1.25rem)] leading-[0.92] tracking-[-0.08em] text-transparent",
          "font-mono whitespace-pre select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        {LOGO_LINES.map((line, rowIndex) => (
          <div key={rowIndex}>
            {[...line].map((character, columnIndex) => {
              if (character === " ") {
                return <span key={`${rowIndex}-${columnIndex}`}> </span>;
              }

              const distance = Math.abs(columnIndex - sweepPosition);
              const highlight = Math.exp(-(distance * distance) / 14);
              const shimmer =
                0.5 +
                0.5 *
                  Math.sin(time * 2.35 + columnIndex * 0.24 + rowIndex * 0.82);
              const energy = clamp(0.42 + shimmer * 0.28 + highlight * 0.52);
              const [r, g, b] = interpolateColor(LOGO_PALETTE, energy);

              return (
                <span
                  key={`${rowIndex}-${columnIndex}`}
                  style={{
                    color: `rgb(${r} ${g} ${b})`,
                    textShadow: `0 0 ${8 + highlight * 18}px rgba(${r}, ${g}, ${b}, ${0.3 + highlight * 0.42})`,
                  }}
                >
                  {character}
                </span>
              );
            })}
          </div>
        ))}
      </motion.pre>

      <div className="pointer-events-none absolute inset-x-[14%] top-[18%] h-px bg-gradient-to-r from-transparent via-emerald-200/60 to-transparent blur-sm" />
      <div className="pointer-events-none absolute inset-x-[16%] bottom-[20%] h-px bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent blur-sm" />
    </div>
  );
}

export default function AppEntryIntroGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const tShell = useTranslations("shell");
  const { user, loading } = useAuth();
  const { setTheme } = useTheme();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspaceId);
  const setScope = useAppearanceStore((state) => state.setScope);
  const ensureScopedPreferences = useAppearanceStore(
    (state) => state.ensureScopedPreferences,
  );
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const promptTimerRef = React.useRef<number | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [showIntro, setShowIntro] = React.useState(false);
  const [promptVisible, setPromptVisible] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const beginIntro = React.useCallback(() => {
    if (promptTimerRef.current) {
      window.clearTimeout(promptTimerRef.current);
      promptTimerRef.current = null;
    }

    setShowIntro(true);
    setPromptVisible(false);
    promptTimerRef.current = window.setTimeout(() => {
      setPromptVisible(true);
    }, INTRO_PROMPT_DELAY_MS);
  }, []);

  React.useEffect(() => {
    if (!mounted || loading || !user) {
      return;
    }

    const scope = { userId: user.id, workspaceId };
    setScope(scope);
    ensureScopedPreferences(scope, FIRST_APP_APPEARANCE_DEFAULTS);

    try {
      if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
        window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
        setTheme("dark");
      }
    } catch (error) {
      console.warn("Failed to initialize Synaply intro theme defaults.", error);
    }

    let shouldShowIntro = false;

    try {
      shouldShowIntro = !hasCompletedAppEntryIntro(user.id);
    } catch (error) {
      console.warn("Failed to read Synaply intro status.", error);
    }

    if (!shouldShowIntro) {
      setShowIntro(false);
      setPromptVisible(false);
      return;
    }

    beginIntro();

    return () => {
      if (promptTimerRef.current) {
        window.clearTimeout(promptTimerRef.current);
        promptTimerRef.current = null;
      }
    };
  }, [
    beginIntro,
    mounted,
    loading,
    user,
    workspaceId,
    setScope,
    ensureScopedPreferences,
    setTheme,
  ]);

  React.useEffect(() => {
    if (showIntro && promptVisible) {
      overlayRef.current?.focus();
    }
  }, [showIntro, promptVisible]);

  const completeIntro = React.useCallback(() => {
    if (!user || !promptVisible) {
      return;
    }

    try {
      markAppEntryIntroSeen(user.id);
    } catch (error) {
      console.warn("Failed to persist Synaply intro status.", error);
    }

    if (promptTimerRef.current) {
      window.clearTimeout(promptTimerRef.current);
      promptTimerRef.current = null;
    }

    setShowIntro(false);
  }, [promptVisible, user]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!promptVisible) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      completeIntro();
    },
    [completeIntro, promptVisible],
  );

  const handlePointerDown = React.useCallback(() => {
    if (!promptVisible) {
      return;
    }

    completeIntro();
  }, [completeIntro, promptVisible]);

  React.useEffect(() => {
    if (!mounted || !user) {
      return;
    }

    const handleReplay = (
      event: Event,
    ) => {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId !== user.id) {
        return;
      }

      beginIntro();
    };

    window.addEventListener(
      APP_ENTRY_INTRO_REPLAY_EVENT,
      handleReplay as EventListener,
    );
    return () =>
      window.removeEventListener(
        APP_ENTRY_INTRO_REPLAY_EVENT,
        handleReplay as EventListener,
      );
  }, [beginIntro, mounted, user]);

  return (
    <>
      {children}

      <AnimatePresence>
        {mounted && showIntro ? (
          <motion.div
            key="synaply-entry-intro"
            ref={overlayRef}
            tabIndex={0}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
            onKeyDown={handleKeyDown}
            onPointerDown={handlePointerDown}
            className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#030607] outline-none"
          >
            <AsciiAuroraBackdrop />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.28))]" />

            <div className="relative z-10 flex w-full max-w-6xl items-center justify-center px-6">
              <SynaplyIntroWordmark />
            </div>

            <AnimatePresence>
              {promptVisible ? (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="pointer-events-none absolute bottom-6 right-6 z-20 text-right"
                >
                  <div className="text-xs uppercase tracking-[0.28em] text-emerald-100/78">
                    {tShell("entryIntro.prompt")}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
