import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { FIELD_TYPES, formSchemaErrors } from '../activity-form-template/form-schema.validator';

type Definition = { name: string; type: typeof FIELD_TYPES[number]; required: boolean; options?: string[] };

/** Validate values, not definitions; no implicit string-to-number/boolean coercion. */
export function validateCustomFields(schema: unknown, values: unknown): Prisma.InputJsonObject {
  if (formSchemaErrors(schema).length) throw new ServiceUnavailableException('Published Activity template is invalid; contact an operator');
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new BadRequestException('customFields must be an object');
  const definitions = (schema as { fields: Definition[] }).fields;
  const input = values as Record<string, unknown>;
  const errors: string[] = [];
  const names = new Set(definitions.map((field) => field.name));
  for (const name of Object.keys(input)) if (!names.has(name)) errors.push(`Unknown custom field: ${name}`);
  const result: Record<string, string | number | boolean> = {};
  for (const field of definitions) {
    const present = Object.prototype.hasOwnProperty.call(input, field.name);
    const value = input[field.name];
    if (!present) {
      if (field.required) errors.push(`${field.name} is required`);
      continue;
    }
    if (['text', 'textarea', 'date', 'select'].includes(field.type) && typeof value === 'string' && value.trim() === '') {
      if (field.required) errors.push(`${field.name} is required`);
      continue; // Optional blank strings are omitted, as empty form inputs.
    }
    let valid = false;
    switch (field.type) {
      case 'text': case 'textarea':
        valid = typeof value === 'string' && value.length <= (field.type === 'text' ? 200 : 10000);
        break;
      case 'number':
        valid = typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
        break;
      case 'checkbox':
        valid = typeof value === 'boolean' && (!field.required || value === true);
        break;
      case 'select': valid = typeof value === 'string' && field.options!.includes(value); break;
      case 'date':
        valid = typeof value === 'string' && /^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
        break;
    }
    if (!valid) errors.push(`${field.name} has an invalid ${field.type} value`);
    else result[field.name] = value as string | number | boolean;
  }
  if (errors.length) throw new BadRequestException(errors);
  return result;
}
