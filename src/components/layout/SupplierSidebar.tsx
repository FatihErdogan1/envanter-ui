import { NavLink } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../ui/NotificationBell';
import logo from '../../resources/logo.png';

const navItems = [
  { to: '/supplier/urunlerim',    label: 'ÜRÜNLERİM' },
  { to: '/supplier/siparisler',   label: 'SİPARİŞLER' },
  { to: '/supplier/islem-gecmisi', label: 'İŞLEM GEÇMİŞİ' },
];

export default function SupplierSidebar() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const handleLogout = () => { qc.clear(); logout(); };

  return (
    <aside className="w-56 flex-shrink-0 bg-bg-surface border-r border-border flex flex-col">
      <div className="px-4 py-4 border-b border-border flex items-center justify-between">
        <img src={logo} alt="inventory.io" className="w-28" />
        <NotificationBell />
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-4 py-2.5 font-pixel text-xs transition-colors duration-100 border-l-2 ${
                isActive
                  ? 'border-accent text-accent bg-bg-panel'
                  : 'border-transparent text-muted hover:text-text-primary hover:bg-bg-panel'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <div className="font-pixel text-xs text-muted mb-1">{user?.username}</div>
        <div className="font-vt text-sm text-accent2 mb-1">{user?.supplierName ?? 'TEDARİKÇİ'}</div>
        <div className="font-pixel text-xs text-muted mb-3">TEDARİKÇİ</div>
        <button
          onClick={handleLogout}
          className="font-pixel text-xs text-red hover:text-text-primary transition-colors"
        >
          ÇIKIŞ YAP
        </button>
      </div>
    </aside>
  );
}
