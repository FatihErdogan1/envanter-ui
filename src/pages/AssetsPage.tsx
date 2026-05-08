import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAssets, createAsset,
  getAssetAssignments, assignAsset, returnAsset, retireAsset, startAssetMaintenance, endAssetMaintenance,
  getSuppliers, getWarehouses, getAssignableUsers
} from '../api';
import type { Asset, AssetAssignment, AssetStatus } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export default function AssetsPage() {
  const qc = useQueryClient();
  const { canManageOperations } = useAuth();
  const [tab, setTab] = useState<'assets' | 'history'>('assets');
  const [selected, setSelected] = useState<Asset | null>(null);
  const [modal, setModal] = useState<'add' | 'actions' | null>(null);
  const [action, setAction] = useState<'assign' | 'maintenance' | null>(null);
  const [form, setForm] = useState({ serialNumber: '', name: '', supplierId: '', warehouseId: '' });
  const [assignForm, setAssignForm] = useState({ userId: '', notes: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({ description: '', notes: '' });
  const [apiError, setApiError] = useState('');

  const refetchAssets = () => qc.invalidateQueries({ queryKey: ['assets'] });

  const { data: assets = [], isLoading } = useQuery({ queryKey: ['assets'], queryFn: () => getAssets().then(r => r.data) });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => getSuppliers().then(r => r.data) });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses().then(r => r.data) });
  const { data: users = [], error: usersError } = useQuery({ queryKey: ['assignable-users'], queryFn: () => getAssignableUsers().then(r => r.data) });
  const { data: history = [] } = useQuery({
    queryKey: ['asset-assignments', selected?.id],
    queryFn: () => selected ? getAssetAssignments(selected.id).then(r => r.data) : Promise.resolve([]),
    enabled: !!selected && tab === 'history',
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
    onSuccess: () => { refetchAssets(); setModal(null); setAction(null); },
  });
  const endMaintenanceMut = useMutation({
    mutationFn: (id: number) => endAssetMaintenance(id),
    onSuccess: () => { refetchAssets(); setModal(null); setAction(null); },
  });

  const assignableUsers = users.filter(u => u.role !== 'ADMIN' && u.active);

  const openActions = () => {
    if (!selected) return;
    setAction(null);
    setAssignForm({ userId: '', notes: '' });
    setMaintenanceForm({ description: '', notes: '' });
    setApiError('');
    setModal('actions');
  };

  const assetCols: Column<Asset>[] = [
    { key: 'serialNumber',       header: 'SERİ NO' },
    { key: 'name',               header: 'DEMİRBAŞ ADI' },
    { key: 'status',             header: 'DURUM',      render: a => <StatusBadge status={a.status as AssetStatus} /> },
    { key: 'assignedToUsername', header: 'ZİMMETLİ',   render: a => a.assignedToUsername ? <span className="text-yellow">{a.assignedToUsername}</span> : <span className="text-muted">—</span> },
    { key: 'supplier',           header: 'TEDARİKÇİ',  render: a => a.supplier?.name ?? '-' },
    { key: 'warehouse',          header: 'DEPO',        render: a => a.warehouse?.name ?? '-' },
  ];

  const historyCols: Column<AssetAssignment>[] = [
    { key: 'user',         header: 'KULLANICI',    render: a => a.user?.username ?? '-' },
    { key: 'assignedDate', header: 'ZİMMET TARİHİ', render: a => a.assignedDate?.split('T')[0] ?? '-' },
    { key: 'returnDate',   header: 'İADE TARİHİ',  render: a => a.returnDate ? a.returnDate.split('T')[0] : <span className="text-yellow">Aktif</span> },
    { key: 'notes',        header: 'NOTLAR' },
  ];

  const submitAdd = async () => {
    setApiError('');
    try {
      await addMut.mutateAsync({
        serialNumber: form.serialNumber, name: form.name,
        supplier: { id: parseInt(form.supplierId) },
        warehouse: { id: parseInt(form.warehouseId) },
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

  return (
    <div>
      <PageHeader title="DEMİRBAŞLAR">
        {canManageOperations && (
          <>
            <Button onClick={() => { setForm({ serialNumber: '', name: '', supplierId: '', warehouseId: '' }); setApiError(''); setModal('add'); }}>+ EKLE</Button>
            <Button variant="secondary" onClick={openActions} disabled={!selected}>İŞLEMLER</Button>
          </>
        )}
      </PageHeader>

      <div className="flex gap-0 mb-4 border-b border-border">
        {(['assets', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`font-pixel text-xs px-4 py-2 border-b-2 transition-colors ${tab === t ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text-primary'}`}>
            {t === 'assets' ? 'DEMİRBAŞLAR' : `ZİMMET GEÇMİŞİ${selected ? ` — ${selected.serialNumber}` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'assets' && (
        <DataTable columns={assetCols} data={assets} rowKey={a => a.id} onRowClick={a => { setSelected(a); setTab('assets'); }} selectedId={selected?.id} />
      )}
      {tab === 'history' && !selected && (
        <p className="text-muted font-vt text-xl">Geçmişi görüntülemek için önce bir demirbaş seçin.</p>
      )}
      {tab === 'history' && selected && (
        <DataTable columns={historyCols} data={history} rowKey={a => a.id} emptyText="Bu demirbaş için zimmet kaydı bulunamadı." />
      )}

      {modal === 'add' && (
        <Modal title="DEMİRBAŞ EKLE" onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button><Button onClick={submitAdd}>KAYDET</Button></>}>
          <div className="flex flex-col gap-3">
            <Input label="SERİ NO" value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))} />
            <Input label="DEMIRBAŞ ADI" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            {[{ k: 'supplierId', label: 'TEDARİKÇİ', items: suppliers }, { k: 'warehouseId', label: 'DEPO', items: warehouses }].map(({ k, label, items }) => (
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
                {usersError && <p className="text-red font-vt">Kullanıcı listesi alınamadı. Backend yeniden başlatılmış ve yetkiniz uygun olmalı.</p>}
                {!usersError && assignableUsers.length === 0 && <p className="text-yellow font-vt">Zimmetlenebilir aktif kullanıcı bulunamadı.</p>}
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
