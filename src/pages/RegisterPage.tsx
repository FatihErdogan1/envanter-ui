import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import logo from '../resources/logo.png';

export default function RegisterPage() {
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return; }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      setSuccess(true);
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

        {success ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="font-pixel text-accent text-xs">KAYIT BAŞARILI</p>
            <p className="font-vt text-text-primary text-lg leading-relaxed">
              Hesabınız oluşturuldu. Yönetici onayının ardından giriş yapabilirsiniz.
            </p>
            <Link to="/login" className="font-pixel text-xs text-muted hover:text-accent transition-colors mt-2">
              GİRİŞ SAYFASINA DÖN
            </Link>
          </div>
        ) : (
          <>
            <p className="font-pixel text-accent text-xs mb-6">KAYIT OL</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="KULLANICI ADI"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                required
              />
              <Input
                label="E-POSTA"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Input
                label="ŞİFRE"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Input
                label="ŞİFRE (TEKRAR)"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              <p className="font-vt text-muted text-sm leading-relaxed -mt-1">
                En az 8 karakter, büyük/küçük harf, rakam ve özel karakter içermelidir.
              </p>
              {error && <p className="text-red font-vt text-base">{error}</p>}
              <Button type="submit" disabled={loading} className="mt-1">
                {loading ? 'KAYDEDİLİYOR...' : 'KAYIT OL'}
              </Button>
            </form>

            <div className="text-center mt-4">
              <Link to="/login" className="font-pixel text-xs text-muted hover:text-accent transition-colors">
                ZATEN HESABIM VAR
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
