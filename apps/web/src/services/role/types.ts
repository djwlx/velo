export interface RoleDetail {
  id: number;
  code: string;
  name: string;
  permissionCodes: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListRolesResponse {
  list: RoleDetail[];
}

export interface CreateRolePayload {
  code: string;
  name: string;
  permissionCodes?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  permissionCodes?: string[];
}
