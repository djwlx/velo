import { LogOut, Menu, UserCircle } from 'lucide-react';
import { Link } from 'wouter';

import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/services/user/types';
import { useUser } from '@/stores/user';

interface HeaderProps {
  showMenu?: boolean;
  onMenuClick?: () => void;
  userProfile?: UserProfile | null;
}

export function Header({
  showMenu = false,
  onMenuClick,
  userProfile,
}: HeaderProps) {
  const signOut = useUser((state) => state.signOut);

  return (
    <header className="flex h-14 shrink-0 items-center border-b px-4">
      {showMenu ? (
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onMenuClick}
          aria-label="打开导航菜单"
        >
          <Menu />
        </Button>
      ) : null}
      <Link href="/" className="text-lg font-medium">
        Velo
      </Link>
      {userProfile ? (
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/setting/me"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.nickname || userProfile.email}
                className="size-5 rounded-full object-cover"
              />
            ) : (
              <UserCircle data-icon="inline-start" />
            )}
            <span>{userProfile.nickname || userProfile.email}</span>
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
    </header>
  );
}
