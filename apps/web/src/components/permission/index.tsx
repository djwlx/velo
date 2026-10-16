import type { ComponentType } from 'react';

import { Loading } from '@/components/states/Loading';
import { NeedAuth } from '@/components/states/NeedAuth';
import { NoPermission } from '@/components/states/NoPermission';
import { useUser } from '@/stores/user';

interface WithAuthOptions {
  permission?: string | string[];
}

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  { permission }: WithAuthOptions = {}
) {
  const required = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : [];

  function WithAuth(props: P) {
    const initialized = useUser((state) => state.initialized);
    const user = useUser((state) => state.user);
    const permissions = useUser((state) => state.permissions);

    if (!initialized) return <Loading />;
    if (!user) return <NeedAuth />;
    if (!required.every((code) => permissions.includes(code))) {
      return <NoPermission />;
    }

    return <Component {...props} />;
  }

  return WithAuth;
}
