import { CheckCircle2, LoaderCircle, LogIn, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { AvatarImage } from '@/components/avatar-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface AccountCardProps {
  id: string;
  title: string;
  icon: LucideIcon;
  connected: boolean;
  loading: boolean;
  pending: boolean;
  accountName: string | null;
  avatarUrl: string | null;
  onLogin: () => void;
  onLogout: () => void;
}

export function AccountCard({
  title,
  icon: Icon,
  connected,
  loading,
  pending,
  accountName,
  avatarUrl,
  onLogin,
  onLogout,
}: AccountCardProps) {
  const initial = accountName?.slice(0, 1) || title.slice(0, 1);

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary"
            style={{ width: 44, height: 44, flex: '0 0 44px' }}
          >
            {loading ? (
              <Skeleton className="size-full rounded-full" />
            ) : connected && avatarUrl ? (
              <AvatarImage
                src={avatarUrl}
                alt={accountName || `${title} 头像`}
                className="rounded-full object-cover"
                style={{
                  display: 'block',
                  width: 44,
                  height: 44,
                  maxWidth: 44,
                  maxHeight: 44,
                }}
                fallback={
                  <span className="flex size-full items-center justify-center font-medium">
                    {initial}
                  </span>
                }
              />
            ) : (
              <Icon aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate">{title}</CardTitle>
            <CardDescription className="truncate">
              {loading ? (
                <Skeleton className="h-4 w-28" />
              ) : connected ? (
                accountName || '账号资料暂不可用'
              ) : (
                '尚未登录'
              )}
            </CardDescription>
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
        ) : connected ? (
          <Badge variant="secondary">
            <CheckCircle2 data-icon="inline-start" />
            已连接
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="flex justify-end">
        {loading ? (
          <Skeleton className="h-8 w-24 rounded-lg" />
        ) : connected ? (
          <Button variant="outline" onClick={onLogout} disabled={pending}>
            {pending ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <LogOut data-icon="inline-start" />
            )}
            退出登录
          </Button>
        ) : (
          <Button onClick={onLogin} disabled={loading}>
            <LogIn data-icon="inline-start" />
            登录
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
