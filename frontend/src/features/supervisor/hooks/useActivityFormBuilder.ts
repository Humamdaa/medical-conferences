import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../shared/api/http';
import { activityFormTemplateApi } from '../api/activity-form-template.api';
import type { ActivityFormTemplate, FieldType, FormSchema } from '../api/activity-form-template.api';

export type DraftField = { id: string; name: string; label: string; type: FieldType; required: boolean; options: string };
function draft(schema: FormSchema): DraftField[] {
  return schema.fields.map((field) => ({ ...field, id: crypto.randomUUID(), options: (field.options ?? []).join('\n') }));
}

export function schemaFromDraft(fields: DraftField[]): FormSchema {
  return { fields: fields.map(({ name, label, type, required, options }) => ({
    name, label: label.trim(), type, required,
    ...(type === 'select' ? { options: options.split('\n').map((option) => option.trim()) } : {}),
  })) };
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'انتهت الجلسة. احتفظ بمسودتك قبل تسجيل الدخول مجدداً.';
    if (error.status === 403) return 'لا تملك صلاحية الوصول أو الحفظ. احتفظ بمسودتك وتحقق من حساب المشرف.';
    if (error.status === 503) return 'النموذج المشترك غير متاح حالياً. اطلب من المسؤول تهيئته ثم أعد المحاولة.';
    if (error.status === 409) return 'حفظ مشرف آخر نسخة أحدث. مسودتك محفوظة في هذه الصفحة. انسخ JSON للاحتفاظ بها قبل تحميل النسخة الجديدة.';
    if (error.status === 400) return `لم يقبل الخادم تعريف الحقول: ${error.message}`;
    if (error.status === 0) return 'تعذّر الاتصال بالخادم. تحقق من الاتصال ثم أعد المحاولة؛ لم نحذف مسودتك.';
  }
  return error instanceof Error ? error.message : 'تعذّر تحميل النموذج أو حفظه. أعد المحاولة.';
}

export function useActivityFormBuilder() {
  const [fields, setFields] = useState<DraftField[]>([]);
  const [template, setTemplate] = useState<ActivityFormTemplate | null>(null);
  const [baseline, setBaseline] = useState('[]');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [conflict, setConflict] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(false);
  const dirty = template !== null && JSON.stringify(fields) !== baseline;

  function apply(value: ActivityFormTemplate) {
    const next = draft(value.fieldsSchema);
    setFields(next); setBaseline(JSON.stringify(next)); setTemplate(value); setConflict(false);
  }

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    activityFormTemplateApi.get(controller.signal)
      .then((value) => { if (!controller.signal.aborted) apply(value); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(errorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { mounted.current = false; controller.abort(); };
  }, []);

  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    // BrowserRouter has no data-router blocker. Confirm ordinary link navigation
    // and logout locally without changing the shared router/auth architecture.
    const navigate = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest('a[href], button.supervisor-logout');
      if (!target) return;
      if (target instanceof HTMLAnchorElement && (target.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) return;
      if (!window.confirm('لديك تغييرات غير محفوظة أو قيد الحفظ. هل تريد مغادرة الصفحة وفقدان المسودة؟')) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigate, true); };
  }, [dirty, saving]);

  async function reload() {
    if (busy.current || (dirty && !window.confirm('تحميل النسخة المنشورة سيحذف مسودتك الحالية بعد نجاح التحميل. هل تريد المتابعة؟'))) return;
    busy.current = true; setLoading(true); setError(''); setSuccess('');
    try { const value = await activityFormTemplateApi.get(); if (mounted.current) apply(value); }
    catch (reason) { if (mounted.current) setError(errorMessage(reason)); }
    finally { busy.current = false; if (mounted.current) setLoading(false); }
  }

  async function save(schema: FormSchema) {
    if (!template || busy.current || conflict) return;
    busy.current = true; setSaving(true); setError(''); setSuccess('');
    try {
      const value = await activityFormTemplateApi.save(template.version, schema);
      if (mounted.current) { apply(value); setSuccess(`تم حفظ النموذج ونشره بنجاح — الإصدار ${value.version}.`); }
    } catch (reason) {
      if (mounted.current) {
        setError(errorMessage(reason));
        if (reason instanceof ApiError && reason.status === 409) setConflict(true);
      }
    } finally { busy.current = false; if (mounted.current) setSaving(false); }
  }

  function edit(next: DraftField[]) { setFields(next); setSuccess(''); }
  return { fields, edit, template, loading, saving, error, success, conflict, dirty, reload, save };
}
