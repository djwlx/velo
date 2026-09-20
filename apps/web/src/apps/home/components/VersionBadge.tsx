import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useRequestQuery } from '@/hooks/useRequestQuery';
import { checkUpdate, getVersion, updateWeb } from '@/services/config';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function VersionBadge() {
  const { data } = useRequestQuery(getVersion);
  const server = data?.data.server;
  const web = data?.data.web;

  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [latest, setLatest] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 2000);
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await checkUpdate();
      if (res.data.hasUpdate && res.data.latest) {
        setLatest(res.data.latest);
        setOpen(true);
      } else {
        flash('已是最新版本');
      }
    } catch {
      flash('检查更新失败');
    } finally {
      setChecking(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateWeb();
      window.location.reload();
    } catch {
      setUpdating(false);
      flash('更新失败');
    }
  };

  if (!server) return null;

  return (
    <>
      <Badge variant="secondary">
        <span>
          server v{server}
          {web ? ` · web v${web}` : ''}
        </span>
        <button
          type="button"
          aria-label="检查更新"
          disabled={checking || updating}
          onClick={handleCheck}
          className="inline-flex items-center justify-center transition-colors hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={checking ? 'size-3 animate-spin' : 'size-3'} />
        </button>
      </Badge>
      {notice ? (
        <span className="text-xs text-muted-foreground">{notice}</span>
      ) : null}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>发现新版本</AlertDialogTitle>
            <AlertDialogDescription>
              最新前端版本 v{latest}，是否立即更新？更新后页面会自动刷新。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction disabled={updating} onClick={handleUpdate}>
              {updating ? '更新中…' : '确认更新'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
