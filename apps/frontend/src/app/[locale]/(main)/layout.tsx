import type { Metadata } from "next";

import MainLayoutClient from "./main-layout-client";

import { getNoIndexMetadata } from "@/lib/seo";

interface LayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = getNoIndexMetadata();

export default function MainLayout({ children }: LayoutProps) {
  return <MainLayoutClient>{children}</MainLayoutClient>;
}
