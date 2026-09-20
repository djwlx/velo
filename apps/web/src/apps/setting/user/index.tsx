import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Form, FormInput, FormSubmit } from '@/components/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { useRequestQuery } from '@/hooks/useRequestQuery';
import { getCurrentUser, updateMe } from '@/services/user';
import { useUser } from '@/stores/user';

import { userSchema, type UserFormValues } from './types';

export function UserInfo() {
  const { data, loading } = useRequestQuery(getCurrentUser);
  const setUser = useUser((state) => state.setUser);
  const user = data?.data.user;
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: '', nickname: '', avatar: '' },
  });

  useEffect(() => {
    if (!user) return;
    form.reset({
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar ?? '',
    });
  }, [user, form]);

  const onSubmit = async ({ nickname, avatar }: UserFormValues) => {
    const response = await updateMe({ nickname, avatar });
    setUser(response.data.user);
    form.reset({
      email: response.data.user.email,
      nickname: response.data.user.nickname,
      avatar: response.data.user.avatar ?? '',
    });
    toast.add({ type: 'success', title: '保存成功' });
  };

  return (
    <main className="flex min-h-0 flex-1 items-start justify-center overflow-auto px-4 py-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <Form form={form} onSubmit={onSubmit}>
              <FormInput
                control={form.control}
                name="email"
                label="邮箱"
                type="email"
                readOnly
              />
              <FormInput
                control={form.control}
                name="nickname"
                label="昵称"
                autoComplete="nickname"
              />
              <FormInput
                control={form.control}
                name="avatar"
                label="头像链接"
                type="url"
                placeholder="https://"
              />
              <div className="flex justify-end">
                <FormSubmit disabled={!form.formState.isDirty} />
              </div>
            </Form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
