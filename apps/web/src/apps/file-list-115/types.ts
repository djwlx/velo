export interface BreadcrumbEntry {
  cid: string;
  name: string;
}

export interface ItemsType {
  name: string;
  size?: number;
  isDir: boolean;
  cid?: string;
  pickCode?: string | null;
}
