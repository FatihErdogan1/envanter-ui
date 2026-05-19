import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../api';
import type { Warehouse } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SearchInput from '../components/ui/SearchInput';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../utils/errorUtils';
import { Pencil, Trash2 } from 'lucide-react';

type FormData = { name: string; locationAddress: string };
type Notification = { type: 'success' | 'error'; message: string };
const blank: FormData = { name: '', locationAddress: '' };

export default function WarehousesPage() {
  const qc = useQueryClient();
  const { canManageOperations } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<FormData>(blank);
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);

  const { data: warehouses = [], isLoading } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses().then(r => r.data) });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? warehouses.filter(w =>
      w.name.toLowerCase().includes(q) ||
      (w.locationAddress ?? '').toLowerCase().includes(q)
    ) : warehouses;
  }, [warehouses, search]);

  const refetch = () => qc.invalidateQueries({ queryKey: ['warehouses'] });
  const addMut  = useMutation({ mutationFn: (d: FormData) => createWarehouse(d), onSuccess: () => { refetch(); setModal(null); } });
  const editMut = useMutation({ mutationFn: (d: FormData) => updateWarehouse(editingId!, d), onSuccess: () => { refetch(); setModal(null); } });
  const delMut  = useMutation({
    mutationFn: (id: number) => deleteWarehouse(id),
    onSuccess: () => { refetch(); setNotification({ type: 'success', message: 'Depo başarıyla silindi.' }); },
    onError: (e: unknown) => {
      setNotification({ type: 'error', message: extractApiError(e, 'Depo silinemedi.') });
    },
  });

  const submit = async () => {
    setApiError('');
    try {
      if (modal === 'add') await addMut.mutateAsync(form);
      else await editMut.mutateAsync(form);
    } catch (e: unknown) { setApiError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.'); }
  };

  const openEdit = (w: Warehouse) => {
    setEditingId(w.id);
    setForm({ name: w.name, locationAddress: w.locationAddress });
    setApiError('');
    setModal('edit');
  };

  const handleDelete = (id: number) => {
    if (!confirm('Bu depo silinsin mi?')) return;
    setNotification(null);
    delMut.mutate(id);
  };

  const actionColumn: Column<Warehouse> = {
    key: 'actions',
    header: '',
    render: (w) => (
      <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
        {canManageOperations && (
          <>
            <button title="Düzenle" aria-label="Düzenle" onClick={() => openEdit(w)}
              className="p-1.5 border border-accent text-accent hover:bg-accent hover:text-bg-primary transition-colors cursor-pointer">
              <Pencil size={14} />
            </button>
            <button title="Sil" aria-label="Sil" onClick={() => handleDelete(w.id)}
              className="p-1.5 border border-red text-red hover:bg-red hover:text-bg-primary transition-colors cursor-pointer">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    ),
  };

  const columns: Column<Warehouse>[] = [
    { key: 'name',            header: 'DEPO ADI' },
    { key: 'locationAddress', header: 'KONUM' },
    actionColumn,
  ];

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader title="DEPOLAR" search={<SearchInput value={search} onChange={setSearch} />}>
        {canManageOperations && (
          <Button onClick={() => { setForm(blank); setApiError(''); setModal('add'); }}>+ EKLE</Button>
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

      <DataTable columns={columns} data={filtered} rowKey={w => w.id} />

      {modal && (
        <Modal title={modal === 'add' ? 'DEPO EKLE' : 'DEPO DÜZENLE'} onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button><Button onClick={submit}>KAYDET</Button></>}>
          <div className="flex flex-col gap-3">
            <Input label="DEPO ADI" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input label="KONUM" value={form.locationAddress} onChange={e => setForm(p => ({ ...p, locationAddress: e.target.value }))} />
            {apiError && <p className="text-red font-vt">{apiError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
