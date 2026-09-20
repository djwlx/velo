import { request } from '@/utils/request';
import type { ListPermissionsResponse } from './types';

export const listPermissions = () =>
  request<ListPermissionsResponse>('/auth/permissions');
