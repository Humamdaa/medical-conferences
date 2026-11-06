import type { SchemaObject } from '@nestjs/swagger';
import { FIELD_TYPES, FORM_LIMITS } from './form-schema.validator';

export const templateSchemaExample = {
  fields: [{ name: 'venue_notes', label: 'Venue notes', type: 'text', required: false }],
};

export const formDefinitionSchema: SchemaObject = {
  type: 'object', additionalProperties: false, required: ['fields'],
  description: 'Dynamic fields only; empty fields is valid. Names must be unique.',
  properties: {
    fields: {
      type: 'array', minItems: 0, maxItems: FORM_LIMITS.fields,
      items: {
        type: 'object', additionalProperties: false,
        required: ['name', 'label', 'type', 'required'],
        properties: {
          name: {
            type: 'string', minLength: 1, maxLength: FORM_LIMITS.name, pattern: '^[a-z][a-z0-9_]*$',
            not: { enum: ['constructor', 'prototype'] },
            description: 'Unique within fields. Lowercase identifier; constructor and prototype are reserved.',
          },
          label: { type: 'string', minLength: 1, maxLength: FORM_LIMITS.label, pattern: '\\S', description: 'Must contain non-whitespace text; not silently trimmed.' },
          type: { type: 'string', enum: [...FIELD_TYPES] },
          required: { type: 'boolean', description: 'Explicit boolean; false is valid.' },
          options: {
            type: 'array', minItems: 1, maxItems: FORM_LIMITS.options, uniqueItems: true,
            description: 'Required for select; forbidden for every other type. Options must be nonblank, already trimmed, and unique.',
            items: { type: 'string', minLength: 1, maxLength: FORM_LIMITS.option, pattern: '^\\S([\\s\\S]*\\S)?$' },
          },
        },
        oneOf: [
          { properties: { type: { enum: ['select'] } }, required: ['options'] },
          { properties: { type: { enum: FIELD_TYPES.filter((type) => type !== 'select') } }, not: { required: ['options'] } },
        ],
      },
    },
  },
  example: templateSchemaExample,
};

export const templateResponseSchema: SchemaObject = {
  type: 'object',
  required: ['id', 'templateKey', 'version', 'supervisorId', 'formName', 'fieldsSchema', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'string', description: 'Database BIGINT serialized as a string.' },
    templateKey: { type: 'string', enum: ['shared-activity'] },
    version: { type: 'integer', minimum: 1, maximum: 2147483647 },
    supervisorId: { type: 'string', description: 'Creator attribution; does not restrict which Supervisor may edit.' },
    formName: { type: 'string' },
    fieldsSchema: formDefinitionSchema,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const templateResponseExample = {
  id: '12', templateKey: 'shared-activity', version: 1, supervisorId: '4',
  formName: 'Shared Activity Form', fieldsSchema: templateSchemaExample,
  createdAt: '2026-11-01T09:00:00.000Z', updatedAt: '2026-11-01T10:00:00.000Z',
};

