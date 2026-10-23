import { FolderOpen, Image } from 'lucide-react';
import { Link } from 'wouter';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const entries = [
  {
    href: '/files',
    title: '文件管理',
    description: '浏览 115 网盘和本地文件',
    icon: FolderOpen,
    external: false,
  },
  {
    href: '/api/115/pic/random',
    title: '随机图片',
    description: '随机看一张图',
    icon: Image,
    external: true,
  },
];

export function Home() {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col justify-center gap-6 overflow-auto p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => {
          const content = (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <entry.icon className="size-5 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col gap-0.5">
                    <CardTitle>{entry.title}</CardTitle>
                    <CardDescription>{entry.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );

          return entry.external ? (
            <a
              key={entry.href}
              href={entry.href}
              className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {content}
            </a>
          ) : (
            <Link
              key={entry.href}
              href={entry.href}
              className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
