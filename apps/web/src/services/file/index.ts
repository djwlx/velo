import type { FileDirectory } from '@velo/shared';

import { ACCESS_TOKEN_KEY, API_BASE_URL, request } from '@/utils/request';

import type { UploadFileResponse } from './types';

export const uploadFile = (file: File) => {
  const body = new FormData();
  body.append('file', file);
  return request<UploadFileResponse>('/files/upload', { method: 'POST', body });
};

export const downloadFile = async (fileId: number, signal?: AbortSignal) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal,
  });

  if (!response.ok) throw new Error('File download failed');
  return response.blob();
};

export const getLocalFiles = (path: string, page = 1, pageSize = 50) => {
  const query = new URLSearchParams({
    path,
    page: String(page),
    pageSize: String(pageSize),
  });
  return request<FileDirectory>(`/files/local?${query.toString()}`);
};

export const getLocalFileUrl = (path: string, download = false) => {
  const url = new URL(
    `${API_BASE_URL}/files/local/content`,
    window.location.origin
  );
  url.searchParams.set('path', path);
  if (download) url.searchParams.set('download', '1');
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) url.searchParams.set('token', token);
  return url.toString();
};

export const downloadLocalFile = (path: string, name: string) => {
  const anchor = document.createElement('a');
  anchor.href = getLocalFileUrl(path, true);
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};
