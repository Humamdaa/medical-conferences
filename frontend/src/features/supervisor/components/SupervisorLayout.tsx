import { useState } from 'react';
import { Activity, LayoutTemplate, LogOut, Menu, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';

export function SupervisorLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  async function logout() {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      setLogoutError('تعذّر تسجيل الخروج. حاول مجدداً.');
    }
  }

  return (
    <div className="supervisor-shell" dir="rtl">
      {menuOpen && (
        <button
          type="button"
          className="supervisor-overlay"
          aria-label="إغلاق القائمة"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`supervisor-sidebar${menuOpen ? ' supervisor-sidebar--open' : ''}`}>
        <div className="supervisor-brand">
          <span className="supervisor-brand-icon"><Activity size={23} /></span>
          <div><strong>MEDCON</strong><small>لوحة المشرف</small></div>
          <button className="supervisor-mobile-close" type="button" aria-label="إغلاق" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        </div>

        <span className="supervisor-side-caption">إعداد نماذج الأنشطة</span>
        <nav className="supervisor-navigation" aria-label="صفحات المشرف">
          <NavLink
            to="/supervisor/fields"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => `supervisor-nav-link${isActive ? ' is-active' : ''}`}
          >
            <LayoutTemplate size={19} /> الحقول الديناميكية
          </NavLink>
        </nav>

        <div className="supervisor-sidebar-bottom">
          <div className="supervisor-sidebar-note">
            يقوم المشرف بتعريف الحقول. يقوم المدير بتعبئتها عند إنشاء النشاط.
          </div>
          <button type="button" className="supervisor-logout" onClick={logout}>
            <LogOut size={18} /> تسجيل الخروج
          </button>
          {logoutError && <p className="supervisor-error" role="alert">{logoutError}</p>}
        </div>
      </aside>

      <div className="supervisor-workspace">
        <header className="supervisor-topbar">
          <div className="supervisor-header-identity">
            <button className="supervisor-menu-toggle" type="button" aria-label="فتح القائمة" onClick={() => setMenuOpen(true)}><Menu size={23} /></button>
            <div><small>منصة المؤتمرات الطبية / الإشراف</small><strong>مرحباً، {fullName || 'مشرف'}</strong></div>
          </div>
          <div className="supervisor-header-right">
            <span className="supervisor-role-pill">مشرف المنصة</span>
            <span className="supervisor-avatar">{(user?.firstName || 'م').slice(0, 1)}</span>
          </div>
        </header>
        <main className="supervisor-main"><Outlet /></main>
      </div>
    </div>
  );
}
