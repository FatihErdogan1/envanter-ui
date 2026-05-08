import client from './client';
import type {
  User, Supplier, Warehouse, Category, Product,
  Asset, AssetAssignment, InventoryTransaction, DashboardStats, StockRequest
} from '../types';

// Auth
export const login = (username: string, password: string) =>
  client.post<{ token: string; role: string; username: string; forcePasswordChange: boolean; warehouseId: number | null; warehouseName: string | null }>('/auth/login', { username, password });

export const forgotPassword = (email: string) =>
  client.post<string>('/auth/forgot-password', { email });

export const register = (username: string, email: string, password: string) =>
  client.post<string>('/auth/register', { username, email, password });

export const changePassword = (newPassword: string) =>
  client.post('/auth/change-password', { newPassword });

// Dashboard
export const getDashboardStats = () =>
  client.get<DashboardStats>('/dashboard/stats');

// Users
export const getUsers = () => client.get<User[]>('/users');
export const getAssignableUsers = () => client.get<User[]>('/users/assignable');
export const createUser = (data: Partial<User> & { password: string }) => client.post<User>('/users', data);
export const updateUser = (id: number, data: Partial<User>) => client.put<User>(`/users/${id}`, data);
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

// Categories
export const getCategories = () => client.get<Category[]>('/categories');
export const createCategory = (data: Partial<Category>) => client.post<Category>('/categories', data);
export const updateCategory = (id: number, data: Partial<Category>) => client.put<Category>(`/categories/${id}`, data);
export const deleteCategory = (id: number) => client.delete(`/categories/${id}`);

// Products
export const getProducts = () => client.get<Product[]>('/products');
export const createProduct = (data: object) => client.post<Product>('/products', data);
export const updateProduct = (id: number, data: object) => client.put<Product>(`/products/${id}`, data);
export const deleteProduct = (id: number) => client.delete(`/products/${id}`);

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

// Inventory
export const getTransactions = () => client.get<InventoryTransaction[]>('/inventory/transactions');
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
