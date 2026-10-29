import type { ManagedFile } from '@velo/shared';
import { useCallback } from 'react';
import { useLocation, useSearchParams } from 'wouter';

import { FileName } from '@/apps/files/components/file-name';
import {
  FileListTable,
  type FileListTableColumn,
  type FileListTableLoadParams,
} from '@/components/file-list-table';
import { withAuth } from '@/components/permission';
import { Card } from '@/components/ui/card';
import {
  downloadLocalFile,
  getLocalFiles,
  getLocalFileUrl,
} from '@/services/file';
import { isAndroid } from '@/utils/device';
import { openInMxPlayer } from '@/utils/external-player';
import { formatFileSize } from '@/utils/file';
import { isVideoFileName } from '@/apps/video/utils';
import { getLocalDirectoryLocation } from './utils';

function FileListLocal() {
  const [searchParams] = useSearchParams();
  const [, setLocation] = useLocation();
  const directory = searchParams.get('path') ?? '';

  const loadPage = useCallback(
    async ({ cid, page, pageSize }: FileListTableLoadParams) => {
      const response = await getLocalFiles(cid, page, pageSize);
      return {
        ...response.data,
        path: response.data.path.map((entry) => ({
          cid: entry.path,
          name: entry.name,
        })),
      };
    },
    []
  );

  const openEntry = (item: ManagedFile) => {
    if (item.isDirectory) {
      setLocation(getLocalDirectoryLocation(item.path));
    } else if (isVideoFileName(item.name)) {
      const videoPath = `/video?${new URLSearchParams({ type: 'local', path: item.path }).toString()}`;

      if (isAndroid()) {
        openInMxPlayer(getLocalFileUrl(item.path), {
          title: item.name,
          fallbackUrl: new URL(videoPath, window.location.origin).toString(),
        });
        return;
      }

      setLocation(videoPath);
    } else if (
      /^(?:image\/|audio\/|application\/pdf$)/.test(item.contentType ?? '')
    ) {
      window.open(getLocalFileUrl(item.path), '_blank', 'noopener');
    } else {
      downloadLocalFile(item.path, item.name);
    }
  };

  const columns: FileListTableColumn<ManagedFile>[] = [
    {
      key: 'name',
      title: '名称',
      className: 'w-full',
      render: (_value, item) => (
        <FileName
          name={item.name}
          isDirectory={item.isDirectory}
          onActivate={() => openEntry(item)}
          className="text-primary"
          iconClassName={item.isDirectory ? undefined : 'text-primary'}
        />
      ),
    },
    {
      key: 'size',
      title: '大小',
      render: (_value, item) =>
        item.isDirectory ? '—' : formatFileSize(item.size),
    },
  ];

  return (
    <main className="flex flex-col gap-4 px-4 py-6">
      <Card className="gap-0">
        <FileListTable
          cid={directory}
          columns={columns}
          rowKey="id"
          loadPage={loadPage}
          onRowClick={openEntry}
          onNavigate={(entry) =>
            setLocation(
              entry.cid === '/'
                ? '/files'
                : getLocalDirectoryLocation(entry.cid)
            )
          }
        />
      </Card>
    </main>
  );
}

export default withAuth(FileListLocal, { permission: 'file:read' });
