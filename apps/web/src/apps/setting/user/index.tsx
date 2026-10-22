import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, Pencil } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';

import { Form, FormField, FormInput, FormSubmit } from '@/components/form';
import { AvatarImage } from '@/components/avatar-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { toast } from '@/components/ui/toast';
import { useRequestQuery } from '@/hooks/useRequestQuery';
import { uploadFile } from '@/services/file';
import { getCurrentUser, updateMe } from '@/services/user';
import { useUser } from '@/stores/user';

import { userSchema, type UserFormValues } from './types';
import { Loading } from '@/components/states/Loading';

export function UserInfo() {
  const { data, loading } = useRequestQuery(getCurrentUser);
  const setUser = useUser((state) => state.setUser);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = data?.data.user;
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { email: '', nickname: '', avatar: '' },
  });
  const nickname = form.watch('nickname');

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

  const onAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.add({ type: 'error', title: '请选择 PNG、JPG、GIF 或 WebP 图片' });
      return;
    }

    setUploading(true);
    try {
      const response = await uploadFile(file);
      form.setValue('avatar', response.data.downloadUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.add({ type: 'success', title: '上传成功' });
    } catch {
      // The request layer displays upload errors.
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex min-h-0 flex-1 items-start justify-center overflow-auto px-4 py-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loading />
          ) : (
            <Form form={form} onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="avatar"
                className="items-center"
              >
                {(field) => (
                  <div className="flex justify-center">
                    <input
                      ref={fileInputRef}
                      id={field.name}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      className="sr-only"
                      onChange={onAvatarFileChange}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      className="group/avatar relative size-24 overflow-hidden rounded-full p-0"
                      aria-label="上传头像"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="relative block size-24 shrink-0 overflow-hidden rounded-full">
                        <AvatarImage
                          src={field.value}
                          alt=""
                          className="size-24 rounded-full object-cover"
                          fallback={
                            <span className="flex size-24 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
                              {(nickname || user?.email || '头像')
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          }
                        />
                        <span
                          className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white transition-opacity duration-200 ease-out ${
                            uploading
                              ? 'opacity-100'
                              : 'opacity-0 group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100'
                          }`}
                        >
                          {uploading ? (
                            <LoaderCircle className="size-6 animate-spin" />
                          ) : (
                            <Pencil className="size-6 scale-90 transition-transform duration-200 ease-out group-hover/avatar:scale-100 group-focus-visible/avatar:scale-100" />
                          )}
                        </span>
                      </span>
                    </Button>
                  </div>
                )}
              </FormField>
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
