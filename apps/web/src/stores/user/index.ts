import { getCurrentUser, login, register } from '@/services/user';
import type { UserProfile } from '@/services/user/types';
import { create } from 'zustand';

const ACCESS_TOKEN_KEY = 'velo_access_token';
const PERMISSIONS_KEY = 'velo_permissions';

interface UserState {
  user: UserProfile | null;
  permissions: string[];
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: UserProfile) => void;
  signOut: () => void;
}

const readStoredPermissions = (): string[] => {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(PERMISSIONS_KEY) ?? '[]'
    );
    return Array.isArray(value) &&
      value.every((permission) => typeof permission === 'string')
      ? value
      : [];
  } catch {
    return [];
  }
};

const savePermissions = (permissions: string[]) => {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
};

export const useUser = create<UserState>((set) => ({
  user: null,
  permissions: readStoredPermissions(),
  initialized: false,
  signIn: async (email, password) => {
    const response = await login(email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.data.token);
    const currentUser = await getCurrentUser();
    savePermissions(currentUser.data.permissions);
    set({
      user: currentUser.data.user,
      permissions: currentUser.data.permissions,
      initialized: true,
    });
  },
  signUp: async (email, password) => {
    const response = await register(email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.data.token);
    const currentUser = await getCurrentUser();
    savePermissions(currentUser.data.permissions);
    set({
      user: currentUser.data.user,
      permissions: currentUser.data.permissions,
      initialized: true,
    });
  },
  refresh: async () => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) {
      localStorage.removeItem(PERMISSIONS_KEY);
      set({ user: null, permissions: [], initialized: true });
      return;
    }
    try {
      const response = await getCurrentUser();
      savePermissions(response.data.permissions);
      set({
        user: response.data.user,
        permissions: response.data.permissions,
        initialized: true,
      });
    } catch {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(PERMISSIONS_KEY);
      set({ user: null, permissions: [], initialized: true });
    }
  },
  setUser: (user) => set({ user }),
  signOut: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
    set({ user: null, permissions: [], initialized: true });
  },
}));
