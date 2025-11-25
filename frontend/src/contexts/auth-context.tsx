'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuthToken, getAuthToken } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; timezone?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; timezone?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  // Check for existing auth on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const response = await api.auth.me();
          setUser(response.data as User);
        } catch {
          // Token invalid, clear it
          setAuthToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    const { user: userData, token } = response.data;
    setAuthToken(token);
    setUser(userData as User);
    router.push('/dashboard');
  };

  const register = async (data: { email: string; password: string; name: string; timezone?: string }) => {
    const response = await api.auth.register(data);
    const { user: userData, token } = response.data;
    setAuthToken(token);
    setUser(userData as User);
    router.push('/dashboard');
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    router.push('/login');
  };

  const updateProfile = async (data: { name?: string; timezone?: string }) => {
    const response = await api.auth.updateProfile(data);
    setUser(response.data as User);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.auth.changePassword(currentPassword, newPassword);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
