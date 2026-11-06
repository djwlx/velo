import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { Image, RefreshCw } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequestQuery } from '@/hooks/useRequestQuery';
import { withAuth } from '@/components/permission';
import { getAdminDashboardStats } from '@/services/dashboard';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

function RandomPicAccessChart({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = echarts.init(container);
    const option: EChartsOption = {
      animationDuration: 300,
      grid: { left: 12, right: 12, top: 20, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => `${Number(value).toLocaleString()} 次`,
      },
      xAxis: {
        type: 'category',
        data: data.map(({ date }) => date.slice(5)),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#71717a' },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f1f1f3' } },
        axisLabel: { color: '#71717a' },
      },
      series: [
        {
          name: '访问量',
          type: 'bar',
          data: data.map(({ count }) => count),
          barMaxWidth: 36,
          itemStyle: { color: '#6366f1', borderRadius: [5, 5, 0, 0] },
        },
      ],
    };
    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="h-64 w-full"
      aria-label="最近七天随机图片访问量"
    />
  );
}

function AdminDashboardPage() {
  const { data, loading, error, refetch } = useRequestQuery(
    getAdminDashboardStats
  );
  const stats = data?.data;

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col space-y-6 overflow-auto p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">管理仪表盘</h1>
          <p className="mt-1 text-muted-foreground">
            查看随机图片访问量和缓存情况。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={loading}
          className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          仪表盘数据加载失败，请刷新重试。
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>随机图片访问量</CardTitle>
            <CardDescription>最近 7 天，每日成功访问次数</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !stats ? (
              <Skeleton className="h-64 w-full" />
            ) : stats ? (
              <>
                <div className="mb-2 text-3xl font-semibold tabular-nums">
                  {stats.randomPicAccessLast7Days.toLocaleString()}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    次
                  </span>
                </div>
                <RandomPicAccessChart data={stats.dailyRandomPicAccess} />
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已缓存随机图片</CardTitle>
            <CardDescription>当前数据库中已缓存的图片数量</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !stats ? (
              <Skeleton className="h-36 w-full" />
            ) : stats ? (
              <div className="flex min-h-36 items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Image className="size-7" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-4xl font-semibold tabular-nums tracking-tight">
                    {stats.cachedRandomPicCount.toLocaleString()}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    张图片
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default withAuth(AdminDashboardPage, { permission: 'admin' });
