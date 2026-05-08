import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api';
import PageHeader from '../components/ui/PageHeader';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function avatarLetters(username: string) {
  return username.slice(0, 2).toUpperCase();
}

const roleLabel: Record<string, string> = {
  ADMIN:   'YÖNETİCİ',
  MANAGER: 'MÜDÜR',
  STAFF:   'PERSONEL',
};

const roleColor: Record<string, string> = {
  ADMIN:   'text-accent border-accent',
  MANAGER: 'text-accent2 border-accent2',
  STAFF:   'text-blue border-blue',
};

export default function ProfilePage() {
  const { user, login } = useAuth();

  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  if (!user) return null;

  const colorClass = roleColor[user.role] ?? 'text-muted border-muted';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (next !== confirm) { setError('Yeni şifreler eşleşmiyor.'); return; }
    if (next.length < 6)  { setError('Şifre en az 6 karakter olmalı.'); return; }

    setLoading(true);
    try {
      await changePassword(next);
      if (user) login(user.token, user.username, user.role, false, user.warehouseId, user.warehouseName);
      setSuccess('Şifre başarıyla güncellendi.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: unknown) {
      setError((err as { response?: { data?: string } }).response?.data ?? 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="PROFİL" />

      {/* Kullanıcı kartı */}
      <div className="card flex items-center gap-6">
        <div className={`w-16 h-16 flex-shrink-0 flex items-center justify-center border-2 bg-bg-panel font-pixel text-lg ${colorClass}`}>
          {avatarLetters(user.username)}
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-vt text-3xl text-text-white">{user.username}</span>
          <span className={`font-pixel border px-2 py-0.5 inline-block w-fit ${colorClass}`} style={{ fontSize: '8px' }}>
            {roleLabel[user.role] ?? user.role}
          </span>
          {user.warehouseName && (
            <span className="font-vt text-lg text-muted">
              DEPO: {user.warehouseName}
            </span>
          )}
        </div>
      </div>

      {/* Şifre değiştirme */}
      <div className="card flex flex-col gap-4">
        <span className="font-pixel text-muted" style={{ fontSize: '9px' }}>ŞİFRE DEĞİŞTİR</span>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
          <Input
            label="MEVCUT ŞİFRE"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
          <Input
            label="YENİ ŞİFRE"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
          <Input
            label="YENİ ŞİFRE (TEKRAR)"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          {error   && <p className="font-vt text-red text-lg">{error}</p>}
          {success && <p className="font-vt text-green text-lg">{success}</p>}

          <Button type="submit" disabled={loading} className="self-start">
            {loading ? 'KAYDEDİLİYOR...' : 'KAYDET'}
          </Button>
        </form>
      </div>
    </div>
  );
}
