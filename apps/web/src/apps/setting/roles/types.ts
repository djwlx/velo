import { z } from 'zod/mini';

export const roleFormSchema = z.object({
  code: z.string().check(
    z.trim(),
    z.minLength(1, '请输入角色标识'),
    z.maxLength(32, '角色标识不能超过 32 个字符'),
    z.regex(/^[a-z0-9][a-z0-9_-]*$/i, '只能包含字母、数字、下划线和连字符')
  ),
  name: z.string().check(
    z.trim(),
    z.minLength(1, '请输入角色名称'),
    z.maxLength(64, '角色名称不能超过 64 个字符')
  ),
  permissionCodes: z.array(z.string()),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
