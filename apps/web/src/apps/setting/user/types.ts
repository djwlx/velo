import { z } from 'zod';

export const userSchema = z.object({
  email: z.string(),
  nickname: z
    .string()
    .trim()
    .min(1, '请输入昵称')
    .max(32, '昵称长度不能超过 32 个字符'),
  avatar: z
    .string()
    .trim()
    .max(2048, '头像地址不能超过 2048 个字符')
    .refine(
      (value) => value === '' || /^https?:\/\//.test(value),
      '请输入有效的头像链接'
    ),
});

export type UserFormValues = z.infer<typeof userSchema>;
