"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Sidebar from "./Sidebar";
import InfoBar from "./Infobar";

interface MainLayoutProps {
  children: React.ReactNode;
  infoBarProps?: {
    title?: string;
    subtitle?: string;
    showViewToggle?: boolean;
    showSearch?: boolean;
  };
  className?: string;
}

const MainLayout = ({ children, infoBarProps, className }: MainLayoutProps) => {
  return (
    <div className={cn("flex h-screen bg-app-bg", className)}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* InfoBar */}
        <InfoBar {...infoBarProps} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-app-bg">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
