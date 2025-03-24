import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthStoreState {
  isAuthenticated: boolean;
}

export interface AuthStoreActions {
  login: () => void;
  logout: () => void;
}

type AuthStore = AuthStoreState & AuthStoreActions;

const authStoreCreator: StateCreator<AuthStore, [], [], AuthStore> = (set) => ({
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
});

export const useAuthStore = create<AuthStore>()(persist(authStoreCreator, { name: 'auth-store' }));
