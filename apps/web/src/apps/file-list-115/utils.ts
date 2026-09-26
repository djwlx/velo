import {
  getFileDownloadUrl,
  type Pan115PathItem,
} from '@/services/pan115';
import { ACCESS_TOKEN_KEY } from '@/utils/request';
import type { BreadcrumbEntry } from './types';

export const PAGE_SIZE = 50;
export const CID_PARAM = 'cid';

export const ROOT_ENTRY: BreadcrumbEntry = { cid: '0', name: '全部文件' };

export const toBreadcrumbs = (
  path: Pan115PathItem[] | undefined
): BreadcrumbEntry[] => [
  ROOT_ENTRY,
  ...(path ?? [])
    .filter((entry) => entry.cid !== ROOT_ENTRY.cid)
    .map((entry) => ({ cid: entry.cid, name: entry.name })),
];

const buildFileUrl = (pickCode: string): string => {
  const url = new URL(getFileDownloadUrl(pickCode), window.location.origin);
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) url.searchParams.set('token', token);
  return url.toString();
};

export const downloadFile = (pickCode: string, name: string) => {
  const anchor = document.createElement('a');
  anchor.href = buildFileUrl(pickCode);
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

export const previewFile = (pickCode: string): void => {
  window.open(buildFileUrl(pickCode), '_blank', 'noopener');
};
