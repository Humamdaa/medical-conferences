/** Temporary browser-only prototype. Replace with API calls when backend is ready. */
export type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}
export interface FormSchema {
  fields: FormField[];
}
export type CustomValue = string | number | boolean;

export interface LocalActivity {
  id: string;
  name: string;
  activityType: string;
  startAt: string;
  endAt: string;
  location: string;
  institution: string;
  description: string;
  points: number;
  latitude: number | null;
  longitude: number | null;
  specialist: { id: string; name: string };
  customFields: Record<string, CustomValue>;
  formSchemaSnapshot: FormSchema;
  localOnly: true;
}

const SCHEMA_KEY = 'medcon:demo:supervisor-form-schema:v1';
const ACTIVITIES_KEY = 'medcon:demo:admin-activities:v1';
const validFieldTypes: FieldType[] = [
  'text', 'number', 'date', 'textarea', 'select', 'checkbox',
];

function readJson(key: string): unknown {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) as unknown : null;
  } catch {
    return null;
  }
}

export function loadSupervisorSchema(): FormSchema | null {
  const raw = readJson(SCHEMA_KEY);
  if (!raw || typeof raw !== 'object' || !('fields' in raw) || !Array.isArray(raw.fields)) return null;
  const fields: FormField[] = [];
  for (const value of raw.fields as unknown[]) {
    if (!value || typeof value !== 'object') return null;
    const f = value as Partial<FormField>;
    if (typeof f.name !== 'string' || typeof f.label !== 'string' ||
        !validFieldTypes.includes(f.type as FieldType) || typeof f.required !== 'boolean') return null;
    if (f.type === 'select' && (!Array.isArray(f.options) || !f.options.every((option) => typeof option === 'string'))) return null;
    fields.push({
      name: f.name,
      label: f.label,
      type: f.type as FieldType,
      required: f.required,
      ...(f.type === 'select' ? { options: f.options } : {}),
    });
  }
  if (new Set(fields.map((field) => field.name)).size !== fields.length) return null;
  return { fields };
}

export function saveSupervisorSchema(schema: FormSchema): void {
  localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema));
}

export function loadLocalActivities(): LocalActivity[] {
  const value = readJson(ACTIVITIES_KEY);
  if (!Array.isArray(value)) return [];
  return value.filter((item: unknown): item is LocalActivity =>
    item !== null && typeof item === 'object' &&
    (item as Partial<LocalActivity>).localOnly === true &&
    typeof (item as Partial<LocalActivity>).id === 'string' &&
    typeof (item as Partial<LocalActivity>).name === 'string' &&
    typeof (item as Partial<LocalActivity>).startAt === 'string' &&
    typeof (item as Partial<LocalActivity>).specialist?.name === 'string',
  );
}

export function findLocalActivity(id: string): LocalActivity | undefined {
  return loadLocalActivities().find((activity) => activity.id === id);
}

export function saveLocalActivity(data: Omit<LocalActivity, 'id' | 'localOnly'>): LocalActivity {
  const activity: LocalActivity = {
    ...data,
    id: `local-${crypto.randomUUID()}`,
    localOnly: true,
  };
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([activity, ...loadLocalActivities()]));
  return activity;
}
