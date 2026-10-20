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
