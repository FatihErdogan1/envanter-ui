import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../api';
import type { Warehouse } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

type FormData = { name: string; location: string };
const blank: FormData = { name: '', location: '' };

export default function WarehousesPage() {
  const qc = useQueryClient();
  const { canManageOperations } = useAuth();
  const [selected, setSelected] = useState<Warehouse | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<FormData>(blank);
  const [apiError, setApiError] = useState('');

  const { data: warehouses = [], isLoading } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses().then(r => r.data) });
  const refetch = () => qc.invalidateQueries({ queryKey: ['warehouses'] });
  const addMut  = useMutation({ mutationFn: (d: FormData) => createWarehouse(d), onSuccess: () => { refetch(); setModal(null); } });
  const editMut = useMutation({ mutationFn: (d: FormData) => updateWarehouse(selected!.id, d), onSuccess: () => { refetch(); setModal(null); } });
  const delMut  = useMutation({ mutationFn: (id: number) => deleteWarehouse(id), onSuccess: refetch });

  const submit = async () => {
    setApiError('');
    try {
      if (modal === 'add') await addMut.mutateAsync(form);
      else await editMut.mutateAsync(form);
    } catch (e: unknown) { setApiError((e as {response?:{data?:string}}).response?.data ?? 'Hata oluştu.'); }
  };

  const columns: Column<Warehouse>[] = [
    { key: 'name',     header: 'DEPO ADI' },
    { key: 'location', header: 'KONUM' },
  ];

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader title="DEPOLAR">
        {canManageOperations && (
          <>
            <Button onClick={() => { setForm(blank); setApiError(''); setModal('add'); }}>+ EKLE</Button>
            <Button variant="secondary" onClick={() => { if (selected) { setForm({ name: selected.name, location: selected.location }); setApiError(''); setModal('edit'); } }} disabled={!selected}>DÜZENLE</Button>
            <Button variant="danger" onClick={() => { if (selected && confirm('Silinsin mi?')) { delMut.mutate(selected.id); setSelected(null); } }} disabled={!selected}>SİL</Button>
          </>
        )}
      </PageHeader>

      <DataTable columns={columns} data={warehouses} rowKey={w => w.id} onRowClick={setSelected} selectedId={selected?.id} />

      {modal && (
        <Modal title={modal === 'add' ? 'DEPO EKLE' : 'DEPO DÜZENLE'} onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button><Button onClick={submit}>KAYDET</Button></>}>
          <div className="flex flex-col gap-3">
            <Input label="DEPO ADI" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input label="KONUM" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            {apiError && <p className="text-red font-vt">{apiError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
