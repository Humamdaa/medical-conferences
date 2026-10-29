import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
export function RoleDashboard() {
  const { user, signOut } = useAuth(); const navigate = useNavigate();
  const [error, setError] = useState('');
  if (!user) return null;
  const title = user.role === 'ADMIN' ? 'لوحة الإدارة' : 'لوحة المشرف';
  return <main className="dashboard" dir="rtl"><section className="dashboard__card">
    <h1>{title}</h1><p>أهلاً {user.firstName} {user.lastName}</p>
    <p>هذه واجهة مؤقتة. صفحات الإدارة والمشرف ضمن مهام التطوير اللاحقة.</p>
    {error && <p role="alert">{error}</p>}
    <button className="button button--primary" onClick={() => signOut().then(() => navigate('/login', { replace: true })).catch(() => setError('تعذّر تسجيل الخروج'))}>تسجيل الخروج</button>
  </section></main>;
}
