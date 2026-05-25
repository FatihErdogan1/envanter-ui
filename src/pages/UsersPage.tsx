import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, KeyRound } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword, getWarehouses, getSuppliers } from '../api';
import { extractApiError } from '../utils/errorUtils';
import type { User, Role, Warehouse, Supplier } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SearchInput from '../components/ui/SearchInput';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';

type FormData = { username: string; email: string; password: string; role: Role; active: boolean; warehouseId: string; supplierId: string };
type UserUpdatePayload = Partial<User> & { warehouseId?: number | null; supplierId?: number | null };
const blank: FormData = { username: '', email: '', password: '', role: 'STAFF', active: true, warehouseId: '', supplierId: '' };

export default function UsersPage() {
  const qc = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | 'reset' | null>(null);
  const [form, setForm] = useState<FormData>(blank);
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState('');
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => getUsers().then(r => r.data) });
  const filteredUsers = users.filter(u => u.role !== 'ADMIN');
  const displayed = useMemo(() => {
    const q = search.toLowerCase();
    return q ? filteredUsers.filter(u =>
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.warehouse?.name ?? '').toLowerCase().includes(q)
    ) : filteredUsers;
  }, [filteredUsers, search]);
  const { data: warehouses = [] } = useQuery<Warehouse[]>({ queryKey: ['warehouses'], queryFn: () => getWarehouses().then(r => r.data) });
  const { data: suppliers = [] } = useQuery<Supplier[]>({ queryKey: ['suppliers'], queryFn: () => getSuppliers().then(r => r.data) });

  const refetch = () => qc.invalidateQueries({ queryKey: ['users'] });

  const addMut   = useMutation({ mutationFn: (d: FormData) => createUser(d), onSuccess: () => { refetch(); setModal(null); }, onError: (e: unknown) => setApiError(extractApiError(e, 'Kullanıcı eklenemedi.')) });
  const editMut  = useMutation({ mutationFn: (d: UserUpdatePayload) => updateUser(editingUser!.id, d), onSuccess: () => { refetch(); setModal(null); }, onError: (e: unknown) => setApiError(extractApiError(e, 'Kullanıcı güncellenemedi.')) });
  const delMut   = useMutation({ mutationFn: (id: number) => deleteUser(id), onSuccess: refetch, onError: (e: unknown) => setApiError(extractApiError(e, 'Kullanıcı silinemedi.')) });
  const resetMut = useMutation({
    mutationFn: (id: number) => resetUserPassword(id).then(r => r.data.tempPassword),
    onSuccess: (pw) => { setTempPassword(pw); setCopied(false); setModal('reset'); },
    onError: (e: unknown) => setApiError(extractApiError(e, 'Şifre sıfırlanamadı.')),
  });

  const openAdd = () => { setForm(blank); setApiError(''); setModal('add'); };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({ username: u.username, email: u.email, password: '', role: u.role, active: u.active, warehouseId: u.warehouse?.id?.toString() ?? '', supplierId: u.supplier?.id?.toString() ?? '' });
    setApiError('');
    setModal('edit');
  };

  const handleDelete = (u: User) => {
    if (!confirm(`"${u.username}" silinsin mi?`)) return;
    delMut.mutate(u.id);
  };

  const submit = async () => {
    setApiError('');
    try {
      if (modal === 'add') await addMut.mutateAsync(form);
      else if (modal === 'edit') await editMut.mutateAsync({
        username: form.username, email: form.email, role: form.role, active: form.active,
        warehouseId: form.warehouseId ? parseInt(form.warehouseId) : null,
        supplierId: form.supplierId ? parseInt(form.supplierId) : null,
      });
    } catch (e: unknown) {
      setApiError(extractApiError(e, 'Hata oluştu.'));
    }
  };

  const iconBtnBase = 'p-1.5 border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  const columns: Column<User>[] = [
    { key: 'username',  header: 'KULLANICI ADI' },
    { key: 'email',     header: 'E-POSTA' },
    { key: 'role',      header: 'ROL' },
    { key: 'warehouse', header: 'DEPO / TEDARİKÇİ', render: (u) => u.role === 'SUPPLIER' ? (u.supplier?.name ?? <span className="text-muted">—</span>) : (u.warehouse?.name ?? <span className="text-muted">—</span>) },
    { key: 'active',    header: 'DURUM', render: (u) => <span className={u.active ? 'text-green' : 'text-red'}>{u.active ? 'AKTİF' : 'PASİF'}</span> },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div className="flex gap-1 items-center" onClick={e => e.stopPropagation()}>
          <button
            title="Düzenle" aria-label="Düzenle"
            onClick={() => openEdit(u)}
            className={`${iconBtnBase} border-accent text-accent hover:bg-accent hover:text-bg-primary`}
          >
            <Pencil size={14} />
          </button>
          <button
            title="Şifre Sıfırla" aria-label="Şifre Sıfırla"
            onClick={() => resetMut.mutate(u.id)}
            className={`${iconBtnBase} border-yellow text-yellow hover:bg-yellow hover:text-bg-primary`}
          >
            <KeyRound size={14} />
          </button>
          <button
            title="Sil" aria-label="Sil"
            onClick={() => handleDelete(u)}
            className={`${iconBtnBase} border-red text-red hover:bg-red hover:text-bg-primary`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader title="KULLANICILAR" search={<SearchInput value={search} onChange={setSearch} />}>
        <Button onClick={openAdd}>+ EKLE</Button>
      </PageHeader>

      <DataTable columns={columns} data={displayed} rowKey={u => u.id} />

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'KULLANICI EKLE' : 'KULLANICI DÜZENLE'} onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button><Button onClick={submit}>KAYDET</Button></>}>
          <div className="flex flex-col gap-3">
            <Input label="KULLANICI ADI" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
            <Input label="E-POSTA" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            {modal === 'add' && <Input label="ŞİFRE" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />}
            <div className="flex flex-col gap-1">
              <label className="text-muted font-pixel text-xs">ROL</label>
              <select className="input-field" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role, supplierId: '', warehouseId: '' }))}>
                <option value="STAFF">STAFF</option>
                <option value="MANAGER">MANAGER</option>
                <option value="SUPPLIER">TEDARİKÇİ</option>
              </select>
            </div>
            {form.role === 'SUPPLIER' ? (
              <div className="flex flex-col gap-1">
                <label className="text-muted font-pixel text-xs">TEDARİKÇİ</label>
                <select className="input-field" value={form.supplierId} onChange={e => setForm(p => ({ ...p, supplierId: e.target.value }))}>
                  <option value="">— Tedarikçi seçiniz —</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="text-muted font-pixel text-xs">DEPO</label>
                <select className="input-field" value={form.warehouseId} onChange={e => setForm(p => ({ ...p, warehouseId: e.target.value }))}>
                  <option value="">— Depo seçiniz —</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}
            {modal === 'edit' && (
              <label className="flex items-center gap-2 font-vt text-lg cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
                <span>AKTİF</span>
              </label>
            )}
            {apiError && <p className="text-red font-vt">{apiError}</p>}
          </div>
        </Modal>
      )}

      {modal === 'reset' && (
        <Modal title="GEÇİCİ ŞİFRE" onClose={() => setModal(null)}
          footer={<Button onClick={() => setModal(null)}>KAPAT</Button>}>
          <p className="font-vt text-lg text-text-primary mb-3">Kullanıcı bir sonraki girişte şifresini değiştirmek zorunda kalacak.</p>
          <div className="flex gap-2">
            <input readOnly value={tempPassword} className="input-field flex-1 font-pixel text-xs text-accent" />
            <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(tempPassword); setCopied(true); }}>
              {copied ? 'KOPYALANDI ✔' : 'KOPYALA'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
