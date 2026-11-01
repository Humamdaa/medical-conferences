import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { FIELD_TYPES, formSchemaErrors } from './form-schema.validator';
import { UpdateActivityFormTemplateDto } from './dto/update-activity-form-template.dto';

const field = { name: 'example', label: 'Example', type: 'text', required: false };
describe('Activity form definition validation', () => {
  it('accepts empty fields and all six existing frontend types', () => {
    expect(formSchemaErrors({ fields: [] })).toEqual([]);
    for (const type of FIELD_TYPES) {
      expect(formSchemaErrors({ fields: [{ ...field, type, ...(type === 'select' ? { options: ['A', 'B'] } : {}) }] })).toEqual([]);
    }
  });

  it.each([
    null, [], {}, { fields: 'bad' }, { fields: [], version: 1 },
    { fields: [null] }, { fields: [{ ...field, name: 'Bad name' }] },
    { fields: [{ ...field, name: 'constructor' }] },
    { fields: [{ ...field, name: 'a'.repeat(65) }] },
    { fields: [field, field] }, { fields: [{ ...field, label: '  ' }] },
    { fields: [{ ...field, label: 'a'.repeat(201) }] },
    { fields: [{ ...field, type: 'file' }] },
    { fields: [{ ...field, required: 'true' }] },
    { fields: [{ name: 'missing', label: 'Missing', type: 'text' }] },
    { fields: [{ ...field, hidden: true }] },
    { fields: [{ ...field, options: ['A'] }] },
    ...[undefined, [], [' '], [' A'], ['A', 'A'], [2], ['a'.repeat(201)], Array(101).fill('A')]
      .map((options) => ({ fields: [{ ...field, type: 'select', options }] })),
    { fields: Array(101).fill(field) },
  ])('rejects invalid definitions: %j', (schema) => {
    expect(formSchemaErrors(schema).length).toBeGreaterThan(0);
  });

  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const parse = (value: unknown) => pipe.transform(value, { type: 'body', metatype: UpdateActivityFormTemplateDto });

  it('accepts a valid request through the global validation conventions', async () => {
    await expect(parse({ expectedVersion: 1, fieldsSchema: { fields: [] } })).resolves.toBeInstanceOf(UpdateActivityFormTemplateDto);
  });

  it.each([undefined, 0, -1, 1.5, '1', 2147483647])('rejects invalid version %j', async (expectedVersion) => {
    await expect(parse({ expectedVersion, fieldsSchema: { fields: [] } })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing/invalid JSON and client changes to fixed metadata', async () => {
    for (const body of [
      { expectedVersion: 1 },
      { expectedVersion: 1, fieldsSchema: { fields: [field, field] } },
      { expectedVersion: 1, fieldsSchema: { fields: [] }, supervisorId: '2' },
      { expectedVersion: 1, fieldsSchema: { fields: [] }, templateKey: 'other' },
    ]) await expect(parse(body)).rejects.toBeInstanceOf(BadRequestException);
  });
});
