"use client";

import React from "react";

export default function PersonalDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full min-h-0">{children}</div>;
}
