export interface PermissionInfo {
  code: string;
  resource: string;
  operation: string;
  name: string;
  description: string;
}

export interface ListPermissionsResponse {
  list: PermissionInfo[];
}
