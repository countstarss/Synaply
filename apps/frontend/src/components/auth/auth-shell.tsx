import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import logo from "@/assets/icons/logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { MarketingBackground } from "@/components/marketing/marketing-background";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { type SiteCopy } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  copy: SiteCopy;
  homeLabel?: string;
  children: React.ReactNode;
}

interface AuthCardProps {
  className?: string;
  children: React.ReactNode;
}

interface AuthMessageProps {
  tone: "success" | "error";
  children: React.ReactNode;
}

interface AuthStatusCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  footer?: React.ReactNode;
}

export function AuthShell({
  copy,
  homeLabel = "Home",
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07090d] text-white">
      <MarketingBackground />

      <header className="relative z-10 border-b border-white/8 bg-black/12 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/landing">
            <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.03]">
              <Image
                src={logo}
                alt="Synaply"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-white/92 uppercase">
                Synaply
              </p>
              <p className="text-xs text-white/48">{copy.tagline}</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="hidden h-10 border border-white/10 bg-white/[0.03] px-4 text-white/78 hover:bg-white/[0.05] hover:text-white sm:inline-flex"
            >
              <Link href="/landing">
                <ArrowLeft className="h-4 w-4" />
                {homeLabel}
              </Link>
            </Button>
            <LanguageSwitcher variant="dark" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-76px)] w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_28rem] lg:px-8 xl:grid-cols-[minmax(0,1.08fr)_30rem]">
        <section className="hidden lg:block">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/58">
              {copy.auth.eyebrow}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-white xl:text-[3.5rem] xl:leading-[1.05]">
                {copy.auth.title}
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/62 xl:text-lg">
                {copy.auth.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {copy.auth.highlights.map((item) => (
                <div
                  key={item}
                  className="border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-white/72"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

        </section>

        <section className="relative">
          <div className="mx-auto w-full max-w-[30rem]">{children}</div>
        </section>
      </main>
    </div>
  );
}

export function AuthCard({ className, children }: AuthCardProps) {
  return (
    <Card
      className={cn(
        "rounded-[14px] border border-white/10 bg-[#0b0e13]/92 p-6 text-white shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8",
        className,
      )}
    >
      {children}
    </Card>
  );
}

export function AuthMessage({ tone, children }: AuthMessageProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border px-4 py-3 text-sm leading-6",
        tone === "error"
          ? "border-red-400/20 bg-red-400/10 text-red-100"
          : "border-white/10 bg-white/[0.04] text-white/78",
      )}
    >
      {children}
    </div>
  );
}

export function AuthStatusCard({
  icon,
  title,
  description,
  footer,
}: AuthStatusCardProps) {
  return (
    <AuthCard className="text-center">
      <div className="mx-auto flex h-18 w-18 items-center justify-center border border-white/10 bg-white/[0.04] text-white">
        {icon}
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-3 text-sm leading-7 text-white/60">{description}</p>
      {footer ? <div className="mt-8">{footer}</div> : null}
    </AuthCard>
  );
}
