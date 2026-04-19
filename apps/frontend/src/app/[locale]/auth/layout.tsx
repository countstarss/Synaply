import type { Metadata } from "next";

import { getNoIndexMetadata } from "@/lib/seo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = getNoIndexMetadata();

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <>{children}</>;
}
