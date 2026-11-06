import { useCallback, useEffect, useState } from 'react';
import { Cloud, LoaderCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { poll115QrLogin, start115QrLogin } from '@/services/pan115';

type QrStatus = 'waiting' | 'scanned' | 'authorized' | 'expired' | 'failed';

interface QrLoginView {
  sessionId: string;
  imageDataUrl: string;
}

interface Account115LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => Promise<unknown>;
}

const statusText: Record<QrStatus, string> = {
  waiting: '等待扫码',
  scanned: '已扫码，请在手机上确认登录',
  authorized: '登录成功',
  expired: '二维码已过期，请重新生成',
  failed: '登录失败，请重新生成二维码',
};

export function Account115LoginDialog({
  open,
  onOpenChange,
  onLoginSuccess,
}: Account115LoginDialogProps) {
  const [qrLogin, setQrLogin] = useState<QrLoginView | null>(null);
  const [qrStatus, setQrStatus] = useState<QrStatus>('waiting');
  const [starting, setStarting] = useState(false);

  const handleStartLogin = useCallback(async () => {
    setStarting(true);
    setQrLogin(null);
    setQrStatus('waiting');
    try {
      const response = await start115QrLogin();
      setQrLogin({
        sessionId: response.data.sessionId,
        imageDataUrl: response.data.imageDataUrl,
      });
    } catch {
      setQrStatus('failed');
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    if (open) void handleStartLogin();
  }, [open, handleStartLogin]);

  useEffect(() => {
    const sessionId = qrLogin?.sessionId;
    if (!open || !sessionId) return;

    let active = true;
    let nextPoll: number | undefined;

    const poll = async () => {
      try {
        const response = await poll115QrLogin(sessionId);
        if (!active) return;

        const status = response.data.status;
        setQrStatus(status);
        if (status === 'authorized') {
          onOpenChange(false);
          setQrLogin(null);
          toast.add({ type: 'success', title: '115 账号登录成功' });
          await onLoginSuccess();
          return;
        }
        if (status === 'expired' || status === 'failed') return;
      } catch {
        if (active) setQrStatus('failed');
        return;
      }

      nextPoll = window.setTimeout(() => void poll(), 1500);
    };

    void poll();
    return () => {
      active = false;
      if (nextPoll !== undefined) window.clearTimeout(nextPoll);
    };
  }, [open, qrLogin?.sessionId, onLoginSuccess, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setQrLogin(null);
      setQrStatus('waiting');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>登录 115 网盘</DialogTitle>
          <DialogDescription>
            使用 115 App 扫描二维码并确认登录。
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-lg bg-muted/40 p-5 text-center">
          {starting ? (
            <>
              <LoaderCircle className="animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">正在生成二维码…</p>
            </>
          ) : qrLogin ? (
            <>
              <img
                src={qrLogin.imageDataUrl}
                alt="115 网盘登录二维码"
                className="size-48 rounded-md bg-background p-2"
              />
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {statusText[qrStatus]}
              </p>
            </>
          ) : (
            <>
              <Cloud className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {statusText[qrStatus]}
              </p>
            </>
          )}
        </div>

        {qrStatus === 'expired' || qrStatus === 'failed' ? (
          <DialogFooter>
            <Button onClick={() => void handleStartLogin()} disabled={starting}>
              <RefreshCw data-icon="inline-start" />
              重新生成二维码
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
