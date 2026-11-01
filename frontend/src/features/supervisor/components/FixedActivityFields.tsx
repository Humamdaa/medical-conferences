import { LockKeyhole } from 'lucide-react';

// Activity's relational columns, kept separate from dynamic field definitions.
const fields = [
  ['name', 'اسم النشاط', 'نص'], ['activityType', 'نوع النشاط', 'نص'],
  ['startAt', 'بداية النشاط', 'تاريخ ووقت'], ['endAt', 'نهاية النشاط', 'تاريخ ووقت'],
  ['location', 'الموقع', 'نص'], ['institution', 'الجهة المنظمة', 'نص'],
  ['latitude', 'خط العرض', 'رقم اختياري'], ['longitude', 'خط الطول', 'رقم اختياري'],
  ['description', 'وصف النشاط', 'نص طويل'], ['points', 'النقاط', 'عدد صحيح'],
  ['specialistId', 'الاختصاص الطبي', 'مرجع الاختصاص'],
];
const systemFields = ['id', 'formConfigId', 'createdAt', 'updatedAt', 'deletedAt'];

export function FixedActivityFields() {
  return <details className="supervisor-fixed-fields supervisor-panel">
    <summary><LockKeyhole size={18} /> الحقول الأساسية الثابتة <span>للعرض فقط · {fields.length} حقلاً</span></summary>
    <p className="supervisor-muted">يعبئها المدير عند إنشاء النشاط. لا يمكن تعديل تعريفها أو حذفها من مصمم الحقول.</p>
    <dl className="supervisor-fixed-grid">{fields.map(([name, label, type]) => <div key={name}>
      <dt>{label}</dt><dd><code>{name}</code><span>{type}</span></dd>
    </div>)}</dl>
    <p className="supervisor-muted">حقول النظام والعلاقات (تُدار تلقائياً): <span dir="ltr">{systemFields.join(', ')}</span>.</p>
    <p className="supervisor-muted">تُحفظ القيم الإضافية في customFields، ومخطط الإنشاء في formSchemaSnapshot؛ وهما ليسا حقولاً قابلة للتحرير هنا.</p>
  </details>;
}
