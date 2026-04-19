"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SidebarItem = ({
  title,
  href,
}: { title: string, href: string }) => {
  const pathname = usePathname();
  return (
    <Link href={href} className={cn('h-10 flex items-center transition-all',
      href === pathname ? 'border-r-4 border-black/80 dark:border-white/80' : 'border-r-4 border-transparent dark:border-transparent'
    )}>
      <h1 className="block text-gray-600 hover:text-black dark:text-gray-200 dark:hover:text-white">{title}</h1>
    </Link>
  )
}

export default SidebarItem;