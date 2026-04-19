"use client";

import React, { createContext, useContext } from "react";

const CachedPageVisibilityContext = createContext(true);

export function CachedPageVisibilityProvider({
  isActive,
  children,
}: {
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <CachedPageVisibilityContext.Provider value={isActive}>
      {children}
    </CachedPageVisibilityContext.Provider>
  );
}

export const useCachedPageVisibility = () =>
  useContext(CachedPageVisibilityContext);
