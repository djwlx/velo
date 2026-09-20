export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  avatar: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface MeResponse {
  user: UserProfile;
  roles: string[];
  permissions: string[];
}

export interface UpdateMePayload {
  nickname?: string;
  avatar?: string;
  password?: string;
  currentPassword?: string;
}

export interface UpdateMeResponse {
  user: UserProfile;
}

export type UserStatus = 'active' | 'disabled';

export interface UserRole {
  code: string;
  name: string;
}

export interface UserSummary {
  id: number;
  email: string;
  nickname: string;
  avatar: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetail extends UserSummary {
  roleIds: number[];
  roles: UserRole[];
}

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export interface ListUsersResponse {
  list: UserSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  nickname?: string;
  avatar?: string;
  status?: UserStatus;
  roleIds?: number[];
}

export interface UpdateUserPayload {
  nickname?: string;
  avatar?: string;
  password?: string;
  status?: UserStatus;
  roleIds?: number[];
}
