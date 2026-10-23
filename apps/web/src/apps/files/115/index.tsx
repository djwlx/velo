import {
  FileListTable,
  type FileListTableColumn,
  type FileListTableLoadParams,
} from '@/components/file-list-table';
import { Card } from '@/components/ui/card';
import { withAuth } from '@/components/permission';
import { getFileList } from '@/services/pan115';
import { isAndroid } from '@/utils/device';
import { openInMxPlayer } from '@/utils/external-player';
import { formatFileSize } from '@/utils/file';
import { useCallback } from 'react';
import { useLocation, useSearchParams } from 'wouter';
import { getFileDirectoryLocation } from '../utils';
import { NameCell } from './components/NameCell';
import type { ItemsType } from './types';
import {
  PAGE_SIZE,
  ROOT_ENTRY,
  downloadFile,
  getFilePreviewUrl,
  isVideoFileName,
  previewFile,
  toBreadcrumbs,
} from './utils';

function FileList115() {
  const [searchParams] = useSearchParams();
  const [, setLocation] = useLocation();

  const cid = searchParams.get('path') ?? ROOT_ENTRY.cid;

  const navigate = useCallback(
    (nextCid: string) => {
      setLocation(getFileDirectoryLocation('115', nextCid));
    },
    [setLocation]
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
      className: 'w-full',
      render: (_value, item) => (
        <NameCell
          item={item}
          onOpen={() => navigate(item.cid ?? ROOT_ENTRY.cid)}
          onDownload={() => {
            if (item.pickCode) downloadFile(item.pickCode, item.name);
          }}
          onPreview={() => {
            if (item.pickCode) previewFile(item.pickCode);
          }}
          onVideo={() => {
            if (!item.pickCode || !isVideoFileName(item.name)) return;

            const query = new URLSearchParams({
              type: '115',
              id: item.pickCode,
              name: item.name,
            });
            const currentCid = searchParams.get('path');
            if (currentCid && /^\d+$/.test(currentCid)) {
              query.set('path', currentCid);
            }

            const videoPath = `/video?${query.toString()}`;

            if (isAndroid()) {
              openInMxPlayer(getFilePreviewUrl(item.pickCode), {
                title: item.name,
                fallbackUrl: new URL(
                  videoPath,
                  window.location.origin
                ).toString(),
              });
              return;
            }

            setLocation(videoPath);
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
  ];

  return (
    <main className="px-4 py-6">
      <Card className="gap-0">
        <FileListTable
          cid={cid}
          columns={columns}
          loadPage={loadPage}
          pageSize={PAGE_SIZE}
          onNavigate={(entry) =>
            entry.cid === '/' ? setLocation('/files') : navigate(entry.cid)
          }
        />
      </Card>
    </main>
  );
}

export default withAuth(FileList115, { permission: 'file:read' });
