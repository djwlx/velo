import { Button } from '@/components/ui/button';
import { cachePics } from '@/services/pan115';
import { Database, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

type CacheStatus = 'idle' | 'loading' | 'done' | 'error';

const LABELS: Record<CacheStatus, string> = {
  idle: '缓存图片',
  loading: '提交中',
  done: '已开始',
  error: '重试',
};

export interface CacheButtonProps {
  cids: string[];
}

export function CacheButton({ cids }: CacheButtonProps) {
  const [status, setStatus] = useState<CacheStatus>('idle');

  const handleClick = async () => {
    if (cids.length === 0) return;

    setStatus('loading');
    try {
      await cachePics(cids);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={cids.length === 0 || status === 'loading' || status === 'done'}
      onClick={handleClick}
    >
      {status === 'loading' ? (
        <LoaderCircle className="animate-spin" data-icon="inline-start" />
      ) : (
        <Database data-icon="inline-start" />
      )}
      {LABELS[status]}
    </Button>
  );
}
