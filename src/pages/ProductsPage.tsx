import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../api';
import type { Product } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

type FormData = { name: string; sku: string; price: string; quantityInStock: string; categoryId: string };
const blank: FormData = { name: '', sku: '', price: '', quantityInStock: '', categoryId: '' };

export default function ProductsPage() {
  const qc = useQueryClient();
  const { canManageOperations } = useAuth();
  const [selected, setSelected] = useState<Product | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<FormData>(blank);
  const [apiError, setApiError] = useState('');

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: () => getProducts().then(r => r.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories().then(r => r.data) });

  const refetch = () => qc.invalidateQueries({ queryKey: ['products'] });
  const addMut  = useMutation({ mutationFn: (d: object) => createProduct(d), onSuccess: () => { refetch(); setModal(null); } });
  const editMut = useMutation({ mutationFn: (d: object) => updateProduct(selected!.id, d), onSuccess: () => { refetch(); setModal(null); } });
  const delMut  = useMutation({ mutationFn: (id: number) => deleteProduct(id), onSuccess: refetch });

  const openAdd = () => { setForm(blank); setApiError(''); setModal('add'); };
  const openEdit = () => {
    if (!selected) return;
    setForm({ name: selected.name, sku: selected.sku, price: String(selected.price), quantityInStock: String(selected.quantityInStock), categoryId: String(selected.category?.id ?? '') });
    setApiError('');
    setModal('edit');
  };

  const payload = () => ({
    name: form.name,
    sku: form.sku,
    price: parseFloat(form.price),
    quantityInStock: parseInt(form.quantityInStock),
    category: { id: parseInt(form.categoryId) },
  });

  const submit = async () => {
    setApiError('');
    try {
      if (modal === 'add') await addMut.mutateAsync(payload());
      else await editMut.mutateAsync(payload());
    } catch (e: unknown) { setApiError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.'); }
  };

  const f = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const columns: Column<Product>[] = [
    { key: 'name',            header: 'ÜRÜN ADI' },
    { key: 'sku',             header: 'SKU' },
    { key: 'price',           header: 'FİYAT',   render: p => `₺${p.price.toFixed(2)}` },
    { key: 'quantityInStock', header: 'STOK' },
    { key: 'category',        header: 'KATEGORİ', render: p => p.category?.name ?? '-' },
  ];

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader title="ÜRÜNLER">
        {canManageOperations && (
          <>
            <Button onClick={openAdd}>+ EKLE</Button>
            <Button variant="secondary" onClick={openEdit} disabled={!selected}>DÜZENLE</Button>
            <Button variant="danger" onClick={() => { if (selected && confirm('Silinsin mi?')) { delMut.mutate(selected.id); setSelected(null); } }} disabled={!selected}>SİL</Button>
          </>
        )}
      </PageHeader>

      <DataTable columns={columns} data={products} rowKey={p => p.id} onRowClick={setSelected} selectedId={selected?.id} />

      {modal && (
        <Modal title={modal === 'add' ? 'ÜRÜN EKLE' : 'ÜRÜN DÜZENLE'} onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button><Button onClick={submit}>KAYDET</Button></>}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="ÜRÜN ADI" value={form.name} onChange={f('name')} className="col-span-2" />
            <Input label="SKU" value={form.sku} onChange={f('sku')} />
            <Input label="FİYAT (₺)" type="number" value={form.price} onChange={f('price')} />
            <Input label="STOK MİKTARI" type="number" value={form.quantityInStock} onChange={f('quantityInStock')} />
            <div className="flex flex-col gap-1">
              <label className="text-muted font-pixel text-xs">KATEGORİ</label>
              <select className="input-field" value={form.categoryId} onChange={f('categoryId')}>
                <option value="">Seçin...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {apiError && <p className="text-red font-vt col-span-2">{apiError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
