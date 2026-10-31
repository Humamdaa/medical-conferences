import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import type { AdminActivityList } from '../api/admin.api';
import { loadLocalActivities } from '../../../shared/activity-forms/localActivityData';

const formatter = new Intl.DateTimeFormat('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' });
function showDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'تاريخ غير متاح' : formatter.format(date);
}

export function AdminActivitiesPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AdminActivityList | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localActivities] = useState(loadLocalActivities);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    adminApi.listActivities(page)
      .then((data) => { if (active) setResult(data); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'تعذّر تحميل الأنشطة.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  const activities = (result?.items ?? []).filter((activity) =>
    `${activity.name} ${activity.institution} ${activity.location} ${activity.specialist.name}`
      .toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">إدارة المحتوى</span><h1>الأنشطة العلمية</h1><p>استعرض أنشطة قاعدة البيانات وأنشئ مسودة نشاط تجريبي.</p></div><Link to="/admin/activities/new" className="admin-button"><Plus size={18} /> إضافة نشاط</Link></div>
      {localActivities.length > 0 && (
        <section className="admin-demo-section">
          <h2>أنشطة تجريبية محفوظة في المتصفح ({localActivities.length})</h2>
          <div className="admin-activity-grid">
            {localActivities.map((activity) => (
              <article className="admin-panel admin-activity-card" key={activity.id}>
                <div className="admin-card-top"><span className="admin-chip">محلي فقط · {activity.activityType}</span><span className="admin-point-chip">{activity.points} نقطة</span></div>
                <h2>{activity.name}</h2><p className="admin-muted">{activity.institution}</p>
                <div className="admin-card-meta"><span><CalendarDays size={16} /> {showDate(activity.startAt)}</span><span><MapPin size={16} /> {activity.location}</span></div>
                <div className="admin-card-bottom"><span>{activity.specialist.name}</span><Link to={`/admin/activities/${activity.id}`} className="admin-text-link">عرض التجربة <ChevronLeft size={17} /></Link></div>
              </article>
            ))}
          </div>
        </section>
      )}
      <div className="admin-list-toolbar">
        <div><strong>{result?.total ?? '—'}</strong><span> نشاط في قاعدة البيانات</span></div>
        <label className="admin-search"><Search size={18} /><input aria-label="البحث ضمن الصفحة الحالية" placeholder="ابحث بالاسم أو الجهة أو الموقع..." value={search} onChange={(e) => setSearch(e.target.value)} /></label>
      </div>
      {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
      {loading ? <p className="admin-muted">جارٍ تحميل الأنشطة...</p> : activities.length === 0 ? (
        <div className="admin-panel admin-empty">لا توجد أنشطة مطابقة في هذه الصفحة.</div>
      ) : (
        <div className="admin-activity-grid">
          {activities.map((activity) => (
            <article className="admin-panel admin-activity-card" key={activity.id}>
              <div className="admin-card-top"><span className="admin-chip">{activity.activityType}</span><span className="admin-point-chip">{activity.points} نقطة</span></div>
              <h2>{activity.name}</h2><p className="admin-muted">{activity.institution}</p>
              <div className="admin-card-meta"><span><CalendarDays size={16} /> {showDate(activity.startAt)}</span><span><MapPin size={16} /> {activity.location}</span></div>
              <div className="admin-card-bottom"><span>{activity.specialist.name}</span><Link to={`/admin/activities/${activity.id}`} className="admin-text-link">عرض التفاصيل <ChevronLeft size={17} /></Link></div>
            </article>
          ))}
        </div>
      )}
      {result && result.totalPages > 1 && (
        <div className="admin-pagination"><button type="button" onClick={() => setPage((p) => p - 1)} disabled={loading || page === 1}><ChevronRight size={16} /> السابق</button><span>صفحة {page} من {result.totalPages}</span><button type="button" onClick={() => setPage((p) => p + 1)} disabled={loading || page === result.totalPages}>التالي <ChevronLeft size={16} /></button></div>
      )}
      <p className="admin-footnote">البحث يعمل على الأنشطة الموجودة في الصفحة الحالية فقط.</p>
    </div>
  );
}
