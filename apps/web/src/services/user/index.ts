import { request } from '@/utils/request';
import type {
  AuthResponse,
  CreateUserPayload,
  ListUsersParams,
  ListUsersResponse,
  MeResponse,
  UpdateMePayload,
  UpdateMeResponse,
  UpdateUserPayload,
  UserDetail,
} from './types';

export const register = (email: string, password: string) =>
  request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const login = (email: string, password: string) =>
  request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getCurrentUser = () =>
  request<MeResponse>('/auth/me', { toast: false });

export const updateMe = (payload: UpdateMePayload) =>
  request<UpdateMeResponse>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const listUsers = (params: ListUsersParams = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.keyword) query.set('keyword', params.keyword);
  const search = query.toString();
  return request<ListUsersResponse>(`/auth/users${search ? `?${search}` : ''}`);
};

export const getUser = (id: number) =>
  request<{ user: UserDetail }>(`/auth/users/${id}`);

export const createUser = (payload: CreateUserPayload) =>
  request<{ user: UserDetail }>('/auth/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateUser = (id: number, payload: UpdateUserPayload) =>
  request<{ user: UserDetail }>(`/auth/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const deleteUser = (id: number) =>
  request<{ id: number }>(`/auth/users/${id}`, { method: 'DELETE' });
