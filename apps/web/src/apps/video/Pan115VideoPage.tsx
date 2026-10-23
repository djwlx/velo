import { FileVideo2 } from 'lucide-react';
import { useSearchParams } from 'wouter';

import { VideoPlayer } from '@/components/video-player';
import { withAuth } from '@/components/permission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getFilePreviewUrl } from '@/apps/files/115/utils';
import { getVideoMimeType } from './utils';

function Pan115VideoPage() {
  const [searchParams] = useSearchParams();

  const pickCode = searchParams.get('id') ?? '';
  const isValidPickCode = /^[A-Za-z0-9_-]{1,128}$/.test(pickCode);
  const name = searchParams.get('name') || '视频';

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 py-6">
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

export default withAuth(Pan115VideoPage);
