import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Info, Pencil } from 'lucide-react';
import { getMyProducts, updateMyProductPrice, getProductStockSummary, getProductSuppliers, getProductTransactionHistory } from '../../api';
import type { Product, InventoryTransaction } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const CRITICAL_THRESHOLD = 5;

type DetailTab = 'stock' | 'suppliers' | 'history';

export default function SupplierProductsPage() {
  const qc = useQueryClient();
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('stock');

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => getMyProducts().then(r => r.data),
  });

  const { data: stockSummary = [] } = useQuery({
    queryKey: ['product-stock', detailProduct?.id],
    queryFn: () => detailProduct ? getProductStockSummary(detailProduct.id).then(r => r.data) : Promise.resolve([]),
    enabled: !!detailProduct && detailTab === 'stock',
  });

  const { data: detailSuppliers = [] } = useQuery({
    queryKey: ['product-suppliers', detailProduct?.id],
    queryFn: () => detailProduct ? getProductSuppliers(detailProduct.id).then(r => r.data) : Promise.resolve([]),
    enabled: !!detailProduct && detailTab === 'suppliers',
  });

  const { data: txHistory = [] } = useQuery({
    queryKey: ['product-history', detailProduct?.id],
    queryFn: () => detailProduct ? getProductTransactionHistory(detailProduct.id).then(r => r.data) : Promise.resolve([]),
    enabled: !!detailProduct && detailTab === 'history',
  });

  const priceMutation = useMutation({
    mutationFn: ({ id, price }: { id: number; price: number }) => updateMyProductPrice(id, price),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-products'] });
      setEditProduct(null);
      setNewPrice('');
      setPriceError('');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Fiyat güncellenemedi.';
      setPriceError(msg);
    },
  });

  const handleSavePrice = () => {
    if (!editProduct) return;
    const val = parseFloat(newPrice);
    if (isNaN(val) || val < 0) { setPriceError('Geçerli bir fiyat giriniz.'); return; }
    priceMutation.mutate({ id: editProduct.id, price: val });
  };

  const columns: Column<Product>[] = [
    { key: 'name', header: 'ÜRÜN ADI' },
    { key: 'sku', header: 'SKU' },
    {
      key: 'price',
      header: 'FİYAT',
      render: (p) => p.price != null ? `₺${Number(p.price).toLocaleString('tr-TR')}` : '-',
    },
    {
      key: 'quantityInStock',
      header: 'STOK',
      render: (p) => (
        <span className={p.quantityInStock <= CRITICAL_THRESHOLD ? 'text-red' : ''}>
          {p.quantityInStock}
        </span>
      ),
    },
    { key: 'category', header: 'KATEGORİ', render: (p) => p.category?.name ?? '-' },
    {
      key: 'actions',
      header: 'AKSİYONLAR',
      render: (p) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setDetailProduct(p); setDetailTab('stock'); }}
            className="text-muted hover:text-accent transition-colors"
            title="Detay"
          >
            <Info size={15} />
          </button>
          <button
            onClick={() => { setEditProduct(p); setNewPrice(p.price != null ? String(p.price) : ''); setPriceError(''); }}
            className="text-muted hover:text-accent2 transition-colors"
            title="Fiyat Güncelle"
          >
            <Pencil size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="ÜRÜNLERİM" />

      {isLoading && <p className="font-pixel text-xs text-muted py-4">Yükleniyor...</p>}
      {error && <p className="text-red font-vt text-xl text-center p-8">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>}
      {!isLoading && !error && <DataTable columns={columns} data={products} rowKey={(p) => p.id} emptyText="Henüz ürün yok." />}

      {/* Price update modal */}
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Fiyat Güncelle">
        {editProduct && (
          <div className="flex flex-col gap-4">
            <div className="font-pixel text-xs text-muted">Ürün: {editProduct.name}</div>
            <div className="font-pixel text-xs text-muted">
              Mevcut Fiyat: {editProduct.price != null ? `₺${Number(editProduct.price).toLocaleString('tr-TR')}` : '-'}
            </div>
            <Input
              label="YENİ FİYAT (₺)"
              type="number"
              min="0"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              autoFocus
            />
            {priceError && <p className="text-red font-vt text-sm">{priceError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setEditProduct(null)}>İPTAL</Button>
              <Button onClick={handleSavePrice} disabled={priceMutation.isPending}>
                {priceMutation.isPending ? 'KAYDEDİLİYOR...' : 'KAYDET'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={!!detailProduct} onClose={() => setDetailProduct(null)} title={detailProduct?.name ?? ''}>
        {detailProduct && (
          <div>
            <div className="flex gap-1 mb-4 border-b border-border">
              {(['stock', 'suppliers', 'history'] as DetailTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-3 py-1.5 font-pixel text-xs border-b-2 -mb-px transition-colors ${
                    detailTab === tab ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text-primary'
                  }`}
                >
                  {tab === 'stock' ? 'STOK' : tab === 'suppliers' ? 'TEDARİKÇİLER' : 'GEÇMİŞ'}
                </button>
              ))}
            </div>

            {detailTab === 'stock' && (
              <div className="space-y-1">
                {stockSummary.length === 0
                  ? <p className="text-muted font-pixel text-xs">Stok kaydı yok.</p>
                  : stockSummary.map((s) => (
                    <div key={s.warehouseId} className="flex justify-between font-pixel text-xs">
                      <span>{s.warehouseName}</span>
                      <span className="text-accent">{s.quantity}</span>
                    </div>
                  ))}
              </div>
            )}

            {detailTab === 'suppliers' && (
              <div className="space-y-1">
                {detailSuppliers.length === 0
                  ? <p className="text-muted font-pixel text-xs">Tedarikçi yok.</p>
                  : detailSuppliers.map((s) => (
                    <div key={s.id} className="font-pixel text-xs text-text-primary">{s.name}</div>
                  ))}
              </div>
            )}

            {detailTab === 'history' && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {(txHistory as InventoryTransaction[]).length === 0
                  ? <p className="text-muted font-pixel text-xs">İşlem geçmişi yok.</p>
                  : (txHistory as InventoryTransaction[]).map((tx) => (
                    <div key={tx.id} className="flex justify-between font-pixel text-xs">
                      <span>{new Date(tx.transactionDate).toLocaleDateString('tr-TR')}</span>
                      <span>{tx.warehouse?.name}</span>
                      <span className={tx.type === 'IN' ? 'text-green-400' : 'text-red'}>
                        {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
