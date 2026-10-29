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
  FileListTableSelection,
} from './types';
export type {
  FileTableBreadcrumbItem,
  FileTableHeaderProps,
} from './components/TableHeader';

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
    emptyText,
    onRowClick,
  } = props;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [breadcrumbs, setBreadcrumbs] = useState<FileTableBreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Map<string, T>>(
    () => new Map()
  );
  const requestId = useRef(0);
  const loadMoreInFlight = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleIntersectRef = useRef<() => void>(() => {});

  const hasMore = !hasError && items.length < total;
  const selectedKeys = new Set(selectedItems.keys());

  useEffect(() => {
    setSelectedItems(new Map());
  }, [cid]);

  const handleSelectionChange = useCallback(
    (item: T, selected: boolean) => {
      if (!props.selection) return;
      const key = props.selection.getKey(item);
      setSelectedItems((current) => {
        const next = new Map(current);
        if (selected) next.set(key, item);
        else next.delete(key);
        return next;
      });
    },
    [props.selection]
  );

  const handleSelectAll = useCallback(
    (currentItems: readonly T[], selected: boolean) => {
      if (!props.selection) return;
      const getKey = props.selection.getKey;
      setSelectedItems((current) => {
        const next = new Map(current);
        for (const item of currentItems) {
          const key = getKey(item);
          if (selected) next.set(key, item);
          else next.delete(key);
        }
        return next;
      });
    },
    [props.selection]
  );

  const fetchPage = useCallback(
    async (targetCid: string, nextPage: number, append: boolean) => {
      const currentRequestId = ++requestId.current;
      setHasError(false);

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
      } catch {
        if (currentRequestId === requestId.current) setHasError(true);
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
    if (loadMoreInFlight.current) return;
    loadMoreInFlight.current = true;
    void fetchPage(cid, page + 1, true).finally(() => {
      loadMoreInFlight.current = false;
    });
  }, [fetchPage, cid, page]);

  const handleIntersect = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    loadMore();
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  useEffect(() => {
    handleIntersectRef.current = handleIntersect;
  }, [handleIntersect]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const root = node.closest('[data-scroll-root]');

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleIntersectRef.current();
        }
      },
      { root, rootMargin: '120px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
        onRowClick={onRowClick}
        selection={
          props.selection
            ? {
                selectedKeys,
                getKey: props.selection.getKey,
                onChange: handleSelectionChange,
                onSelectAll: handleSelectAll,
              }
            : undefined
        }
        emptyText={
          hasError
            ? '文件列表加载失败，请刷新重试'
            : (emptyText ?? '文件夹为空')
        }
      />
      {props.selection && selectedItems.size > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border bg-popover px-4 py-3 text-popover-foreground shadow-lg">
            <span className="text-sm">已选 {selectedItems.size} 项</span>
            {props.selection.renderActions([...selectedItems.values()])}
          </div>
        </div>
      ) : null}
    </>
  );
}
