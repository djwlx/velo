import { useCallback, useEffect, useRef, useState } from 'react';

import { ProTable } from '../pro-table';
import { FileTableHeader } from './components/TableHeader';

import type { FileTableBreadcrumbItem } from './components/TableHeader';
import type { FileListTableProps } from './types';

export type {
  FileListTableColumn,
  FileListTableLoadParams,
  FileListTableLoadResult,
  FileListTableProps,
} from './types';
export type {
  FileTableBreadcrumbItem,
  FileTableHeaderProps,
} from './components/TableHeader';
export { FileTableHeader } from './components/TableHeader';

const DEFAULT_PAGE_SIZE = 50;

export function FileListTable<T>(props: FileListTableProps<T>) {
  const {
    cid,
    onNavigate,
    columns,
    rowKey,
    className,
    loadPage,
    pageSize = DEFAULT_PAGE_SIZE,
  } = props;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [breadcrumbs, setBreadcrumbs] = useState<FileTableBreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestId = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = items.length < total;

  const fetchPage = useCallback(
    async (targetCid: string, nextPage: number, append: boolean) => {
      const currentRequestId = ++requestId.current;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setItems([]);
        setPage(1);
        setTotal(0);
        setIsLoading(true);
      }

      try {
        const result = await loadPage({
          cid: targetCid,
          page: nextPage,
          pageSize,
        });
        if (currentRequestId !== requestId.current) return;

        setItems((prev) =>
          append ? [...prev, ...result.items] : result.items
        );
        setPage(result.page);
        setTotal(result.total);
        if (!append && result.path) setBreadcrumbs(result.path);
      } finally {
        if (currentRequestId === requestId.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [loadPage, pageSize]
  );

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchPage(cid, 1, false);
  }, [cid, fetchPage]);

  const loadMore = useCallback(() => {
    void fetchPage(cid, page + 1, true);
  }, [fetchPage, cid, page]);

  const handleIntersect = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    loadMore();
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) handleIntersect();
      },
      { rootMargin: '120px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const handleNavigate = useCallback(
    (index: number, entry: FileTableBreadcrumbItem) => {
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
      onNavigate?.(entry, index);
    },
    [onNavigate]
  );

  const infiniteFooter = (
    <div
      ref={sentinelRef}
      className="text-center text-sm text-muted-foreground"
    >
      {isLoadingMore ? '加载中…' : hasMore ? '滚动加载更多' : ''}
    </div>
  );

  return (
    <>
      <FileTableHeader
        breadcrumbs={breadcrumbs}
        onRefresh={() => void fetchPage(cid, 1, false)}
        onNavigate={handleNavigate}
        isLoading={isLoading}
      />
      <ProTable
        className={className}
        columns={columns}
        rowKey={rowKey}
        items={items}
        isLoading={isLoading}
        footer={infiniteFooter}
      />
    </>
  );
}
