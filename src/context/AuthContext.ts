import { createContext } from 'react';
import type { Role } from '../types';

export interface AuthUser {
  username: string;
  role: Role;
  token: string;
  forcePasswordChange: boolean;
  warehouseId: number | null;
  warehouseName: string | null;
  supplierId: number | null;
  supplierName: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  login: (token: string, username: string, role: string, forcePasswordChange: boolean, warehouseId?: number | null, warehouseName?: string | null, supplierId?: number | null, supplierName?: string | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  isSupplier: boolean;
  canManageOperations: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
