import { request } from '@/utils/request';

export interface AppVersion {
  server: string;
  web: string | null;
}

export interface UpdateStatus {
  current: string | null;
  latest: string | null;
  hasUpdate: boolean;
}

export const getVersion = () => request<AppVersion>('/config/version');

export const checkUpdate = () => request<UpdateStatus>('/config/version/check');

export const updateWeb = () =>
  request<{ version: string }>('/config/version/update', { method: 'POST' });
