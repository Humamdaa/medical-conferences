import { useEffect, useState } from 'react';
import { Activity, CalendarDays, CheckCircle2, CircleAlert, ClipboardList, LogOut, Menu, Stethoscope, UserRound, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
import { doctorApi } from '../api/doctor.api';
import type { DoctorProfile } from '../api/doctor.api';

export interface DoctorOutletContext {
  profile: DoctorProfile;
  updateProfile: (profile: DoctorProfile) => void;
}

export function DoctorLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    doctorApi.profile().then(data => { if (active) setProfile(data); })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'تعذّر تحميل الملف'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  async function logout() {
    try { await signOut(); navigate('/login', { replace: true }); }
    catch { setError('تعذّر تسجيل الخروج. حاول مرة أخرى.'); }
  }

  const doctorName = profile
    ? [profile.firstName, profile.fatherName, profile.lastName]
      .filter(Boolean)
      .join(' ')
    : user?.firstName ?? 'دكتور';

  return (
    <div className="doctor-shell" dir="rtl">
      {menuOpen && <button aria-label="إغلاق القائمة" className="doctor-overlay" onClick={() => setMenuOpen(false)} />}
      <aside className={`doctor-sidebar ${menuOpen ? 'doctor-sidebar--open' : ''}`}>
        <div className="doctor-brand"><span className="doctor-brand-icon"><Activity size={24} /></span><div><strong>MEDCON</strong><small>بوابة الطبيب</small></div><button className="doctor-menu-close" onClick={() => setMenuOpen(false)} aria-label="إغلاق"><X size={19} /></button></div>
        <p className="doctor-side-label">المساحة الشخصية</p>
        <nav aria-label="تنقل الطبيب" className="doctor-nav">
          <NavLink to="/doctor/profile" onClick={() => setMenuOpen(false)} className={({ isActive }) => `doctor-nav-link ${isActive ? 'doctor-nav-link--active' : ''}`}><UserRound size={20} /> ملفي الشخصي</NavLink>
          <NavLink to="/doctor/activities" onClick={() => setMenuOpen(false)} className={({ isActive }) => `doctor-nav-link ${isActive ? 'doctor-nav-link--active' : ''}`}><CalendarDays size={20} /> الأنشطة العلمية</NavLink>
        </nav>
        <div className="doctor-sidebar-bottom">
          <div className="doctor-help"><Stethoscope size={22} /><strong>تجربتك المهنية تبدأ هنا</strong><p>أكمل بياناتك لتكون جاهزاً للأنشطة القادمة.</p></div>
          <button className="doctor-logout" type="button" onClick={logout}><LogOut size={18} /> تسجيل الخروج</button>
        </div>
      </aside>
      <div className="doctor-workspace">
        <header className="doctor-topbar">
          <div className="doctor-topbar-start"><button className="doctor-menu-button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><Menu size={23} /></button><div><span className="doctor-breadcrumb">منصة المؤتمرات الطبية / بوابة الطبيب</span><strong>أهلاً بعودتك، {doctorName}</strong></div></div>
          <div className="doctor-topbar-end"><span className={`doctor-profile-pill ${profile?.isComplete ? 'is-complete' : ''}`}>{profile?.isComplete ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />} {profile?.isComplete ? 'ملف مكتمل' : 'ملف يحتاج إكمال'}</span><span className="doctor-avatar">{(user?.firstName ?? 'ط').slice(0, 1)}</span></div>
        </header>
        <main className="doctor-main">
          {error && <div className="doctor-error" role="alert"><CircleAlert size={19} /> {error}</div>}
          {busy ? <div className="doctor-loading"><ClipboardList size={30} /> جارٍ تحميل بياناتك...</div>
            : profile ? <Outlet context={{ profile, updateProfile: setProfile } satisfies DoctorOutletContext} />
              : <div className="doctor-error">تعذّر التحقق من اكتمال الملف الشخصي. لا يمكن تفعيل التسجيل دون هذه المعلومات.</div>}
        </main>
      </div>
    </div>
  );
}
