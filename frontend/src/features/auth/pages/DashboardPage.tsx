import { useEffect, useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import type { CurrentUser } from '../api/auth.api';

// Minimal session verification page; replace with the real dashboard later.
export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    authApi.me()
      .then((data) => { if (active) setUser(data); })
      .catch((reason: unknown) => {
        if (!active) return;
        if (reason && typeof reason === 'object' && 'status' in reason && reason.status === 401) {
          navigate('/login', { replace: true });
        } else {
          setError('تعذّر تحميل بيانات المستخدم.');
        }
      });
    return () => { active = false; };
  }, [navigate]);

  async function logout() {
    setIsLoggingOut(true);
    setError('');
    try {
      await authApi.logout();
      navigate('/login', { replace: true });
    } catch {
      setError('تعذّر تسجيل الخروج. حاول مرة أخرى.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="dashboard">
      <section className="dashboard__card">
        <span className="dashboard__icon"><ShieldCheck size={28} /></span>
        <p className="dashboard__eyebrow">تم الاتصال بنجاح</p>
        <h1>{user ? `مرحباً، ${user.firstName} ${user.lastName}` : 'جارٍ تحميل حسابك...'}</h1>
        {user && <p className="dashboard__caption">الدور: {user.role} · {user.email}</p>}
        <p className="dashboard__description">هذه شاشة مؤقتة للتأكد من عمل Login وSession وGET /auth/me. سنستبدلها بلوحة التحكم لاحقاً.</p>
        {error && <p className="notice notice--error" role="alert">{error}</p>}
        <button className="button button--primary" type="button" onClick={logout} disabled={isLoggingOut || !user}>
          <span>{isLoggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}</span><LogOut size={18} />
        </button>
      </section>
    </main>
  );
}
