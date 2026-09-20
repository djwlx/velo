import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'wouter';

import { useUser } from '@/stores/user';
import {
  AuthGate,
  Header,
  Sidebar,
  getSettingNavigationSections,
} from './components';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [location] = useLocation();
  const showSidebar = location.startsWith('/setting');
  const user = useUser((state) => state.user);
  const permissions = useUser((state) => state.permissions);
  const isAuthPage = location === '/login' || location === '/register';
  const settingSections = getSettingNavigationSections(
    permissions.includes('module:auth')
  );
  const page = (
    <div key={location} className="page-transition h-full">
      {children}
    </div>
  );

  if (isAuthPage) return <AuthGate>{page}</AuthGate>;

  return (
    <AuthGate>
      <div className="w-screen h-dvh flex flex-col">
        <Header
          showMenu={showSidebar}
          userProfile={user}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <div className="flex-1 flex min-h-0">
          {showSidebar ? (
            <Sidebar
              sections={settingSections}
              mobileOpen={mobileSidebarOpen}
              onMobileOpenChange={setMobileSidebarOpen}
            />
          ) : null}
          <div className="flex-1 min-h-0 overflow-scroll">{page}</div>
        </div>
      </div>
    </AuthGate>
  );
}
