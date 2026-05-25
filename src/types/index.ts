export type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'SUPPLIER';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}
export type SupplierOrderStatus = 'BEKLIYOR' | 'ONAYLANDI' | 'REDDEDILDI' | 'YOLDA' | 'TESLIM_ALINDI';
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
  warehouse?: { id: number; name: string; locationAddress: string } | null;
  supplier?: { id: number; name: string } | null;
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
  locationAddress: string;
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
  suppliers?: Supplier[];
  warehouse?: Warehouse | null;
  warehouseStocks?: ProductWarehouseStock[];
}

export interface ProductWarehouseStock {
  warehouseId: number;
  warehouseName: string;
  quantity: number;
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

export interface AssetMaintenance {
  id: number;
  assetId: number;
  description: string;
  notes: string | null;
  startDate: string;
  endDate: string | null;
}

export interface InventoryTransaction {
  id: number;
  product: Product;
  warehouse: Warehouse;
  destinationWarehouse: Warehouse | null;
  user?: User | null;
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

export interface SupplierOrder {
  id: number;
  product: Product;
  supplier: Supplier;
  warehouse: Warehouse;
  createdBy?: User | null;
  quantity: number;
  status: SupplierOrderStatus;
  orderDate: string;
  updatedDate: string | null;
}

export interface WarehouseStockItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
}

export type NotificationType = 'STOCK_REQUEST' | 'ORDER' | 'LOW_STOCK';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  referenceId: number | null;
  read: boolean;
  createdAt: string;
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
  criticalStockCount: number;
}
