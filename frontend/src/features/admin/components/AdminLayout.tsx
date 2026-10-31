import { useCallback, useState } from 'react';
import { Activity, CalendarDays, LogOut, Menu, PlusCircle, UserRound, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';

export interface AdminOutletContext {
  setDisplayName: (firstName: string, lastName: string) => void;
}

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const setDisplayName = useCallback((firstName: string, lastName: string) => {
    setName({ firstName, lastName });
  }, []);

  async function logout() {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      setLogoutError('تعذّر تسجيل الخروج. حاول مجدداً.');
    }
  }

  const navigation = [
    { to: '/admin/activities', label: 'الأنشطة العلمية', Icon: CalendarDays },
    { to: '/admin/activities/new', label: 'إضافة نشاط', Icon: PlusCircle },
    { to: '/admin/profile', label: 'ملفي الشخصي', Icon: UserRound },
  ];

  return (
    <div className="admin-shell" dir="rtl">
      {menuOpen && (
        <button className="admin-overlay" type="button" aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)} />
      )}
      <aside className={`admin-sidebar ${menuOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-brand">
          <span className="admin-brand-icon"><Activity size={23} /></span>
          <div><strong>MEDCON</strong><small>لوحة الإدارة</small></div>
          <button className="admin-mobile-close" type="button" aria-label="إغلاق" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        </div>
        <span className="admin-side-caption">إدارة المنصة</span>
        <nav className="admin-navigation" aria-label="صفحات الإدارة">
          {navigation.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/admin/activities'} onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}>
              <Icon size={19} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-note">إدارة البيانات والأنشطة العلمية من مكان واحد.</div>
          <button className="admin-logout" type="button" onClick={logout}><LogOut size={18} /> تسجيل الخروج</button>
          {logoutError && <p className="admin-error" role="alert">{logoutError}</p>}
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-header-identity">
            <button type="button" aria-label="فتح القائمة" className="admin-menu-toggle" onClick={() => setMenuOpen(true)}><Menu size={23} /></button>
            <div><small>منصة المؤتمرات الطبية / الإدارة</small><strong>مرحباً، {name.firstName} {name.lastName}</strong></div>
          </div>
          <div className="admin-header-right">
            <span className="admin-role-pill">مدير النظام</span>
            <span className="admin-avatar">{(name.firstName || 'م').slice(0, 1)}</span>
          </div>
        </header>
        <main className="admin-main">
          <Outlet context={{ setDisplayName } satisfies AdminOutletContext} />
        </main>
      </div>
    </div>
  );
}
