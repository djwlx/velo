import { useState } from 'react';
import { LogOut, Menu, Settings } from 'lucide-react';
import { Link, useLocation } from 'wouter';

import { AvatarImage } from '@/components/avatar-image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/stores/user';
import { SidebarSheet } from './SidebarSheet';

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return Array.from(parts[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Header() {
  const signOut = useUser((state) => state.signOut);
  const user = useUser((state) => state.user);
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userInitials = getInitials(user?.nickname || user?.email || '');

  const showSidebar = location.startsWith('/setting');

  if (location.startsWith('/login') || location.startsWith('/register')) {
    return null;
  }

  return (
    <header className="flex h-14 shrink-0 items-center border-b px-4">
      {showSidebar ? (
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="打开导航菜单"
        >
          <Menu />
        </Button>
      ) : null}
      <Link href="/" className="flex items-center gap-2 text-lg font-medium">
        <img src="/logo.svg" alt="" aria-hidden="true" className="size-8" />
        <span>Velo</span>
      </Link>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                className="ml-auto rounded-full"
                aria-label="账户菜单"
              />
            }
          >
            <AvatarImage
              src={user.avatar ?? ''}
              alt=""
              className="size-9 rounded-full object-cover"
              fallback={
                <span className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                  {userInitials}
                </span>
              }
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setLocation('/setting/me')}
                className="gap-3 px-2 py-2"
              >
                <AvatarImage
                  src={user.avatar ?? ''}
                  alt=""
                  className="size-8 shrink-0 rounded-full object-cover"
                  fallback={
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {userInitials}
                    </span>
                  }
                />
                <span className="truncate">{user.nickname || user.email}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setLocation('/setting/me')}>
                <Settings data-icon="inline-start" />
                设置
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={signOut}>
                <LogOut data-icon="inline-start" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <SidebarSheet open={sidebarOpen} onOpenChange={setSidebarOpen} />
    </header>
  );
}
