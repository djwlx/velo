import { useEffect, useRef } from 'react';
import { ArrowLeft, FileVideo2 } from 'lucide-react';
import { useLocation } from 'wouter';

import { VideoPlayer } from '@/components/video-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clearLocalVideo, getLocalVideo } from './local-video';

export function LocalVideoPage() {
  const [, setLocation] = useLocation();
  const releaseTimerRef = useRef<number | null>(null);
  const video = getLocalVideo();

  useEffect(() => {
    if (releaseTimerRef.current !== null) {
      window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }
    if (!video) return;

    return () => {
      releaseTimerRef.current = window.setTimeout(() => {
        clearLocalVideo(video.src);
        releaseTimerRef.current = null;
      }, 0);
    };
  }, [video]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 py-6">
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setLocation('/')}
      >
        <ArrowLeft data-icon="inline-start" />
        返回
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 break-all">
            <FileVideo2 className="size-5 shrink-0 text-muted-foreground" />
            {video?.name ?? '本地视频'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {video ? (
            <VideoPlayer src={video.src} type={video.type} />
          ) : (
            <p className="text-sm text-muted-foreground">
              本地视频已失效，请返回首页重新选择。
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
