import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { FileText, FileVideo2, Image } from 'lucide-react';
import { useRef } from 'react';
import { useLocation } from 'wouter';
import { toast } from '@/components/ui/toast';
import { isLocalVideoFile, setLocalVideo } from '@/apps/video/local-video';

const entries = [
  {
    href: '/115',
    title: '115 文件',
    description: '浏览网盘文件',
    icon: FileText,
  },
  {
    href: '/api/115/pic/random',
    title: '随机图片',
    external: true,
    description: '随机看一张图',
    icon: Image,
  },
  {
    href: '/video/local',
    title: '本地文件',
    description: '选择本地视频播放',
    icon: FileVideo2,
    local: true,
  },
];

export function Home() {
  const [_, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openLocalVideo = (file?: File) => {
    if (!file) return;
    if (!isLocalVideoFile(file)) {
      toast.add({ type: 'error', title: '请选择有效的视频文件' });
      return;
    }

    try {
      setLocalVideo(file);
      navigate('/video/local');
    } catch {
      toast.add({ type: 'error', title: '无法打开这个视频文件' });
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mkv,.avi,.mov,.wmv,.flv,.rmvb,.mpeg,.mpg,.ts"
        className="hidden"
        onChange={(event) => {
          openLocalVideo(event.currentTarget.files?.[0]);
          event.currentTarget.value = '';
        }}
      />
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col justify-center gap-6 overflow-auto p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {entries.map((entry) => (
            <Card
              key={entry.href}
              className="h-full cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => {
                if (entry.local) {
                  fileInputRef.current?.click();
                } else if (entry.external) {
                  window.location.assign(entry.href);
                } else {
                  navigate(entry.href);
                }
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <entry.icon className="size-5 text-muted-foreground" />
                  <div className="flex flex-col gap-0.5">
                    <CardTitle>{entry.title}</CardTitle>
                    <CardDescription>{entry.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
