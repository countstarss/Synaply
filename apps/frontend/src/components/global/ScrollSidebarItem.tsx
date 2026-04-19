/**
 * 支持滚动监听功能的侧边栏项组件
 * 用于设置页面等需要滚动监听的场景
 */

"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface ScrollSidebarItemProps {
  title: string;
  href: string;
  active?: boolean;
  onClick: (href: string) => void;
}

const ScrollSidebarItem = ({
  title,
  href,
  active = false,
  onClick,
}: ScrollSidebarItemProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        'h-10 flex items-center px-3 rounded-md transition-all text-sm',
        active
          ? 'bg-neutral-200 text-gray-900 font-medium dark:bg-gray-800 dark:text-white'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/60'
      )}
    >
      {title}
    </a>
  );
};

export default ScrollSidebarItem; 