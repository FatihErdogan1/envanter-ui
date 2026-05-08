import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';
import type { Category } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

type FormData = { name: string; description: string };
const blank: FormData = { name: '', description: '' };

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { canManageOperations } = useAuth();
  const [selected, setSelected] = useState<Category | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<FormData>(blank);
  const [apiError, setApiError] = useState('');

  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories().then(r => r.data) });
  const refetch = () => qc.invalidateQueries({ queryKey: ['categories'] });
  const addMut  = useMutation({ mutationFn: (d: FormData) => createCategory(d), onSuccess: () => { refetch(); setModal(null); } });
  const editMut = useMutation({ mutationFn: (d: FormData) => updateCategory(selected!.id, d), onSuccess: () => { refetch(); setModal(null); } });
  const delMut  = useMutation({ mutationFn: (id: number) => deleteCategory(id), onSuccess: refetch });

  const submit = async () => {
    setApiError('');
    try {
      if (modal === 'add') await addMut.mutateAsync(form);
      else await editMut.mutateAsync(form);
    } catch (e: unknown) { setApiError((e as {response?:{data?:string}}).response?.data ?? 'Hata oluştu.'); }
  };

  const columns: Column<Category>[] = [
    { key: 'name',        header: 'KATEGORİ ADI' },
    { key: 'description', header: 'AÇIKLAMA' },
  ];

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader title="KATEGORİLER">
        {canManageOperations && (
          <>
            <Button onClick={() => { setForm(blank); setApiError(''); setModal('add'); }}>+ EKLE</Button>
            <Button variant="secondary" onClick={() => { if (selected) { setForm({ name: selected.name, description: selected.description }); setApiError(''); setModal('edit'); } }} disabled={!selected}>DÜZENLE</Button>
            <Button variant="danger" onClick={() => { if (selected && confirm('Silinsin mi?')) { delMut.mutate(selected.id); setSelected(null); } }} disabled={!selected}>SİL</Button>
          </>
        )}
      </PageHeader>

      <DataTable columns={columns} data={categories} rowKey={c => c.id} onRowClick={setSelected} selectedId={selected?.id} />

      {modal && (
        <Modal title={modal === 'add' ? 'KATEGORİ EKLE' : 'KATEGORİ DÜZENLE'} onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button><Button onClick={submit}>KAYDET</Button></>}>
          <div className="flex flex-col gap-3">
            <Input label="KATEGORİ ADI" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input label="AÇIKLAMA" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            {apiError && <p className="text-red font-vt">{apiError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
