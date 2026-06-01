import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@services/api';

interface User {
  userId: string;
  email: string;
  role?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await authAPI.login(email, password);
          const { token, data } = response.data;

          const user: User = {
            userId: data.userId,
            email: data.email,
            role: data.role,
          };

          set({ token, user, isAuthenticated: true });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string) => {
        set({ token });
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
