import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTransactions, stockIn, stockOut, transfer, getProducts, getWarehouses,
  getStockRequests, createStockRequest, approveStockRequest, rejectStockRequest,
} from '../api';
import type { InventoryTransaction, StockRequest, StockRequestStatus, PageResponse } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SearchInput from '../components/ui/SearchInput';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { extractApiError } from '../utils/errorUtils';

type TxModal = 'in' | 'out' | 'transfer' | null;
type RequestModal = 'request' | 'review' | null;

export default function InventoryPage() {
  const qc = useQueryClient();
  const { canManageOperations, user, isAdmin, isStaff } = useAuth();
  const [tab, setTab] = useState<'transactions' | 'requests'>(isStaff ? 'requests' : 'transactions');
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<TxModal>(null);
  const [requestModal, setRequestModal] = useState<RequestModal>(null);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  const [form, setForm] = useState({ productId: '', warehouseId: '', toWarehouseId: '', quantity: '', notes: '' });
  const [requestForm, setRequestForm] = useState({ productId: '', warehouseId: '', quantity: '', notes: '', managerNote: '' });
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');
  const [txPage, setTxPage] = useState(0);
  const TX_PAGE_SIZE = 20;

  const emptyTxPage: PageResponse<InventoryTransaction> = { content: [], totalElements: 0, totalPages: 0, currentPage: 0, size: TX_PAGE_SIZE };
  const { data: txsPage = emptyTxPage, isLoading } = useQuery({
    queryKey: ['transactions', txPage, TX_PAGE_SIZE],
    queryFn: () => getTransactions(txPage, TX_PAGE_SIZE).then(r => r.data),
  });
  const txs = txsPage.content;
  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => getProducts(0, 1000).then(r => r.data),
  });
  const products = productsData?.content ?? [];
  const { data: warehouses = [] } = useQuery({ queryKey: ['warehouses'], queryFn: () => getWarehouses().then(r => r.data) });
  const { data: stockRequests = [] } = useQuery({ queryKey: ['stock-requests'], queryFn: () => getStockRequests().then(r => r.data) });

  const sourceWarehouses = isAdmin ? warehouses : warehouses.filter(w => w.id === user?.warehouseId);
  const selectedSourceWarehouseId = form.warehouseId ? parseInt(form.warehouseId) : user?.warehouseId ?? null;
  const destinationWarehouses = warehouses.filter(w => w.id !== selectedSourceWarehouseId);

  const filteredTxs = useMemo(() => {
    const q = search.toLowerCase();
    return q ? txs.filter(t =>
      (t.product?.name ?? '').toLowerCase().includes(q) ||
      (t.warehouse?.name ?? '').toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q)
    ) : txs;
  }, [txs, search]);
  const filteredRequests = useMemo(() => {
    const q = search.toLowerCase();
    return q ? stockRequests.filter(r =>
      (r.product?.name ?? '').toLowerCase().includes(q) ||
      (r.warehouse?.name ?? '').toLowerCase().includes(q) ||
      (r.requestedBy?.username ?? '').toLowerCase().includes(q)
    ) : stockRequests;
  }, [stockRequests, search]);

  const refetch = () => qc.invalidateQueries({ queryKey: ['transactions'] });
  const inMut  = useMutation({ mutationFn: (d: object) => stockIn(d),  onSuccess: () => { refetch(); setModal(null); } });
  const outMut = useMutation({ mutationFn: (d: object) => stockOut(d), onSuccess: () => { refetch(); setModal(null); } });
  const trMut  = useMutation({ mutationFn: (d: object) => transfer(d), onSuccess: () => { refetch(); setModal(null); } });
  const refetchRequests = () => qc.invalidateQueries({ queryKey: ['stock-requests'] });
  const requestMut = useMutation({ mutationFn: (d: object) => createStockRequest(d), onSuccess: () => { refetchRequests(); setRequestModal(null); if (isStaff) setToast('Talep başarıyla oluşturuldu.'); } });
  const approveMut = useMutation({ mutationFn: ({ id, managerNote }: { id: number; managerNote?: string }) => approveStockRequest(id, { managerNote }), onSuccess: () => { refetchRequests(); refetch(); setRequestModal(null); } });
  const rejectMut = useMutation({ mutationFn: ({ id, managerNote }: { id: number; managerNote?: string }) => rejectStockRequest(id, { managerNote }), onSuccess: () => { refetchRequests(); setRequestModal(null); } });

  const openModal = (type: TxModal) => {
    setForm({ productId: '', warehouseId: isAdmin ? '' : String(user?.warehouseId ?? ''), toWarehouseId: '', quantity: '', notes: '' });
    setApiError('');
    setModal(type);
  };

  const openRequest = () => {
    setRequestForm({ productId: '', warehouseId: '', quantity: '', notes: '', managerNote: '' });
    setApiError('');
    setRequestModal('request');
  };

  const openReview = (request: StockRequest) => {
    setSelectedRequest(request);
    setRequestForm(p => ({ ...p, managerNote: '' }));
    setApiError('');
    setRequestModal('review');
  };

  const submit = async () => {
    setApiError('');
    const payload: object = {
      product: { id: parseInt(form.productId) },
      warehouse: { id: parseInt(form.warehouseId) },
      quantity: parseInt(form.quantity),
      notes: form.notes,
      ...(modal === 'transfer' ? { destinationWarehouse: { id: parseInt(form.toWarehouseId) } } : {}),
    };
    try {
      if (modal === 'in')       await inMut.mutateAsync(payload);
      else if (modal === 'out') await outMut.mutateAsync(payload);
      else if (modal === 'transfer') await trMut.mutateAsync(payload);
    } catch (e: unknown) {
      setApiError(extractApiError(e, 'İşlem gerçekleştirilemedi.'));
    }
  };

  const submitRequest = async () => {
    setApiError('');
    if (!requestForm.productId) { setApiError('Ürün seçilmelidir.'); return; }
    const qty = parseInt(requestForm.quantity);
    if (isNaN(qty) || qty <= 0) { setApiError('Geçerli bir miktar giriniz.'); return; }
    const warehouseId = isStaff ? user?.warehouseId : parseInt(requestForm.warehouseId);
    if (!warehouseId) { setApiError('Depo seçilmelidir.'); return; }
    try {
      await requestMut.mutateAsync({
        product: { id: parseInt(requestForm.productId) },
        warehouse: { id: warehouseId },
        quantity: qty,
        notes: requestForm.notes,
      });
    } catch (e: unknown) {
      setApiError(extractApiError(e, 'Talep oluşturulamadı.'));
    }
  };

  const reviewRequest = async (status: 'approve' | 'reject') => {
    if (!selectedRequest) return;
    setApiError('');
    try {
      const payload = { id: selectedRequest.id, managerNote: requestForm.managerNote };
      if (status === 'approve') await approveMut.mutateAsync(payload);
      else await rejectMut.mutateAsync(payload);
    } catch (e: unknown) {
      setApiError(extractApiError(e, 'İşlem gerçekleştirilemedi.'));
    }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({
      ...p,
      [k]: e.target.value,
      ...(k === 'warehouseId' && p.toWarehouseId === e.target.value ? { toWarehouseId: '' } : {}),
    }));
  const rf = (k: keyof typeof requestForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setRequestForm(p => ({ ...p, [k]: e.target.value }));

  const txTypeLabel: Record<string, string> = { IN: 'GİRİŞ', OUT: 'ÇIKIŞ', TRANSFER: 'TRANSFER' };
  const txTypeColor: Record<string, string> = { IN: 'text-green', OUT: 'text-red', TRANSFER: 'text-blue' };
  const requestStatusLabel: Record<StockRequestStatus, string> = { PENDING: 'BEKLİYOR', APPROVED: 'ONAYLANDI', REJECTED: 'REDDEDİLDİ' };
  const requestStatusColor: Record<StockRequestStatus, string> = { PENDING: 'text-yellow', APPROVED: 'text-green', REJECTED: 'text-red' };

  const columns: Column<InventoryTransaction>[] = [
    { key: 'type',            header: 'TİP',       render: t => <span className={txTypeColor[t.type]}>{txTypeLabel[t.type]}</span> },
    { key: 'product',         header: 'ÜRÜN',      render: t => t.product?.name ?? '-' },
    { key: 'warehouse',       header: 'DEPO',      render: t => t.warehouse?.name ?? '-' },
    { key: 'destinationWarehouse', header: 'HEDEF DEPO', render: t => t.destinationWarehouse?.name ?? '-' },
    { key: 'quantity',        header: 'MİKTAR' },
    { key: 'transactionDate', header: 'TARİH',     render: t => t.transactionDate?.split('T')[0] ?? '-' },
  ];
  const requestColumns: Column<StockRequest>[] = [
    { key: 'status', header: 'DURUM', render: r => <span className={requestStatusColor[r.status]}>{requestStatusLabel[r.status]}</span> },
    { key: 'product', header: 'ÜRÜN', render: r => r.product?.name ?? '-' },
    { key: 'warehouse', header: 'DEPO', render: r => r.warehouse?.name ?? '-' },
    { key: 'quantity', header: 'MİKTAR' },
    { key: 'requestedBy', header: 'TALEP EDEN', render: r => r.requestedBy?.username ?? '-' },
    { key: 'requestDate', header: 'TARİH', render: r => r.requestDate?.split('T')[0] ?? '-' },
  ];

  if (isLoading && !isStaff) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader title="STOK HAREKETLERİ" search={<SearchInput value={search} onChange={setSearch} />}>
        {canManageOperations && (
          <>
            <Button onClick={() => openModal('in')}>STOK GİRİŞİ</Button>
            <Button variant="secondary" onClick={() => openModal('out')}>STOK ÇIKIŞI</Button>
            <Button variant="secondary" onClick={() => openModal('transfer')}>TRANSFER</Button>
          </>
        )}
      </PageHeader>

      {toast && (
        <div className="flex items-center justify-between p-3 mb-4 border border-green font-vt text-lg text-green">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-4 opacity-60 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      <div className="flex gap-0 mb-4 border-b border-border">
        {(isStaff ? ['requests'] : ['transactions', 'requests'] as const).map(t => (
          <button key={t} onClick={() => setTab(t as typeof tab)}
            className={`font-pixel text-xs px-4 py-2 border-b-2 transition-colors ${tab === t ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text-primary'}`}>
            {t === 'transactions' ? 'HAREKETLER' : 'TALEPLER'}
          </button>
        ))}
      </div>

      {tab === 'transactions' && (
        <>
          <DataTable columns={columns} data={filteredTxs} rowKey={t => t.id} emptyText="Henüz işlem yok." />
          {txsPage.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-muted font-vt text-lg">
                {txsPage.totalElements} işlem • Sayfa {txsPage.currentPage + 1} / {txsPage.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={txPage === 0} onClick={() => setTxPage(p => p - 1)}>← ÖNCEKİ</Button>
                <Button variant="secondary" disabled={txPage >= txsPage.totalPages - 1} onClick={() => setTxPage(p => p + 1)}>SONRAKİ →</Button>
              </div>
            </div>
          )}
        </>
      )}
      {tab === 'requests' && (
        <>
          {isStaff && (
            <div className="flex justify-end mb-3">
              <Button onClick={openRequest}>+ TALEP OLUŞTUR</Button>
            </div>
          )}
          <DataTable columns={requestColumns} data={filteredRequests} rowKey={r => r.id}
            onRowClick={r => { setSelectedRequest(r); if (canManageOperations && r.status === 'PENDING') openReview(r); }}
            selectedId={selectedRequest?.id} emptyText="Henüz talep yok." />
        </>
      )}

      {modal && (
        <Modal
          title={modal === 'in' ? 'STOK GİRİŞİ' : modal === 'out' ? 'STOK ÇIKIŞI' : 'DEPO TRANSFER'}
          onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button><Button onClick={submit}>KAYDET</Button></>}
        >
          <div className="flex flex-col gap-3">
            {[{ k: 'productId', label: 'ÜRÜN', items: products }, { k: 'warehouseId', label: modal === 'transfer' ? 'KAYNAK DEPO' : 'DEPO', items: sourceWarehouses }].map(({ k, label, items }) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-muted font-pixel text-xs">{label}</label>
                <select className="input-field" value={form[k as keyof typeof form]} onChange={f(k as keyof typeof form)}>
                  <option value="">Seçin...</option>
                  {items.map((i: {id:number; name:string}) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            ))}
            {modal === 'transfer' && (
              <div className="flex flex-col gap-1">
                <label className="text-muted font-pixel text-xs">HEDEF DEPO</label>
                <select className="input-field" value={form.toWarehouseId} onChange={f('toWarehouseId')}>
                  <option value="">Seçin...</option>
                  {destinationWarehouses.map((w: {id:number; name:string}) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}
            <Input label="MİKTAR" type="number" value={form.quantity} onChange={f('quantity')} />
            <Input label="NOTLAR" value={form.notes} onChange={f('notes')} />
            {apiError && <p className="text-red font-vt">{apiError}</p>}
          </div>
        </Modal>
      )}

      {requestModal === 'request' && (
        <Modal title="STOK TALEBİ" onClose={() => setRequestModal(null)}
          footer={<><Button variant="secondary" onClick={() => setRequestModal(null)}>İPTAL</Button><Button onClick={submitRequest} disabled={requestMut.isPending}>{requestMut.isPending ? 'GÖNDERİLİYOR...' : 'GÖNDER'}</Button></>}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-muted font-pixel text-xs">ÜRÜN</label>
              <select className="input-field" value={requestForm.productId} onChange={rf('productId')}>
                <option value="">Seçin...</option>
                {products.map((p: {id:number; name:string}) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {!isStaff && (
              <div className="flex flex-col gap-1">
                <label className="text-muted font-pixel text-xs">DEPO</label>
                <select className="input-field" value={requestForm.warehouseId} onChange={rf('warehouseId')}>
                  <option value="">Seçin...</option>
                  {sourceWarehouses.map((w: {id:number; name:string}) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}
            <Input label="MİKTAR" type="number" value={requestForm.quantity} onChange={rf('quantity')} />
            <div className="flex flex-col gap-1">
              <label className="text-muted font-pixel text-xs">{isStaff ? 'NOT (OPSİYONEL)' : 'NOTLAR'}</label>
              {isStaff ? (
                <textarea className="input-field resize-none" rows={3} value={requestForm.notes}
                  onChange={e => setRequestForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Açıklama ekleyebilirsiniz..." />
              ) : (
                <input className="input-field" value={requestForm.notes} onChange={e => setRequestForm(p => ({ ...p, notes: e.target.value }))} />
              )}
            </div>
            {apiError && <p className="text-red font-vt">{apiError}</p>}
          </div>
        </Modal>
      )}

      {requestModal === 'review' && selectedRequest && (
        <Modal title="TALEP İNCELE" onClose={() => setRequestModal(null)}
          footer={<><Button variant="danger" onClick={() => reviewRequest('reject')}>REDDET</Button><Button onClick={() => reviewRequest('approve')}>ONAYLA</Button></>}>
          <div className="flex flex-col gap-3 font-vt text-lg">
            <p><span className="text-muted">Ürün:</span> {selectedRequest.product?.name}</p>
            <p><span className="text-muted">Depo:</span> {selectedRequest.warehouse?.name}</p>
            <p><span className="text-muted">Miktar:</span> {selectedRequest.quantity}</p>
            <p><span className="text-muted">Talep Eden:</span> {selectedRequest.requestedBy?.username}</p>
            {selectedRequest.notes && <p><span className="text-muted">Not:</span> {selectedRequest.notes}</p>}
            <Input label="YÖNETİCİ NOTU" value={requestForm.managerNote} onChange={rf('managerNote')} />
            {apiError && <p className="text-red font-vt">{apiError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
