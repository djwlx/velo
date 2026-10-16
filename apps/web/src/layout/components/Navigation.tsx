import {
  FileText,
  House,
  Image,
  ShieldCheck,
  UserCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

import { cn } from '@/lib/utils';

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavigationSection {
  title?: string;
  items: NavigationItem[];
}

const navigationSections: NavigationSection[] = [
  {
    items: [
      { href: '/', label: '首页', icon: House },
      { href: '/115', label: '115 文件', icon: FileText },
      { href: '/pic', label: '随机图片', icon: Image },
    ],
  },
];

export const getSettingNavigationSections = (
  canManageAuth: boolean
): NavigationSection[] => [
  {
    title: '基本设置',
    items: [{ href: '/setting/me', label: '用户信息', icon: UserCircle }],
  },
  ...(canManageAuth
    ? [
        {
          title: '管理员设置',
          items: [
            { href: '/setting/users', label: '用户管理', icon: Users },
            { href: '/setting/roles', label: '角色管理', icon: ShieldCheck },
          ],
        },
      ]
    : []),
];

interface NavigationProps {
  sections?: NavigationSection[];
  onNavigate?: () => void;
}

export function Navigation({
  sections = navigationSections,
  onNavigate,
}: NavigationProps) {
  const [location] = useLocation();

  return (
    <nav aria-label="主导航" className="flex flex-col gap-4 p-3">
      {sections.map((section, index) => (
        <div key={section.title ?? index} className="flex flex-col gap-1">
          {section.title ? (
            <div className="px-3 pt-1 text-xs font-medium text-muted-foreground">
              {section.title}
            </div>
          ) : null}
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? location === '/'
                : location === item.href ||
                  location.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <Icon data-icon="inline-start" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
