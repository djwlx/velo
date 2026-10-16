import { ShieldCheck, UserCircle, Users } from 'lucide-react';
import type { SidebarSection } from '../types';

export const settingSidebarConfig: SidebarSection[] = [
  {
    title: '基本设置',
    items: [{ href: '/setting/me', label: '用户信息', icon: UserCircle }],
  },
  {
    title: '管理员设置',
    items: [
      { href: '/setting/users', label: '用户管理', icon: Users },
      { href: '/setting/roles', label: '角色管理', icon: ShieldCheck },
    ],
  },
];
