import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, getWarehouseStock } from '../api';
import type { Warehouse, WarehouseStockItem } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SearchInput from '../components/ui/SearchInput';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

type FormData = { name: string; locationAddress: string };
const blank: FormData = { name: '', locationAddress: '' };

export default function WarehousesPage() {
  const qc = useQueryClient();
  const { canManageOperations } = useAuth();
  const [selected, setSelected] = useState<Warehouse | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [stockWarehouse, setStockWarehouse] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<FormData>(blank);
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');

  const { data: warehouses = [], isLoading } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses().then(r => r.data) });
  const { data: stockItems = [], isLoading: stockLoading } = useQuery<WarehouseStockItem[]>({
    queryKey: ['warehouse-stock', stockWarehouse?.id],
    queryFn: () => getWarehouseStock(stockWarehouse!.id).then(r => r.data),
    enabled: stockWarehouse !== null,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? warehouses.filter(w =>
      w.name.toLowerCase().includes(q) ||
      (w.locationAddress ?? '').toLowerCase().includes(q)
    ) : warehouses;
  }, [warehouses, search]);

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

  const stockColumns: Column<WarehouseStockItem>[] = [
    { key: 'productName', header: 'ÜRÜN ADI' },
    { key: 'sku',         header: 'SKU' },
    { key: 'quantity',    header: 'MİKTAR' },
  ];

  const columns: Column<Warehouse>[] = [
    { key: 'name',            header: 'DEPO ADI' },
    { key: 'locationAddress', header: 'KONUM' },
  ];

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader title="DEPOLAR" search={<SearchInput value={search} onChange={setSearch} />}>
        <Button variant="secondary" onClick={() => { if (selected) setStockWarehouse(selected); }} disabled={!selected}>STOK</Button>
        {canManageOperations && (
          <>
            <Button onClick={() => { setForm(blank); setApiError(''); setModal('add'); }}>+ EKLE</Button>
            <Button variant="secondary" onClick={() => { if (selected) { setForm({ name: selected.name, locationAddress: selected.locationAddress }); setApiError(''); setModal('edit'); } }} disabled={!selected}>DÜZENLE</Button>
            <Button variant="danger" onClick={() => { if (selected && confirm('Silinsin mi?')) { delMut.mutate(selected.id); setSelected(null); } }} disabled={!selected}>SİL</Button>
          </>
        )}
      </PageHeader>

      <DataTable columns={columns} data={filtered} rowKey={w => w.id} onRowClick={setSelected} selectedId={selected?.id} />

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

      {stockWarehouse && (
        <Modal title={`STOK — ${stockWarehouse.name}`} onClose={() => setStockWarehouse(null)}
          footer={<Button variant="secondary" onClick={() => setStockWarehouse(null)}>KAPAT</Button>}>
          {stockLoading
            ? <p className="text-muted font-vt text-xl">Yükleniyor...</p>
            : stockItems.length === 0
              ? <p className="text-muted font-vt text-lg">Bu depoda stok bulunamadı.</p>
              : <DataTable columns={stockColumns} data={stockItems} rowKey={s => s.productId} />
          }
        </Modal>
      )}
    </div>
  );
}
