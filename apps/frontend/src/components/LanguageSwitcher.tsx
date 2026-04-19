'use client';

import { Check, ChevronDown, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark' | 'surface';
}

export default function LanguageSwitcher({
  variant = 'light',
}: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const tLanguage = useTranslations('language');
  const router = useRouter();
  const pathname = usePathname();
  const languages = [
    { code: 'en', name: tLanguage('english'), flag: 'EN' },
    { code: 'zh', name: tLanguage('chinese'), flag: 'ZH' },
    { code: 'ko', name: tLanguage('korean'), flag: 'KO' },
    { code: 'ja', name: tLanguage('japanese'), flag: 'JA' },
  ] as const;

  const currentLanguage =
    languages.find((language) => language.code === locale) || languages[0];
  const isDark = variant === 'dark';
  const isSurface = variant === 'surface';

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) {
      return;
    }

    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <button
          type="button"
          className={cn(
            'inline-flex h-10 items-center gap-3 rounded-md border px-3 text-sm font-medium transition',
            isSurface && 'min-w-[220px] justify-between',
            isDark
              ? 'border-white/10 bg-[#090b10]/90 text-white/82 shadow-[0_12px_40px_rgba(0,0,0,0.28)] hover:bg-[#0d1016]'
              : isSurface
                ? 'border-app-border bg-app-content-bg text-foreground shadow-sm hover:bg-app-button-hover/70'
                : 'border-black/10 bg-white text-neutral-800 shadow-sm hover:bg-neutral-50',
            isPending && 'cursor-not-allowed opacity-60',
          )}
        >
          <span
            className={cn(
              'flex h-6 min-w-9 items-center justify-center rounded-[3px] border px-2 text-[10px] font-semibold tracking-[0.18em]',
              isDark
                ? 'border-white/10 bg-white/[0.04] text-white/76'
                : isSurface
                  ? 'border-app-border bg-app-bg/80 text-foreground/80'
                  : 'border-black/10 bg-neutral-100 text-neutral-700',
            )}
          >
            {currentLanguage.flag}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span
              className={cn(
                'block text-[9px] uppercase tracking-[0.22em]',
                isDark
                  ? 'text-white/38'
                  : isSurface
                    ? 'text-muted-foreground'
                    : 'text-neutral-500',
              )}
            >
              {tLanguage('label')}
            </span>
            <span
              className={cn(
                'block truncate text-sm',
                isDark
                  ? 'text-white/84'
                  : isSurface
                    ? 'text-foreground'
                    : 'text-neutral-800',
              )}
            >
              {currentLanguage.name}
            </span>
          </span>
          <Languages className="h-4 w-4 opacity-55" />
          <ChevronDown className="h-4 w-4 opacity-55" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isSurface ? 'start' : 'end'}
        className={cn(
          'min-w-60 rounded-lg border p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]',
          isDark
            ? 'border-white/10 bg-[#090b10]/96 text-white backdrop-blur-xl'
            : isSurface
              ? 'border-app-border bg-app-content-bg text-foreground'
              : 'border-black/10 bg-white text-neutral-900',
        )}
      >
        {languages.map((language) => {
          const active = language.code === locale;

          return (
            <DropdownMenuItem
              key={language.code}
              onClick={() => switchLanguage(language.code)}
              className={cn(
                'grid grid-cols-[40px_minmax(0,1fr)_16px] items-center gap-3 rounded-md px-3 py-2.5',
                isDark
                  ? 'focus:bg-white/[0.05] focus:text-white'
                  : isSurface
                    ? 'focus:bg-app-button-hover focus:text-foreground'
                    : 'focus:bg-neutral-100 focus:text-neutral-900',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-10 items-center justify-center rounded-[4px] border text-[10px] font-semibold tracking-[0.18em]',
                  active
                    ? isDark
                      ? 'border-white/14 bg-white/[0.06] text-white'
                      : isSurface
                        ? 'border-app-text-primary/20 bg-app-button-hover text-foreground'
                        : 'border-black/10 bg-neutral-100 text-neutral-900'
                    : isDark
                      ? 'border-white/10 bg-white/[0.03] text-white/62'
                      : isSurface
                        ? 'border-app-border bg-app-bg/60 text-muted-foreground'
                      : 'border-black/10 bg-neutral-100 text-neutral-900',
                )}
              >
                {language.flag}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block truncate text-sm',
                    active
                      ? isDark
                        ? 'text-white'
                        : isSurface
                          ? 'text-foreground'
                          : 'text-neutral-900'
                      : isDark
                        ? 'text-white/78'
                        : isSurface
                          ? 'text-foreground'
                          : 'text-neutral-800',
                  )}
                >
                  {language.name}
                </span>
                <span
                  className={cn(
                    'block text-[10px] uppercase tracking-[0.2em]',
                    isDark
                      ? 'text-white/32'
                      : isSurface
                        ? 'text-muted-foreground'
                        : 'text-neutral-400',
                  )}
                >
                  {language.code}
                </span>
              </span>
              {active ? (
                <Check
                  className={cn(
                    'h-4 w-4',
                    isDark
                      ? 'text-white/82'
                      : isSurface
                        ? 'text-foreground'
                        : 'text-neutral-800',
                  )}
                />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
