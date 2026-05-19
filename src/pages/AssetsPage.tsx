import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAssets, createAsset, deleteAsset,
  getAssetAssignments, getAssetMaintenance,
  assignAsset, returnAsset, retireAsset, startAssetMaintenance, endAssetMaintenance,
  getSuppliers, getWarehouses, getAssignableUsers
} from '../api';
import { extractApiError } from '../utils/errorUtils';
import type { Asset, AssetAssignment, AssetMaintenance, AssetStatus } from '../types';

type Notification = { type: 'success' | 'error'; message: string };
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import SearchInput from '../components/ui/SearchInput';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Trash2 } from 'lucide-react';

export default function AssetsPage() {
  const qc = useQueryClient();
  const { canManageOperations, user, isAdmin } = useAuth();
  const [tab, setTab] = useState<'assets' | 'history' | 'maintenance'>('assets');
  const [selected, setSelected] = useState<Asset | null>(null);
  const [modal, setModal] = useState<'add' | 'actions' | null>(null);
  const [action, setAction] = useState<'assign' | 'maintenance' | null>(null);
  const [form, setForm] = useState({ serialNumber: '', name: '', supplierId: '', warehouseId: '' });
  const [assignForm, setAssignForm] = useState({ userId: '', notes: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ description: '', notes: '' });
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);

  const refetchAssets = () => qc.invalidateQueries({ queryKey: ['assets'] });

  const { data: assets = [], isLoading, isError } = useQuery({ queryKey: ['assets'], queryFn: () => getAssets().then(r => r.data) });
  const scopedAssets = useMemo(() => (
    isAdmin ? assets : assets.filter(a => a.warehouse?.id === user?.warehouseId)
  ), [assets, isAdmin, user?.warehouseId]);
  const filteredAssets = useMemo(() => {
    const q = search.toLowerCase();
    return q ? scopedAssets.filter(a =>
      a.serialNumber.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.assignedToUsername ?? '').toLowerCase().includes(q) ||
      (a.supplier?.name ?? '').toLowerCase().includes(q) ||
      (a.warehouse?.name ?? '').toLowerCase().includes(q)
    ) : scopedAssets;
  }, [scopedAssets, search]);
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => getSuppliers().then(r => r.data) });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses().then(r => r.data) });
  const { data: users = [], error: usersError } = useQuery({ queryKey: ['assignable-users'], queryFn: () => getAssignableUsers().then(r => r.data) });

  const visibleWarehouses = isAdmin ? warehouses : warehouses.filter(w => w.id === user?.warehouseId);

  const { data: history = [] } = useQuery({
    queryKey: ['asset-assignments', selected?.id],
    queryFn: () => selected ? getAssetAssignments(selected.id).then(r => r.data) : Promise.resolve([]),
    enabled: !!selected && tab === 'history',
  });

  const { data: maintenanceHistory = [] } = useQuery({
    queryKey: ['asset-maintenance', selected?.id],
    queryFn: () => selected ? getAssetMaintenance(selected.id).then(r => r.data) : Promise.resolve([]),
    enabled: !!selected && tab === 'maintenance',
  });

  const addMut    = useMutation({ mutationFn: (d: object) => createAsset(d), onSuccess: () => { refetchAssets(); setModal(null); } });
  const assignMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { userId: number; notes?: string } }) => assignAsset(id, data),
    onSuccess: () => { refetchAssets(); qc.invalidateQueries({ queryKey: ['asset-assignments'] }); setModal(null); setAction(null); },
  });
  const returnMut = useMutation({
    mutationFn: (id: number) => returnAsset(id),
    onSuccess: () => { refetchAssets(); qc.invalidateQueries({ queryKey: ['asset-assignments'] }); setModal(null); setAction(null); },
  });
  const retireMut = useMutation({
    mutationFn: (id: number) => retireAsset(id),
    onSuccess: () => { refetchAssets(); setModal(null); setAction(null); },
  });
  const startMaintenanceMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { description: string; notes?: string } }) => startAssetMaintenance(id, data),
    onSuccess: () => { refetchAssets(); qc.invalidateQueries({ queryKey: ['asset-maintenance'] }); setModal(null); setAction(null); },
  });
  const endMaintenanceMut = useMutation({
    mutationFn: (id: number) => endAssetMaintenance(id),
    onSuccess: () => { refetchAssets(); qc.invalidateQueries({ queryKey: ['asset-maintenance'] }); setModal(null); setAction(null); },
  });
  const delMut = useMutation({
    mutationFn: (id: number) => deleteAsset(id),
    onSuccess: () => { refetchAssets(); setSelected(null); setNotification({ type: 'success', message: 'Demirbaş başarıyla silindi.' }); },
    onError: (e: unknown) => { setNotification({ type: 'error', message: extractApiError(e, 'Demirbaş silinemedi.') }); },
  });

  const assignableUsers = users.filter(u =>
    u.role !== 'ADMIN' && u.active && u.warehouse?.id === selected?.warehouse?.id
  );

  const openActionsFor = (asset: Asset) => {
    setSelected(asset);
    setAction(null);
    setAssignForm({ userId: '', notes: '' });
    setMaintenanceForm({ description: '', notes: '' });
    setApiError('');
    setModal('actions');
  };

  const handleDelete = (asset: Asset) => {
    if (!confirm(`"${asset.name}" demirbaşı silinsin mi?`)) return;
    setNotification(null);
    delMut.mutate(asset.id);
  };

  const assetCols: Column<Asset>[] = [
    { key: 'serialNumber',       header: 'SERİ NO' },
    { key: 'name',               header: 'DEMİRBAŞ ADI' },
    { key: 'status',             header: 'DURUM',      render: a => <StatusBadge status={a.status as AssetStatus} /> },
    { key: 'assignedToUsername', header: 'ZİMMETLİ',   render: a => a.assignedToUsername ? <span className="text-yellow">{a.assignedToUsername}</span> : <span className="text-muted">—</span> },
    { key: 'supplier',           header: 'TEDARİKÇİ',  render: a => a.supplier?.name ?? '-' },
    { key: 'warehouse',          header: 'DEPO',        render: a => a.warehouse?.name ?? '-' },
    ...(canManageOperations ? [{
      key: 'actions' as keyof Asset,
      header: '',
      render: (a: Asset) => (
        <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
          <button title="İşlemler" aria-label="İşlemler" onClick={() => openActionsFor(a)}
            className="p-1.5 border border-accent text-accent hover:bg-accent hover:text-bg-primary transition-colors cursor-pointer">
            <ClipboardList size={14} />
          </button>
          <button title="Sil" aria-label="Sil" onClick={() => handleDelete(a)}
            className="p-1.5 border border-red text-red hover:bg-red hover:text-bg-primary transition-colors cursor-pointer">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    }] : []),
  ];

  const historyCols: Column<AssetAssignment>[] = [
    { key: 'user',         header: 'KULLANICI',     render: a => a.user?.username ?? '-' },
    { key: 'assignedDate', header: 'ZİMMET TARİHİ', render: a => a.assignedDate?.split('T')[0] ?? '-' },
    { key: 'returnDate',   header: 'İADE TARİHİ',   render: a => a.returnDate ? a.returnDate.split('T')[0] : <span className="text-yellow">Aktif</span> },
    { key: 'notes',        header: 'NOTLAR' },
  ];

  const maintenanceCols: Column<AssetMaintenance>[] = [
    { key: 'description', header: 'AÇIKLAMA' },
    { key: 'startDate',   header: 'BAŞLANGIÇ',  render: m => m.startDate?.split('T')[0] ?? '-' },
    { key: 'endDate',     header: 'BİTİŞ',      render: m => m.endDate ? m.endDate.split('T')[0] : <span className="text-yellow">Devam ediyor</span> },
    { key: 'notes',       header: 'NOTLAR',     render: m => m.notes ?? '-' },
  ];

  const submitAdd = async () => {
    setApiError('');
    if (!form.warehouseId) { setApiError('Depo seçilmelidir.'); return; }
    try {
      await addMut.mutateAsync({
        serialNumber: form.serialNumber,
        name: form.name,
        warehouse: { id: parseInt(form.warehouseId) },
        ...(form.supplierId ? { supplier: { id: parseInt(form.supplierId) } } : {}),
      });
    } catch (e: unknown) { setApiError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.'); }
  };

  const submitAssign = async () => {
    setApiError('');
    try {
      await assignMut.mutateAsync({ id: selected!.id, data: { userId: parseInt(assignForm.userId), notes: assignForm.notes } });
    } catch (e: unknown) { setApiError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.'); }
  };

  const submitMaintenance = async () => {
    if (!selected) return;
    setApiError('');
    try {
      await startMaintenanceMut.mutateAsync({ id: selected.id, data: maintenanceForm });
    } catch (e: unknown) { setApiError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.'); }
  };

  const handleReturn = async () => {
    if (!selected) return;
    setApiError('');
    try {
      await returnMut.mutateAsync(selected.id);
    } catch (e: unknown) { setApiError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.'); }
  };

  const handleRetire = async () => {
    if (!selected) return;
    if (!confirm('Demirbaş hurdaya ayrılsın mı?')) return;
    setApiError('');
    try {
      await retireMut.mutateAsync(selected.id);
    } catch (e: unknown) { setApiError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.'); }
  };

  const handleEndMaintenance = async () => {
    if (!selected) return;
    setApiError('');
    try {
      await endMaintenanceMut.mutateAsync(selected.id);
    } catch (e: unknown) { setApiError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.'); }
  };

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;
  if (isError)   return <p className="text-red font-vt text-xl">Demirbaşlar yüklenemedi. Lütfen tekrar deneyin.</p>;

  const tabs = [
    { key: 'assets',      label: 'DEMİRBAŞLAR' },
    { key: 'history',     label: selected ? `ZİMMET GEÇMİŞİ — ${selected.serialNumber}` : 'ZİMMET GEÇMİŞİ' },
    { key: 'maintenance', label: selected ? `BAKIM GEÇMİŞİ — ${selected.serialNumber}`  : 'BAKIM GEÇMİŞİ' },
  ] as const;

  return (
    <div>
      <PageHeader title="DEMİRBAŞLAR" search={<SearchInput value={search} onChange={setSearch} />}>
        {canManageOperations && (
          <Button onClick={() => { setForm({ serialNumber: '', name: '', supplierId: '', warehouseId: '' }); setApiError(''); setModal('add'); }}>+ EKLE</Button>
        )}
      </PageHeader>

      {notification && (
        <div className={`flex items-center justify-between p-3 mb-4 border font-vt text-lg ${
          notification.type === 'error' ? 'border-red text-red' : 'border-green text-green'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-4 opacity-60 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      <div className="flex gap-0 mb-4 border-b border-border">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`font-pixel text-xs px-4 py-2 border-b-2 transition-colors ${tab === t.key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'assets' && (
        <DataTable columns={assetCols} data={filteredAssets} rowKey={a => a.id} onRowClick={a => { setSelected(a); setTab('assets'); }} selectedId={selected?.id} />
      )}
      {tab === 'history' && !selected && (
        <p className="text-muted font-vt text-xl">Geçmişi görüntülemek için önce bir demirbaş seçin.</p>
      )}
      {tab === 'history' && selected && (
        <DataTable columns={historyCols} data={history} rowKey={a => a.id} emptyText="Bu demirbaş için zimmet kaydı bulunamadı." />
      )}
      {tab === 'maintenance' && !selected && (
        <p className="text-muted font-vt text-xl">Geçmişi görüntülemek için önce bir demirbaş seçin.</p>
      )}
      {tab === 'maintenance' && selected && (
        <DataTable columns={maintenanceCols} data={maintenanceHistory} rowKey={m => m.id} emptyText="Bu demirbaş için bakım kaydı bulunamadı." />
      )}

      {modal === 'add' && (
        <Modal title="DEMİRBAŞ EKLE" onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button><Button onClick={submitAdd}>KAYDET</Button></>}>
          <div className="flex flex-col gap-3">
            <Input label="SERİ NO" value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} />
            <Input label="DEMIRBAŞ ADI" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            {[{ k: 'supplierId', label: 'TEDARİKÇİ', items: suppliers }, { k: 'warehouseId', label: 'DEPO', items: visibleWarehouses }].map(({ k, label, items }) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-muted font-pixel text-xs">{label}</label>
                <select className="input-field" value={form[k as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}>
                  <option value="">Seçin...</option>
                  {items.map((i: { id: number; name: string }) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            ))}
            {apiError && <p className="text-red font-vt">{apiError}</p>}
          </div>
        </Modal>
      )}

      {modal === 'actions' && selected && (
        <Modal title="DEMİRBAŞ İŞLEMLERİ" onClose={() => { setModal(null); setAction(null); }}
          footer={<Button variant="secondary" onClick={() => { setModal(null); setAction(null); }}>KAPAT</Button>}>
          <div className="flex flex-col gap-4">
            <div className="border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-pixel text-xs text-accent mb-2">{selected.serialNumber}</p>
                  <p className="font-vt text-xl text-text-primary">{selected.name}</p>
                  <p className="font-vt text-lg text-muted">{selected.warehouse?.name ?? '-'} / {selected.supplier?.name ?? '-'}</p>
                </div>
                <StatusBadge status={selected.status as AssetStatus} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="info" onClick={() => setAction('assign')} disabled={selected.status !== 'AVAILABLE'}>ZİMMETE AL</Button>
              <Button variant="success" onClick={handleReturn} disabled={selected.status !== 'IN_USE'}>ZİMMET DÜŞÜR</Button>
              <Button variant="warning" onClick={() => setAction('maintenance')} disabled={selected.status !== 'AVAILABLE'}>BAKIMA AL</Button>
              <Button variant="success" onClick={handleEndMaintenance} disabled={selected.status !== 'MAINTENANCE'}>BAKIMI BİTİR</Button>
              <Button variant="danger" onClick={handleRetire} disabled={selected.status === 'IN_USE' || selected.status === 'RETIRED'}>HURDAYA AYIR</Button>
            </div>

            {action === 'assign' && (
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <div className="flex flex-col gap-1">
                  <label className="text-muted font-pixel text-xs">KULLANICI</label>
                  <select className="input-field" value={assignForm.userId} onChange={e => setAssignForm(p => ({ ...p, userId: e.target.value }))}>
                    <option value="">Seçin...</option>
                    {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                  </select>
                </div>
                {usersError && <p className="text-red font-vt">Kullanıcı listesi alınamadı.</p>}
                {!usersError && assignableUsers.length === 0 && <p className="text-yellow font-vt">Bu depoda zimmetlenebilir aktif kullanıcı bulunamadı.</p>}
                <Input label="NOTLAR" value={assignForm.notes} onChange={e => setAssignForm(p => ({ ...p, notes: e.target.value }))} />
                <Button variant="info" onClick={submitAssign} disabled={!assignForm.userId}>ZİMMETLE</Button>
              </div>
            )}

            {action === 'maintenance' && (
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <Input label="BAKIM AÇIKLAMASI" value={maintenanceForm.description} onChange={e => setMaintenanceForm(p => ({ ...p, description: e.target.value }))} />
                <Input label="NOTLAR" value={maintenanceForm.notes} onChange={e => setMaintenanceForm(p => ({ ...p, notes: e.target.value }))} />
                <Button variant="warning" onClick={submitMaintenance}>BAKIMA AL</Button>
              </div>
            )}

            {apiError && <p className="text-red font-vt">{apiError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
