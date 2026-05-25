import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SupplierSidebar from './SupplierSidebar';

export default function SupplierLayout() {
  const { user, isSupplier } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isSupplier) return <Navigate to="/" replace />;

  return (
    <div className="flex h-full">
      <SupplierSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
