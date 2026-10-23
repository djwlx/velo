export const ADMIN_ROLE = 'admin' as const;

export const PERMISSIONS = [
  {
    code: 'file:read',
    resource: 'file',
    operation: 'read',
    name: '读取文件',
    description: '浏览和读取文件',
  },
  {
    code: 'file:write',
    resource: 'file',
    operation: 'write',
    name: '写入文件',
    description: '上传和修改文件',
  },
] as const;

export type Permission = (typeof PERMISSIONS)[number]['code'] | typeof ADMIN_ROLE;

export const ALL_PERMISSIONS = PERMISSIONS.map(({ code }) => code);
