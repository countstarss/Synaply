import React from "react";
import { ThemeProvider } from "./theme-provider";
import {
  NextIntlClientProvider,
  type AbstractIntlMessages,
} from "next-intl";
import { AuthProvider } from "@/context/AuthContext";
import { QueryProvider } from "./query-provider"; // 导入 QueryProvider

interface AppProviderProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

const AppProvider = ({ children, locale, messages }: AppProviderProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="synaply-theme"
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
};

export default AppProvider;
