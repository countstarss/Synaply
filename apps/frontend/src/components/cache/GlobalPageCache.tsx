"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";
import { CachedPageVisibilityProvider } from "@/components/cache/CachedPageVisibility";
import {
  getProductPageIdFromPathname,
  pageOrderById,
} from "@/lib/navigation/page-registry";
import { CachedTasksPage } from "./pages/CachedTasksPage";
import { CachedProjectsPage } from "./pages/CachedProjectsPage";
import { CachedIssuesPage } from "./pages/CachedIssuesPage";
import { CachedWorkflowsPage } from "./pages/CachedWorkflowsPage";
import { CachedDocsPage } from "./pages/CachedDocsPage";
import { CachedInboxPage } from "./pages/CachedInboxPage";
import { CachedIntelligencePage } from "./pages/CachedIntelligencePage";

const PAGE_COMPONENTS = {
  tasks: CachedTasksPage,
  projects: CachedProjectsPage,
  issues: CachedIssuesPage,
  workflows: CachedWorkflowsPage,
  docs: CachedDocsPage,
  inbox: CachedInboxPage,
  intelligence: CachedIntelligencePage,
} as const;

type PageId = keyof typeof PAGE_COMPONENTS;
type PagePosition = "left" | "center" | "right" | "hidden";

const getPageIdFromPath = (pathname: string): PageId | null => {
  const pageId = getProductPageIdFromPathname(pathname);

  if (pageId && pageId in PAGE_COMPONENTS) {
    return pageId as PageId;
  }

  return null;
};

interface PageState {
  id: PageId;
  position: PagePosition;
  isAnimating: boolean;
}

const createInitialPageStates = (initialPageId: PageId | null) => {
  const initialStates = {} as Record<PageId, PageState>;

  (Object.keys(PAGE_COMPONENTS) as PageId[]).forEach((pageId) => {
    initialStates[pageId] = {
      id: pageId,
      position: pageId === initialPageId ? "center" : "hidden",
      isAnimating: false,
    };
  });

  return initialStates;
};

const createInitialMountedPages = (initialPageId: PageId | null) => {
  const initialMounted = {} as Record<PageId, boolean>;

  (Object.keys(PAGE_COMPONENTS) as PageId[]).forEach((pageId) => {
    initialMounted[pageId] = pageId === initialPageId;
  });

  return initialMounted;
};

const getPageStyle = (state: PageState): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transition: state.isAnimating
      ? "transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none",
    willChange: state.isAnimating ? "transform, opacity" : "auto",
    contain: "layout paint style",
  };

  switch (state.position) {
    case "left":
      return {
        ...baseStyle,
        transform: "translateX(-100%)",
        opacity: 1,
        visibility: "visible",
        pointerEvents: "none",
        zIndex: 5,
      };
    case "center":
      return {
        ...baseStyle,
        transform: "translateX(0%)",
        opacity: 1,
        visibility: "visible",
        pointerEvents: "auto",
        zIndex: 10,
      };
    case "right":
      return {
        ...baseStyle,
        transform: "translateX(100%)",
        opacity: 1,
        visibility: "visible",
        pointerEvents: "none",
        zIndex: 5,
      };
    case "hidden":
    default:
      return {
        ...baseStyle,
        transform: "translateX(0%)",
        opacity: 0,
        visibility: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      };
  }
};

const PageRenderer = React.memo(
  ({ state, shouldMount }: { state: PageState; shouldMount: boolean }) => {
    if (!shouldMount) {
      return null;
    }

    const PageComponent = PAGE_COMPONENTS[state.id];

    return (
      <div style={getPageStyle(state)} aria-hidden={state.position !== "center"}>
        <CachedPageVisibilityProvider isActive={state.position === "center"}>
          <PageComponent />
        </CachedPageVisibilityProvider>
      </div>
    );
  },
);

PageRenderer.displayName = "PageRenderer";

export const GlobalPageCache = React.memo(() => {
  const pathname = usePathname();
  const initialPageId = getPageIdFromPath(pathname);
  const [currentPageId, setCurrentPageId] = useState<PageId | null>(
    initialPageId,
  );
  const [pageStates, setPageStates] = useState<Record<PageId, PageState>>(() =>
    createInitialPageStates(initialPageId),
  );
  const [mountedPages, setMountedPages] = useState<Record<PageId, boolean>>(
    () => createInitialMountedPages(initialPageId),
  );
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performTransition = useCallback(
    (fromPageId: PageId | null, toPageId: PageId) => {
      if (fromPageId === toPageId) {
        return;
      }

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      setMountedPages((prev) => ({
        ...prev,
        [toPageId]: true,
        ...(fromPageId ? { [fromPageId]: true } : {}),
      }));

      const fromOrder = fromPageId ? pageOrderById[fromPageId] : 0;
      const toOrder = pageOrderById[toPageId];
      const isForward = toOrder > fromOrder;

      setPageStates((prev) => {
        const next = { ...prev };

        (Object.keys(next) as PageId[]).forEach((pageId) => {
          if (pageId !== fromPageId && pageId !== toPageId) {
            next[pageId] = {
              ...next[pageId],
              position: "hidden",
              isAnimating: false,
            };
          }
        });

        if (fromPageId) {
          next[fromPageId] = {
            ...next[fromPageId],
            position: "center",
            isAnimating: false,
          };
        }

        next[toPageId] = {
          ...next[toPageId],
          position: isForward ? "right" : "left",
          isAnimating: false,
        };

        return next;
      });

      setTimeout(() => {
        setPageStates((prev) => {
          const next = { ...prev };

          if (fromPageId) {
            next[fromPageId] = {
              ...next[fromPageId],
              position: isForward ? "left" : "right",
              isAnimating: true,
            };
          }

          next[toPageId] = {
            ...next[toPageId],
            position: "center",
            isAnimating: true,
          };

          return next;
        });

        animationTimeoutRef.current = setTimeout(() => {
          setPageStates((prev) => {
            const next = { ...prev };

            (Object.keys(next) as PageId[]).forEach((pageId) => {
              next[pageId] = {
                ...next[pageId],
                position: pageId === toPageId ? "center" : "hidden",
                isAnimating: false,
              };
            });

            return next;
          });
        }, 300);
      }, 16);
    },
    [],
  );

  useEffect(() => {
    const newPageId = getPageIdFromPath(pathname);

    if (!newPageId) {
      setCurrentPageId(null);
      return;
    }

    if (!mountedPages[newPageId]) {
      setMountedPages((prev) => ({
        ...prev,
        [newPageId]: true,
      }));
    }

    if (newPageId !== currentPageId) {
      performTransition(currentPageId, newPageId);
      setCurrentPageId(newPageId);
    }
  }, [pathname, currentPageId, mountedPages, performTransition]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ContextMenuWrapper>
      <div className="relative w-full h-full overflow-hidden">
        {(Object.keys(PAGE_COMPONENTS) as PageId[]).map((pageId) => (
          <PageRenderer
            key={pageId}
            state={pageStates[pageId]}
            shouldMount={mountedPages[pageId]}
          />
        ))}
      </div>
    </ContextMenuWrapper>
  );
});

GlobalPageCache.displayName = "GlobalPageCache";
