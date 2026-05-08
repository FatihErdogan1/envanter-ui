export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';
export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';
export type TxType = 'IN' | 'OUT' | 'TRANSFER';
export type StockRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  active: boolean;
  forcePasswordChange: boolean;
  warehouse?: { id: number; name: string; location: string } | null;
}

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantityInStock: number;
  category: Category;
}

export interface Asset {
  id: number;
  serialNumber: string;
  name: string;
  purchaseDate: string | null;
  status: AssetStatus;
  supplier: Supplier;
  warehouse: Warehouse;
  assignedToUsername?: string | null;
}

export interface AssetAssignment {
  id: number;
  assetId: number;
  user: User;
  assignedDate: string;
  returnDate: string | null;
  notes: string;
}

export interface InventoryTransaction {
  id: number;
  product: Product;
  warehouse: Warehouse;
  destinationWarehouse: Warehouse | null;
  type: TxType;
  quantity: number;
  transactionDate: string;
  notes: string;
}

export interface StockRequest {
  id: number;
  product: Product;
  warehouse: Warehouse;
  requestedBy: User;
  reviewedBy?: User | null;
  quantity: number;
  status: StockRequestStatus;
  requestDate: string;
  reviewDate?: string | null;
  notes?: string | null;
  managerNote?: string | null;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalAssets: number;
  totalWarehouses: number;
  availableAssets: number;
  inUseAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
}
