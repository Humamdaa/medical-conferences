import { useState } from 'react';
import { ClipboardCopy, Eye, LayoutTemplate, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { formSchema } from '../../../shared/activity-forms/activity-form-template.api';
import type { FieldType } from '../../../shared/activity-forms/activity-form-template.api';
import { schemaFromDraft, useActivityFormBuilder } from '../hooks/useActivityFormBuilder';
import type { DraftField } from '../hooks/useActivityFormBuilder';
import { FixedActivityFields } from '../components/FixedActivityFields';
import { FormPreviewDialog } from '../components/FormPreviewDialog';

const types: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'نص' }, { value: 'number', label: 'رقم' },
  { value: 'date', label: 'تاريخ' }, { value: 'textarea', label: 'نص طويل' },
  { value: 'select', label: 'قائمة خيارات' }, { value: 'checkbox', label: 'مربع اختيار' },
];

export function SupervisorFieldsPage() {
  const { fields, edit, template, loading, saving, error, success, conflict, dirty, reload, save } = useActivityFormBuilder();
  const [preview, setPreview] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const schema = schemaFromDraft(fields);
  const validation = formSchema.safeParse(schema);
  const valid = validation.success;
  const busy = loading || saving;

  function addField() {
    let number = 1;
    while (fields.some((field) => field.name === `field_${number}`)) number++;
    edit([...fields, { id: crypto.randomUUID(), name: `field_${number}`, label: '', type: 'text', required: false, options: '' }]);
  }
  function updateField(id: string, change: Partial<DraftField>) {
    edit(fields.map((field) => field.id === id ? { ...field, ...change } : field));
  }
  async function copy() {
    try { await navigator.clipboard.writeText(JSON.stringify(schema, null, 2)); setCopyMessage('تم نسخ المسودة بصيغة JSON.'); }
    catch { setCopyMessage('تعذّر النسخ. افتح المعاينة وانسخ نص JSON يدوياً.'); }
  }

  return (
    <div className="supervisor-page">
      <div className="supervisor-page-heading"><div><span className="supervisor-eyebrow">النموذج المشترك للأنشطة</span><h1>الحقول الديناميكية</h1><p>عرّف الحقول الإضافية التي يستخدمها المدير. الحفظ ينشر النموذج لجميع المشرفين.</p></div><span className="supervisor-heading-icon"><LayoutTemplate size={26} /></span></div>
      <FixedActivityFields />
      {loading && <div className="supervisor-alert supervisor-alert--info" role="status">جارٍ تحميل النسخة المنشورة...</div>}
      {error && <div className="supervisor-alert supervisor-alert--error" role="alert">{error}
        <div className="supervisor-builder-actions"><button type="button" className="supervisor-button supervisor-button--outline" disabled={busy} onClick={() => void reload()}><RefreshCw size={16} /> {template ? 'تحميل النسخة المنشورة' : 'إعادة المحاولة'}</button>
          {template && <button type="button" className="supervisor-button supervisor-button--outline" onClick={() => void copy()}><ClipboardCopy size={16} /> نسخ مسودتي</button>}
        </div>
      </div>}
      {success && <div className="supervisor-alert supervisor-alert--success" role="status">{success}</div>}
      {template && <section className="supervisor-panel supervisor-builder-panel" aria-busy={busy}>
        <div className="supervisor-panel-title-row"><div><h2>الحقول القابلة للتخصيص</h2><p>{fields.length} / 100 حقول · الإصدار المحمّل {template.version}</p></div>
          <span className={`supervisor-draft-status${dirty ? ' is-dirty' : ''}`} role="status">{saving ? 'جارٍ الحفظ...' : dirty ? 'تغييرات غير محفوظة' : 'مطابق للنسخة المحمّلة'}</span>
        </div>
        <div className="supervisor-builder-actions"><button id="supervisor-preview-trigger" type="button" className="supervisor-button supervisor-button--outline" onClick={() => setPreview(true)}><Eye size={17} /> معاينة النموذج</button>
          <button type="button" className="supervisor-button supervisor-button--outline" disabled={busy} onClick={() => void reload()}><RefreshCw size={16} /> تحميل النسخة المنشورة</button>
        </div>
        <fieldset className="supervisor-editor-fields" disabled={busy}>
          <legend className="supervisor-sr-only">تعريف الحقول الديناميكية</legend>
          {fields.length === 0 && <div className="supervisor-empty supervisor-builder-empty">النموذج لا يحتوي حقولاً إضافية. يمكنك نشره كما هو أو إضافة حقل.</div>}
          {fields.map((field, index) => (
            <div className="supervisor-field-editor" key={field.id}>
              <div className="supervisor-field-editor-title"><strong><span className="supervisor-field-number">{index + 1}</span> {field.label || 'حقل جديد'}</strong><button type="button" className="supervisor-icon-danger" title="حذف الحقل" aria-label={`حذف الحقل ${index + 1}`} onClick={() => { edit(fields.filter((item) => item.id !== field.id)); }}><Trash2 size={18} /></button></div>
              <div className="supervisor-two-columns">
                <label className="supervisor-field">اسم الحقل المعروض
                  <input maxLength={200} value={field.label} placeholder="مثال: اسم المشفى" onChange={(e) => updateField(field.id, { label: e.target.value })} />
                </label>
                <label className="supervisor-field">الاسم البرمجي (name)
                  <input maxLength={64} dir="ltr" value={field.name} placeholder="hospital_name" onChange={(e) => updateField(field.id, { name: e.target.value })} />
                </label>
                <label className="supervisor-field">نوع الحقل
                  <select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}>
                    {types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <label className="supervisor-field supervisor-checkbox-field"><input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} /> حقل مطلوب</label>
              </div>
              {field.type === 'select' && <label className="supervisor-field">الخيارات — خيار واحد في كل سطر (حتى 100 خيار)
                <textarea rows={3} value={field.options} placeholder={'الخيار الأول\nالخيار الثاني'} onChange={(e) => updateField(field.id, { options: e.target.value })} />
              </label>}
            </div>
          ))}

          <div className="supervisor-builder-actions"><button type="button" className="supervisor-button" disabled={fields.length >= 100} onClick={addField}><Plus size={17} /> إضافة حقل</button>
            {fields.length > 0 && <button type="button" className="supervisor-button supervisor-button--outline" onClick={() => { if (window.confirm('هل تريد حذف جميع الحقول الإضافية من المسودة؟')) edit([]); }}>حذف جميع الحقول</button>}
          </div>
        </fieldset>
        {!valid && <div className="supervisor-schema-warning" role="alert">راجع الحقول قبل الحفظ: عنوان غير فارغ (حتى 200 حرف)، واسم فريد (حتى 64 حرفاً) يبدأ بحرف إنجليزي صغير ويتبعه أحرف صغيرة أو أرقام أو _. الاسمان constructor وprototype محجوزان. القوائم تحتاج 1–100 خيار فريد وغير فارغ، كل خيار حتى 200 حرف وفي سطر منفصل.</div>}
        {conflict && <p className="supervisor-schema-warning">الحفظ متوقف حتى تحميل النسخة الأحدث ومراجعة مسودتك. انسخ المسودة قبل إعادة التحميل إذا أردت دمجها يدوياً.</p>}
        <div className="supervisor-save-bar"><p className="supervisor-muted">{dirty ? 'التغييرات في هذه الصفحة لم تُنشر بعد.' : 'الحفظ يحدّث النموذج المشترك ولا يغيّر مخططات الأنشطة السابقة.'}</p>
          <button type="button" className="supervisor-button" disabled={busy || !valid || conflict || !dirty || template.version >= 2147483647} onClick={() => void save(schema)}><Save size={17} /> {saving ? 'جارٍ الحفظ...' : 'حفظ ونشر النموذج'}</button>
        </div>
      </section>}
      {copyMessage && <p role="status" className="supervisor-muted">{copyMessage}</p>}
      {preview && template && <FormPreviewDialog schema={schema} onClose={() => setPreview(false)} />}
    </div>
  );
}
