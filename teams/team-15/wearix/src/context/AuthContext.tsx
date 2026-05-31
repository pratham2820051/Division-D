'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'support';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role: 'buyer' | 'seller') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const MOCK_USERS = [
  { id: 'buyer1', name: 'John Doe', email: 'buyer@wearix.com', password: 'password123', role: 'buyer' as const },
  { id: 'seller1', name: 'Jane Seller', email: 'seller@wearix.com', password: 'password123', role: 'seller' as const },
  { id: 'support1', name: 'Sarah Thompson', email: 'support@wearix.com', password: 'password123', role: 'support' as const },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('wearix_token');
    const storedUser = localStorage.getItem('wearix_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('wearix_token');
        localStorage.removeItem('wearix_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!found) {
      setIsLoading(false);
      return { success: false, error: 'Invalid email or password' };
    }
    const mockToken = `mock_jwt_${Date.now()}_${found.id}`;
    const userData: User = { id: found.id, name: found.name, email: found.email, role: found.role };
    setUser(userData);
    setToken(mockToken);
    localStorage.setItem('wearix_token', mockToken);
    localStorage.setItem('wearix_user', JSON.stringify(userData));
    setIsLoading(false);
    return { success: true };
  };

  const register = async (name: string, email: string, password: string, role: 'buyer' | 'seller') => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const exists = MOCK_USERS.find(u => u.email === email);
    if (exists) {
      setIsLoading(false);
      return { success: false, error: 'Email already registered' };
    }
    const newUser: User = { id: `user_${Date.now()}`, name, email, role };
    const mockToken = `mock_jwt_${Date.now()}_${newUser.id}`;
    setUser(newUser);
    setToken(mockToken);
    localStorage.setItem('wearix_token', mockToken);
    localStorage.setItem('wearix_user', JSON.stringify(newUser));
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('wearix_token');
    localStorage.removeItem('wearix_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
