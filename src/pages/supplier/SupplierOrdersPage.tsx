import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThumbsUp, ThumbsDown, Truck } from 'lucide-react';
import { getSupplierOrders, approveSupplierOrder, rejectSupplierOrder, shipSupplierOrder } from '../../api';
import type { SupplierOrder } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import OrderStatusBadge from '../../components/ui/OrderStatusBadge';
import { extractApiError } from '../../utils/errorUtils';

type ConfirmAction = {
  orderId: number;
  action: 'approve' | 'reject' | 'ship';
  label: string;
};

const CONFIRM_LABELS: Record<ConfirmAction['action'], string> = {
  approve: 'Sipariş onaylanacak ve yöneticiye bildirilecek.',
  reject:  'Sipariş reddedilecek.',
  ship:    'Sipariş yola çıktı olarak işaretlenecek.',
};

export default function SupplierOrdersPage() {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [actionError, setActionError] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['supplier-orders'],
    queryFn: () => getSupplierOrders().then(r => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['supplier-orders'] });
  const onSuccess = () => { invalidate(); setConfirm(null); setActionError(''); };
  const onError   = (err: unknown) => setActionError(extractApiError(err, 'İşlem başarısız.'));

  const approveMutation = useMutation({ mutationFn: approveSupplierOrder, onSuccess, onError });
  const rejectMutation  = useMutation({ mutationFn: rejectSupplierOrder,  onSuccess, onError });
  const shipMutation    = useMutation({ mutationFn: shipSupplierOrder,    onSuccess, onError });

  const isPending = approveMutation.isPending || rejectMutation.isPending || shipMutation.isPending;

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.action === 'approve') approveMutation.mutate(confirm.orderId);
    else if (confirm.action === 'reject') rejectMutation.mutate(confirm.orderId);
    else if (confirm.action === 'ship') shipMutation.mutate(confirm.orderId);
  };

  const columns: Column<SupplierOrder>[] = [
    { key: 'product',   header: 'ÜRÜN',  render: (o) => o.product?.name ?? '-' },
    { key: 'warehouse', header: 'DEPO',  render: (o) => o.warehouse?.name ?? '-' },
    { key: 'quantity',  header: 'MİKTAR' },
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

        if (o.status === 'BEKLIYOR') {
          btns.push(
            <button key="approve"
              onClick={() => { setActionError(''); setConfirm({ orderId: o.id, action: 'approve', label: CONFIRM_LABELS.approve }); }}
              className="flex items-center gap-1 font-pixel text-xs transition-opacity hover:opacity-80 px-2 py-0.5 rounded"
              style={{ background: '#14532d', color: '#ffffff' }}
              title="Onayla"
            >
              <ThumbsUp size={13} style={{ color: '#4ade80' }} /> ONAYLA
            </button>,
            <button key="reject"
              onClick={() => { setActionError(''); setConfirm({ orderId: o.id, action: 'reject', label: CONFIRM_LABELS.reject }); }}
              className="flex items-center gap-1 font-pixel text-xs transition-opacity hover:opacity-80 px-2 py-0.5 rounded"
              style={{ background: '#7f1d1d', color: '#ffffff' }}
              title="Reddet"
            >
              <ThumbsDown size={13} style={{ color: '#ef4444' }} /> REDDET
            </button>
          );
        }

        if (o.status === 'ONAYLANDI') {
          btns.push(
            <button key="ship"
              onClick={() => { setActionError(''); setConfirm({ orderId: o.id, action: 'ship', label: CONFIRM_LABELS.ship }); }}
              className="flex items-center gap-1 font-pixel text-xs transition-opacity hover:opacity-80 px-2 py-0.5 rounded"
              style={{ background: '#1e3a5f', color: '#ffffff' }}
              title="Yola Çıkar"
            >
              <Truck size={13} style={{ color: '#3b82f6' }} /> YOLA ÇIK
            </button>
          );
        }

        return btns.length > 0 ? <div className="flex flex-wrap gap-2">{btns}</div> : null;
      },
    },
  ];

  return (
    <div>
      <PageHeader title="SİPARİŞLER" />

      {isLoading && <p className="font-pixel text-xs text-muted py-4">Yükleniyor...</p>}
      {!isLoading && <DataTable columns={columns} data={orders} rowKey={(o) => o.id} emptyText="Sipariş yok." />}

      {confirm && (
        <Modal onClose={() => { setConfirm(null); setActionError(''); }} title="İşlemi Onayla">
          <div className="flex flex-col gap-4">
            <p className="font-pixel text-xs text-text-primary">{confirm.label}</p>
            {actionError && <p className="text-red font-vt text-sm">{actionError}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setConfirm(null); setActionError(''); }}>İPTAL</Button>
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending ? 'İŞLENİYOR...' : 'EVET, DEVAM ET'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
