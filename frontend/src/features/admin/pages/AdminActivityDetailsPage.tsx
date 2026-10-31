import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../api/admin.api';
import type { AdminActivityDetails } from '../api/admin.api';
import { findLocalActivity } from '../../../shared/activity-forms/localActivityData';

type FieldDefinition = { name?: string; label?: string };

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function fieldLabels(snapshot: unknown) {
  const definitions = Array.isArray(snapshot) ? snapshot : asObject(snapshot)?.fields;
  const labels = new Map<string, string>();
  if (Array.isArray(definitions)) {
    for (const value of definitions) {
      const field = asObject(value) as FieldDefinition | null;
      if (typeof field?.name === 'string') labels.set(field.name, field.label || field.name);
    }
  }
  return labels;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (Array.isArray(value)) return value.map(displayValue).join('، ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function displayDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'تاريخ غير متاح';
  return new Intl.DateTimeFormat('ar-SY', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

export function AdminActivityDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<AdminActivityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (id?.startsWith('local-')) {
      const local = findLocalActivity(id);
      if (local) { setActivity(local); setError(''); }
      else { setActivity(null); setError('تعذّر العثور على النشاط التجريبي في هذا المتصفح.'); }
      setLoading(false);
      return;
    }
    if (!id || !/^[1-9]\d*$/.test(id)) {
      setError('معرّف النشاط غير صالح.'); setLoading(false); return;
    }
    setError(''); setLoading(true);
    adminApi.getActivity(id)
      .then((data) => { if (active) setActivity(data); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'تعذّر تحميل النشاط.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const values = asObject(activity?.customFields);
  const labels = fieldLabels(activity?.formSchemaSnapshot);

  return (
    <div className="admin-page">
      <Link to="/admin/activities" className="admin-back"><ArrowRight size={18} /> العودة إلى الأنشطة</Link>
      {loading ? <p className="admin-muted">جارٍ تحميل تفاصيل النشاط...</p> : error ? <div className="admin-alert admin-alert--error" role="alert">{error}</div> : activity && (
        <>
          <div className="admin-page-heading"><div><span className="admin-eyebrow">تفاصيل النشاط</span><h1>{activity.name}</h1><p>{activity.institution}</p>{id?.startsWith('local-') && <div className="admin-alert admin-alert--info">نشاط تجريبي محفوظ محلياً فقط — لم يُرسل إلى قاعدة البيانات.</div>}</div><span className="admin-heading-icon"><CalendarDays size={26} /></span></div>
          <section className="admin-panel admin-detail-panel"><h2>المعلومات الأساسية</h2>
            <div className="admin-detail-grid">
              <div><small>نوع النشاط</small><strong>{activity.activityType}</strong></div>
              <div><small>الاختصاص</small><strong>{activity.specialist.name}</strong></div>
              <div><small>بداية النشاط</small><strong>{displayDate(activity.startAt)}</strong></div>
              <div><small>نهاية النشاط</small><strong>{displayDate(activity.endAt)}</strong></div>
              <div><small>الموقع</small><strong><MapPin size={14} /> {activity.location}</strong></div>
              <div><small>النقاط</small><strong>{activity.points} نقطة</strong></div>
            </div>
          </section>
          <section className="admin-panel admin-detail-panel"><h2>وصف النشاط</h2><p className="admin-description">{activity.description || 'لا يوجد وصف.'}</p></section>
          {values && Object.keys(values).length > 0 && (
            <section className="admin-panel admin-detail-panel"><h2>الحقول الإضافية</h2>
              <div className="admin-detail-grid">
                {Object.entries(values).map(([key, value]) => (
                  <div key={key}><small>{labels.get(key) || key}</small><strong>{displayValue(value)}</strong></div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
