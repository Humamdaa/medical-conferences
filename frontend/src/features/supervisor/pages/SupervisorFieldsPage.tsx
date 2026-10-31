import { useState } from 'react';
import { ClipboardCopy, LayoutTemplate, Plus, Save, Trash2 } from 'lucide-react';
import { loadSupervisorSchema, saveSupervisorSchema } from '../../../shared/activity-forms/localActivityData';

type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox';
type DraftField = {
  id: number;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string;
};

const types: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'نص' },
  { value: 'number', label: 'رقم' },
  { value: 'date', label: 'تاريخ' },
  { value: 'textarea', label: 'نص طويل' },
  { value: 'select', label: 'قائمة خيارات' },
  { value: 'checkbox', label: 'مربع اختيار' },
];

export function SupervisorFieldsPage() {
  const [fields, setFields] = useState<DraftField[]>(() =>
    (loadSupervisorSchema()?.fields ?? []).map((field, index) => ({
      id: index + 1,
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      options: (field.options ?? []).join(', '),
    })),
  );
  const [copyMessage, setCopyMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  function addField() {
    setFields((current) => {
      const id = current.reduce((max, field) => Math.max(max, field.id), 0) + 1;
      return [...current, {
        id, name: `field_${id}`, label: '', type: 'text', required: false, options: '',
      }];
    });
    setCopyMessage('');
    setSaveMessage('');
  }

  function updateField(id: number, change: Partial<DraftField>) {
    setFields((current) => current.map((field) => field.id === id ? { ...field, ...change } : field));
    setCopyMessage('');
    setSaveMessage('');
  }

  const invalidNames = fields.some((field) => !/^[a-z][a-z0-9_]*$/.test(field.name));
  const duplicateNames = new Set(fields.map((field) => field.name)).size !== fields.length;
  const missingLabels = fields.some((field) => !field.label.trim());
  const invalidOptions = fields.some((field) => field.type === 'select' && !field.options.split(',').some((option) => option.trim()));
  const valid = !invalidNames && !duplicateNames && !missingLabels && !invalidOptions;

  const schema = {
    fields: fields.map((field) => ({
      name: field.name,
      label: field.label.trim(),
      type: field.type,
      required: field.required,
      ...(field.type === 'select' ? { options: field.options.split(',').map((option) => option.trim()).filter(Boolean) } : {}),
    })),
  };

  function saveDemoSchema() {
    if (!valid) return;
    try {
      saveSupervisorSchema(schema);
      setSaveMessage('تم حفظ الحقول محلياً. يمكن للمدير تعبئتها عند إنشاء نشاط جديد من المتصفح نفسه.');
    } catch {
      setSaveMessage('تعذّر حفظ الحقول في هذا المتصفح.');
    }
  }

  async function copySchema() {
    if (!valid) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
      setCopyMessage('تم نسخ مخطط الحقول.');
    } catch {
      setCopyMessage('تعذّر النسخ التلقائي. يمكنك نسخ النص من المعاينة.');
    }
  }

  return (
    <div className="supervisor-page">
      <div className="supervisor-page-heading"><div><span className="supervisor-eyebrow">مصمم النماذج</span><h1>الحقول الديناميكية</h1><p>أضف أو عدّل أو احذف الحقول وشاهد شكل النموذج مباشرة.</p></div><span className="supervisor-heading-icon"><LayoutTemplate size={26} /></span></div>
      <div className="supervisor-alert supervisor-alert--info"><strong>نسخة تجريبية (Frontend only)</strong> — اضغط «حفظ الحقول محلياً» لمشاركتها مع صفحة المدير داخل هذا المتصفح فقط. لا يتم حفظ شيء في قاعدة البيانات.</div>
      <div className="supervisor-builder-layout">
        <section className="supervisor-panel supervisor-builder-panel">
          <div className="supervisor-panel-title-row"><div><h2>إعداد الحقول</h2><p>{fields.length} حقول في المسودة الحالية</p></div><button type="button" className="supervisor-button" onClick={addField}><Plus size={17} /> إضافة حقل</button></div>
          {fields.length === 0 && <div className="supervisor-empty supervisor-builder-empty">لم تتم إضافة أي حقول بعد. اضغط «إضافة حقل» للبدء.</div>}
          {fields.map((field, index) => (
            <div className="supervisor-field-editor" key={field.id}>
              <div className="supervisor-field-editor-title"><strong>الحقل {index + 1}</strong><button type="button" className="supervisor-icon-danger" title="حذف الحقل" aria-label={`حذف الحقل ${index + 1}`} onClick={() => { setFields((current) => current.filter((item) => item.id !== field.id)); setSaveMessage(''); }}><Trash2 size={18} /></button></div>
              <div className="supervisor-two-columns">
                <label className="supervisor-field">اسم الحقل المعروض
                  <input value={field.label} placeholder="مثال: اسم المشفى" onChange={(e) => updateField(field.id, { label: e.target.value })} />
                </label>
                <label className="supervisor-field">الاسم البرمجي (name)
                  <input dir="ltr" value={field.name} placeholder="hospital_name" onChange={(e) => updateField(field.id, { name: e.target.value })} />
                </label>
                <label className="supervisor-field">نوع الحقل
                  <select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}>
                    {types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <label className="supervisor-field supervisor-checkbox-field"><input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} /> حقل مطلوب</label>
              </div>
              {field.type === 'select' && <label className="supervisor-field">الخيارات (افصل بينها بفاصلة)
                <input value={field.options} placeholder="الخيار الأول, الخيار الثاني" onChange={(e) => updateField(field.id, { options: e.target.value })} />
              </label>}
            </div>
          ))}
          {fields.length > 0 && <div className="supervisor-form-footer"><button type="button" className="supervisor-button supervisor-button--outline" onClick={() => { setFields([]); setSaveMessage(''); }}>حذف جميع الحقول</button></div>}
        </section>
        <section className="supervisor-panel supervisor-builder-panel">
          <h2>معاينة النموذج</h2><p className="supervisor-muted">هذه معاينة فقط ولا يمكن تقديمها أو حفظها.</p>
          <div className="supervisor-preview-form">
            {fields.length === 0 && <div className="supervisor-empty">ستظهر الحقول المضافة هنا.</div>}
            {fields.map((field) => (
              <label className="supervisor-field" key={field.id}>{field.label || 'حقل دون عنوان'} {field.required && <span className="supervisor-required">*</span>}
                {field.type === 'textarea' ? <textarea disabled placeholder="نص طويل" /> :
                  field.type === 'select' ? <select disabled><option>اختر...</option>{field.options.split(',').filter((option) => option.trim()).map((option, index) => <option key={`${option}-${index}`}>{option.trim()}</option>)}</select> :
                  field.type === 'checkbox' ? <input className="supervisor-preview-checkbox" type="checkbox" disabled /> :
                  <input type={field.type} disabled placeholder="معاينة الحقل" />}
              </label>
            ))}
          </div>
          <div className="supervisor-schema-header"><h3>معاينة مخطط JSON</h3><button className="supervisor-button supervisor-button--outline" disabled={!valid} type="button" onClick={copySchema}><ClipboardCopy size={15} /> نسخ JSON</button></div>
          {fields.length > 0 && !valid && <p className="supervisor-schema-warning">أدخل عنواناً لكل حقل، واستخدم أسماء برمجية فريدة تبدأ بحرف إنجليزي وتحتوي على أحرف صغيرة أو أرقام أو _ فقط. القوائم تحتاج خياراً واحداً على الأقل.</p>}
          <pre className="supervisor-schema-code" dir="ltr">{JSON.stringify(schema, null, 2)}</pre>
          {copyMessage && <p className="supervisor-muted" role="status">{copyMessage}</p>}
          <div className="supervisor-form-footer"><button className="supervisor-button" type="button" disabled={!valid} onClick={saveDemoSchema}><Save size={17} /> حفظ الحقول محلياً</button></div>
          {saveMessage && <p className="supervisor-muted" role="status">{saveMessage}</p>}
        </section>
      </div>
    </div>
  );
}
