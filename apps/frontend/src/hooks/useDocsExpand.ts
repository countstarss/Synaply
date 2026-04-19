import React from "react";

// 创建展开状态的 Context
export const DocsExpandContext = React.createContext<{
  isExpanded: boolean;
  onToggleExpand: () => void;
}>({
  isExpanded: false,
  onToggleExpand: () => {},
});

export const useDocsExpand = () => React.useContext(DocsExpandContext);
