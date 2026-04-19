"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SettingsScrollSection {
  id: string;
  label: string;
  description?: string;
  content: React.ReactNode;
}

interface SettingsScrollPageProps {
  title: string;
  description?: string;
  sections: SettingsScrollSection[];
  sectionGroupLabel?: string;
}

export default function SettingsScrollPage({
  title,
  description,
  sections,
  sectionGroupLabel,
}: SettingsScrollPageProps) {
  const tSettings = useTranslations("settings");
  const pathname = usePathname();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const sectionRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const [activeSectionId, setActiveSectionId] = React.useState(
    sections[0]?.id ?? "",
  );

  const activeSectionIndex = React.useMemo(
    () => sections.findIndex((section) => section.id === activeSectionId),
    [activeSectionId, sections],
  );

  const syncHash = React.useCallback((sectionId: string) => {
    if (typeof window === "undefined" || !sectionId) {
      return;
    }

    const nextHash = `#${sectionId}`;

    if (window.location.hash === nextHash) {
      return;
    }

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${nextHash}`,
    );
    window.dispatchEvent(new CustomEvent("settings:hash-update"));
  }, []);

  const scrollToSection = React.useCallback(
    (
      sectionId: string,
      options?: {
        behavior?: ScrollBehavior;
        syncUrl?: boolean;
      },
    ) => {
      const container = contentRef.current;
      const sectionElement = sectionRefs.current[sectionId];

      if (!container || !sectionElement) {
        return;
      }

      container.scrollTo({
        top: Math.max(sectionElement.offsetTop - 16, 0),
        behavior: options?.behavior ?? "smooth",
      });

      setActiveSectionId(sectionId);

      if (options?.syncUrl !== false) {
        syncHash(sectionId);
      }
    },
    [syncHash],
  );

  const scrollToAdjacentSection = React.useCallback(
    (direction: -1 | 1) => {
      if (activeSectionIndex === -1) {
        return;
      }

      const nextSection = sections[activeSectionIndex + direction];

      if (!nextSection) {
        return;
      }

      scrollToSection(nextSection.id);
    },
    [activeSectionIndex, scrollToSection, sections],
  );

  React.useEffect(() => {
    if (!sections.length) {
      return;
    }

    setActiveSectionId((currentId) => {
      if (currentId && sections.some((section) => section.id === currentId)) {
        return currentId;
      }

      return sections[0].id;
    });
  }, [sections]);

  React.useEffect(() => {
    const container = contentRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const scrollAnchor = container.scrollTop + 140;
      let nextActiveSectionId = sections[0]?.id ?? "";

      for (const section of sections) {
        const sectionElement = sectionRefs.current[section.id];

        if (!sectionElement) {
          continue;
        }

        if (sectionElement.offsetTop <= scrollAnchor) {
          nextActiveSectionId = section.id;
        }
      }

      setActiveSectionId((currentId) =>
        currentId === nextActiveSectionId ? currentId : nextActiveSectionId,
      );
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [sections]);

  React.useEffect(() => {
    if (!sections.length) {
      return;
    }

    const applyLocationHash = (behavior: ScrollBehavior) => {
      const hashSectionId = window.location.hash.replace(/^#/, "");
      const targetSectionId = sections.some(
        (section) => section.id === hashSectionId,
      )
        ? hashSectionId
        : sections[0]?.id;

      if (!targetSectionId) {
        return;
      }

      scrollToSection(targetSectionId, {
        behavior,
        syncUrl: false,
      });
    };

    const frameId = window.requestAnimationFrame(() => {
      applyLocationHash("auto");
    });

    const handleHashChange = () => {
      applyLocationHash("smooth");
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener(
      "settings:hash-update",
      handleHashChange as EventListener,
    );

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener(
        "settings:hash-update",
        handleHashChange as EventListener,
      );
    };
  }, [pathname, scrollToSection, sections]);

  const renderSectionButton = (section: SettingsScrollSection, index: number) => {
    const isActive = section.id === activeSectionId;

    return (
      <button
        key={section.id}
        type="button"
        onClick={() => scrollToSection(section.id)}
        className={cn(
          "min-w-[140px] rounded-md border border-app-border bg-app-bg/50 px-3 py-2.5 text-left transition-colors",
          isActive ? "bg-app-button-hover text-foreground" : "hover:bg-app-button-hover",
        )}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="mt-1 text-sm font-semibold text-foreground">
          {section.label}
        </div>
        {section.description && (
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {section.description}
          </div>
        )}
      </button>
    );
  };

  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0];

  return (
    <div className="flex h-full min-h-0 flex-col select-none">
      <div className="border-b border-app-border px-5 py-[15px] sm:px-6">
        {sectionGroupLabel && (
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {sectionGroupLabel}
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div className="hidden items-center gap-3 border border-app-border bg-app-bg/40 px-3 py-2 md:flex">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {String(Math.max(activeSectionIndex + 1, 1)).padStart(2, "0")} /{" "}
                {String(sections.length).padStart(2, "0")}
              </div>
              <div className="text-sm font-medium text-foreground">
                {activeSection?.label}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => scrollToAdjacentSection(-1)}
              disabled={activeSectionIndex <= 0}
            >
              <ChevronUp className="size-4" />
              {tSettings("navigation.previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => scrollToAdjacentSection(1)}
              disabled={
                activeSectionIndex === -1 ||
                activeSectionIndex >= sections.length - 1
              }
            >
              <ChevronDown className="size-4" />
              {tSettings("navigation.next")}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {sections.map((section, index) => renderSectionButton(section, index))}
        </div>
      </div>

      <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex max-w-5xl px-5 sm:px-6 mx-auto flex-col justify-center">
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              ref={(node) => {
                sectionRefs.current[section.id] = node;
              }}
              className={cn("py-8", index > 0 && "border-t border-app-border")}
            >
              <div className="mb-6">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                  {section.label}
                </h2>
                {section.description && (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {section.description}
                  </p>
                )}
              </div>
              {section.content}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
