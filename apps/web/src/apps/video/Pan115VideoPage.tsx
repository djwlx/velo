import { ArrowLeft, FileVideo2 } from 'lucide-react';
import { useLocation, useRoute, useSearchParams } from 'wouter';

import { VideoPlayer } from '@/components/video-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CID_PARAM, getFilePreviewUrl } from '@/apps/file-list-115/utils';

const VIDEO_MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  ogg: 'video/ogg',
};

const getVideoMimeType = (fileName: string): string | undefined =>
  VIDEO_MIME_TYPES[fileName.split('.').pop()?.toLowerCase() ?? ''];

export function Pan115VideoPage() {
  const [matched, params] = useRoute('/video/115/:pickCode');
  const [searchParams] = useSearchParams();
  const [, setLocation] = useLocation();
  const pickCode = matched ? params.pickCode : '';
  const isValidPickCode = /^[A-Za-z0-9_-]{1,128}$/.test(pickCode);
  const name = searchParams.get('name') || '视频';
  const cid = searchParams.get(CID_PARAM);
  const backLocation =
    cid && /^\d+$/.test(cid)
      ? `/115?${CID_PARAM}=${encodeURIComponent(cid)}`
      : '/115';

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 py-6">
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setLocation(backLocation)}
      >
        <ArrowLeft data-icon="inline-start" />
        返回文件列表
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 break-all">
            <FileVideo2 className="size-5 shrink-0 text-muted-foreground" />
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isValidPickCode ? (
            <VideoPlayer
              src={getFilePreviewUrl(pickCode)}
              type={getVideoMimeType(name)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">视频地址无效。</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
