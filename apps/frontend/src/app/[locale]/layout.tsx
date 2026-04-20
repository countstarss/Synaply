import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next"
import { routing } from "@/i18n/routing";
import "@/app/globals.css";
import AppProvider from "@/providers/app-provider";
import { Toaster } from "@/components/ui/sonner"; // 导入 Toaster
import {
  getBaseSiteMetadata,
  normalizeSiteLocale,
} from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return getBaseSiteMetadata(normalizeSiteLocale(locale));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // 等待 params 解析
  const { locale } = await params;

  // 验证 locale 是否有效
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('synaply-theme') || 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch (e) {}
            `,
          }}
        />
        <Analytics />
      </head>
      <body className="bg-background font-sans text-foreground">
        <AppProvider locale={locale} messages={messages}>
          {children}
        </AppProvider>
        <Toaster position="top-right" richColors /> {/* 添加 Toaster 组件 */}
      </body>
    </html>
  );
}
