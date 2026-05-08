import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import logo from '../resources/logo.png';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
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

        {sent ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="font-pixel text-accent text-xs">MAIL GÖNDERİLDİ</p>
            <p className="font-vt text-text-primary text-lg leading-relaxed">
              E-posta adresiniz kayıtlıysa geçici şifreniz gönderildi. Gelen kutunuzu kontrol edin.
            </p>
            <Link to="/login" className="font-pixel text-xs text-muted hover:text-accent transition-colors mt-2">
              GİRİŞ SAYFASINA DÖN
            </Link>
          </div>
        ) : (
          <>
            <p className="font-pixel text-accent text-xs mb-1">ŞİFRE SIFIRLAMA</p>
            <p className="font-vt text-muted text-base mb-6 leading-relaxed">
              Kayıtlı e-posta adresinizi girin. Geçici şifreniz mail olarak gönderilecektir.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="E-POSTA"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
              {error && <p className="text-red font-vt text-base">{error}</p>}
              <Button type="submit" disabled={loading} className="mt-2">
                {loading ? 'GÖNDERİLİYOR...' : 'SIFIRLA'}
              </Button>
            </form>

            <div className="text-center mt-4">
              <Link to="/login" className="font-pixel text-xs text-muted hover:text-accent transition-colors">
                GİRİŞ SAYFASINA DÖN
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
