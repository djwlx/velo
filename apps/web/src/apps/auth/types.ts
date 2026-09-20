import { z } from 'zod';

export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱')
    .max(320, '邮箱长度不能超过 320 个字符'),
  password: z
    .string()
    .min(4, '密码长度需要在 4 到 256 个字符之间')
    .max(256, '密码长度需要在 4 到 256 个字符之间'),
});

export type AuthFormValues = z.infer<typeof authSchema>;
