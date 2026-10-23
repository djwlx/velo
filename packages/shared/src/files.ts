export interface ManagedFile {
  id: string;
  name: string;
  path: string;
  source: '115' | 'local';
  isDirectory: boolean;
  size: number;
  contentType: string | null;
  modifiedAt: string | null;
}

export interface FileDirectory {
  items: ManagedFile[];
  page: number;
  pageSize: number;
  total: number;
  path: { path: string; name: string }[];
}
