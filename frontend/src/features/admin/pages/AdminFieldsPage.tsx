import { useState } from 'react';
import { ClipboardCopy, LayoutTemplate, Plus, Trash2 } from 'lucide-react';

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

export function AdminFieldsPage() {
  const [fields, setFields] = useState<DraftField[]>([]);
  const [nextId, setNextId] = useState(1);
  const [copyMessage, setCopyMessage] = useState('');

  function addField() {
    setFields((current) => [...current, {
      id: nextId,
      name: `field_${nextId}`,
      label: '',
      type: 'text',
      required: false,
      options: '',
    }]);
    setNextId((id) => id + 1);
    setCopyMessage('');
  }

  function updateField(id: number, change: Partial<DraftField>) {
    setFields((current) => current.map((field) => field.id === id ? { ...field, ...change } : field));
    setCopyMessage('');
  }

  const invalidNames = fields.some((field) => !/^[a-z][a-z0-9_]*$/.test(field.name));
  const duplicateNames = new Set(fields.map((field) => field.name)).size !== fields.length;
  const missingLabels = fields.some((field) => !field.label.trim());
  const invalidOptions = fields.some((field) => field.type === 'select' && !field.options.split(',').some((option) => option.trim()));
  const valid = fields.length > 0 && !invalidNames && !duplicateNames && !missingLabels && !invalidOptions;

  const schema = {
    fields: fields.map((field) => ({
      name: field.name,
      label: field.label.trim(),
      type: field.type,
      required: field.required,
      ...(field.type === 'select' ? { options: field.options.split(',').map((option) => option.trim()).filter(Boolean) } : {}),
    })),
  };

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
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">مصمم النماذج</span><h1>الحقول الديناميكية</h1><p>أضف أو عدّل أو احذف الحقول وشاهد شكل النموذج مباشرة.</p></div><span className="admin-heading-icon"><LayoutTemplate size={26} /></span></div>
      <div className="admin-alert admin-alert--info"><strong>نسخة تجريبية (Frontend only)</strong> — التعديلات مؤقتة داخل هذه الصفحة. لا يتم حفظ الحقول في قاعدة البيانات، وستُفقد عند إعادة تحميل الصفحة.</div>
      <div className="admin-builder-layout">
        <section className="admin-panel admin-builder-panel">
          <div className="admin-panel-title-row"><div><h2>إعداد الحقول</h2><p>{fields.length} حقول في المسودة الحالية</p></div><button type="button" className="admin-button" onClick={addField}><Plus size={17} /> إضافة حقل</button></div>
          {fields.length === 0 && <div className="admin-empty admin-builder-empty">لم تتم إضافة أي حقول بعد. اضغط «إضافة حقل» للبدء.</div>}
          {fields.map((field, index) => (
            <div className="admin-field-editor" key={field.id}>
              <div className="admin-field-editor-title"><strong>الحقل {index + 1}</strong><button type="button" className="admin-icon-danger" title="حذف الحقل" aria-label={`حذف الحقل ${index + 1}`} onClick={() => setFields((current) => current.filter((item) => item.id !== field.id))}><Trash2 size={18} /></button></div>
              <div className="admin-two-columns">
                <label className="admin-field">اسم الحقل المعروض
                  <input value={field.label} placeholder="مثال: اسم المشفى" onChange={(e) => updateField(field.id, { label: e.target.value })} />
                </label>
                <label className="admin-field">الاسم البرمجي (name)
                  <input dir="ltr" value={field.name} placeholder="hospital_name" onChange={(e) => updateField(field.id, { name: e.target.value })} />
                </label>
                <label className="admin-field">نوع الحقل
                  <select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}>
                    {types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <label className="admin-field admin-checkbox-field"><input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} /> حقل مطلوب</label>
              </div>
              {field.type === 'select' && <label className="admin-field">الخيارات (افصل بينها بفاصلة)
                <input value={field.options} placeholder="الخيار الأول, الخيار الثاني" onChange={(e) => updateField(field.id, { options: e.target.value })} />
              </label>}
            </div>
          ))}
          {fields.length > 0 && <div className="admin-form-footer"><button type="button" className="admin-button admin-button--outline" onClick={() => setFields([])}>حذف جميع الحقول</button></div>}
        </section>
        <section className="admin-panel admin-builder-panel">
          <h2>معاينة النموذج</h2><p className="admin-muted">هذه معاينة فقط ولا يمكن تقديمها أو حفظها.</p>
          <div className="admin-preview-form">
            {fields.length === 0 && <div className="admin-empty">ستظهر الحقول المضافة هنا.</div>}
            {fields.map((field) => (
              <label className="admin-field" key={field.id}>{field.label || 'حقل دون عنوان'} {field.required && <span className="admin-required">*</span>}
                {field.type === 'textarea' ? <textarea disabled placeholder="نص طويل" /> :
                  field.type === 'select' ? <select disabled><option>اختر...</option>{field.options.split(',').filter((option) => option.trim()).map((option, index) => <option key={`${option}-${index}`}>{option.trim()}</option>)}</select> :
                  field.type === 'checkbox' ? <input className="admin-preview-checkbox" type="checkbox" disabled /> :
                  <input type={field.type} disabled placeholder="معاينة الحقل" />}
              </label>
            ))}
          </div>
          <div className="admin-schema-header"><h3>معاينة مخطط JSON</h3><button className="admin-button admin-button--outline" disabled={!valid} type="button" onClick={copySchema}><ClipboardCopy size={15} /> نسخ JSON</button></div>
          {fields.length > 0 && !valid && <p className="admin-schema-warning">أدخل عنواناً لكل حقل، واستخدم أسماء برمجية فريدة تبدأ بحرف إنجليزي وتحتوي على أحرف صغيرة أو أرقام أو _ فقط. القوائم تحتاج خياراً واحداً على الأقل.</p>}
          <pre className="admin-schema-code" dir="ltr">{JSON.stringify(schema, null, 2)}</pre>
          {copyMessage && <p className="admin-muted" role="status">{copyMessage}</p>}
        </section>
      </div>
    </div>
  );
}
