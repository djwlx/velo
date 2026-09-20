import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import {
  Form,
  FormCheckboxGroup,
  FormInput,
  FormSelect,
  FormSubmit,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { useRequestQuery } from '@/hooks/useRequestQuery';
import type { RoleDetail } from '@/services/role/types';
import { createUser, getUser, updateUser } from '@/services/user';
import type { UpdateUserPayload } from '@/services/user/types';

import { createUserFormSchema, type UserFormValues } from '../types';

const STATUS_ITEMS = { active: '启用', disabled: '禁用' } as const;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number | null;
  roles: RoleDetail[];
  onSaved: () => void;
}

export function UserFormDialog({
  open,
  onOpenChange,
  userId,
  roles,
  onSaved,
}: UserFormDialogProps) {
  const isEdit = userId !== null;
  const fetchUser = useCallback(() => getUser(userId as number), [userId]);
  const { data, loading } = useRequestQuery(fetchUser, {
    enabled: open && isEdit,
  });

  const schema = useMemo(() => createUserFormSchema(isEdit), [isEdit]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      nickname: '',
      avatar: '',
      status: 'active',
      roleIds: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    const user = data?.data.user;
    if (isEdit && !user) return;
    form.reset({
      email: user?.email ?? '',
      password: '',
      nickname: user?.nickname ?? '',
      avatar: user?.avatar ?? '',
      status: user?.status ?? 'active',
      roleIds: user?.roleIds ?? [],
    });
  }, [open, isEdit, data, form]);

  const onSubmit = async (values: UserFormValues) => {
    if (isEdit && userId !== null) {
      const payload: UpdateUserPayload = {
        nickname: values.nickname,
        avatar: values.avatar,
        status: values.status,
        roleIds: values.roleIds,
      };
      if (values.password) payload.password = values.password;
      await updateUser(userId, payload);
      toast.add({ type: 'success', title: '保存成功' });
    } else {
      await createUser({
        email: values.email,
        password: values.password,
        nickname: values.nickname,
        avatar: values.avatar,
        status: values.status,
        roleIds: values.roleIds,
      });
      toast.add({ type: 'success', title: '创建成功' });
    }
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑用户' : '新增用户'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改用户资料、状态与角色。' : '创建一个新的用户账号。'}
          </DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit}>
          <FormInput
            control={form.control}
            name="email"
            label="邮箱"
            type="email"
            autoComplete="off"
            disabled={isEdit}
          />
          <FormInput
            control={form.control}
            name="password"
            label="密码"
            type="password"
            autoComplete="new-password"
            placeholder={isEdit ? '留空则不修改' : undefined}
          />
          <FormInput
            control={form.control}
            name="nickname"
            label="昵称"
            autoComplete="off"
          />
          <FormInput
            control={form.control}
            name="avatar"
            label="头像链接"
            type="url"
            placeholder="https://"
          />
          <FormSelect
            control={form.control}
            name="status"
            label="状态"
            items={STATUS_ITEMS}
          />
          <FormCheckboxGroup
            control={form.control}
            name="roleIds"
            label="角色"
            emptyText="暂无可用角色"
            options={roles.map((role) => ({
              value: role.id,
              label: role.name,
              description: role.code,
            }))}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <FormSubmit disabled={loading} />
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
