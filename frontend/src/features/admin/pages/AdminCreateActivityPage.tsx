import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, ClipboardList, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  loadSupervisorSchema,
  saveLocalActivity,
} from '../../../shared/activity-forms/localActivityData';
import type { CustomValue, FormField } from '../../../shared/activity-forms/localActivityData';

type ActivityForm = {
  name: string;
  activityType: string;
  startAt: string;
  endAt: string;
  location: string;
  institution: string;
  description: string;
  points: string;
  specialistName: string;
  latitude: string;
  longitude: string;
};

const initialForm: ActivityForm = {
  name: '', activityType: 'Conference', startAt: '', endAt: '',
  location: '', institution: '', description: '', points: '0',
  specialistName: '', latitude: '', longitude: '',
};

function filledField(field: FormField, value: CustomValue | undefined): boolean {
  if (field.type === 'checkbox') return field.required ? value === true : true;
  return !field.required || (typeof value === 'string' && value.trim() !== '');
}

export function AdminCreateActivityPage() {
  const navigate = useNavigate();
  // Snapshot at page opening. Supervisor must save their draft before opening this page.
  const [schema] = useState(() => loadSupervisorSchema());
  const [form, setForm] = useState<ActivityForm>(initialForm);
  const [values, setValues] = useState<Record<string, CustomValue>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(key: keyof ActivityForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  }

  function updateCustom(name: string, value: CustomValue) {
    setValues((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (saving) return;

    const start = new Date(form.startAt);
    const end = new Date(form.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError('يجب أن يكون تاريخ النهاية بعد تاريخ البداية.');
      return;
    }
    const points = Number(form.points);
    if (!Number.isSafeInteger(points) || points < 0) {
      setError('يجب أن تكون النقاط عدداً صحيحاً غير سالب.');
      return;
    }
    const latitude = form.latitude.trim() === '' ? null : Number(form.latitude);
    const longitude = form.longitude.trim() === '' ? null : Number(form.longitude);
    if ((latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
        (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) {
      setError('قيم الإحداثيات غير صحيحة.');
      return;
    }
    if (schema?.fields.some((field) => !filledField(field, values[field.name]))) {
      setError('يرجى تعبئة جميع الحقول الإضافية المطلوبة.');
      return;
    }

    const customFields: Record<string, CustomValue> = {};
    for (const field of schema?.fields ?? []) {
      const value = values[field.name];
      if (field.type === 'checkbox') {
        customFields[field.name] = value === true;
      } else if (field.type === 'number') {
        if (value === undefined || value === '') {
          if (field.required) { setError(`يرجى إدخال ${field.label}.`); return; }
          continue;
        }
        const numberValue = Number(value);
        if (!Number.isFinite(numberValue)) {
          setError(`قيمة ${field.label} يجب أن تكون رقماً.`);
          return;
        }
        customFields[field.name] = numberValue;
      } else {
        customFields[field.name] = typeof value === 'string' ? value.trim() : '';
      }
    }

    setSaving(true);
    try {
      const draft = saveLocalActivity({
        name: form.name.trim(),
        activityType: form.activityType,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        location: form.location.trim(),
        institution: form.institution.trim(),
        description: form.description.trim(),
        points,
        latitude,
        longitude,
        specialist: { id: '', name: form.specialistName.trim() },
        customFields,
        formSchemaSnapshot: schema ?? { fields: [] },
      });
      navigate(`/admin/activities/${draft.id}`, { replace: true });
    } catch {
      setSaving(false);
      setError('تعذّر حفظ النشاط في هذا المتصفح. تحقق من مساحة التخزين المحلية.');
    }
  }

  return (
    <div className="admin-page">
      <Link to="/admin/activities" className="admin-back"><ArrowRight size={18} /> العودة إلى الأنشطة</Link>
      <div className="admin-page-heading">
        <div><span className="admin-eyebrow">إدارة الأنشطة</span><h1>إنشاء نشاط جديد</h1><p>أدخل معلومات النشاط وعبّئ الحقول التي يحددها المشرف.</p></div>
        <span className="admin-heading-icon"><ClipboardList size={26} /></span>
      </div>
      <div className="admin-alert admin-alert--info" role="note">
        <strong>واجهة تجريبية فقط.</strong> سيتم حفظ النشاط في هذا المتصفح، وليس في قاعدة البيانات.
        لن يظهر للأطباء أو للمستخدمين على أجهزة أخرى.
      </div>
      <form onSubmit={submit} className="admin-create-form">
        <section className="admin-panel admin-detail-panel">
          <h2>المعلومات الأساسية</h2>
          <div className="admin-form-grid">
            <label className="admin-field">اسم النشاط *
              <input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="مثال: مؤتمر طب القلب" maxLength={200} />
            </label>
            <label className="admin-field">نوع النشاط *
              <select required value={form.activityType} onChange={(e) => update('activityType', e.target.value)}>
                <option value="Conference">مؤتمر</option>
                <option value="Workshop">ورشة عمل</option>
                <option value="Seminar">ندوة</option>
                <option value="Other">نشاط آخر</option>
              </select>
            </label>
            <label className="admin-field">بداية النشاط *
              <input type="datetime-local" required value={form.startAt} onChange={(e) => update('startAt', e.target.value)} />
            </label>
            <label className="admin-field">نهاية النشاط *
              <input type="datetime-local" required value={form.endAt} onChange={(e) => update('endAt', e.target.value)} />
            </label>
            <label className="admin-field">الموقع *
              <input required value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="مثال: دمشق" />
            </label>
            <label className="admin-field">الجهة المنظمة *
              <input required value={form.institution} onChange={(e) => update('institution', e.target.value)} placeholder="مثال: وزارة الصحة" />
            </label>
            <label className="admin-field">الاختصاص الطبي *
              <input required value={form.specialistName} onChange={(e) => update('specialistName', e.target.value)} placeholder="اكتب اسم الاختصاص للتجربة" />
              <small>عند ربط الـ API سنستخدم الاختصاصات ومعرّفاتها من قاعدة البيانات.</small>
            </label>
            <label className="admin-field">النقاط *
              <input type="number" min="0" step="1" required value={form.points} onChange={(e) => update('points', e.target.value)} />
            </label>
            <label className="admin-field">خط العرض (اختياري)
              <input type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} dir="ltr" />
            </label>
            <label className="admin-field">خط الطول (اختياري)
              <input type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} dir="ltr" />
            </label>
            <label className="admin-field admin-field--full">وصف النشاط *
              <textarea rows={4} required value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="تفاصيل النشاط العلمي..." />
            </label>
          </div>
        </section>

        <section className="admin-panel admin-detail-panel">
          <h2>الحقول الإضافية — من نموذج المشرف</h2>
          {schema && schema.fields.length > 0 ? (
            <div className="admin-form-grid">
              {schema.fields.map((field) => (
                <label className={`admin-field ${field.type === 'textarea' ? 'admin-field--full' : ''}`} key={field.name}>
                  <span>{field.label} {field.required && <b className="admin-required">*</b>}</span>
                  {field.type === 'textarea' ? (
                    <textarea required={field.required} rows={3} value={String(values[field.name] ?? '')} onChange={(e) => updateCustom(field.name, e.target.value)} />
                  ) : field.type === 'select' ? (
                    <select required={field.required} value={String(values[field.name] ?? '')} onChange={(e) => updateCustom(field.name, e.target.value)}>
                      <option value="">اختر...</option>
                      {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <span className="admin-checkbox-input"><input type="checkbox" required={field.required} checked={values[field.name] === true} onChange={(e) => updateCustom(field.name, e.target.checked)} /> نعم</span>
                  ) : (
                    <input type={field.type} required={field.required} step={field.type === 'number' ? 'any' : undefined} value={String(values[field.name] ?? '')} onChange={(e) => updateCustom(field.name, e.target.value)} />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <div className="admin-alert admin-alert--info">
              لا توجد حقول إضافية محفوظة من المشرف في هذا المتصفح. يمكن إنشاء نشاط بالحقول الأساسية فقط.
            </div>
          )}
        </section>

        {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
        <div className="admin-form-footer">
          <button type="submit" disabled={saving} className="admin-button"><Save size={18} /> حفظ نشاط تجريبي</button>
          <Link to="/admin/activities" className="admin-button admin-button--outline">إلغاء</Link>
        </div>
      </form>
    </div>
  );
}
