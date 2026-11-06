import { ValidatorConstraint } from 'class-validator';
import type { ValidatorConstraintInterface } from 'class-validator';

export const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'select', 'checkbox'] as const;
export const FORM_LIMITS = { fields: 100, name: 64, label: 200, options: 100, option: 200 };

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function onlyKeys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

/** Validate the JSON itself: TypeScript/Prisma JSON types do not validate input. */
export function formSchemaErrors(value: unknown): string[] {
  if (!object(value) || !onlyKeys(value, ['fields']) || !Array.isArray(value.fields)) {
    return ['fieldsSchema must be an object containing only a fields array'];
  }
  if (value.fields.length > FORM_LIMITS.fields) return ['At most 100 dynamic fields are allowed'];

  const errors: string[] = [];
  const names = new Set<string>();
  value.fields.forEach((field: unknown, index: number) => {
    const prefix = `fieldsSchema.fields[${index}]`;
    if (!object(field)) { errors.push(`${prefix} must be an object`); return; }
    if (!onlyKeys(field, ['name', 'label', 'type', 'required', 'options'])) {
      errors.push(`${prefix} contains unsupported properties`);
    }
    if (typeof field.name !== 'string' || field.name.length > FORM_LIMITS.name ||
        !/^[a-z][a-z0-9_]*$/.test(field.name) || ['constructor', 'prototype'].includes(field.name)) {
      errors.push(`${prefix}.name must be a safe lowercase identifier of 1–64 characters`);
    } else {
      if (names.has(field.name)) errors.push(`${prefix}.name must be unique`);
      names.add(field.name);
    }
    if (!text(field.label, FORM_LIMITS.label)) errors.push(`${prefix}.label must contain 1–200 characters`);
    if (!FIELD_TYPES.includes(field.type as typeof FIELD_TYPES[number])) errors.push(`${prefix}.type is unsupported`);
    if (typeof field.required !== 'boolean') errors.push(`${prefix}.required must be a boolean`);
    if (field.type === 'select') {
      if (!Array.isArray(field.options) || field.options.length < 1 || field.options.length > FORM_LIMITS.options ||
          !field.options.every((option: unknown) => text(option, FORM_LIMITS.option) && option === option.trim())) {
        errors.push(`${prefix}.options must contain 1–100 nonempty, trimmed strings of at most 200 characters`);
      } else if (new Set(field.options).size !== field.options.length) {
        errors.push(`${prefix}.options must be unique`);
      }
    } else if ('options' in field) {
      errors.push(`${prefix}.options is only allowed for select fields`);
    }
  });
  return errors;
}

@ValidatorConstraint({ name: 'activityFormSchema', async: false })
export class FormSchemaConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean { return formSchemaErrors(value).length === 0; }
  defaultMessage(): string { return 'fieldsSchema contains invalid field definitions'; }
}
