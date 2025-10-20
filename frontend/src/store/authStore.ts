import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import socketService from '@/lib/socket';
import { AuthState } from '@/types';
import toast from 'react-hot-toast';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));

          set({ user, token, isAuthenticated: true });

          socketService.connect(token);

          toast.success('تم تسجيل الدخول بنجاح');
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'فشل تسجيل الدخول');
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        socketService.disconnect();

        set({ user: null, token: null, isAuthenticated: false });

        toast.success('تم تسجيل الخروج');
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);
