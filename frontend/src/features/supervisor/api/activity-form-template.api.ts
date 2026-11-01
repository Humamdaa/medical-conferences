import { z } from 'zod';
import { http } from '../../../shared/api/http';

export const fieldTypes = ['text', 'number', 'date', 'textarea', 'select', 'checkbox'] as const;
const fieldDefinition = z.object({
  name: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/).refine((name) => !['constructor', 'prototype'].includes(name)),
  label: z.string().max(200).refine((label) => label.trim().length > 0),
  type: z.enum(fieldTypes), required: z.boolean(),
  options: z.array(z.string().min(1).max(200).refine((option) => option === option.trim())).min(1).max(100).optional(),
}).strict().refine((field) => field.type === 'select'
  ? !!field.options && new Set(field.options).size === field.options.length
  : field.options === undefined);

export const formSchema = z.object({ fields: z.array(fieldDefinition).max(100) }).strict()
  .refine((schema) => new Set(schema.fields.map((field) => field.name)).size === schema.fields.length);
export type FormSchema = z.infer<typeof formSchema>;
export type FieldType = typeof fieldTypes[number];

const templateSchema = z.object({
  id: z.string(), templateKey: z.literal('shared-activity'),
  version: z.number().int().min(1).max(2147483647),
  supervisorId: z.string(), formName: z.string(), fieldsSchema: formSchema,
  createdAt: z.string(), updatedAt: z.string(),
});
export type ActivityFormTemplate = z.infer<typeof templateSchema>;

function parseTemplate(value: unknown): ActivityFormTemplate {
  const result = templateSchema.safeParse(value);
  if (!result.success) throw new Error('استجابة النموذج غير صالحة. لم يتم استبدال المسودة؛ تواصل مع مسؤول النظام.');
  return result.data;
}

export const activityFormTemplateApi = {
  get: async (signal?: AbortSignal) => parseTemplate(await http<unknown>('/activity-form-template', { signal })),
  save: async (expectedVersion: number, fieldsSchema: FormSchema) => parseTemplate(await http<unknown>('/activity-form-template', {
    method: 'PUT', body: JSON.stringify({ expectedVersion, fieldsSchema }),
  })),
};
