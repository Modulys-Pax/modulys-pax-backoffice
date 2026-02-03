'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (user: AdminUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = Cookies.get('admin_token');
    const savedUser = Cookies.get('admin_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        Cookies.remove('admin_token');
        Cookies.remove('admin_user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      const isLoginPage = pathname === '/login';
      const isRootPage = pathname === '/';
      
      if (!user && !isLoginPage && !isRootPage) {
        router.push('/login');
      } else if (user && isLoginPage) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const login = (userData: AdminUser, accessToken: string) => {
    setUser(userData);
    setToken(accessToken);
    Cookies.set('admin_token', accessToken, { expires: 7 });
    Cookies.set('admin_user', JSON.stringify(userData), { expires: 7 });
    router.push('/dashboard');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('admin_token');
    Cookies.remove('admin_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
