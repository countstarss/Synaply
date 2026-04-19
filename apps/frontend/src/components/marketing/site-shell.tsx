"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { MarketingBackground } from "@/components/marketing/marketing-background";
import { useSiteCopy } from "@/components/marketing/site-copy";
import { ConicButton } from "@/components/ui/conic-button";
import { useAuth } from "@/context/AuthContext";
import { Link } from "@/i18n/navigation";
import { AUTH_ROUTE, DEFAULT_POST_LOGIN_ROUTE } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

interface MarketingShellProps {
  current?: "home" | "pricing" | "about";
  children: React.ReactNode;
}

const navItems = [
  { key: "home", href: "/landing" },
  { key: "pricing", href: "/pricing" },
  { key: "about", href: "/about" },
] as const;

const marketingLogo = "/synaply-logo.png";

export function MarketingShell({
  current,
  children,
}: MarketingShellProps) {
  const copy = useSiteCopy();
  const t = useTranslations();
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070b] text-white">
      <MarketingBackground />

      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#05070b]/84 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/landing">
            <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.03]">
              <Image
                src={marketingLogo}
                alt="Synaply"
                width={28}
                height={28}
                sizes="28px"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/92">
                Synaply
              </p>
              <p className="text-xs text-white/42">{copy.tagline}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => {
                const active = current === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "inline-flex h-10 items-center border px-4 text-sm transition",
                      active
                        ? "border-white/12 bg-white/[0.05] text-white"
                        : "border-transparent text-white/56 hover:border-white/8 hover:bg-white/[0.03] hover:text-white/82",
                    )}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                );
              })}
            </nav>

            <LanguageSwitcher variant="dark" />

            <ConicButton
              asChild
              className="hidden sm:inline-flex"
              innerClassName="px-4"
            >
              <Link href={user ? DEFAULT_POST_LOGIN_ROUTE : AUTH_ROUTE}>
                {user ? t("nav.dashboard") : t("nav.login")}
              </Link>
            </ConicButton>
          </div>
        </div>
      </header>

      <main className="relative z-10">{children}</main>
    </div>
  );
}
