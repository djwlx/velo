import type { ReactNode } from 'react';
import type { ProTableColumn, ProTableProps } from '../pro-table';
import type { FileTableBreadcrumbItem } from './components/TableHeader';

export interface FileListTableLoadParams {
  cid: string;
  page: number;
  pageSize: number;
}

export interface FileListTableLoadResult<T> {
  items: T[];
  page: number;
  total: number;
  path?: FileTableBreadcrumbItem[];
}

export interface FileListTableProps<T> extends Pick<
  ProTableProps<T>,
  'className' | 'columns' | 'rowKey'
> {
  cid: string;
  onNavigate?: (entry: FileTableBreadcrumbItem, index: number) => void;
  loadPage: (
    params: FileListTableLoadParams
  ) => Promise<FileListTableLoadResult<T>>;
  pageSize?: number;
  emptyText?: ReactNode;
}

export interface FileListTableColumn<T> extends ProTableColumn<T> {}
