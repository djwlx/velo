import { LogOut, Menu, UserCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';

import { Button } from '@/components/ui/button';
import { useUser } from '@/stores/user';
import { SidebarSheet } from './SidebarSheet';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const signOut = useUser((state) => state.signOut);
  const user = useUser((state) => state.user);
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showSidebar = location.startsWith('/setting');

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
      <Link href="/" className="text-lg font-medium">
        Velo
      </Link>
      {user ? (
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/setting/me"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.nickname || user.email}
                className="size-5 rounded-full object-cover"
              />
            ) : (
              <UserCircle data-icon="inline-start" />
            )}
            <span>{user.nickname || user.email}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            aria-label="退出登录"
          >
            <LogOut />
          </Button>
        </div>
      ) : null}
      <SidebarSheet open={sidebarOpen} onOpenChange={setSidebarOpen} />
    </header>
  );
}
