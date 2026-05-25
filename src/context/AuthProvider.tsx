import { useState, ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthUser } from './AuthContext';

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
  const isSupplier = user?.role === 'SUPPLIER';
  const canManageOperations = isAdmin || isManager;

  const login = (token: string, username: string, role: string, forcePasswordChange: boolean, warehouseId: number | null = null, warehouseName: string | null = null, supplierId: number | null = null, supplierName: string | null = null) => {
    const authUser: AuthUser = { token, username, role: role as AuthUser['role'], forcePasswordChange, warehouseId, warehouseName, supplierId, supplierName };
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
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isManager, isStaff, isSupplier, canManageOperations }}>
      {children}
    </AuthContext.Provider>
  );
}
