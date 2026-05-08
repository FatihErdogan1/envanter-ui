import { createContext, useContext, useState, ReactNode } from 'react';
import type { Role } from '../types';

interface AuthUser {
  username: string;
  role: Role;
  token: string;
  forcePasswordChange: boolean;
  warehouseId: number | null;
  warehouseName: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (token: string, username: string, role: string, forcePasswordChange: boolean, warehouseId?: number | null, warehouseName?: string | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  canManageOperations: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isStaff = user?.role === 'STAFF';
  const canManageOperations = isAdmin || isManager;

  const login = (token: string, username: string, role: string, forcePasswordChange: boolean, warehouseId: number | null = null, warehouseName: string | null = null) => {
    const authUser: AuthUser = { token, username, role: role as Role, forcePasswordChange, warehouseId, warehouseName };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isManager, isStaff, canManageOperations }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
