import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, Image } from 'lucide-react';
import { Link } from 'wouter';

const entries = [
  {
    href: '/115',
    title: '115 文件',
    description: '浏览网盘文件',
    icon: FileText,
  },
  {
    href: '/pic',
    title: '随机图片',
    description: '随机看一张图',
    icon: Image,
  },
];

export function Home() {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col justify-center gap-6 overflow-auto p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((entry) => (
          <Link key={entry.href} href={entry.href} className="block">
            <Card className="h-full transition-colors hover:bg-muted/50">
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
          </Link>
        ))}
      </div>
    </main>
  );
}
