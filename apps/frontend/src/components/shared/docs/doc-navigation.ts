import type { DocContext } from "@/lib/fetchers/doc";
import {
  buildDocStorageKey,
  resolveDocHref,
} from "@/components/shared/docs/doc-navigation-utils";

interface DocNavigator {
  push: (href: string) => void;
}

interface OpenDocRouteOptions {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  context: DocContext;
  docId: string;
  projectId?: string | null;
  router: DocNavigator;
  setActiveDocId: (docId: string | null) => void;
}

export function openDocRoute(options: OpenDocRouteOptions) {
  const {
    workspaceId,
    workspaceType,
    context,
    docId,
    projectId,
    router,
    setActiveDocId,
  } = options;

  if (typeof window !== "undefined") {
    const storageKey = buildDocStorageKey({
      workspaceId,
      workspaceType,
      context,
      projectId,
    });
    localStorage.setItem(storageKey, JSON.stringify([docId]));
  }

  setActiveDocId(docId);
  router.push(
    resolveDocHref({
      context,
      projectId,
    }),
  );
}
