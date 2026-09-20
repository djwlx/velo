import { z } from 'zod';

export const roleFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, '请输入角色标识')
    .max(32, '角色标识不能超过 32 个字符')
    .regex(/^[a-z0-9][a-z0-9_-]*$/i, '只能包含字母、数字、下划线和连字符'),
  name: z
    .string()
    .trim()
    .min(1, '请输入角色名称')
    .max(64, '角色名称不能超过 64 个字符'),
  permissionCodes: z.array(z.string()),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
