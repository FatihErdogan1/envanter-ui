import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../api';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats } from '../types';

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
}

function SummaryCard({ label, value, accent, borderColor }: SummaryCardProps) {
  return (
    <div className={`card flex flex-col gap-3 border-t-2 ${borderColor}`}>
      <span className="font-pixel text-muted" style={{ fontSize: '9px' }}>{label}</span>
      <span className={`font-vt text-5xl ${accent}`}>{value}</span>
    </div>
  );
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
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardStats().then((r) => r.data),
  });

  if (isLoading) return <p className="text-muted font-vt text-2xl">Yükleniyor...</p>;
  if (error || !data) return <p className="text-red font-vt text-2xl">Veri yüklenemedi.</p>;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="DASHBOARD" />
      <UserBanner />

      {/* Özet istatistikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="ÜRÜNLER"      value={data.totalProducts}   accent="text-accent"  borderColor="border-accent" />
        <SummaryCard label="DEMİRBAŞLAR"  value={data.totalAssets}     accent="text-blue"    borderColor="border-blue" />
        <SummaryCard label="DEPOLAR"      value={data.totalWarehouses} accent="text-accent2" borderColor="border-accent2" />
        <SummaryCard label="KULLANICILAR" value={data.totalUsers}      accent="text-green"   borderColor="border-green" />
      </div>

      {/* Demirbaş durum çubuğu */}
      <AssetStatusBar stats={data} />

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
