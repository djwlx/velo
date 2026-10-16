import { LockKeyhole } from 'lucide-react';
import { useLocation } from 'wouter';

import { Button } from '@/components/ui/button';

export function NeedAuth() {
  const [location, navigate] = useLocation();

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <LockKeyhole className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">请先登录后再访问</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => window.history.back()}>
          返回上一层
        </Button>
        <Button
          onClick={() =>
            navigate(`/login?redirect=${encodeURIComponent(location)}`)
          }
        >
          去登录
        </Button>
      </div>
    </main>
  );
}
