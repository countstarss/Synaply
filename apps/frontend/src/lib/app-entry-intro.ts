"use client";

export const APP_ENTRY_INTRO_REPLAY_EVENT = "synaply:app-entry-intro:replay";

const INTRO_STORAGE_PREFIX = "synaply.app-entry-intro.v1";

export function buildAppEntryIntroStorageKey(userId: string) {
  return `${INTRO_STORAGE_PREFIX}::${userId}`;
}

export function hasCompletedAppEntryIntro(userId: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(buildAppEntryIntroStorageKey(userId)) === "done";
}

export function markAppEntryIntroSeen(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(buildAppEntryIntroStorageKey(userId), "done");
}

export function clearAppEntryIntroSeen(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(buildAppEntryIntroStorageKey(userId));
}

export function requestAppEntryIntroReplay(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  clearAppEntryIntroSeen(userId);
  window.dispatchEvent(
    new CustomEvent(APP_ENTRY_INTRO_REPLAY_EVENT, {
      detail: { userId },
    }),
  );
}
