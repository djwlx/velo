import { ArrowRight, FolderOpen, Image } from 'lucide-react';
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
    description: '浏览 115网盘和本地文件',
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
    <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col justify-center gap-6 overflow-auto p-4 sm:p-6">
      <section
        aria-labelledby="home-shortcuts-title"
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1 px-1">
          <h1
            id="home-shortcuts-title"
            className="text-lg font-semibold tracking-tight"
          >
            快捷入口
          </h1>
          <p className="text-sm text-muted-foreground">常用功能，一点即达</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {entries.map((entry) => {
            const content = (
              <Card className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <entry.icon className="size-6" aria-hidden="true" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <CardTitle>{entry.title}</CardTitle>
                      <CardDescription>{entry.description}</CardDescription>
                    </div>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </div>
                </CardHeader>
              </Card>
            );

            return entry.external ? (
              <a
                key={entry.href}
                href={entry.href}
                className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {content}
              </a>
            ) : (
              <Link
                key={entry.href}
                href={entry.href}
                className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
