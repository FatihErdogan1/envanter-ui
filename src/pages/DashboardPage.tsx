import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAssets, getDashboardStats, getWarehouseStock } from '../api';
import PageHeader from '../components/ui/PageHeader';
import DataTable, { Column } from '../components/ui/DataTable';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats, WarehouseStockItem } from '../types';

const roleLabel: Record<string, string> = {
  ADMIN:   'YÖNETİCİ',
  MANAGER: 'MÜDÜR',
  STAFF:   'PERSONEL',
};

const roleColor: Record<string, string> = {
  ADMIN:   'text-accent border-accent',
  MANAGER: 'text-accent2 border-accent2',
  STAFF:   'text-blue border-blue',
};

function UserBanner() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();
  const colorClass = roleColor[user.role] ?? 'text-muted border-muted';

  return (
    <Link
      to="/profile"
      className="card flex items-center gap-4 hover:border-accent transition-colors duration-150 group"
    >
      <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border-2 bg-bg-panel font-pixel text-sm ${colorClass}`}>
        {initials}
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <span className="font-vt text-2xl text-text-white group-hover:text-accent transition-colors">
          HOŞGELDİN, {user.username.toUpperCase()}
        </span>
        <span className={`font-pixel ${colorClass.split(' ')[0]}`} style={{ fontSize: '8px' }}>
          {roleLabel[user.role] ?? user.role}
          {user.warehouseName ? `  ·  ${user.warehouseName}` : ''}
        </span>
      </div>
      <span className="font-pixel text-muted group-hover:text-accent transition-colors" style={{ fontSize: '8px' }}>
        PROFİL →
      </span>
    </Link>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  accent: string;
  borderColor: string;
  to?: string;
}

function SummaryCard({ label, value, accent, borderColor, to }: SummaryCardProps) {
  const inner = (
    <div className={`card flex flex-col gap-3 border-t-2 ${borderColor} ${to ? 'hover:opacity-80 transition-opacity cursor-pointer' : ''}`}>
      <span className="font-pixel text-muted" style={{ fontSize: '9px' }}>{label}</span>
      <span className={`font-vt text-5xl ${accent}`}>{value}</span>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

interface AssetBarProps {
  stats: DashboardStats;
}

function AssetStatusBar({ stats }: AssetBarProps) {
  const total = stats.totalAssets || 1;
  const segments = [
    { label: 'MÜSAİT',       value: stats.availableAssets,   bg: 'bg-green',  text: 'text-green' },
    { label: 'KULLANIMDA',   value: stats.inUseAssets,        bg: 'bg-blue',   text: 'text-blue' },
    { label: 'BAKIMDA',      value: stats.maintenanceAssets,  bg: 'bg-yellow', text: 'text-yellow' },
    { label: 'KULLANIM DIŞI', value: stats.retiredAssets,    bg: 'bg-muted',  text: 'text-muted' },
  ];

  return (
    <div className="card flex flex-col gap-4">
      <span className="font-pixel text-muted" style={{ fontSize: '9px' }}>DEMİRBAŞ DURUMU</span>

      {/* Segmented bar */}
      <div className="flex h-4 w-full overflow-hidden border border-border">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.bg} opacity-80 transition-all duration-300`}
            style={{ width: `${(seg.value / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 ${seg.bg} opacity-80`} />
              <span className="font-pixel text-muted" style={{ fontSize: '8px' }}>{seg.label}</span>
            </div>
            <span className={`font-vt text-3xl ${seg.text}`}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const quickLinks = [
  { to: '/products',  label: '→  ÜRÜNLER',          desc: 'Ürün listesi ve yönetimi' },
  { to: '/assets',    label: '→  DEMİRBAŞLAR',       desc: 'Atama, bakım, emeklilik' },
  { to: '/inventory', label: '→  STOK HAREKETLERİ',  desc: 'Giriş, çıkış, transfer' },
  { to: '/warehouses',label: '→  DEPOLAR',            desc: 'Depo listesi ve detaylar' },
];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const isWarehouseScoped = !isAdmin && user?.warehouseId != null;
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', user?.warehouseId],
    queryFn: () => getDashboardStats().then((r) => r.data),
  });
  const { data: assets = [], isLoading: assetsLoading } = useQuery({
    queryKey: ['dashboard-assets', user?.warehouseId],
    queryFn: () => getAssets().then((r) => r.data),
    enabled: isWarehouseScoped,
  });
  const { data: warehouseStock = [], isLoading: stockLoading } = useQuery({
    queryKey: ['dashboard-warehouse-stock', user?.warehouseId],
    queryFn: () => getWarehouseStock(user!.warehouseId!).then((r) => r.data),
    enabled: isWarehouseScoped,
  });

  const scopedAssets = useMemo(() => (
    isWarehouseScoped
      ? assets.filter((asset) => asset.warehouse?.id === user?.warehouseId)
      : assets
  ), [assets, isWarehouseScoped, user?.warehouseId]);

  const displayStats = useMemo<DashboardStats | null>(() => {
    if (!data) return null;
    if (!isWarehouseScoped) return data;

    return {
      ...data,
      totalAssets: scopedAssets.length,
      totalWarehouses: 1,
      availableAssets: scopedAssets.filter((asset) => asset.status === 'AVAILABLE').length,
      inUseAssets: scopedAssets.filter((asset) => asset.status === 'IN_USE').length,
      maintenanceAssets: scopedAssets.filter((asset) => asset.status === 'MAINTENANCE').length,
      retiredAssets: scopedAssets.filter((asset) => asset.status === 'RETIRED').length,
    };
  }, [data, isWarehouseScoped, scopedAssets]);

  const stockColumns: Column<WarehouseStockItem>[] = [
    { key: 'productName', header: 'ÜRÜN ADI' },
    { key: 'sku',         header: 'SKU' },
    { key: 'quantity',    header: 'MİKTAR' },
  ];

  if (isLoading || assetsLoading) return <p className="text-muted font-vt text-2xl">Yükleniyor...</p>;
  if (error || !displayStats) return <p className="text-red font-vt text-2xl">Veri yüklenemedi{error ? `: ${(error as Error).message}` : ''}.</p>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="DASHBOARD" />
      <UserBanner />

      {/* Özet istatistikler */}
      <div className={`grid grid-cols-2 gap-4 ${user?.role === 'ADMIN' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        <SummaryCard label="ÜRÜNLER"      value={displayStats.totalProducts}    accent="text-accent"  borderColor="border-accent"  to="/products" />
        <SummaryCard label="KRİTİK STOK"  value={displayStats.criticalStockCount} accent="text-red"   borderColor="border-red"     to="/products?lowStock=true" />
        <SummaryCard label="DEMİRBAŞLAR"  value={displayStats.totalAssets}      accent="text-blue"    borderColor="border-blue"    to="/assets" />
        <SummaryCard label="DEPOLAR"      value={displayStats.totalWarehouses}  accent="text-accent2" borderColor="border-accent2" to="/warehouses" />
        {user?.role === 'ADMIN' && (
          <SummaryCard label="KULLANICILAR" value={displayStats.totalUsers} accent="text-green" borderColor="border-green" to="/users" />
        )}
      </div>

      {/* Demirbaş durum çubuğu */}
      <AssetStatusBar stats={displayStats} />

      {isWarehouseScoped && (
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-pixel text-muted" style={{ fontSize: '9px' }}>DEPO STOK — {user?.warehouseName ?? 'DEPO'}</span>
            <Link to="/inventory" className="font-pixel text-accent hover:text-text-primary transition-colors" style={{ fontSize: '8px' }}>
              STOK GİRİŞİ →
            </Link>
          </div>
          {stockLoading
            ? <p className="text-muted font-vt text-xl">Yükleniyor...</p>
            : warehouseStock.length === 0
              ? <p className="text-muted font-vt text-lg">Bu depoda stok bulunamadı.</p>
              : <DataTable columns={stockColumns} data={warehouseStock} rowKey={(stock) => stock.productId} />
          }
        </div>
      )}

      {/* Hızlı erişim */}
      <div className="card flex flex-col gap-4">
        <span className="font-pixel text-muted" style={{ fontSize: '9px' }}>HIZLI ERİŞİM</span>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center justify-between px-4 py-3 border border-border hover:border-accent hover:bg-bg-panel transition-colors duration-150 group"
            >
              <span className="font-pixel text-text-primary group-hover:text-accent transition-colors" style={{ fontSize: '9px' }}>
                {link.label}
              </span>
              <span className="font-vt text-muted text-lg group-hover:text-text-primary transition-colors">
                {link.desc}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
