import { cn } from '@/lib/utils';
import { Link, useLocation } from 'wouter';
import type { SidebarProps, SidebarSection } from './types';
import { useMemo } from 'react';
import { settingSidebarConfig } from './configs/setting';
import { VersionBadge } from './VersionBadge';
import { useUser } from '@/stores/user';
import { Settings2 } from 'lucide-react';

export function Sidebar(props: SidebarProps) {
  const { sections: propSections, onNavigate } = props;
  const [location] = useLocation();
  const roles = useUser((state) => state.roles);

  const sections = useMemo<SidebarSection[]>(() => {
    let useconfig;
    if (location.startsWith('/setting')) {
      useconfig = settingSidebarConfig;
    } else {
      useconfig = propSections ?? [];
    }

    return useconfig.filter((item) => {
      if (item.roles) {
        return item.roles.some((role) =>
          roles.some((granted) => granted.code === role)
        );
      }

      return true;
    });
  }, [propSections, location, roles]);

  return (
    <nav
      aria-label="设置导航"
      className="flex min-h-full flex-col gap-7 bg-sidebar p-5 text-sidebar-foreground"
    >
      <div className="flex items-center gap-3 px-1 pb-1">
        <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <Settings2 className="size-5" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold tracking-tight">设置</h2>
          <p className="text-xs text-muted-foreground">管理账户与权限</p>
        </div>
      </div>
      {sections.map((section, index) => (
        <div key={section.title ?? index} className="flex flex-col gap-2">
          {section.title ? (
            <h3 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground">
              {section.title}
            </h3>
          ) : null}
          <div className="flex flex-col gap-1">
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
                    'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all',
                    'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    isActive &&
                      'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
                  )}
                >
                  <Icon data-icon="inline-start" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <VersionBadge />
    </nav>
  );
}
