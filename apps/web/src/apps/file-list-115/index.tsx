import {
  FileListTable,
  type FileListTableColumn,
  type FileListTableLoadParams,
} from '@/components/file-list-table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getFileList } from '@/services/pan115';
import { formatFileSize } from '@/utils/file';
import { ArrowLeft } from 'lucide-react';
import { useCallback } from 'react';
import { useLocation, useSearchParams } from 'wouter';
import { CacheButton } from './components/CacheButton';
import { NameCell } from './components/NameCell';
import type { ItemsType } from './types';
import {
  CID_PARAM,
  PAGE_SIZE,
  ROOT_ENTRY,
  downloadFile,
  toBreadcrumbs,
} from './utils';

export function FileList115() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [, setLocation] = useLocation();

  const cid = searchParams.get(CID_PARAM) ?? ROOT_ENTRY.cid;

  const navigate = useCallback(
    (nextCid: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (nextCid === ROOT_ENTRY.cid) {
          params.delete(CID_PARAM);
        } else {
          params.set(CID_PARAM, nextCid);
        }
        return params;
      });
    },
    [setSearchParams]
  );

  const loadPage = useCallback(
    async ({ cid, page, pageSize }: FileListTableLoadParams) => {
      const res = await getFileList({ cid, page, pageSize });

      return {
        items: res.data.items.map<ItemsType>((item) => ({
          name: item.name,
          isDir: item.isDirectory,
          cid: item.cid,
          size: item.size,
          pickCode: item.pickCode,
        })),
        page: res.data.page,
        total: res.data.total,
        path: toBreadcrumbs(res.data.path),
      };
    },
    []
  );

  const columns: FileListTableColumn<ItemsType>[] = [
    {
      key: 'name',
      title: '名称',
      render: (_value, item) => (
        <NameCell
          item={item}
          onOpen={() => navigate(item.cid ?? ROOT_ENTRY.cid)}
          onDownload={() => {
            if (item.pickCode) downloadFile(item.pickCode, item.name);
          }}
        />
      ),
    },
    {
      key: 'size',
      title: '大小',
      render: (_value, item) => {
        if (!_value) {
          return '-';
        }

        return formatFileSize(item.size);
      },
    },
    {
      key: 'actions',
      title: '操作',
      render: (_value, item) =>
        item.isDir ? <CacheButton cid={item.cid} /> : null,
    },
  ];

  return (
    <main className="px-4 py-6">
      <div className="flex pb-4">
        <Button variant="outline" size="sm" onClick={() => setLocation('/')}>
          <ArrowLeft data-icon="inline-start" />
          返回
        </Button>
      </div>
      <Card className="gap-0">
        <FileListTable
          cid={cid}
          columns={columns}
          loadPage={loadPage}
          pageSize={PAGE_SIZE}
          onNavigate={(entry) => navigate(entry.cid)}
        />
      </Card>
    </main>
  );
}
