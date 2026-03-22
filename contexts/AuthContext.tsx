'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'tamperguard_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    // Clear cookie for server-side access
    document.cookie = `${AUTH_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null);
    router.push('/');
  }, [router]);

  const checkAuth = useCallback((): boolean => {
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
            
            // Ensure cookie is also present (in case it was cleared but localStorage remains)
            if (!document.cookie.includes(AUTH_KEY)) {
              document.cookie = `${AUTH_KEY}=${authData}; Path=/; Max-Age=${24 * 60 * 60}`;
            }
            
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
  }, [logout]);

  useEffect(() => {
    setIsMounted(true);
    checkAuth();
  }, [checkAuth]);

  // Prevent hydration mismatch by not rendering until mounted
  // However, we should still render children to avoid blank screen
  // unless the authentication state is critical for the layout.
  // For this project, we can render everything.

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
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
        const authString = JSON.stringify(authData);
        localStorage.setItem(AUTH_KEY, authString);
        
        // Set cookie for server-side access (Next.js Server Components)
        document.cookie = `${AUTH_KEY}=${authString}; Path=/; Max-Age=${24 * 60 * 60}`;
        
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
  }, []);

  const value = useMemo(() => ({
    isAuthenticated,
    isAdmin,
    user,
    login,
    logout,
    checkAuth
  }), [isAuthenticated, isAdmin, user, login, logout, checkAuth]);

  return (
    <AuthContext.Provider value={value}>
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
