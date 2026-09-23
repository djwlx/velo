import { z } from 'zod/mini';

export const authSchema = z.object({
  email: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, '请输入邮箱'),
      z.email('请输入有效的邮箱'),
      z.maxLength(320, '邮箱长度不能超过 320 个字符')
    ),
  password: z
    .string()
    .check(
      z.minLength(4, '密码长度需要在 4 到 256 个字符之间'),
      z.maxLength(256, '密码长度需要在 4 到 256 个字符之间')
    ),
});

export type AuthFormValues = z.infer<typeof authSchema>;
