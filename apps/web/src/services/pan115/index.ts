import { API_BASE_URL, request } from '@/utils/request';
import type { GetPan115FilesParams, Pan115FileList } from './types';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

const isPositiveInteger = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 1;

const validateParams = ({
  cid,
  page,
  pageSize,
}: Required<GetPan115FilesParams>) => {
  if (!/^\d+$/.test(cid)) {
    throw new TypeError('cid must contain only digits');
  }
  if (!isPositiveInteger(page)) {
    throw new RangeError('page must be a positive integer');
  }
  if (!isPositiveInteger(pageSize) || pageSize > MAX_PAGE_SIZE) {
    throw new RangeError(`pageSize must be between 1 and ${MAX_PAGE_SIZE}`);
  }
};

export const getFileList = ({
  cid,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
}: GetPan115FilesParams) => {
  const params = { cid: cid.trim(), page, pageSize };
  validateParams(params);

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  return request<Pan115FileList>(
    `/115/files/${encodeURIComponent(params.cid)}?${query.toString()}`
  );
};

export const getFileDownloadUrl = (pickCode: string): string => {
  const normalizedPickCode = pickCode.trim();
  if (!normalizedPickCode) {
    throw new TypeError('pickCode is required');
  }

  return `${API_BASE_URL}/115/file/${encodeURIComponent(normalizedPickCode)}`;
};

export const cachePics = (cid: string) => {
  const normalizedCid = cid.trim();
  if (!/^\d+$/.test(normalizedCid)) {
    throw new TypeError('cid must contain only digits');
  }

  return request<{ cid: string; started: boolean }>('/115/pic/cache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cid: normalizedCid }),
  });
};

export type {
  GetPan115FilesParams,
  Pan115FileItem,
  Pan115FileList,
  Pan115PathItem,
} from './types';
