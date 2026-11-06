import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateActivityDto } from './create-activity.dto';

export const validActivity = {
  name: 'Workshop', activityType: 'Workshop', startAt: '2027-01-10T09:00:00+03:00',
  endAt: '2027-01-10T12:00:00+03:00', location: 'Damascus', institution: 'Institution',
  description: 'Description', points: 5, specialistId: '1', expectedFormVersion: 1, customFields: {},
};

describe('CreateActivityDto', () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const parse = (body: unknown) => pipe.transform(body, { type: 'body', metatype: CreateActivityDto });
  it('accepts fixed fields, trims text, and permits absent/null coordinates', async () => {
    expect(await parse({ ...validActivity, name: ' Workshop ', latitude: null })).toMatchObject({ name: 'Workshop', latitude: null });
    await expect(parse({ ...validActivity, latitude: 33.1234567, longitude: -180 })).resolves.toBeInstanceOf(CreateActivityDto);
  });
  it.each([
    { name: ' ' }, { name: 'a'.repeat(201) }, { activityType: '' }, { description: 'a'.repeat(10001) },
    { location: null }, { institution: '' }, { startAt: '2027-02-30T09:00:00Z' },
    { startAt: '2027-01-10T09:00:00' }, { endAt: '2027-01-10T06:00:00Z' },
    { points: -1 }, { points: 1.5 }, { points: '5' }, { points: 2147483648 },
    { latitude: 91 }, { longitude: -181 }, { latitude: 1.12345678 }, { latitude: '33' },
    { specialistId: 1 }, { specialistId: '0' }, { specialistId: '9223372036854775808' },
    { expectedFormVersion: 0 }, { expectedFormVersion: '1' }, { expectedFormVersion: 2147483648 },
    { customFields: null }, { customFields: [] }, { customFields: undefined },
    { formSchemaSnapshot: { fields: [] } }, { formConfigId: '1' }, { deletedAt: null },
  ])('rejects invalid or client-managed data %j', async (change) => {
    await expect(parse({ ...validActivity, ...change })).rejects.toBeInstanceOf(BadRequestException);
  });
});
