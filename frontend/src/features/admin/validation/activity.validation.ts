import type { ActivityFormTemplate } from '../../../shared/activity-forms/activity-form-template.api';
import type { CreateActivityInput, CustomValue, SpecialistOption } from '../api/admin.api';

export type ActivityForm = {
  name: string; activityType: string; startAt: string; endAt: string;
  location: string; institution: string; description: string; points: string;
  specialistId: string; latitude: string; longitude: string;
};

export function activityPayload(form: ActivityForm, template: ActivityFormTemplate, values: Record<string, CustomValue>, specialists: SpecialistOption[]): CreateActivityInput {
  const text = (value: string, label: string, max: number) => {
    const result = value.trim();
    if (!result || result.length > max) throw new Error(`${label} مطلوب وبحد أقصى ${max} حرفاً.`);
    return result;
  };
  const start = new Date(form.startAt); const end = new Date(form.endAt);
  if (!form.startAt || !form.endAt || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw new Error('يجب أن تكون تواريخ النشاط صحيحة والنهاية بعد البداية.');
  const points = Number(form.points);
  if (!form.points.trim() || !Number.isInteger(points) || points < 0 || points > 2147483647) throw new Error('النقاط عدد صحيح من 0 إلى 2147483647.');
  if (!specialists.some((option) => option.id === form.specialistId)) throw new Error('اختر اختصاصاً طبياً موجوداً.');
  function coordinate(value: string, limit: number) {
    if (!value.trim()) return null;
    const number = Number(value);
    const decimalPlaces = (number.toString().split('e-')[0].split('.')[1]?.length ?? 0) + Number(number.toString().split('e-')[1] ?? 0);
    if (!Number.isFinite(number) || Math.abs(number) > limit || decimalPlaces > 7) throw new Error('الإحداثيات خارج المجال أو تتجاوز 7 منازل عشرية.');
    return number;
  }
  const customFields: Record<string, CustomValue> = {};
  for (const field of template.fieldsSchema.fields) {
    const raw = values[field.name];
    if (raw === undefined || (typeof raw === 'string' && !raw.trim())) {
      if (field.required) throw new Error(`${field.label} مطلوب.`);
      continue;
    }
    if (field.type === 'checkbox') {
      if (typeof raw !== 'boolean' || (field.required && !raw)) throw new Error(`يجب تأكيد ${field.label}.`);
      customFields[field.name] = raw;
    } else if (field.type === 'number') {
      const number = Number(raw);
      if (typeof raw === 'boolean' || !Number.isFinite(number) || Math.abs(number) > Number.MAX_SAFE_INTEGER) throw new Error(`${field.label}: أدخل رقماً ضمن المجال الآمن.`);
      customFields[field.name] = number;
    } else {
      if (typeof raw !== 'string') throw new Error(`${field.label}: قيمة غير صالحة.`);
      if (field.type === 'select' && !field.options?.includes(raw)) throw new Error(`${field.label}: اختر قيمة من القائمة.`);
      if (field.type === 'date' && (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(`${raw}T00:00:00Z`)) || new Date(`${raw}T00:00:00Z`).toISOString().slice(0, 10) !== raw)) throw new Error(`${field.label}: تاريخ غير صالح.`);
      if ((field.type === 'text' && raw.length > 200) || (field.type === 'textarea' && raw.length > 10000)) throw new Error(`${field.label}: النص طويل جداً.`);
      customFields[field.name] = raw;
    }
  }
  return {
    name: text(form.name, 'اسم النشاط', 200), activityType: text(form.activityType, 'نوع النشاط', 100),
    startAt: start.toISOString(), endAt: end.toISOString(),
    location: text(form.location, 'الموقع', 200), institution: text(form.institution, 'الجهة المنظمة', 200),
    description: text(form.description, 'الوصف', 10000), points,
    latitude: coordinate(form.latitude, 90), longitude: coordinate(form.longitude, 180),
    specialistId: form.specialistId, expectedFormVersion: template.version, customFields,
  };
}
