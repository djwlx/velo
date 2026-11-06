import { useState } from 'react';
import { Cloud } from 'lucide-react';

import { withAuth } from '@/components/permission';
import { toast } from '@/components/ui/toast';
import { useRequestQuery } from '@/hooks/useRequestQuery';
import { get115AccountStatus, remove115Account } from '@/services/pan115';

import { Account115LoginDialog } from './components/115-login-dialog';
import { AccountCard, type AccountCardProps } from './components/account-card';

function AccountConfigPage() {
  const { data, loading, refetch } = useRequestQuery(get115AccountStatus);
  const [loginOpen, setLoginOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const bound = data?.data.bound ?? false;
  const profile = data?.data.profile ?? null;
  const profileAvailable = data?.data.profileAvailable ?? true;

  const handleLogout = async () => {
    setRemoving(true);
    try {
      await remove115Account();
      toast.add({ type: 'success', title: '115 账号已退出' });
      await refetch();
    } catch {
      // The request layer displays the error.
    } finally {
      setRemoving(false);
    }
  };

  const accountCards: AccountCardProps[] = [
    {
      id: '115',
      title: '115 网盘',
      icon: Cloud,
      connected: bound,
      loading,
      pending: removing,
      accountName: profileAvailable ? (profile?.userName ?? null) : null,
      avatarUrl: profile?.avatarUrl ?? null,
      onLogin: () => setLoginOpen(true),
      onLogout: () => void handleLogout(),
    },
  ];

  return (
    <main className="flex min-h-0 flex-1 justify-center overflow-auto px-4 py-6">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">账户配置</h1>
          <p className="text-sm text-muted-foreground">
            管理已连接的外部账户。
          </p>
        </header>

        <section
          aria-label="外部账户"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {accountCards.map((account) => (
            <AccountCard key={account.id} {...account} />
          ))}
        </section>
      </div>

      <Account115LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onLoginSuccess={refetch}
      />
    </main>
  );
}

export default withAuth(AccountConfigPage, { permission: 'admin' });
