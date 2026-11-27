import { Button } from '@/components/ui/button';
import { cachePics } from '@/services/pan115';
import { Database, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

type CacheStatus = 'idle' | 'loading' | 'done' | 'error';

const STATUS_LABELS: Record<Exclude<CacheStatus, 'idle'>, string> = {
  loading: '提交中',
  done: '已开始',
  error: '重试',
};

export interface CacheButtonProps {
  cids: string[];
  label?: string;
  cache?: (cids: string[]) => Promise<unknown>;
}

export function CacheButton({
  cids,
  label = '缓存图片',
  cache = cachePics,
}: CacheButtonProps) {
  const [status, setStatus] = useState<CacheStatus>('idle');

  const handleClick = async () => {
    if (cids.length === 0) return;

    setStatus('loading');
    try {
      await cache(cids);
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
      {status === 'idle' ? label : STATUS_LABELS[status]}
    </Button>
  );
}
