"use client";

import React from "react";
import InboxPageContent from "@/components/inbox/InboxPageContent";

export const CachedInboxPage = React.memo(() => {
  return (
    <div className="h-full w-full">
      <InboxPageContent />
    </div>
  );
});

CachedInboxPage.displayName = "CachedInboxPage";
