import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';
import { useToastStore } from './toast';

export interface UserSession {
  uid: string;
  email: string;
  fullName: string;
  role: 'student' | 'moderator' | 'admin';
  profilePicture: string;
  isVerified: boolean;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserSession | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );
  const token = ref<string | null>(localStorage.getItem('accessToken'));
  const toastStore = useToastStore();

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin' || user.value?.role === 'moderator');

  const setSession = (accessToken: string, refreshToken: string, userSession: UserSession) => {
    token.value = accessToken;
    user.value = userSession;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userSession));
  };

  const login = async (credentials: Record<string, string>) => {
    try {
      const res = await api.post('/auth/login', credentials);
      if (res.data?.success) {
        const { accessToken, refreshToken, user: session } = res.data.data;
        setSession(accessToken, refreshToken, session);
        toastStore.show('Logged in successfully.', 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      toastStore.show(err.response?.data?.message || 'Login failed. Please verify credentials.', 'error');
      return false;
    }
  };

  const signup = async (payload: Record<string, any>) => {
    try {
      const res = await api.post('/auth/signup', payload);
      if (res.data?.success) {
        toastStore.show(res.data.message || 'Registration successful. Check email verification.', 'success', 6000);
        return true;
      }
      return false;
    } catch (err: any) {
      toastStore.show(err.response?.data?.message || 'Signup failed.', 'error');
      return false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    toastStore.show('Logged out successfully.', 'info');
  };

  const updateProfileState = (partialProfile: Partial<UserSession>) => {
    if (user.value) {
      user.value = { ...user.value, ...partialProfile };
      localStorage.setItem('user', JSON.stringify(user.value));
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    signup,
    logout,
    updateProfileState
  };
});
