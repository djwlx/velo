import { z } from 'zod';

const nicknameField = z
  .string()
  .trim()
  .min(1, '请输入昵称')
  .max(32, '昵称长度不能超过 32 个字符');

const avatarField = z
  .string()
  .trim()
  .max(2048, '头像地址不能超过 2048 个字符')
  .refine(
    (value) => value === '' || /^https?:\/\//.test(value),
    '请输入有效的头像链接'
  );

const optionalPasswordField = z
  .string()
  .max(256, '密码长度需要在 4 到 256 个字符之间')
  .refine(
    (value) => value === '' || (value.length >= 4 && value.length <= 256),
    '密码长度需要在 4 到 256 个字符之间'
  );

const requiredPasswordField = z
  .string()
  .min(4, '密码长度需要在 4 到 256 个字符之间')
  .max(256, '密码长度需要在 4 到 256 个字符之间');

export const createUserFormSchema = (isEdit: boolean) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, '请输入邮箱')
      .email('请输入有效的邮箱')
      .max(320, '邮箱长度不能超过 320 个字符'),
    password: isEdit ? optionalPasswordField : requiredPasswordField,
    nickname: nicknameField,
    avatar: avatarField,
    status: z.enum(['active', 'disabled']),
    roleIds: z.array(z.number()),
  });

export type UserFormValues = z.infer<
  ReturnType<typeof createUserFormSchema>
>;
