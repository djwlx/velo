import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useUser } from '@/stores/user';
import { Header } from './header';
import { useLocation } from 'wouter';
import { Sidebar } from './sidebar';
interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const refresh = useUser((state) => state.refresh);
  const [location] = useLocation();

  const showSidebar = location.startsWith('/setting');

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="w-screen h-dvh flex flex-col">
      <Header />
      <div className="flex min-h-0 min-w-0 flex-1">
        {showSidebar && (
          <aside className="hidden w-64 shrink-0 overflow-y-auto border-r md:block">
            <Sidebar />
          </aside>
        )}
        <div className="min-w-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
