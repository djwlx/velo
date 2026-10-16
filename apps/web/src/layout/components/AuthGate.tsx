import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Redirect, useLocation, useSearch } from 'wouter';

import { useUser } from '@/stores/user';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [location] = useLocation();
  const search = useSearch();
  const initialized = useUser((state) => state.initialized);
  const user = useUser((state) => state.user);
  const refresh = useUser((state) => state.refresh);
  const requiresAuth =
    location === '/115' ||
    location.startsWith('/115/') ||
    location === '/setting' ||
    location.startsWith('/setting/');

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (requiresAuth && !initialized) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (requiresAuth && !user) {
    const target = `${location}${search ? `?${search}` : ''}`;
    return <Redirect to={`/login?redirect=${encodeURIComponent(target)}`} />;
  }
  return <>{children}</>;
}
