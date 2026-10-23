import type { ManagedFile } from '@velo/shared';
import { Folder } from 'lucide-react';
import { Link } from 'wouter';

import {
  FileListTable,
  type FileListTableColumn,
} from '@/components/file-list-table';
import { Card } from '@/components/ui/card';
import { withAuth } from '@/components/permission';

const roots: ManagedFile[] = [
  {
    id: 'local',
    name: '本地',
    path: '',
    source: 'local',
    isDirectory: true,
    size: 0,
    contentType: null,
    modifiedAt: null,
  },
  {
    id: '115',
    name: '115',
    path: '0',
    source: '115',
    isDirectory: true,
    size: 0,
    contentType: null,
    modifiedAt: null,
  },
];

const loadRoots = async () => ({
  items: roots,
  page: 1,
  total: roots.length,
  path: [{ cid: '/', name: '文件管理' }],
});

const columns: FileListTableColumn<ManagedFile>[] = [
  {
    key: 'name',
    title: '名称',
    render: (_value, item) => (
      <Link
        href={item.source === 'local' ? '/files/local' : '/files/115'}
        className="inline-flex items-center gap-1.5 text-primary hover:underline"
      >
        <Folder className="size-4 shrink-0" />
        {item.source === 'local' ? '本地' : '115'}
      </Link>
    ),
  },
];

function FileList() {
  return (
    <main className="px-4 py-6">
      <Card className="gap-0">
        <FileListTable
          cid="/"
          rowKey="id"
          columns={columns}
          loadPage={loadRoots}
        />
      </Card>
    </main>
  );
}

export default withAuth(FileList);
