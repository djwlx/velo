import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import type { SidebarProps, SidebarSection } from './types';
import { useMemo } from 'react';
import { settingSidebarConfig } from './configs/setting';

export function Sidebar(props: SidebarProps) {
  const { sections: propSections, onNavigate } = props;
  const [location] = useLocation();

  const sections = useMemo<SidebarSection[]>(() => {
    if (location.startsWith('/setting')) {
      return settingSidebarConfig;
    } else {
      return propSections ?? [];
    }
  }, [propSections, location]);

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
