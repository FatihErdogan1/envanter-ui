import { useQuery } from '@tanstack/react-query';
import { getMyTransactions } from '../../api';
import type { InventoryTransaction } from '../../types';
import PageHeader from '../../components/ui/PageHeader';
import DataTable, { Column } from '../../components/ui/DataTable';

export default function SupplierTransactionsPage() {
  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['my-transactions'],
    queryFn: () => getMyTransactions().then(r => r.data),
  });

  const columns: Column<InventoryTransaction>[] = [
    {
      key: 'transactionDate',
      header: 'TARİH',
      render: (tx) => new Date(tx.transactionDate).toLocaleString('tr-TR'),
    },
    { key: 'product', header: 'ÜRÜN', render: (tx) => tx.product?.name ?? '-' },
    { key: 'warehouse', header: 'DEPO', render: (tx) => tx.warehouse?.name ?? '-' },
    { key: 'type', header: 'İŞLEM', render: (tx) => tx.type === 'IN' ? 'Giriş' : tx.type === 'OUT' ? 'Çıkış' : 'Transfer' },
    {
      key: 'quantity',
      header: 'MİKTAR',
      render: (tx) => (
        <span className={tx.type === 'IN' ? 'text-green-400' : 'text-red'}>
          {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="İŞLEM GEÇMİŞİ" />
      {isLoading && <p className="font-pixel text-xs text-muted py-4">Yükleniyor...</p>}
      {error && <p className="text-red font-vt text-xl text-center p-8">Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.</p>}
      {!isLoading && !error && <DataTable columns={columns} data={transactions} rowKey={(tx) => tx.id} emptyText="İşlem geçmişi yok." />}
    </div>
  );
}
