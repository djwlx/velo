import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
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
    onRowClick,
    selection,
  } = props;
  const columnCount = columns.length + Number(Boolean(selection));
  const allItemsSelected =
    Boolean(selection) &&
    items.length > 0 &&
    items.every((item) => selection?.selectedKeys.has(selection.getKey(item)));

  return (
    <div className={cn('flex-1', className)} role="region">
      <Table>
        <TableHeader>
          <TableRow>
            {selection ? (
              <TableHead className="sticky top-0 w-10 bg-muted">
                <Checkbox
                  aria-label="全选当前列表"
                  checked={allItemsSelected}
                  onCheckedChange={(checked) =>
                    selection.onSelectAll(items, checked)
                  }
                />
              </TableHead>
            ) : null}
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
                colSpan={columnCount}
                className="h-24 text-center text-muted-foreground"
              >
                <LoaderCircle className="mx-auto size-5 animate-spin" />
              </TableCell>
            </TableRow>
          ) : null}
          {!isLoading && items.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={columnCount}
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
                <TableRow
                  key={dataRowKey}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  onClick={
                    onRowClick
                      ? (event) => {
                          const target = event.target as HTMLElement;
                          if (
                            target.closest(
                              'button, a, input, select, textarea, [role="button"], [role="checkbox"]'
                            )
                          ) {
                            return;
                          }
                          onRowClick(item, index);
                        }
                      : undefined
                  }
                >
                  {selection ? (
                    <TableCell
                      className="w-10"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        aria-label="选择此行"
                        checked={selection.selectedKeys.has(
                          selection.getKey(item)
                        )}
                        onCheckedChange={(checked) =>
                          selection.onChange(item, checked === true)
                        }
                      />
                    </TableCell>
                  ) : null}
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
