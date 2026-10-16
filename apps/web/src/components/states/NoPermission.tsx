import { ShieldX } from 'lucide-react';

export function NoPermission() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-2">
      <ShieldX className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">无权限访问</p>
    </main>
  );
}
