import { request } from '@/utils/request';

export interface AppVersion {
  version: string;
}

export const getVersion = () => request<AppVersion>('/config/version');
