import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import SupplierLayout from './components/layout/SupplierLayout';
import LoginPage           from './pages/LoginPage';
import ForgotPasswordPage  from './pages/ForgotPasswordPage';
import RegisterPage        from './pages/RegisterPage';
import ChangePasswordPage  from './pages/ChangePasswordPage';
import DashboardPage       from './pages/DashboardPage';
import UsersPage      from './pages/UsersPage';
import ProductsPage   from './pages/ProductsPage';
import AssetsPage     from './pages/AssetsPage';
import InventoryPage  from './pages/InventoryPage';
import WarehousesPage from './pages/WarehousesPage';
import CategoriesPage from './pages/CategoriesPage';
import SuppliersPage  from './pages/SuppliersPage';
import ProfilePage    from './pages/ProfilePage';
import OrdersPage     from './pages/OrdersPage';
import SupplierProductsPage     from './pages/supplier/SupplierProductsPage';
import SupplierOrdersPage       from './pages/supplier/SupplierOrdersPage';
import SupplierTransactionsPage from './pages/supplier/SupplierTransactionsPage';

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
}

function StaffGuard({ children }: { children: React.ReactNode }) {
  const { isStaff } = useAuth();
  return isStaff ? <Navigate to="/products" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Supplier portal */}
        <Route path="/supplier" element={<SupplierLayout />}>
          <Route path="urunlerim"     element={<SupplierProductsPage />} />
          <Route path="siparisler"    element={<SupplierOrdersPage />} />
          <Route path="islem-gecmisi" element={<SupplierTransactionsPage />} />
          <Route index element={<Navigate to="urunlerim" replace />} />
        </Route>

        {/* Admin / Manager / Staff portal */}
        <Route element={<AppLayout />}>
          <Route index element={<StaffGuard><DashboardPage /></StaffGuard>} />
          <Route path="products"   element={<ProductsPage />} />
          <Route path="assets"     element={<AssetsPage />} />
          <Route path="inventory"  element={<InventoryPage />} />
          <Route path="warehouses" element={<StaffGuard><WarehousesPage /></StaffGuard>} />
          <Route path="categories" element={<StaffGuard><CategoriesPage /></StaffGuard>} />
          <Route path="suppliers"  element={<StaffGuard><SuppliersPage /></StaffGuard>} />
          <Route path="orders"     element={<StaffGuard><OrdersPage /></StaffGuard>} />
          <Route path="users"    element={<AdminOnly><UsersPage /></AdminOnly>} />
          <Route path="profile"  element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
