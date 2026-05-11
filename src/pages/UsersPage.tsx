import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword, getWarehouses } from '../api';
import type { User, Role, Warehouse } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SearchInput from '../components/ui/SearchInput';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';

type FormData = { username: string; email: string; password: string; role: Role; active: boolean; warehouseId: string };
type UserUpdatePayload = Partial<User> & { warehouseId?: number | null };
const blank: FormData = { username: '', email: '', password: '', role: 'STAFF', active: true, warehouseId: '' };

export default function UsersPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<User | null>(null);
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

  const refetch = () => qc.invalidateQueries({ queryKey: ['users'] });

  const addMut = useMutation({ mutationFn: (d: FormData) => createUser(d), onSuccess: () => { refetch(); setModal(null); } });
  const editMut = useMutation({ mutationFn: (d: UserUpdatePayload) => updateUser(selected!.id, d), onSuccess: () => { refetch(); setModal(null); } });
  const delMut = useMutation({ mutationFn: (id: number) => deleteUser(id), onSuccess: refetch });
  const resetMut = useMutation({
    mutationFn: (id: number) => resetUserPassword(id).then(r => r.data.tempPassword),
    onSuccess: (pw) => { setTempPassword(pw); setCopied(false); setModal('reset'); },
  });

  const openAdd = () => { setForm(blank); setApiError(''); setModal('add'); };
  const openEdit = () => {
    if (!selected) return;
    setForm({ username: selected.username, email: selected.email, password: '', role: selected.role, active: selected.active, warehouseId: selected.warehouse?.id?.toString() ?? '' });
    setApiError('');
    setModal('edit');
  };
  const handleDelete = () => {
    if (!selected) return;
    if (!confirm(`"${selected.username}" silinsin mi?`)) return;
    delMut.mutate(selected.id);
    setSelected(null);
  };

  const submit = async () => {
    setApiError('');
    try {
      if (modal === 'add') await addMut.mutateAsync(form);
      else if (modal === 'edit') await editMut.mutateAsync({
        username: form.username, email: form.email, role: form.role, active: form.active,
        warehouseId: form.warehouseId ? parseInt(form.warehouseId) : null,
      });
    } catch (e: unknown) {
      setApiError((e as { response?: { data?: string } }).response?.data ?? 'Hata oluştu.');
    }
  };

  const columns: Column<User>[] = [
    { key: 'username',  header: 'KULLANICI ADI' },
    { key: 'email',     header: 'E-POSTA' },
    { key: 'role',      header: 'ROL' },
    { key: 'warehouse', header: 'DEPO', render: (u) => u.warehouse?.name ?? <span className="text-muted">—</span> },
    { key: 'active',    header: 'DURUM', render: (u) => <span className={u.active ? 'text-green' : 'text-red'}>{u.active ? 'AKTİF' : 'PASİF'}</span> },
  ];

  if (isLoading) return <p className="text-muted font-vt text-xl">Yükleniyor...</p>;

  return (
    <div>
      <PageHeader title="KULLANICILAR" search={<SearchInput value={search} onChange={setSearch} />}>
        <Button onClick={openAdd}>+ EKLE</Button>
        <Button variant="secondary" onClick={openEdit} disabled={!selected || selected.role === 'ADMIN'}>DÜZENLE</Button>
        <Button variant="secondary" onClick={() => selected && resetMut.mutate(selected.id)} disabled={!selected || selected.role === 'ADMIN'}>ŞİFRE SIFIRLA</Button>
        <Button variant="danger" onClick={handleDelete} disabled={!selected || selected.role === 'ADMIN'}>SİL</Button>
      </PageHeader>

      <DataTable columns={columns} data={displayed} rowKey={u => u.id} onRowClick={setSelected} selectedId={selected?.id} />

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'KULLANICI EKLE' : 'KULLANICI DÜZENLE'} onClose={() => setModal(null)}
          footer={<><Button variant="secondary" onClick={() => setModal(null)}>İPTAL</Button><Button onClick={submit}>KAYDET</Button></>}>
          <div className="flex flex-col gap-3">
            <Input label="KULLANICI ADI" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
            <Input label="E-POSTA" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            {modal === 'add' && <Input label="ŞİFRE" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />}
            <div className="flex flex-col gap-1">
              <label className="text-muted font-pixel text-xs">ROL</label>
              <select className="input-field" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))}>
                <option value="STAFF">STAFF</option>
                <option value="MANAGER">MANAGER</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-muted font-pixel text-xs">DEPO</label>
              <select className="input-field" value={form.warehouseId} onChange={e => setForm(p => ({ ...p, warehouseId: e.target.value }))}>
                <option value="">Depo Yok (Admin)</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
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
