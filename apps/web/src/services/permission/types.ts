export interface PermissionInfo {
  code: string;
  module: string;
  name: string;
  description: string;
}

export interface ListPermissionsResponse {
  list: PermissionInfo[];
}
