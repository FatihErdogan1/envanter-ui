import client from './client';
import type {
  User, Supplier, Warehouse, Category, Product, ProductWarehouseStock,
  Asset, AssetAssignment, AssetMaintenance, InventoryTransaction, DashboardStats, StockRequest, WarehouseStockItem,
  SupplierOrder, PageResponse, Notification
} from '../types';

// Auth
export const login = (username: string, password: string) =>
  client.post<{ token: string; role: string; username: string; forcePasswordChange: boolean; warehouseId: number | null; warehouseName: string | null; supplierId: number | null; supplierName: string | null }>('/auth/login', { username, password });

export const forgotPassword = (email: string) =>
  client.post<string>('/auth/forgot-password', { email });

export const register = (username: string, email: string, password: string) =>
  client.post<string>('/auth/register', { username, email, password });

export const changePassword = (newPassword: string, currentPassword?: string) =>
  client.post('/auth/change-password', { newPassword, currentPassword });

// Dashboard
export const getDashboardStats = () =>
  client.get<DashboardStats>('/dashboard/stats');

// Users
export const getUsers = () => client.get<User[]>('/users');
export const getAssignableUsers = () => client.get<User[]>('/users/assignable');
export const createUser = (data: Partial<User> & { password: string; supplierId?: string | null }) => client.post<User>('/users', data);
export const updateUser = (id: number, data: Partial<User> & { warehouseId?: number | null; supplierId?: number | null }) => client.put<User>(`/users/${id}`, data);
export const deleteUser = (id: number) => client.delete(`/users/${id}`);
export const resetUserPassword = (id: number) =>
  client.post<{ tempPassword: string }>(`/users/${id}/reset-password`);

// Suppliers
export const getSuppliers = () => client.get<Supplier[]>('/suppliers');
export const createSupplier = (data: Partial<Supplier>) => client.post<Supplier>('/suppliers', data);
export const updateSupplier = (id: number, data: Partial<Supplier>) => client.put<Supplier>(`/suppliers/${id}`, data);
export const deleteSupplier = (id: number) => client.delete(`/suppliers/${id}`);

// Warehouses
export const getWarehouses = () => client.get<Warehouse[]>('/warehouses');
export const createWarehouse = (data: Partial<Warehouse>) => client.post<Warehouse>('/warehouses', data);
export const updateWarehouse = (id: number, data: Partial<Warehouse>) => client.put<Warehouse>(`/warehouses/${id}`, data);
export const deleteWarehouse = (id: number) => client.delete(`/warehouses/${id}`);
export const getWarehouseStock = (id: number) => client.get<WarehouseStockItem[]>(`/warehouses/${id}/stock`);

// Categories
export const getCategories = () => client.get<Category[]>('/categories');
export const createCategory = (data: Partial<Category>) => client.post<Category>('/categories', data);
export const updateCategory = (id: number, data: Partial<Category>) => client.put<Category>(`/categories/${id}`, data);
export const deleteCategory = (id: number) => client.delete(`/categories/${id}`);

// Products
export const getProducts = (page = 0, size = 20) =>
  client.get<PageResponse<Product>>(`/products?page=${page}&size=${size}`);
export const createProduct = (data: object) => client.post<Product>('/products', data);
export const updateProduct = (id: number, data: object) => client.put<Product>(`/products/${id}`, data);
export const deleteProduct = (id: number) => client.delete(`/products/${id}`);
export const getProductStockSummary = (id: number) => client.get<ProductWarehouseStock[]>(`/products/${id}/stock-summary`);
export const getProductSuppliers = (id: number) => client.get<Supplier[]>(`/products/${id}/suppliers`);
export const getProductTransactionHistory = (id: number) => client.get<InventoryTransaction[]>(`/products/${id}/transaction-history`);

// Assets
export const getAssets = () => client.get<Asset[]>('/assets');
export const createAsset = (data: object) => client.post<Asset>('/assets', data);
export const updateAsset = (id: number, data: object) => client.put<Asset>(`/assets/${id}`, data);
export const deleteAsset = (id: number) => client.delete(`/assets/${id}`);
export const assignAsset = (assetId: number, data: { userId: number; notes?: string }) =>
  client.post(`/assets/${assetId}/assign`, data);
export const returnAsset = (assetId: number) =>
  client.post(`/assets/${assetId}/return`);
export const retireAsset = (assetId: number) =>
  client.post(`/assets/${assetId}/retire`);
export const startAssetMaintenance = (assetId: number, data: { description: string; notes?: string }) =>
  client.post(`/assets/${assetId}/maintenance/start`, data);
export const endAssetMaintenance = (assetId: number) =>
  client.post(`/assets/${assetId}/maintenance/end`);
export const getAssetAssignments = (assetId: number) =>
  client.get<AssetAssignment[]>(`/assets/${assetId}/assignments`);
export const getAssetMaintenance = (assetId: number) =>
  client.get<AssetMaintenance[]>(`/assets/${assetId}/maintenance`);

// Inventory
export const getTransactions = (page = 0, size = 20) =>
  client.get<PageResponse<InventoryTransaction>>(`/inventory/transactions?page=${page}&size=${size}`);
export const stockIn = (data: object) => client.post('/inventory/in', data);
export const stockOut = (data: object) => client.post('/inventory/out', data);
export const transfer = (data: object) => client.post('/inventory/transfer', data);

// Stock Requests
export const getStockRequests = () => client.get<StockRequest[]>('/stock-requests');
export const createStockRequest = (data: object) => client.post<StockRequest>('/stock-requests', data);
export const approveStockRequest = (id: number, data: { managerNote?: string }) =>
  client.post<StockRequest>(`/stock-requests/${id}/approve`, data);
export const rejectStockRequest = (id: number, data: { managerNote?: string }) =>
  client.post<StockRequest>(`/stock-requests/${id}/reject`, data);

// Supplier Orders
export const getSupplierOrders = () => client.get<SupplierOrder[]>('/supplier-orders');
export const createSupplierOrder = (data: { productId: number; supplierId: number; warehouseId: number; quantity: number }) =>
  client.post<SupplierOrder>('/supplier-orders', data);
export const approveSupplierOrder = (id: number) => client.patch<SupplierOrder>(`/supplier-orders/${id}/approve`);
export const rejectSupplierOrder  = (id: number) => client.patch<SupplierOrder>(`/supplier-orders/${id}/reject`);
export const shipSupplierOrder    = (id: number) => client.patch<SupplierOrder>(`/supplier-orders/${id}/ship`);
export const deliverSupplierOrder = (id: number) => client.patch<SupplierOrder>(`/supplier-orders/${id}/deliver`);

// Notifications
export const getNotifications = () => client.get<Notification[]>('/notifications');
export const getUnreadCount = () => client.get<{ count: number }>('/notifications/unread-count');
export const markAllNotificationsRead = () => client.put('/notifications/read-all');
export const markNotificationRead = (id: number) => client.put(`/notifications/${id}/read`);

// Supplier Portal
export const getMyProducts     = () => client.get<Product[]>('/supplier-orders/my-products');
export const updateMyProductPrice = (productId: number, price: number) =>
  client.patch<Product>(`/supplier-orders/my-products/${productId}/price`, { price });
export const getMyTransactions = () => client.get<InventoryTransaction[]>('/supplier-orders/my-transactions');
