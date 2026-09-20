import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, Redirect, useLocation, useSearchParams } from 'wouter';

import { Form, FormInput, FormSubmit } from '@/components/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { useUser } from '@/stores/user';

import { authSchema, type AuthFormValues } from './types';

export function AuthPage() {
  const [location, navigate] = useLocation();
  const [searchParams] = useSearchParams();
  const user = useUser((state) => state.user);
  const signIn = useUser((state) => state.signIn);
  const signUp = useUser((state) => state.signUp);
  const isRegister = location === '/register';
  const redirectParam = searchParams.get('redirect');
  const redirectTo =
    redirectParam &&
    redirectParam.startsWith('/') &&
    !redirectParam.startsWith('//')
      ? redirectParam
      : '/';
  const authSwitchHref = `${isRegister ? '/login' : '/register'}${
    redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''
  }`;
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  });

  if (user) return <Redirect to={redirectTo} />;

  const onSubmit = async ({ email, password }: AuthFormValues) => {
    if (isRegister) await signUp(email, password);
    else await signIn(email, password);
    toast.add({
      type: 'success',
      title: isRegister ? '注册成功' : '登录成功',
    });
    navigate(redirectTo);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isRegister ? '注册 Velo' : '登录 Velo'}</CardTitle>
          <CardDescription>
            {isRegister ? '创建账号后即可开始使用。' : '登录后继续使用 Velo。'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={onSubmit}>
            <FormInput
              control={form.control}
              name="email"
              label="邮箱"
              type="email"
              autoComplete="email"
            />
            <FormInput
              control={form.control}
              name="password"
              label="密码"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            <FormSubmit pendingLabel="提交中…">
              {isRegister ? '注册' : '登录'}
            </FormSubmit>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {isRegister ? '已有账号？' : '还没有账号？'}
          <Link
            className="ml-1 text-primary hover:underline"
            href={authSwitchHref}
          >
            {isRegister ? '去登录' : '去注册'}
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
