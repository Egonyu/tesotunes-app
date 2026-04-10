import { create } from 'zustand';

import { AuthUser } from '../types/auth';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  setSession: (payload: { user: AuthUser; token: string }) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
  setStatus: (status: AuthStatus) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  user: null,
  token: null,
  hydrated: false,
  setSession: ({ user, token }) =>
    set({
      user,
      token,
      status: 'authenticated',
      hydrated: true,
    }),
  clearSession: () =>
    set({
      user: null,
      token: null,
      status: 'guest',
      hydrated: true,
    }),
  setHydrated: (value) => set({ hydrated: value }),
  setStatus: (status) => set({ status }),
}));
