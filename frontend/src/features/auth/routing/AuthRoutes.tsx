import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ROLE_HOME } from './role-paths';
import type { Role } from '../api/auth.api';

function AuthPending({ error = false }: { error?: boolean }) {
  return <main dir="rtl" className="auth-pending">{error ? 'تعذّر التحقق من الجلسة؛ تحقق من الاتصال وأعد تحميل الصفحة.' : 'جارٍ التحقق من الجلسة...'}</main>;
}
export function ProtectedRoute({ role }: { role: Role }) {
  const { user, status } = useAuth();
  if (status === 'loading') return <AuthPending />;
  if (status === 'error') return <AuthPending error />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}
export function GuestRoute() {
  const { user, status } = useAuth();
  if (status === 'loading') return <AuthPending />;
  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}
export function HomeRedirect() {
  const { user, status } = useAuth();
  if (status === 'loading') return <AuthPending />;
  if (status === 'error') return <AuthPending error />;
  return <Navigate to={user ? ROLE_HOME[user.role] : '/login'} replace />;
}
