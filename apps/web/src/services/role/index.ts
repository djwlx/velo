import { request } from '@/utils/request';
import type {
  CreateRolePayload,
  ListRolesResponse,
  RoleDetail,
  UpdateRolePayload,
} from './types';

export const listRoles = () => request<ListRolesResponse>('/auth/roles');

export const createRole = (payload: CreateRolePayload) =>
  request<{ role: RoleDetail }>('/auth/roles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateRole = (id: number, payload: UpdateRolePayload) =>
  request<{ role: RoleDetail }>(`/auth/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteRole = (id: number) =>
  request<{ id: number }>(`/auth/roles/${id}`, { method: 'DELETE' });
