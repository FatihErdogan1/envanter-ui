import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
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

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products"   element={<ProductsPage />} />
          <Route path="assets"     element={<AssetsPage />} />
          <Route path="inventory"  element={<InventoryPage />} />
          <Route path="warehouses" element={<WarehousesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="suppliers"  element={<SuppliersPage />} />
          <Route path="users"    element={<AdminOnly><UsersPage /></AdminOnly>} />
          <Route path="profile"  element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
