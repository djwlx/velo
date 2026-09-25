import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { LoaderCircle } from 'lucide-react';

import type { ProTableProps } from './types';

export type { ProTableColumn, ProTableProps } from './types';

export function ProTable<T>(props: ProTableProps<T>) {
  const {
    className,
    columns = [],
    items = [],
    rowKey,
    footer,
    isLoading = false,
    emptyText = '暂无数据',
  } = props;

  return (
    <div className={cn('flex-1', className)} role="region">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn('sticky top-0 bg-muted', column.className)}
              >
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                <LoaderCircle className="mx-auto size-5 animate-spin" />
              </TableCell>
            </TableRow>
          ) : null}
          {!isLoading && items.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          ) : null}
          {!isLoading &&
            items.length > 0 &&
            items.map((item, index) => {
              const dataRowKey: string | number = rowKey
                ? (item as Record<string, any>)[rowKey]
                : index;

              return (
                <TableRow key={dataRowKey}>
                  {columns.map((column) => {
                    const rowCellKey = `${dataRowKey}-${column.key}`;

                    const keyValue = (item as Record<string, any>)[column.key];

                    const cellValue =
                      typeof keyValue === 'string' ? keyValue : null;

                    return (
                      <TableCell key={rowCellKey} className={column.className}>
                        {column.render?.(keyValue, item, index, items) ??
                          cellValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
      {footer}
    </div>
  );
}
