import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { CardHeader } from '@/components/ui/card';
import { TruncatedText } from '@/components/truncated-text';
import { cn } from '@/lib/utils';
import { ChevronRightIcon, RefreshCw } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface FileTableBreadcrumbItem {
  cid: string;
  name: string;
}

export interface FileTableHeaderProps {
  breadcrumbs: FileTableBreadcrumbItem[];
  onRefresh?: () => void;
  onNavigate?: (index: number, entry: FileTableBreadcrumbItem) => void;
  isLoading?: boolean;
  className?: string;
}

const ITEM_MAX_WIDTH = 'max-w-40';

export function FileTableHeader({
  breadcrumbs,
  onRefresh,
  onNavigate,
  isLoading = false,
  className,
}: FileTableHeaderProps) {
  const first = breadcrumbs[0];
  const last = breadcrumbs[breadcrumbs.length - 1];
  const middle = breadcrumbs.slice(1, -1);
  const isSingle = breadcrumbs.length === 1;

  const scrollRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, [breadcrumbs]);

  const renderEntry = (
    entry: FileTableBreadcrumbItem,
    index: number,
    current: boolean
  ) => {
    const content = (
      <TruncatedText className={ITEM_MAX_WIDTH} text={entry.name} />
    );

    return current ? (
      <BreadcrumbPage className="flex min-w-0">{content}</BreadcrumbPage>
    ) : (
      <BreadcrumbLink
        render={<button type="button" />}
        className="flex min-w-0"
        onClick={() => onNavigate?.(index, entry)}
      >
        {content}
      </BreadcrumbLink>
    );
  };

  return (
    <CardHeader className={cn('gap-4 border-b', className)}>
      <div className="flex min-w-0 items-center gap-4">
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-nowrap">
            {breadcrumbs.length === 0 ? null : isSingle ? (
              <BreadcrumbItem className="min-w-0">
                {renderEntry(first, 0, true)}
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem className="min-w-0">
                  {renderEntry(first, 0, false)}
                </BreadcrumbItem>
                <BreadcrumbSeparator className="shrink-0" />
                {middle.length > 0 && (
                  <BreadcrumbItem
                    ref={scrollRef}
                    className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    <div className="flex w-max items-center gap-1.5">
                      {middle.map((entry, index) => (
                        <span
                          key={`${entry.cid}-${index}`}
                          className="inline-flex items-center gap-1"
                        >
                          {renderEntry(entry, index + 1, false)}
                          <ChevronRightIcon className="size-3.5 shrink-0" />
                        </span>
                      ))}
                    </div>
                  </BreadcrumbItem>
                )}
                <BreadcrumbItem className="min-w-0">
                  {renderEntry(last, breadcrumbs.length - 1, true)}
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw data-icon="inline-start" />
          刷新
        </Button>
      </div>
    </CardHeader>
  );
}
