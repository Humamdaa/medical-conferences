import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, ClipboardList, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { activityFormTemplateApi } from '../../../shared/activity-forms/activity-form-template.api';
import type { ActivityFormTemplate, FormSchema } from '../../../shared/activity-forms/activity-form-template.api';
import { ApiError } from '../../../shared/api/http';
import { adminApi } from '../api/admin.api';
import type { CustomValue, SpecialistOption } from '../api/admin.api';
import { activityPayload } from '../validation/activity.validation';
import type { ActivityForm } from '../validation/activity.validation';

const initialForm: ActivityForm = {
  name: '', activityType: 'Conference', startAt: '', endAt: '', location: '', institution: '',
  description: '', points: '0', specialistId: '', latitude: '', longitude: '',
};

function errorText(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'انتهت الجلسة. احتفظ ببياناتك قبل تسجيل الدخول مجدداً.';
    if (error.status === 403) return 'إنشاء الأنشطة متاح للمدير فقط. تحقق من صلاحيات الحساب.';
    if (error.status === 404) return 'الاختصاص المحدد لم يعد موجوداً. أعد تحميل الاختصاصات واختر قيمة صالحة.';
    if (error.status === 503) return 'نموذج المشرف غير متاح. اطلب من المسؤول تهيئته ثم أعد المحاولة.';
    if (error.status === 409) return 'نموذج المشرف تغيّر. بياناتك ما زالت محفوظة هنا؛ حمّل النسخة الأحدث وراجعها قبل الإنشاء.';
    if (error.status === 0) return 'تعذّر الاتصال. لم نحذف بياناتك. إذا حدث الخطأ أثناء الإنشاء، تحقق من قائمة الأنشطة في تبويب آخر قبل إعادة الإرسال لتجنب التكرار.';
  }
  return error instanceof Error ? error.message : 'تعذّر إكمال الطلب.';
}

export function AdminCreateActivityPage() {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<ActivityFormTemplate | null>(null);
  const [specialists, setSpecialists] = useState<SpecialistOption[]>([]);
  const [form, setForm] = useState<ActivityForm>(initialForm);
  const [values, setValues] = useState<Record<string, CustomValue>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conflict, setConflict] = useState(false);
  const [candidate, setCandidate] = useState<ActivityFormTemplate | null>(null);
  const [archivedDrafts, setArchivedDrafts] = useState<{ version: number; fieldsSchema: FormSchema; customFields: Record<string, CustomValue> }[]>([]);
  const busy = useRef(false);
  const mounted = useRef(false);
  const schema = template?.fieldsSchema;

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    Promise.all([activityFormTemplateApi.get(controller.signal), adminApi.specialists(controller.signal)])
      .then(([current, options]) => { if (!controller.signal.aborted) { setTemplate(current); setSpecialists(options); } })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(errorText(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { mounted.current = false; controller.abort(); };
  }, []);

  async function loadInitial() {
    if (busy.current) return;
    busy.current = true; setLoading(true); setError('');
    try {
      const [current, options] = await Promise.all([activityFormTemplateApi.get(), adminApi.specialists()]);
      if (mounted.current) { setTemplate(current); setSpecialists(options); }
    } catch (reason) { if (mounted.current) setError(errorText(reason)); }
    finally { busy.current = false; if (mounted.current) setLoading(false); }
  }

  async function reloadTemplate() {
    if (busy.current) return;
    busy.current = true; setLoading(true); setError('');
    try { const current = await activityFormTemplateApi.get(); if (mounted.current) setCandidate(current); }
    catch (reason) { if (mounted.current) setError(errorText(reason)); }
    finally { busy.current = false; if (mounted.current) setLoading(false); }
  }

  function adoptTemplate() {
    if (!candidate || !template || !window.confirm('ستبقى البيانات الأساسية، وسنحتفظ بنسخة للقراءة من قيمك الإضافية السابقة. يجب إعادة تعبئة الحقول الإضافية حسب النموذج الجديد. هل تريد المتابعة؟')) return;
    setArchivedDrafts((current) => [...current, { version: template.version, fieldsSchema: template.fieldsSchema, customFields: { ...values } }]);
    setValues({}); setTemplate(candidate); setCandidate(null); setConflict(false); setError('');
  }

  async function refreshSpecialists() {
    if (busy.current) return;
    busy.current = true; setLoading(true);
    try { const options = await adminApi.specialists(); if (mounted.current) { setSpecialists(options); setError(''); } }
    catch (reason) { if (mounted.current) setError(errorText(reason)); }
    finally { busy.current = false; if (mounted.current) setLoading(false); }
  }

  function update(key: keyof ActivityForm, value: string) { setForm((current) => ({ ...current, [key]: value })); setError(''); }
  function updateCustom(name: string, value: CustomValue) { setValues((current) => ({ ...current, [name]: value })); setError(''); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!template || loading || busy.current || conflict) return;
    setError('');
    try {
      const payload = activityPayload(form, template, values, specialists);
      busy.current = true; setSaving(true);
      const created = await adminApi.createActivity(payload);
      if (mounted.current) navigate(`/admin/activities/${created.id}`, { replace: true });
    } catch (reason) {
      if (mounted.current) { setError(errorText(reason)); if (reason instanceof ApiError && reason.status === 409) setConflict(true); }
    } finally { busy.current = false; if (mounted.current) setSaving(false); }
  }

  return (
    <div className="admin-page">
      <Link to="/admin/activities" className="admin-back"><ArrowRight size={18} /> العودة إلى الأنشطة</Link>
      <div className="admin-page-heading">
        <div><span className="admin-eyebrow">إدارة الأنشطة</span><h1>إنشاء نشاط جديد</h1><p>أدخل معلومات النشاط وعبّئ الحقول التي يحددها المشرف.</p></div>
        <span className="admin-heading-icon"><ClipboardList size={26} /></span>
      </div>
      {loading && <div className="admin-alert admin-alert--info" role="status">جارٍ تحميل النموذج والاختصاصات...</div>}
      {error && <div className="admin-alert admin-alert--error" role="alert">{error}</div>}
      {!template && !loading && <button type="button" className="admin-button" onClick={() => void loadInitial()}>إعادة التحميل</button>}
      {conflict && <section className="admin-panel admin-detail-panel" role="alert">
        <h2>تغيّر نموذج المشرف — راجع النسخة الجديدة</h2>
        <p>لم نحذف بياناتك. الإنشاء متوقف حتى مراجعة النموذج واعتماده. المعلومات الأساسية ستبقى كما هي.</p>
        <button type="button" className="admin-button admin-button--outline" disabled={loading || saving} onClick={() => void reloadTemplate()}>تحميل النموذج الأحدث للمراجعة</button>
        {candidate && <div>
          <p>الإصدار الأحدث: {candidate.version} · {candidate.fieldsSchema.fields.length} حقول إضافية.</p>
          <details><summary>عرض تعريف الحقول الجديدة</summary><pre className="admin-draft-json" dir="ltr">{JSON.stringify(candidate.fieldsSchema, null, 2)}</pre></details>
          <button type="button" className="admin-button" disabled={loading || saving} onClick={adoptTemplate}>اعتماد النسخة الجديدة وإعادة تعبئة الحقول الإضافية</button>
        </div>}
      </section>}
      {archivedDrafts.map((draft, index) => <details className="admin-panel admin-detail-panel" key={index}>
        <summary>نسخة محفوظة من مسودتك السابقة — الإصدار {draft.version}</summary>
        <p className="admin-muted">للمراجعة والنسخ اليدوي فقط؛ لن نرسل هذه القيم تلقائياً مع النموذج الجديد.</p>
        <pre className="admin-draft-json" dir="ltr">{JSON.stringify(draft, null, 2)}</pre>
      </details>)}
      {template && <p className="admin-muted">نموذج المشرف — الإصدار {template.version}. التواريخ تُدخل حسب المنطقة الزمنية لجهازك وتُرسل بتوقيت UTC.</p>}
      <form onSubmit={submit} className="admin-create-form">
        <fieldset disabled={loading || saving || !template} className="admin-create-fieldset">
          <legend className="admin-sr-only">بيانات النشاط</legend>
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
              <input maxLength={200} required value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="مثال: دمشق" />
            </label>
            <label className="admin-field">الجهة المنظمة *
              <input maxLength={200} required value={form.institution} onChange={(e) => update('institution', e.target.value)} placeholder="مثال: وزارة الصحة" />
            </label>
            <label className="admin-field">الاختصاص الطبي *
              <select required value={form.specialistId} onChange={(e) => update('specialistId', e.target.value)}>
                <option value="">اختر الاختصاص...</option>
                {specialists.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
              <button type="button" className="admin-text-link" onClick={() => void refreshSpecialists()}>تحديث الاختصاصات</button>
              {specialists.length === 0 && <small>لا توجد اختصاصات متاحة. اطلب إضافة اختصاص ثم أعد فتح الصفحة.</small>}
            </label>
            <label className="admin-field">النقاط *
              <input type="number" min="0" max="2147483647" step="1" required value={form.points} onChange={(e) => update('points', e.target.value)} />
            </label>
            <label className="admin-field">خط العرض (اختياري)
              <input type="number" min="-90" max="90" step="0.0000001" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} dir="ltr" />
            </label>
            <label className="admin-field">خط الطول (اختياري)
              <input type="number" min="-180" max="180" step="0.0000001" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} dir="ltr" />
            </label>
            <label className="admin-field admin-field--full">وصف النشاط *
              <textarea maxLength={10000} rows={4} required value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="تفاصيل النشاط العلمي..." />
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
                    <textarea maxLength={10000} required={field.required} rows={3} value={String(values[field.name] ?? '')} onChange={(e) => updateCustom(field.name, e.target.value)} />
                  ) : field.type === 'select' ? (
                    <select required={field.required} value={String(values[field.name] ?? '')} onChange={(e) => updateCustom(field.name, e.target.value)}>
                      <option value="">اختر...</option>
                      {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <span className="admin-checkbox-input"><input type="checkbox" required={field.required} checked={values[field.name] === true} onChange={(e) => updateCustom(field.name, e.target.checked)} /> نعم</span>
                  ) : (
                    <input maxLength={field.type === 'text' ? 200 : undefined} type={field.type} required={field.required} step={field.type === 'number' ? 'any' : undefined} value={String(values[field.name] ?? '')} onChange={(e) => updateCustom(field.name, e.target.value)} />
                  )}
                </label>
              ))}
            </div>
          ) : (
            <div className="admin-alert admin-alert--info">
              {template ? 'النموذج المنشور لا يحتوي حقولاً إضافية.' : 'يجب تحميل النموذج المنشور قبل إنشاء النشاط.'}
            </div>
          )}
        </section>

        <div className="admin-form-footer">
          <button type="submit" disabled={saving || loading || !template || conflict || specialists.length === 0} className="admin-button"><Save size={18} /> {saving ? 'جارٍ إنشاء النشاط...' : 'إنشاء النشاط'}</button>
          <Link to="/admin/activities" className="admin-button admin-button--outline">إلغاء</Link>
        </div>
        </fieldset>
      </form>
    </div>
  );
}
