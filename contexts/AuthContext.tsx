'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email?: string;
  role: 'user' | 'admin';
  picture?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'tamperguard_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = (): boolean => {
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem(AUTH_KEY);
      if (authData) {
        try {
          const { user: storedUser, timestamp } = JSON.parse(authData);
          // Session expires after 24 hours
          const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000;
          
          if (!isExpired && storedUser) {
            setIsAuthenticated(true);
            setIsAdmin(storedUser.role === 'admin');
            setUser(storedUser);
            return true;
          } else {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
    }
    return false;
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const authData = {
          user: data.user,
          timestamp: Date.now(),
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        setIsAuthenticated(true);
        setIsAdmin(data.user.role === 'admin');
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (response.ok) {
        const data = await response.json();
        const authData = {
          user: data.user,
          timestamp: Date.now(),
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        setIsAuthenticated(true);
        setIsAdmin(data.user.role === 'admin');
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, user, login, loginWithGoogle, logout, checkAuth }}>
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
