import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Info, Pencil, Trash2 } from 'lucide-react';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, getSuppliers, getWarehouses,
  getProductStockSummary, getProductSuppliers, getProductTransactionHistory,
} from '../api';
import type { Product, InventoryTransaction } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SearchInput from '../components/ui/SearchInput';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../utils/errorUtils';

const CRITICAL_THRESHOLD = 10;

type FormData = {
  name: string; sku: string; price: string; quantityInStock: string;
  categoryId: string; supplierIds: string[]; warehouseId: string;
};
type Notification = { type: 'success' | 'error'; message: string };
type DetailTab = 'stock' | 'suppliers' | 'history';

const blank: FormData = { name: '', sku: '', price: '', quantityInStock: '0', categoryId: '', supplierIds: [], warehouseId: '' };

export default function ProductsPage() {
  const qc = useQueryClient();
  const { canManageOperations, isAdmin, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<FormData>(blank);
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('stock');

  const lowStockOnly = searchParams.get('lowStock') === 'true';

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: () => getProducts().then(r => r.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories().then(r => r.data) });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => getSuppliers().then(r => r.data) });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses().then(r => r.data) });
  const selectableWarehouses = isAdmin ? warehouses : warehouses.filter(w => w.id === user?.warehouseId);

  // Detail modal queries
  const { data: detailStock = [], isLoading: stockLoading } = useQuery({
    queryKey: ['product-stock', detailProduct?.id],
    queryFn: () => getProductStockSummary(detailProduct!.id).then(r => r.data),
    enabled: !!detailProduct && detailTab === 'stock',
    gcTime: 0,
  });
  const { data: detailSuppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['product-suppliers', detailProduct?.id],
    queryFn: () => getProductSuppliers(detailProduct!.id).then(r => r.data),
    enabled: !!detailProduct && detailTab === 'suppliers',
    gcTime: 0,
  });
  const { data: detailHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['product-history', detailProduct?.id],
    queryFn: () => getProductTransactionHistory(detailProduct!.id).then(r => r.data),
    enabled: !!detailProduct && detailTab === 'history',
    gcTime: 0,
  });

  const filtered = useMemo(() => {
    let list = lowStockOnly ? products.filter(p => p.quantityInStock < CRITICAL_THRESHOLD) : products;
    const q = search.toLowerCase();
    if (q) list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.category?.name ?? '').toLowerCase().includes(q)
    );
    return list;
  }, [products, search, lowStockOnly]);

  const refetch = () => qc.invalidateQueries({ queryKey: ['products'] });
  const addMut  = useMutation({ mutationFn: (d: object) => createProduct(d), onSuccess: () => { refetch(); setModal(null); } });
  const editMut = useMutation({ mutationFn: (d: object) => updateProduct(editingId!, d), onSuccess: () => { refetch(); setModal(null); } });
  const delMut  = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => { refetch(); setNotification({ type: 'success', message: 'Ürün başarıyla silindi.' }); },
    onError: (e: unknown) => { setNotification({ type: 'error', message: extractApiError(e, 'Ürün silinemedi.') }); },
  });

  const openAdd = () => {
    setForm({ ...blank, warehouseId: isAdmin ? '' : String(user?.warehouseId ?? '') });
    setApiError('');
    setModal('add');
  };

  const openEdit = (product: Product) => {
    const canEdit = isAdmin || product.warehouse?.id === user?.warehouseId;
    if (!canEdit) return;
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantityInStock: String(product.quantityInStock),
      categoryId: String(product.category?.id ?? ''),
      supplierIds: product.suppliers?.map(s => String(s.id)) ?? [],
      warehouseId: String(product.warehouse?.id ?? user?.warehouseId ?? ''),
    });
    setApiError('');
    setModal('edit');
  };

  const handleDelete = (product: Product) => {
    const canEdit = isAdmin || product.warehouse?.id === user?.warehouseId;
    if (!canEdit) return;
    if (!confirm('Bu ürün silinsin mi?')) return;
    setNotification(null);
    delMut.mutate(product.id);
  };

  const openDetail = (product: Product) => {
    setDetailProduct(product);
    setDetailTab('stock');
  };

  const addPayload = () => ({
    name: form.name,
    sku: form.sku,
    price: parseFloat(form.price),
    quantityInStock: parseInt(form.quantityInStock) || 0,
    category: { id: parseInt(form.categoryId) },
    suppliers: form.supplierIds.map(id => ({ id: parseInt(id) })),
    warehouse: { id: parseInt(form.warehouseId) },
  });

  const editPayload = () => ({
    name: form.name,
    sku: form.sku,
    price: parseFloat(form.price),
    quantityInStock: parseInt(form.quantityInStock) || 0,
    category: { id: parseInt(form.categoryId) },
  });

  const submit = async () => {
    setApiError('');
    if (!form.categoryId) { setApiError('Kategori seçilmelidir.'); return; }
    if (modal === 'add') {
      if (form.supplierIds.length === 0) { setApiError('En az bir tedarikçi seçilmelidir.'); return; }
      if (!form.warehouseId) { setApiError('Depo seçilmelidir.'); return; }
    }
    try {
      if (modal === 'add') await addMut.mutateAsync(addPayload());
      else await editMut.mutateAsync(editPayload());
    } catch (e: unknown) { setApiError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.'); }
  };

  const f = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const columns: Column<Product>[] = [
    { key: 'name',            header: 'ÜRÜN ADI' },
    { key: 'sku',             header: 'SKU' },
    { key: 'price',           header: 'FİYAT',   render: p => `₺${Number(p.price).toFixed(2)}` },
    { key: 'quantityInStock', header: 'STOK',    render: p => <span className={p.quantityInStock < CRITICAL_THRESHOLD ? 'text-red' : ''}>{p.quantityInStock}</span> },
    { key: 'category',        header: 'KATEGORİ', render: p => p.category?.name ?? '-' },
    {
      key: 'actions',
      header: '',
      render: (p) => {
        const canEdit = isAdmin || p.warehouse?.id === user?.warehouseId;
        return (
          <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
            <button
              title="Detay"
              aria-label="Detay"
              onClick={() => openDetail(p)}
              className="p-1.5 border border-blue text-blue hover:bg-blue hover:text-bg-primary transition-colors cursor-pointer"
            >
              <Info size={14} />
            </button>
            {canManageOperations && (
              <>
                <button
                  title="Düzenle"
                  aria-label="Düzenle"
                  disabled={!canEdit}
                  onClick={() => openEdit(p)}
                  className="p-1.5 border border-accent text-accent hover:bg-accent hover:text-bg-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Pencil size={14} />
                </button>
                <button
                  title="Sil"
                  aria-label="Sil"
                  disabled={!canEdit}
                  onClick={() => handleDelete(p)}
                  className="p-1.5 border border-red text-red hover:bg-red hover:text-bg-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader
        title={lowStockOnly ? 'ÜRÜNLER — KRİTİK STOK' : 'ÜRÜNLER'}
        search={<SearchInput value={search} onChange={setSearch} />}
      >
        {lowStockOnly && (
          <Button variant="secondary" onClick={() => setSearchParams({})}>TÜM ÜRÜNLER</Button>
        )}
        {canManageOperations && (
          <Button onClick={openAdd}>+ EKLE</Button>
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

      <DataTable columns={columns} data={filtered} rowKey={p => p.id} />

      {/* Add / Edit Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'ÜRÜN EKLE' : 'ÜRÜN DÜZENLE'} onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button><Button onClick={submit}>KAYDET</Button></>}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="ÜRÜN ADI" value={form.name} onChange={f('name')} className="col-span-2" />
            <Input label="SKU" value={form.sku} onChange={f('sku')} />
            <Input label="FİYAT (₺)" type="number" min="0" step="0.01" value={form.price} onChange={f('price')} />
            <Input label="STOK MİKTARI" type="number" min="0" step="1" value={form.quantityInStock} onChange={f('quantityInStock')} />
            <div className="flex flex-col gap-1">
              <label className="text-muted font-pixel text-xs">KATEGORİ</label>
              <select className="input-field" value={form.categoryId} onChange={f('categoryId')}>
                <option value="">Seçin...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {modal === 'add' && (
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-muted font-pixel text-xs">TEDARİKÇİLER</label>
                <div className="border border-border bg-bg-panel p-2 max-h-28 overflow-y-auto flex flex-col gap-1">
                  {suppliers.map(s => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer font-vt text-lg text-text-primary hover:text-accent">
                      <input
                        type="checkbox"
                        checked={form.supplierIds.includes(String(s.id))}
                        onChange={e => setForm(p => ({
                          ...p,
                          supplierIds: e.target.checked
                            ? [...p.supplierIds, String(s.id)]
                            : p.supplierIds.filter(id => id !== String(s.id)),
                        }))}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {modal === 'add' && (
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-muted font-pixel text-xs">DEPO *</label>
                <select className="input-field" value={form.warehouseId} onChange={f('warehouseId')}>
                  <option value="">Seçin...</option>
                  {selectableWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}
            {apiError && <p className="text-red font-vt col-span-2">{apiError}</p>}
          </div>
        </Modal>
      )}

      {/* Product Detail Modal */}
      {detailProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={e => { if (e.target === e.currentTarget) setDetailProduct(null); }}
        >
          <div className="bg-bg-surface border border-accent w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div>
                <span className="font-pixel text-accent text-xs">{detailProduct.name}</span>
                <span className="font-vt text-muted text-lg ml-3">{detailProduct.sku}</span>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="text-muted hover:text-red font-pixel text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border shrink-0">
              {([
                { key: 'stock',     label: 'STOK' },
                { key: 'suppliers', label: 'TEDARİKÇİLER' },
                { key: 'history',   label: 'İŞLEM GEÇMİŞİ' },
              ] as { key: DetailTab; label: string }[]).map(t => (
                <button key={t.key} onClick={() => setDetailTab(t.key)}
                  className={`font-pixel text-xs px-4 py-2 border-b-2 transition-colors ${
                    detailTab === t.key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text-primary'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Tab: Stok */}
              {detailTab === 'stock' && (
                stockLoading
                  ? <p className="text-muted font-vt text-xl">Yükleniyor...</p>
                  : detailStock.length === 0
                    ? <p className="text-muted font-vt text-lg">Bu ürüne ait stok kaydı bulunamadı.</p>
                    : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr>
                            <th className="table-header">DEPO ADI</th>
                            <th className="table-header text-right">MİKTAR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailStock.map(s => (
                            <tr key={s.warehouseId} className="border-b border-border hover:bg-bg-panel">
                              <td className="table-cell">{s.warehouseName}</td>
                              <td className="table-cell text-right font-vt text-xl">{s.quantity}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-accent">
                            <td className="table-cell font-pixel text-xs text-accent">TOPLAM</td>
                            <td className="table-cell text-right font-pixel text-xs text-accent">
                              {detailStock.reduce((sum, s) => sum + s.quantity, 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )
              )}

              {/* Tab: Tedarikçiler */}
              {detailTab === 'suppliers' && (
                suppliersLoading
                  ? <p className="text-muted font-vt text-xl">Yükleniyor...</p>
                  : detailSuppliers.length === 0
                    ? <p className="text-muted font-vt text-lg">Bu ürüne bağlı tedarikçi bulunamadı.</p>
                    : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr>
                            <th className="table-header">TEDARİKÇİ ADI</th>
                            <th className="table-header">TELEFON</th>
                            <th className="table-header">E-POSTA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailSuppliers.map(s => (
                            <tr key={s.id} className="border-b border-border hover:bg-bg-panel">
                              <td className="table-cell">{s.name}</td>
                              <td className="table-cell">{s.phone || '-'}</td>
                              <td className="table-cell">{s.email || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
              )}

              {/* Tab: İşlem Geçmişi */}
              {detailTab === 'history' && (
                historyLoading
                  ? <p className="text-muted font-vt text-xl">Yükleniyor...</p>
                  : detailHistory.length === 0
                    ? <p className="text-muted font-vt text-lg">Bu ürüne ait işlem geçmişi bulunamadı.</p>
                    : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr>
                            <th className="table-header">TARİH</th>
                            <th className="table-header">İŞLEM</th>
                            <th className="table-header">DEPO</th>
                            <th className="table-header text-right">MİKTAR</th>
                            <th className="table-header">KİŞİ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailHistory.map(tx => (
                            <tr key={tx.id} className="border-b border-border hover:bg-bg-panel">
                              <td className="table-cell">{tx.transactionDate?.split('T')[0] ?? '-'}</td>
                              <td className="table-cell">
                                <span className={`font-pixel text-xs ${
                                  tx.type === 'IN' ? 'text-green' : tx.type === 'OUT' ? 'text-red' : 'text-yellow'
                                }`}>
                                  {tx.type === 'IN' ? 'Giriş' : tx.type === 'OUT' ? 'Çıkış' : 'Transfer'}
                                </span>
                              </td>
                              <td className="table-cell">{tx.type === 'TRANSFER' ? `${tx.warehouse?.name} → ${tx.destinationWarehouse?.name ?? '?'}` : tx.warehouse?.name ?? '-'}</td>
                              <td className="table-cell text-right">
                                <span className={tx.type === 'IN' ? 'text-green' : tx.type === 'OUT' ? 'text-red' : 'text-yellow'}>
                                  {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : ''}
                                  {tx.quantity}
                                </span>
                              </td>
                              <td className="table-cell text-muted">{tx.user?.username ?? 'Sistem'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end px-4 py-3 border-t border-border shrink-0">
              <Button variant="secondary" onClick={() => setDetailProduct(null)}>KAPAT</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
