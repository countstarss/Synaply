import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// 创建本地化的导航 API
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing); 