export interface Pan115FileItem {
  cid: string;
  name: string;
  pickCode: string | null;
  isDirectory: boolean;
  type: string | null;
  size: number;
}

export interface Pan115PathItem {
  cid: string;
  name: string;
}

export interface Pan115FileList {
  cid: string;
  page: number;
  pageSize: number;
  total: number;
  items: Pan115FileItem[];
  path: Pan115PathItem[];
}

export interface GetPan115FilesParams {
  cid: string;
  page?: number;
  pageSize?: number;
}
