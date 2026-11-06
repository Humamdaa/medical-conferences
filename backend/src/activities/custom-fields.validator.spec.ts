import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { validateCustomFields } from './custom-fields.validator';

const definition = (type: string, required = true) => ({ fields: [{ name: 'value', label: 'Value', type, required, ...(type === 'select' ? { options: ['On site', 'Online'] } : {}) }] });
describe('Dynamic Activity values', () => {
  it.each([
    ['text', 'Notes'], ['textarea', 'Long notes'], ['number', 0], ['number', -2.5],
    ['date', '2028-02-29'], ['select', 'On site'], ['checkbox', true],
  ])('accepts %s values without coercion', (type, value) => {
    expect(validateCustomFields(definition(type), { value })).toEqual({ value });
  });
  it.each([
    ['text', 5], ['text', ' '.repeat(2)], ['text', 'x'.repeat(201)], ['textarea', 'x'.repeat(10001)],
    ['number', '2'], ['number', null], ['number', NaN], ['number', Infinity], ['number', 1e20],
    ['date', '2027-02-29'], ['date', '2027-02-30'], ['date', '0000-01-01'], ['date', '2027-1-1'],
    ['date', '2027-01-01T00:00:00Z'], ['select', 'unknown'], ['checkbox', false], ['checkbox', 'true'],
  ])('rejects invalid %s value %j', (type, value) => {
    expect(() => validateCustomFields(definition(type), { value })).toThrow(BadRequestException);
  });
  it('accepts an empty schema and rejects unknown keys including object-key hazards', () => {
    expect(validateCustomFields({ fields: [] }, {})).toEqual({});
    expect(() => validateCustomFields({ fields: [] }, JSON.parse('{"__proto__":true}'))).toThrow(BadRequestException);
  });
  it('handles optional blank text/date/select, omitted values, and explicit false', () => {
    for (const type of ['text', 'date', 'select', 'textarea']) expect(validateCustomFields(definition(type, false), { value: '' })).toEqual({});
    expect(validateCustomFields(definition('number', false), {})).toEqual({});
    expect(validateCustomFields(definition('checkbox', false), { value: false })).toEqual({ value: false });
    expect(() => validateCustomFields(definition('number', false), { value: '' })).toThrow(BadRequestException);
    expect(() => validateCustomFields(definition('text', false), { value: null })).toThrow(BadRequestException);
  });
  it('rejects missing required values, invalid objects and invalid published definitions', () => {
    expect(() => validateCustomFields(definition('text'), {})).toThrow(BadRequestException);
    expect(() => validateCustomFields(definition('text'), [])).toThrow(BadRequestException);
    expect(() => validateCustomFields({ fields: [{ type: 'file' }] }, {})).toThrow(ServiceUnavailableException);
  });
});
