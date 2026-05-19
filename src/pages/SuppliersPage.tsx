import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api';
import type { Supplier } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SearchInput from '../components/ui/SearchInput';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../utils/errorUtils';
import { Pencil, Trash2 } from 'lucide-react';

type FormData = { name: string; email: string; phone: string; address: string };
type Notification = { type: 'success' | 'error'; message: string };
const blank: FormData = { name: '', email: '', phone: '', address: '' };

export default function SuppliersPage() {
  const qc = useQueryClient();
  const { canManageOperations } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<FormData>(blank);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers().then(r => r.data),
  });
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      (s.address ?? '').toLowerCase().includes(q)
    ) : suppliers;
  }, [suppliers, search]);

  const refetch = () => qc.invalidateQueries({ queryKey: ['suppliers'] });
  const addMut  = useMutation({ mutationFn: (d: FormData) => createSupplier(d), onSuccess: () => { refetch(); setModal(null); } });
  const editMut = useMutation({ mutationFn: (d: FormData) => updateSupplier(editingId!, d), onSuccess: () => { refetch(); setModal(null); } });
  const delMut  = useMutation({
    mutationFn: (id: number) => deleteSupplier(id),
    onSuccess: () => { refetch(); setNotification({ type: 'success', message: 'Tedarikçi başarıyla silindi.' }); },
    onError: (e: unknown) => {
      setNotification({ type: 'error', message: extractApiError(e, 'Tedarikçi silinemedi.') });
    },
  });

  const isDuplicatePhone = (excludeId?: number) => {
    const trimmed = form.phone.trim();
    if (!trimmed) return false;
    return suppliers.some(s => {
      if (excludeId !== undefined && s.id === excludeId) return false;
      return s.phone.trim() === trimmed;
    });
  };

  const submit = async () => {
    setFormError('');
    if (!form.name.trim()) { setFormError('Tedarikçi adı zorunludur.'); return; }
    if (!form.phone.trim()) { setFormError('Telefon numarası zorunludur.'); return; }
    if (isDuplicatePhone(editingId ?? undefined)) { setFormError('Bu telefon numarası zaten kayıtlı.'); return; }
    try {
      if (modal === 'add') await addMut.mutateAsync(form);
      else await editMut.mutateAsync(form);
    } catch (e: unknown) {
      setFormError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.');
    }
  };

  const openEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setForm({ name: supplier.name, email: supplier.email, phone: supplier.phone, address: supplier.address ?? '' });
    setFormError('');
    setModal('edit');
  };

  const handleDelete = (id: number) => {
    if (!confirm('Bu tedarikçi silinsin mi?')) return;
    setNotification(null);
    delMut.mutate(id);
  };

  const actionColumn: Column<Supplier> = {
    key: 'actions',
    header: '',
    render: (s) => (
      <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
        <button title="Düzenle" aria-label="Düzenle" onClick={() => openEdit(s)}
          className="p-1.5 border border-accent text-accent hover:bg-accent hover:text-bg-primary transition-colors cursor-pointer">
          <Pencil size={14} />
        </button>
        <button title="Sil" aria-label="Sil" onClick={() => handleDelete(s.id)}
          className="p-1.5 border border-red text-red hover:bg-red hover:text-bg-primary transition-colors cursor-pointer">
          <Trash2 size={14} />
        </button>
      </div>
    ),
  };

  const columns: Column<Supplier>[] = [
    { key: 'name',    header: 'TEDARİKÇİ ADI' },
    { key: 'email',   header: 'E-POSTA' },
    { key: 'phone',   header: 'TELEFON' },
    { key: 'address', header: 'ADRES' },
    ...(canManageOperations ? [actionColumn] : []),
  ];

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader title="TEDARİKÇİLER" search={<SearchInput value={search} onChange={setSearch} />}>
        {canManageOperations && (
          <Button onClick={() => { setForm(blank); setFormError(''); setModal('add'); }}>+ EKLE</Button>
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

      <DataTable columns={columns} data={filtered} rowKey={s => s.id} />

      {modal && (
        <Modal
          title={modal === 'add' ? 'TEDARİKÇİ EKLE' : 'TEDARİKÇİ DÜZENLE'}
          onClose={() => setModal(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button>
              <Button onClick={submit}>KAYDET</Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <Input label="TEDARİKÇİ ADI *" value={form.name}    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input label="E-POSTA" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <Input label="TELEFON *" value={form.phone} onChange={e => { setFormError(''); setForm(p => ({ ...p, phone: e.target.value })); }} />
            <Input label="ADRES" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            {formError && <p className="text-red font-vt text-base">{formError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
