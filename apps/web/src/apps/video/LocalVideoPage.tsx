import { FileVideo2 } from 'lucide-react';
import { useSearchParams } from 'wouter';

import { VideoPlayer } from '@/components/video-player';
import { withAuth } from '@/components/permission';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLocalFileUrl } from '@/services/file';

import { getVideoMimeType, isVideoFileName } from './utils';

function LocalVideoPage() {
  const [searchParams] = useSearchParams();
  const path = searchParams.get('path') ?? '';
  const name = path.split('/').at(-1) ?? '';
  const valid = path.length > 0 && isVideoFileName(name);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 break-all">
            <FileVideo2 className="size-5 shrink-0 text-muted-foreground" />
            {name || '本地视频'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {valid ? (
            <VideoPlayer
              src={getLocalFileUrl(path)}
              type={getVideoMimeType(name)}
              autoPlay
              autoFullScreen
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              视频地址无效，请返回文件列表重新选择。
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default withAuth(LocalVideoPage, { permission: 'file:read' });
