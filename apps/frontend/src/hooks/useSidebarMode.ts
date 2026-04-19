"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";

export type SidebarMode = "main" | "settings";

interface ModeChangeOptions {
  skipAnimation?: boolean;
}

const SETTINGS_ROUTE_PREFIX = "/settings";
const DEFAULT_MAIN_ROUTE = "/tasks";
const LAST_NON_SETTINGS_ROUTE_STORAGE_KEY =
  "synaply:last-non-settings-route";

function isSettingsPath(pathname: string) {
  return (
    pathname === SETTINGS_ROUTE_PREFIX ||
    pathname.startsWith(`${SETTINGS_ROUTE_PREFIX}/`)
  );
}

function buildRouteSnapshot(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
) {
  const queryString = searchParams.toString();
  const hash =
    typeof window === "undefined" ? "" : window.location.hash || "";

  return `${pathname}${queryString ? `?${queryString}` : ""}${hash}`;
}

export function useSidebarMode() {
  const [mode, setMode] = useState<SidebarMode>("main");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isModeTransitionEnabled, setIsModeTransitionEnabled] = useState(true);
  const [returnToMainPath, setReturnToMainPath] =
    useState(DEFAULT_MAIN_ROUTE);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 使用ref来跟踪当前模式和路径
  const currentModeRef = useRef<SidebarMode>("main");
  const previousPathnameRef = useRef<string>("");
  const isTransitioningRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 触发模式变化
  const triggerModeChange = useCallback(
    (newMode: SidebarMode, options?: ModeChangeOptions) => {
      const skipAnimation = options?.skipAnimation ?? false;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 如果模式没有变化，直接返回
      if (currentModeRef.current === newMode) {
        return;
      }

      if (skipAnimation) {
        isTransitioningRef.current = false;
        setIsTransitioning(false);
        setIsModeTransitionEnabled(false);
      } else {
        // 设置过渡状态
        isTransitioningRef.current = true;
        setIsTransitioning(true);
        setIsModeTransitionEnabled(true);
      }

      // 更新模式
      currentModeRef.current = newMode;
      setMode(newMode);

      if (skipAnimation) {
        animationFrameRef.current = window.requestAnimationFrame(() => {
          animationFrameRef.current = window.requestAnimationFrame(() => {
            setIsModeTransitionEnabled(true);
            animationFrameRef.current = null;
          });
        });
        return;
      }

      // 动画完成后重置状态
      timeoutRef.current = setTimeout(() => {
        isTransitioningRef.current = false;
        setIsTransitioning(false);
        timeoutRef.current = null;
      }, 300);
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedRoute = window.sessionStorage.getItem(
      LAST_NON_SETTINGS_ROUTE_STORAGE_KEY,
    );

    if (storedRoute) {
      setReturnToMainPath(storedRoute);
    }
  }, []);

  useEffect(() => {
    if (!pathname || isSettingsPath(pathname)) {
      return;
    }

    const currentRoute = buildRouteSnapshot(pathname, searchParams);
    setReturnToMainPath((previousRoute) => {
      if (previousRoute === currentRoute) {
        return previousRoute;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          LAST_NON_SETTINGS_ROUTE_STORAGE_KEY,
          currentRoute,
        );
      }

      return currentRoute;
    });
  }, [pathname, searchParams]);

  // 根据路径自动切换模式
  useEffect(() => {
    const shouldShowSettings = isSettingsPath(pathname);
    const newMode: SidebarMode = shouldShowSettings ? "settings" : "main";

    // 检查路径是否真的发生了变化
    const pathnameChanged = previousPathnameRef.current !== pathname;
    previousPathnameRef.current = pathname;

    // 只有在路径变化且模式需要改变时才触发
    if (pathnameChanged && currentModeRef.current !== newMode) {
      triggerModeChange(newMode);
    } else if (!pathnameChanged && currentModeRef.current !== newMode) {
      // 处理初始化情况（组件首次渲染）
      currentModeRef.current = newMode;
      setMode(newMode);
    }
  }, [pathname, triggerModeChange]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const switchToSettings = useCallback(() => {
    if (!isTransitioningRef.current) {
      triggerModeChange("settings");
    }
  }, [triggerModeChange]);

  const switchToMain = useCallback((options?: ModeChangeOptions) => {
    if (!isTransitioningRef.current) {
      triggerModeChange("main", options);
    }
  }, [triggerModeChange]);

  return {
    mode,
    isTransitioning,
    isModeTransitionEnabled,
    switchToSettings,
    switchToMain,
    returnToMainPath,
  };
}
