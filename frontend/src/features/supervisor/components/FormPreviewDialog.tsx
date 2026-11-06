import { useEffect, useRef, useState } from 'react';
import { ClipboardCopy, X } from 'lucide-react';
import type { FormSchema } from '../../../shared/activity-forms/activity-form-template.api';
import { FixedActivityFields } from './FixedActivityFields';

export function FormPreviewDialog({ schema, onClose }: { schema: FormSchema; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const previous = document.getElementById('supervisor-preview-trigger') ?? document.activeElement;
    const dialog = ref.current!;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close(); document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  async function copy() {
    try { await navigator.clipboard.writeText(JSON.stringify(schema, null, 2)); setMessage('تم نسخ JSON.'); }
    catch { setMessage('تعذّر النسخ. حدد النص في قسم JSON وانسخه يدوياً.'); }
  }
  return <dialog ref={ref} className="supervisor-preview-dialog" dir="rtl" aria-labelledby="form-preview-title" aria-describedby="form-preview-description" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="supervisor-preview-header"><h2 id="form-preview-title">معاينة النموذج</h2>
      <button autoFocus type="button" className="supervisor-button supervisor-button--outline" onClick={onClose} aria-label="إغلاق المعاينة"><X size={18} /></button>
    </header>
    <p id="form-preview-description" className="supervisor-muted">معاينة المسودة الحالية فقط. يمكنك تجربة الحقول؛ القيم المدخلة هنا لا تُحفظ.</p>
    <FixedActivityFields />
    <div className="supervisor-preview-form">
      {schema.fields.length === 0 && <p className="supervisor-empty">لا توجد حقول إضافية في هذه المسودة.</p>}
      {schema.fields.map((field, index) => <label className="supervisor-field" key={index}>
        <span>{index + 1}. {field.label || 'حقل دون عنوان'} {field.required && <span className="supervisor-required">*</span>}</span>
        {field.type === 'textarea' ? <textarea rows={3} /> : field.type === 'select' ? <select defaultValue=""><option value="">اختر...</option>{field.options?.map((option, i) => <option key={i}>{option}</option>)}</select> : <input type={field.type} className={field.type === 'checkbox' ? 'supervisor-preview-checkbox' : undefined} />}
      </label>)}
    </div>
    <details><summary>مخطط JSON للمسودة</summary><pre className="supervisor-schema-code" dir="ltr">{JSON.stringify(schema, null, 2)}</pre></details>
    <div className="supervisor-builder-actions"><button type="button" className="supervisor-button supervisor-button--outline" onClick={copy}><ClipboardCopy size={16} /> نسخ JSON</button><button type="button" className="supervisor-button" onClick={onClose}>إغلاق المعاينة</button></div>
    {message && <p role="status" className="supervisor-muted">{message}</p>}
  </dialog>;
}
