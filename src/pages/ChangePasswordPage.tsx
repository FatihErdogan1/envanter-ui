import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import logo from '../resources/logo.png';

export default function ChangePasswordPage() {
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) { setError('Şifreler eşleşmiyor.'); return; }
    setLoading(true);
    try {
      await changePassword(newPassword);
      // forcePasswordChange artık false, user state'ini güncelle
      if (user) login(user.token, user.username, user.role, false, user.warehouseId, user.warehouseName);
      navigate('/', { replace: true });
    } catch (e: unknown) {
      setError((e as { response?: { data?: string } }).response?.data ?? 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="bg-bg-surface border border-border w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="inventory.io" className="w-40 mx-auto" />
        </div>

        <p className="font-pixel text-accent text-xs mb-1">ŞİFRE DEĞİŞTİR</p>
        <p className="font-vt text-muted text-base mb-6 leading-relaxed">
          Güvenliğiniz için yeni bir şifre belirlemeniz gerekmektedir.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="YENİ ŞİFRE"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoFocus
            required
          />
          <Input
            label="YENİ ŞİFRE (TEKRAR)"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error && <p className="text-red font-vt text-base">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? 'KAYDEDİLİYOR...' : 'KAYDET'}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={logout}
            className="font-pixel text-xs text-muted hover:text-red transition-colors"
          >
            ÇIKIŞ YAP
          </button>
        </div>
      </div>
    </div>
  );
}
