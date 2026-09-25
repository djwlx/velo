import type { ReactNode } from 'react';

export interface ProTableColumn<T = unknown> {
  key: string;
  title: ReactNode;
  className?: string;
  render?: (
    value: any,
    item: T,
    index: number,
    items: readonly T[]
  ) => ReactNode;
}

export interface ProTableProps<T = unknown> {
  className?: string;
  items: readonly T[];
  columns: ProTableColumn<T>[];
  rowKey?: string;
  footer?: ReactNode;
  isLoading?: boolean;
  emptyText?: ReactNode;
}
