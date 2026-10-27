import type { ReactNode } from 'react';
import { CalendarDays, ClipboardCheck, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthShellProps {
  heading: string;
  subheading: string;
  children: ReactNode;
}

export function AuthShell({ heading, subheading, children }: AuthShellProps) {
  return (
    <main className="auth-page">
      <div className="auth-frame">
        <aside className="hero-panel" aria-label="عن المنصة">
          <Link to="/login" className="brand brand--light">
            <span className="brand__logo"><ShieldCheck size={22} strokeWidth={2.2} /></span>
            <span className="brand__text"><strong>MEDCON</strong><small>منصة المؤتمرات الطبية</small></span>
          </Link>
          <div className="hero-panel__ambient hero-panel__ambient--one" />
          <div className="hero-panel__ambient hero-panel__ambient--two" />
          <div className="hero-panel__content">
            <span className="eyebrow"><Sparkles size={15} /> نظام ذكي لتنظيم الأنشطة الطبية</span>
            <h2>كل ما تحتاجه لإدارة<br /><em>مؤتمرات طبية استثنائية.</em></h2>
            <p>من التسجيل وتنظيم المشاركين إلى متابعة الحضور وإصدار الشهادات، تجربة أكثر وضوحاً في مكان واحد.</p>
            <div className="feature-list">
              <div><span><CalendarDays size={19} /></span><div><strong>إدارة الأنشطة</strong><small>تنظيم الفعاليات ومتابعة تفاصيلها</small></div></div>
              <div><span><UsersRound size={19} /></span><div><strong>تسجيل المشاركين</strong><small>تجربة تسجيل منظمة وسهلة</small></div></div>
              <div><span><ClipboardCheck size={19} /></span><div><strong>متابعة الحضور</strong><small>بيانات واضحة قابلة للمتابعة</small></div></div>
            </div>
          </div>
          <div className="hero-panel__footer"><span className="hero-panel__dot" /> المنصة الطبية الرقمية</div>
        </aside>
        <section className="form-panel" aria-label={heading}>
          <div className="form-panel__mobile-brand">
            <span className="brand__logo"><ShieldCheck size={20} /></span>
            <span>MEDCON</span>
          </div>
          <div className="form-content">
            <div className="form-heading">
              <span className="form-heading__accent" />
              <h1>{heading}</h1>
              <p>{subheading}</p>
            </div>
            {children}
          </div>
          <div className="form-panel__footer">© منصة المؤتمرات الطبية</div>
        </section>
      </div>
    </main>
  );
}
