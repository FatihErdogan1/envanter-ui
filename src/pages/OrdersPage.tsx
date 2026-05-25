import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PackageCheck, Plus, ThumbsUp, ThumbsDown, Truck } from 'lucide-react';
import {
  getSupplierOrders, createSupplierOrder,
  approveSupplierOrder, rejectSupplierOrder, shipSupplierOrder, deliverSupplierOrder,
  getProducts, getSuppliers, getWarehouses,
} from '../api';
import type { SupplierOrder, SupplierOrderStatus, Product, Supplier } from '../types';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import OrderStatusBadge from '../components/ui/OrderStatusBadge';
import { ORDER_STATUS_LABELS } from '../components/ui/orderStatusLabels';
import { extractApiError } from '../utils/errorUtils';

type FilterStatus = SupplierOrderStatus | '';

type NewOrderForm = {
  productId: string;
  supplierId: string;
  warehouseId: string;
  quantity: string;
};

type ConfirmAction = {
  orderId: number;
  type: 'approve' | 'reject' | 'ship' | 'deliver';
  label: string;
};

const blankForm: NewOrderForm = { productId: '', supplierId: '', warehouseId: '', quantity: '' };

export default function OrdersPage() {
  const qc = useQueryClient();
  const { isAdmin, isManager } = useAuth();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewOrderForm>(blankForm);
  const [formError, setFormError] = useState('');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionError, setActionError] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['supplier-orders'],
    queryFn: () => getSupplierOrders().then(r => r.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => getProducts(0, 1000).then(r => r.data),
  });
  const products = productsData?.content ?? [];

  useQuery({ queryKey: ['suppliers'], queryFn: () => getSuppliers().then(r => r.data) });
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses().then(r => r.data) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['supplier-orders'] });
    qc.invalidateQueries({ queryKey: ['products-all'] });
  };

  const onMutationSuccess = () => { invalidate(); setConfirmAction(null); setActionError(''); };
  const onMutationError   = (e: unknown) => setActionError(extractApiError(e, 'İşlem başarısız.'));

  const createMut  = useMutation({ mutationFn: createSupplierOrder,  onSuccess: () => { invalidate(); setShowCreate(false); setForm(blankForm); setFormError(''); }, onError: (e: unknown) => setFormError(extractApiError(e, 'Sipariş oluşturulamadı.')) });
  const approveMut = useMutation({ mutationFn: (id: number) => approveSupplierOrder(id), onSuccess: onMutationSuccess, onError: onMutationError });
  const rejectMut  = useMutation({ mutationFn: (id: number) => rejectSupplierOrder(id),  onSuccess: onMutationSuccess, onError: onMutationError });
  const shipMut    = useMutation({ mutationFn: (id: number) => shipSupplierOrder(id),    onSuccess: onMutationSuccess, onError: onMutationError });
  const deliverMut = useMutation({ mutationFn: (id: number) => deliverSupplierOrder(id), onSuccess: onMutationSuccess, onError: onMutationError });

  const isPending = approveMut.isPending || rejectMut.isPending || shipMut.isPending || deliverMut.isPending;

  const executeConfirm = () => {
    if (!confirmAction) return;
    const id = confirmAction.orderId;
    switch (confirmAction.type) {
      case 'approve': approveMut.mutate(id); break;
      case 'reject':  rejectMut.mutate(id);  break;
      case 'ship':    shipMut.mutate(id);    break;
      case 'deliver': deliverMut.mutate(id); break;
    }
  };

  const selectedProduct: Product | undefined = products.find(p => p.id === Number(form.productId));
  const availableSuppliers: Supplier[]       = selectedProduct ? (selectedProduct.suppliers ?? []) : [];

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === Number(productId));
    const firstSupplier = product?.suppliers?.[0];
    setForm(f => ({ ...f, productId, supplierId: firstSupplier ? String(firstSupplier.id) : '' }));
  };

  const handleCreate = () => {
    setFormError('');
    if (!form.productId || !form.supplierId || !form.warehouseId || !form.quantity) {
      setFormError('Tüm alanlar zorunludur.');
      return;
    }
    const qty = parseInt(form.quantity);
    if (isNaN(qty) || qty <= 0) { setFormError('Geçerli bir miktar giriniz.'); return; }
    createMut.mutate({ productId: Number(form.productId), supplierId: Number(form.supplierId), warehouseId: Number(form.warehouseId), quantity: qty });
  };

  const filtered = orders.filter(o => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (filterSupplier && !o.supplier?.name.toLowerCase().includes(filterSupplier.toLowerCase())) return false;
    return true;
  });

  const CONFIRM_LABELS: Record<ConfirmAction['type'], string> = {
    approve: 'Sipariş onaylanacak ve tedarikçiye bildirilecek.',
    reject:  'Sipariş reddedilecek.',
    ship:    'Sipariş yola çıktı olarak işaretlenecek.',
    deliver: 'Sipariş teslim alınacak ve stok otomatik güncellenecek.',
  };

  const columns: Column<SupplierOrder>[] = [
    { key: 'product',  header: 'ÜRÜN',      render: (o) => o.product?.name ?? '-' },
    { key: 'supplier', header: 'TEDARİKÇİ', render: (o) => o.supplier?.name ?? '-' },
    { key: 'warehouse',header: 'DEPO',      render: (o) => o.warehouse?.name ?? '-' },
    { key: 'quantity', header: 'MİKTAR' },
    {
      key: 'status',
      header: 'DURUM',
      render: (o) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: 'orderDate',
      header: 'TARİH',
      render: (o) => new Date(o.orderDate).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      header: 'AKSİYONLAR',
      render: (o) => {
        const btns: React.ReactNode[] = [];

        if (o.status === 'BEKLIYOR' && isAdmin) {
          btns.push(
            <button key="approve"
              onClick={() => { setActionError(''); setConfirmAction({ orderId: o.id, type: 'approve', label: CONFIRM_LABELS.approve }); }}
              className="flex items-center gap-1 font-pixel text-xs transition-opacity hover:opacity-80 px-2 py-0.5 rounded"
              style={{ background: '#14532d', color: '#ffffff' }}
              title="Onayla"
            >
              <ThumbsUp size={13} style={{ color: '#4ade80' }} /> ONAYLA
            </button>,
            <button key="reject"
              onClick={() => { setActionError(''); setConfirmAction({ orderId: o.id, type: 'reject', label: CONFIRM_LABELS.reject }); }}
              className="flex items-center gap-1 font-pixel text-xs transition-opacity hover:opacity-80 px-2 py-0.5 rounded"
              style={{ background: '#7f1d1d', color: '#ffffff' }}
              title="Reddet"
            >
              <ThumbsDown size={13} style={{ color: '#ef4444' }} /> REDDET
            </button>
          );
        }

        if (o.status === 'ONAYLANDI' && isAdmin) {
          btns.push(
            <button key="ship"
              onClick={() => { setActionError(''); setConfirmAction({ orderId: o.id, type: 'ship', label: CONFIRM_LABELS.ship }); }}
              className="flex items-center gap-1 font-pixel text-xs transition-opacity hover:opacity-80 px-2 py-0.5 rounded"
              style={{ background: '#1e3a5f', color: '#ffffff' }}
              title="Yola Çıkar"
            >
              <Truck size={13} style={{ color: '#3b82f6' }} /> YOLA ÇIK
            </button>
          );
        }

        if (o.status === 'YOLDA' && (isAdmin || isManager)) {
          btns.push(
            <button key="deliver"
              onClick={() => { setActionError(''); setConfirmAction({ orderId: o.id, type: 'deliver', label: CONFIRM_LABELS.deliver }); }}
              className="flex items-center gap-1 font-pixel text-xs transition-opacity hover:opacity-80 px-2 py-0.5 rounded"
              style={{ background: '#581c87', color: '#ffffff' }}
              title="Teslim Al"
            >
              <PackageCheck size={13} style={{ color: '#a855f7' }} /> TESLİM AL
            </button>
          );
        }

        return btns.length > 0 ? <div className="flex flex-wrap gap-2">{btns}</div> : null;
      },
    },
  ];

  return (
    <div>
      <PageHeader title="SİPARİŞLER">
        <Button onClick={() => setShowCreate(true)}><Plus size={14} className="mr-1" />EKLE</Button>
      </PageHeader>

      <div className="flex gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="bg-bg-surface border border-border font-pixel text-xs text-text-primary px-3 py-1.5 focus:outline-none focus:border-accent"
        >
          <option value="">TÜM DURUMLAR</option>
          {(Object.keys(ORDER_STATUS_LABELS) as SupplierOrderStatus[]).map(s => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <input
          placeholder="Tedarikçi filtrele..."
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="bg-bg-surface border border-border font-pixel text-xs text-text-primary px-3 py-1.5 focus:outline-none focus:border-accent placeholder-muted"
        />
      </div>

      {isLoading && <p className="font-pixel text-xs text-muted py-4">Yükleniyor...</p>}
      {!isLoading && <DataTable columns={columns} data={filtered} rowKey={(o) => o.id} emptyText="Sipariş yok." />}

      {/* Create order modal */}
      {showCreate && (
        <Modal onClose={() => { setShowCreate(false); setForm(blankForm); setFormError(''); }} title="Yeni Sipariş">
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-pixel text-xs text-muted block mb-1">ÜRÜN</label>
              <select value={form.productId} onChange={(e) => handleProductChange(e.target.value)}
                className="w-full bg-bg-surface border border-border font-pixel text-xs text-text-primary px-3 py-2 focus:outline-none focus:border-accent">
                <option value="">Ürün seçiniz...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="font-pixel text-xs text-muted block mb-1">TEDARİKÇİ</label>
              <select value={form.supplierId} onChange={(e) => setForm(f => ({ ...f, supplierId: e.target.value }))}
                disabled={availableSuppliers.length === 0}
                className="w-full bg-bg-surface border border-border font-pixel text-xs text-text-primary px-3 py-2 focus:outline-none focus:border-accent disabled:opacity-50">
                <option value="">{form.productId ? (availableSuppliers.length === 0 ? 'Bu ürünün tedarikçisi yok' : 'Tedarikçi seçiniz...') : 'Önce ürün seçiniz'}</option>
                {availableSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="font-pixel text-xs text-muted block mb-1">DEPO</label>
              <select value={form.warehouseId} onChange={(e) => setForm(f => ({ ...f, warehouseId: e.target.value }))}
                className="w-full bg-bg-surface border border-border font-pixel text-xs text-text-primary px-3 py-2 focus:outline-none focus:border-accent">
                <option value="">Depo seçiniz...</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <Input label="MİKTAR" type="number" min="1" value={form.quantity}
              onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} />
            {formError && <p className="text-red font-vt text-sm">{formError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setShowCreate(false); setForm(blankForm); setFormError(''); }}>İPTAL</Button>
              <Button onClick={handleCreate} disabled={createMut.isPending}>
                {createMut.isPending ? 'OLUŞTURULUYOR...' : 'OLUŞTUR'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Unified confirm modal */}
      {confirmAction && (
        <Modal onClose={() => { setConfirmAction(null); setActionError(''); }} title="İşlemi Onayla">
          <div className="flex flex-col gap-4">
            <p className="font-pixel text-xs text-text-primary">{confirmAction.label}</p>
            {actionError && <p className="text-red font-vt text-sm">{actionError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setConfirmAction(null); setActionError(''); }}>İPTAL</Button>
              <Button onClick={executeConfirm} disabled={isPending}>
                {isPending ? 'İŞLENİYOR...' : 'EVET, DEVAM ET'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
