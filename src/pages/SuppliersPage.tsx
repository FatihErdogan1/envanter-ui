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

type FormData = { name: string; email: string; phone: string; address: string };
const blank: FormData = { name: '', email: '', phone: '', address: '' };

export default function SuppliersPage() {
  const qc = useQueryClient();
  const { canManageOperations } = useAuth();
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<FormData>(blank);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

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
  const editMut = useMutation({ mutationFn: (d: FormData) => updateSupplier(selected!.id, d), onSuccess: () => { refetch(); setModal(null); } });
  const delMut  = useMutation({ mutationFn: (id: number) => deleteSupplier(id), onSuccess: refetch });

  const isDuplicatePhone = () => {
    const trimmed = form.phone.trim();
    if (!trimmed) return false;
    return suppliers.some(s => {
      if (modal === 'edit' && s.id === selected?.id) return false;
      return s.phone.trim() === trimmed;
    });
  };

  const submit = async () => {
    setFormError('');
    if (!form.name.trim()) { setFormError('Tedarikçi adı zorunludur.'); return; }
    if (!form.phone.trim()) { setFormError('Telefon numarası zorunludur.'); return; }
    if (isDuplicatePhone()) { setFormError('Bu telefon numarası zaten kayıtlı.'); return; }
    try {
      if (modal === 'add') await addMut.mutateAsync(form);
      else await editMut.mutateAsync(form);
    } catch (e: unknown) {
      setFormError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.');
    }
  };

  const openEdit = () => {
    if (!selected) return;
    setForm({
      name: selected.name,
      email: selected.email,
      phone: selected.phone,
      address: selected.address ?? '',
    });
    setFormError('');
    setModal('edit');
  };

  const columns: Column<Supplier>[] = [
    { key: 'name',    header: 'TEDARİKÇİ ADI' },
    { key: 'email',   header: 'E-POSTA' },
    { key: 'phone',   header: 'TELEFON' },
    { key: 'address', header: 'ADRES' },
  ];

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader title="TEDARİKÇİLER" search={<SearchInput value={search} onChange={setSearch} />}>
        {canManageOperations && (
          <>
            <Button onClick={() => { setForm(blank); setFormError(''); setModal('add'); }}>+ EKLE</Button>
            <Button variant="secondary" onClick={openEdit} disabled={!selected}>DÜZENLE</Button>
            <Button
              variant="danger"
              onClick={() => { if (selected && confirm('Silinsin mi?')) { delMut.mutate(selected.id); setSelected(null); } }}
              disabled={!selected}
            >
              SİL
            </Button>
          </>
        )}
      </PageHeader>

      <DataTable columns={columns} data={filtered} rowKey={s => s.id} onRowClick={setSelected} selectedId={selected?.id} />

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
            <Input label="TEDARİKÇİ ADI *"  value={form.name}  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input label="E-POSTA" type="email" value={form.email}      onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <Input
              label="TELEFON *"
              value={form.phone}
              onChange={e => { setFormError(''); setForm(p => ({ ...p, phone: e.target.value })); }}
            />
            <Input label="ADRES"             value={form.address}       onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            {formError && <p className="text-red font-vt text-base">{formError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
