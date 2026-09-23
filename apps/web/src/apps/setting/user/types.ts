import { z } from 'zod/mini';

export const userSchema = z.object({
  email: z.string(),
  nickname: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, '请输入昵称'),
      z.maxLength(32, '昵称长度不能超过 32 个字符')
    ),
  avatar: z.string().check(
    z.trim(),
    z.maxLength(2048, '头像地址不能超过 2048 个字符'),
    z.refine(
      (value) => value === '' || /^https?:\/\//.test(value),
      '请输入有效的头像链接'
    )
  ),
});

export type UserFormValues = z.infer<typeof userSchema>;
