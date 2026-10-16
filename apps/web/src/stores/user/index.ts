import { getCurrentUser, login, register } from '@/services/user';
import type { UserProfile, UserRole } from '@/services/user/types';
import { create } from 'zustand';

const ACCESS_TOKEN_KEY = 'velo_access_token';

interface UserState {
  user: UserProfile | null;
  roles: UserRole[];
  permissions: string[];
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: UserProfile) => void;
  signOut: () => void;
}

export const useUser = create<UserState>((set) => ({
  user: null,
  roles: [],
  permissions: [],
  initialized: false,
  signIn: async (email, password) => {
    const response = await login(email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.data.token);
    const currentUser = await getCurrentUser();
    set({
      user: currentUser.data.user,
      roles: currentUser.data.roles,
      permissions: currentUser.data.permissions,
      initialized: true,
    });
  },
  signUp: async (email, password) => {
    const response = await register(email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.data.token);
    const currentUser = await getCurrentUser();
    set({
      user: currentUser.data.user,
      roles: currentUser.data.roles,
      permissions: currentUser.data.permissions,
      initialized: true,
    });
  },
  refresh: async () => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      set({ user: null, roles: [], permissions: [], initialized: true });
      return;
    }
    try {
      const response = await getCurrentUser();
      set({
        user: response.data.user,
        roles: response.data.roles,
        permissions: response.data.permissions,
        initialized: true,
      });
    } catch {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      set({ user: null, roles: [], permissions: [], initialized: true });
    }
  },
  setUser: (user) => set({ user }),
  signOut: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    set({ user: null, roles: [], permissions: [], initialized: true });
  },
}));
