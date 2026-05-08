import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../resources/logo.png';

const navItems = [
  { to: '/',           label: 'DASHBOARD' },
  { to: '/products',   label: 'ÜRÜNLER' },
  { to: '/assets',     label: 'DEMİRBAŞLAR' },
  { to: '/inventory',  label: 'STOK HAREKETLERİ' },
  { to: '/warehouses', label: 'DEPOLAR' },
  { to: '/categories', label: 'KATEGORİLER' },
  { to: '/suppliers',  label: 'TEDARİKÇİLER' },
  { to: '/users',      label: 'KULLANICILAR', adminOnly: true },
  { to: '/profile',    label: 'PROFİLİM' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  const visible = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="w-56 flex-shrink-0 bg-bg-surface border-r border-border flex flex-col">
      <div className="px-4 py-4 border-b border-border">
        <img src={logo} alt="inventory.io" className="w-28" />
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
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
        <div className="font-vt text-sm text-accent2 mb-3">{user?.role}</div>
        <button
          onClick={logout}
          className="font-pixel text-xs text-red hover:text-text-primary transition-colors"
        >
          ÇIKIŞ YAP
        </button>
      </div>
    </aside>
  );
}
