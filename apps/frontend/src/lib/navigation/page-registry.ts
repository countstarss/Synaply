import {
  BookAIcon,
  Bug,
  FolderOpen,
  Inbox,
  ListCheck,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  isReady?: boolean;
}

type WorkspaceNavVisibility = "all" | "team" | "personal";

interface ProductPageDefinition extends NavItem {
  id: string;
  segment: string;
  order: number;
  cached: boolean;
  navVisibility: WorkspaceNavVisibility;
  labelKey: string;
  borderlessShellPatterns?: readonly string[];
}

type TranslationFn = (key: string) => string;

export const productPages = [
  {
    id: "tasks",
    segment: "tasks",
    order: 1,
    cached: true,
    navVisibility: "all",
    icon: ListCheck,
    label: "",
    labelKey: "nav.myWork",
    href: "/tasks",
  },
  {
    id: "projects",
    segment: "projects",
    order: 2,
    cached: true,
    navVisibility: "all",
    icon: FolderOpen,
    label: "",
    labelKey: "nav.projects",
    href: "/projects",
    borderlessShellPatterns: ["/projects/:projectId/:issueId"],
  },
  {
    id: "issues",
    segment: "issues",
    order: 3,
    cached: true,
    navVisibility: "all",
    icon: Bug,
    label: "",
    labelKey: "nav.issues",
    href: "/issues",
    borderlessShellPatterns: ["/issues/:issueId"],
  },
  {
    id: "workflows",
    segment: "workflows",
    order: 4,
    cached: true,
    navVisibility: "team",
    icon: Workflow,
    label: "",
    labelKey: "nav.workflows",
    href: "/workflows",
  },
  {
    id: "docs",
    segment: "docs",
    order: 5,
    cached: true,
    navVisibility: "all",
    icon: BookAIcon,
    label: "",
    labelKey: "nav.docs",
    href: "/docs",
    borderlessShellPatterns: ["/docs", "/personal/doc"],
  },
  {
    id: "inbox",
    segment: "inbox",
    order: 6,
    cached: true,
    navVisibility: "all",
    icon: Inbox,
    label: "",
    labelKey: "nav.inbox",
    href: "/inbox",
  },
  {
    id: "intelligence",
    segment: "intelligence",
    order: 7,
    cached: true,
    navVisibility: "all",
    icon: Sparkles,
    label: "",
    labelKey: "nav.intelligence",
    href: "/intelligence",
    borderlessShellPatterns: ["/intelligence", "/intelligence/:threadId"],
  },
] as const satisfies readonly ProductPageDefinition[];

export type ProductPageId = (typeof productPages)[number]["id"];

const PRODUCT_PAGE_ID_BY_SEGMENT = new Map<string, ProductPageId>(
  productPages.map((page) => [page.segment, page.id]),
);

const PROJECT_SUBVIEW_ROUTE_SEGMENTS = new Set([
  "issues",
  "docs",
  "workflow",
  "sync",
]);

export const pageOrderById = productPages.reduce(
  (result, page) => {
    result[page.id] = page.order;
    return result;
  },
  {} as Record<ProductPageId, number>,
);

export const getReadyNavItems = <T extends NavItem>(items: readonly T[]) =>
  items.filter((item) => item.isReady !== false);

const getNavItemsByVisibility = (
  visibility: Exclude<WorkspaceNavVisibility, "all">,
) =>
  productPages.filter(
    (page) => page.navVisibility === "all" || page.navVisibility === visibility,
  );

export const mainNavItems = getNavItemsByVisibility("team");
export const personalNavItems = getNavItemsByVisibility("personal");

function withResolvedLabels(
  items: readonly ProductPageDefinition[],
  t: TranslationFn,
): NavItem[] {
  return items.map(({ labelKey, ...item }) => ({
    ...item,
    label: t(labelKey),
  }));
}

export const getWorkspaceNavItems = (
  t: TranslationFn,
  workspaceType?: string | null,
) =>
  getReadyNavItems(
    withResolvedLabels(
      workspaceType === "TEAM" ? mainNavItems : personalNavItems,
      t,
    ),
  );

export const normalizeProductPathname = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(firstSegment)) {
    segments.shift();
  }

  return `/${segments.join("/")}` || "/";
};

const routeMatchesPattern = (pathname: string, routePattern: string) => {
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const routePatternSegments = routePattern.split("/").filter(Boolean);

  if (pathnameSegments.length !== routePatternSegments.length) {
    return false;
  }

  return routePatternSegments.every((segment, index) => {
    if (segment.startsWith(":")) {
      if (
        routePatternSegments[0] === "projects" &&
        segment === ":issueId" &&
        PROJECT_SUBVIEW_ROUTE_SEGMENTS.has(pathnameSegments[index])
      ) {
        return false;
      }

      return Boolean(pathnameSegments[index]);
    }

    return segment === pathnameSegments[index];
  });
};

export const borderlessContentShellRoutes = productPages.flatMap(
  (page: ProductPageDefinition) => page.borderlessShellPatterns ?? [],
);

export const shouldUseBorderlessContentShell = (pathname: string) => {
  const routePathname = normalizeProductPathname(pathname);

  return borderlessContentShellRoutes.some((route) =>
    routeMatchesPattern(routePathname, route),
  );
};

export const getProductPageIdFromPathname = (
  pathname: string,
): ProductPageId | null => {
  const routePathname = normalizeProductPathname(pathname);
  const [firstSegment] = routePathname.split("/").filter(Boolean);

  if (!firstSegment) {
    return null;
  }

  return PRODUCT_PAGE_ID_BY_SEGMENT.get(firstSegment) ?? null;
};
