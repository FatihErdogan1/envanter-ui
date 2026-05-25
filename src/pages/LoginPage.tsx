import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { login as loginApi } from '../api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import logo from '../resources/logo.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await loginApi(username, password);
      login(data.token, data.username, data.role, data.forcePasswordChange, data.warehouseId, data.warehouseName, data.supplierId, data.supplierName);
      const redirectTo = data.forcePasswordChange ? '/change-password' : data.role === 'SUPPLIER' ? '/supplier/urunlerim' : '/';
      navigate(redirectTo, { replace: true });
    } catch {
      setError('Kullanıcı adı veya şifre hatalı.');
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="KULLANICI ADI"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
          <Input
            label="ŞİFRE"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red font-vt text-lg">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
          </Button>
        </form>

        <div className="flex justify-between mt-4">
          <Link to="/forgot-password" className="font-pixel text-xs text-muted hover:text-accent transition-colors">
            ŞİFREMİ UNUTTUM
          </Link>
          <Link to="/register" className="font-pixel text-xs text-muted hover:text-accent2 transition-colors">
            KAYIT OL
          </Link>
        </div>
      </div>
    </div>
  );
}
