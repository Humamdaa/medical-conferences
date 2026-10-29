import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CircleAlert, Clock3, GraduationCap, MapPin, Search, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { activitiesApi } from '../api/activities.api';
import type { ActivityListResponse, ActivitySummary } from '../api/activities.api';
import { useDoctorProfile } from '../hooks/useDoctorProfile';

const dateFormatter = new Intl.DateTimeFormat('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('ar-SY', { hour: '2-digit', minute: '2-digit' });

function ActivityCard({ activity, profileComplete }: {activity: ActivitySummary; profileComplete: boolean}) {
  const hasEnded = new Date(activity.endAt).getTime() < Date.now();
  return <article className="doctor-activity-card">
    <div className="doctor-activity-card-top"><span className="doctor-activity-type">{activity.activityType}</span><span className={hasEnded ? 'doctor-activity-state past' : 'doctor-activity-state'}>{hasEnded ? 'منتهٍ' : 'قادم'}</span></div>
    <div className="doctor-activity-emblem"><GraduationCap size={27}/></div>
    <h3>{activity.name}</h3><p className="doctor-activity-org">{activity.institution}</p>
    <div className="doctor-activity-info"><span><CalendarDays size={16}/> {dateFormatter.format(new Date(activity.startAt))}</span><span><Clock3 size={16}/> {timeFormatter.format(new Date(activity.startAt))}</span><span><MapPin size={16}/> {activity.location}</span></div>
    <div className="doctor-activity-footer"><span className="doctor-specialist-tag">{activity.specialist.name}</span><span className="doctor-points">{activity.points} نقطة</span></div>
    <div className="doctor-activity-actions">
      <button disabled title={profileComplete ? 'التسجيل قيد التطوير' : 'أكمل ملفك الشخصي أولاً'}>حاضر</button>
      <button disabled title={profileComplete ? 'التسجيل قيد التطوير' : 'أكمل ملفك الشخصي أولاً'}>مشارك</button>
    </div>
    <small className="doctor-activity-status-note">{profileComplete ? 'التسجيل سيتاح في النسخة القادمة' : 'يجب إكمال الملف الشخصي قبل إتاحة التسجيل'}</small>
  </article>;
}

export function DoctorActivitiesPage() {
  const { profile } = useDoctorProfile();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ActivityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    activitiesApi.list(page).then(data => { if (alive) setResult(data); })
      .catch((e: unknown) => { if (alive) setError(e instanceof Error ? e.message : 'تعذّر تحميل الأنشطة'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [page]);
  const items = result?.items.filter(a => `${a.name} ${a.institution} ${a.specialist.name}`.toLowerCase().includes(search.toLowerCase())) ?? [];
  return <div className="doctor-content">
    <div className="doctor-page-head"><div><span className="doctor-overline">الفعاليات والتعليم المستمر</span><h1>الأنشطة <span className="doctor-title-accent">العلمية</span></h1><p>استعرض الأنشطة والمؤتمرات الطبية وأحدث الفرص العلمية.</p></div><div className="doctor-head-mark"><CalendarDays size={30}/></div></div>
    {!profile.isComplete && <div className="doctor-completion-banner"><span className="doctor-banner-icon"><CircleAlert size={23}/></span><div><strong>ملفك الشخصي غير مكتمل</strong><p>يلزم إكمال بياناتك الأساسية قبل السماح بالتسجيل في أي نشاط عند تفعيل خدمة التسجيل.</p></div><Link to="/doctor/profile" className="doctor-banner-action">إكمال الملف <ArrowLeft size={17}/></Link></div>}
    {profile.isComplete && <div className="doctor-info-banner"><CircleAlert size={20}/><p>ملفك مكتمل. التسجيل بصفة <strong>حاضر</strong> أو <strong>مشارك</strong> لم يُفعّل في Backend بعد، لذلك الأزرار معطلة حالياً.</p></div>}
    <div className="doctor-activities-toolbar"><div><h2>استكشف الأنشطة</h2><p>{result ? `${result.total} نشاط في قاعدة البيانات` : 'قائمة الأنشطة الطبية'}</p></div><label className="doctor-search"><Search size={19}/><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الجهة أو الاختصاص..." aria-label="البحث في هذه الصفحة" /></label></div>
    {error && <div className="doctor-alert danger" role="alert">{error}</div>}
    {loading ? <div className="doctor-loading"><Clock3 size={25}/> جارٍ تحميل الأنشطة...</div> : items.length ? <div className="doctor-activities-grid">{items.map(item => <ActivityCard key={item.id} activity={item} profileComplete={profile.isComplete}/>)}</div> : <div className="doctor-empty"><UsersRound size={36}/><h3>لا توجد أنشطة مطابقة</h3><p>{search ? 'جرّب كلمة بحث مختلفة. البحث الحالي ضمن هذه الصفحة فقط.' : 'لم تتم إضافة أنشطة إلى قاعدة البيانات بعد.'}</p></div>}
    {result && result.totalPages > 1 && <div className="doctor-pagination"><button disabled={page<=1 || loading} onClick={() => setPage(p=>p-1)}>السابق</button><span>صفحة {page} من {result.totalPages}</span><button disabled={page>=result.totalPages || loading} onClick={()=>setPage(p=>p+1)}>التالي</button></div>}
  </div>;
}
