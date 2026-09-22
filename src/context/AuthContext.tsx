/**
 * GrowNaturals Billing — Auth & Permissions Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  canAccess: (moduleKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gn_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.post('/auth/login', { username, password });
      setUser(data.user);
      localStorage.setItem('gn_auth_user', JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gn_auth_user');
    localStorage.removeItem('gn_auth_token');
  };

  // Check if current user has permission for a specific module
  const canAccess = (moduleKey: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admins have master access

    // Check specific module permission checkbox
    if (user.permissions && user.permissions[moduleKey] !== undefined) {
      return Boolean(user.permissions[moduleKey]);
    }

    // Role fallbacks
    switch (user.role) {
      case 'manager':
        return moduleKey !== 'staff' && moduleKey !== 'settings';
      case 'cashier':
        return ['dashboard', 'pos', 'invoices', 'inventory', 'refunds'].includes(moduleKey);
      case 'supervisor':
        return ['projects', 'delivery_challans', 'expenses'].includes(moduleKey);
      case 'staff':
        return ['inventory', 'delivery_challans'].includes(moduleKey);
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
