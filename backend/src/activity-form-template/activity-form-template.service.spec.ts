import { BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { ActivityFormTemplateService, SHARED_TEMPLATE_KEY } from './activity-form-template.service';
import { PrismaService } from '../prisma/prisma.service';

const initial = () => ({
  id: 10n, templateKey: SHARED_TEMPLATE_KEY, version: 1, supervisorId: 42n,
  formName: 'Shared Activity', fieldsSchema: { fields: [] },
  createdAt: new Date('2026-11-01T00:00:00Z'), updatedAt: new Date('2026-11-01T00:00:00Z'),
});

describe('ActivityFormTemplateService', () => {
  const delegate = { findUnique: jest.fn(), updateManyAndReturn: jest.fn() };
  const service = new ActivityFormTemplateService({ activityFormConfig: delegate } as unknown as PrismaService);
  beforeEach(() => jest.resetAllMocks());

  it('loads only the explicit shared key and serializes IDs', async () => {
    delegate.findUnique.mockResolvedValue(initial());
    expect(await service.get()).toMatchObject({ id: '10', supervisorId: '42', version: 1 });
    expect(delegate.findUnique.mock.calls[0][0].where).toEqual({ templateKey: SHARED_TEMPLATE_KEY });
  });

  it('never auto-initializes or chooses a legacy configuration', async () => {
    delegate.findUnique.mockResolvedValue(null);
    await expect(service.get()).rejects.toBeInstanceOf(ServiceUnavailableException);
    delegate.updateManyAndReturn.mockResolvedValue([]);
    await expect(service.update({ expectedVersion: 1, fieldsSchema: { fields: [] } })).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('uses a single conditional returning update and preserves creator attribution', async () => {
    delegate.updateManyAndReturn.mockResolvedValue([{ ...initial(), version: 2 }]);
    expect(await service.update({ expectedVersion: 1, fieldsSchema: { fields: [] } })).toMatchObject({ version: 2, supervisorId: '42' });
    expect(delegate.updateManyAndReturn.mock.calls[0][0]).toMatchObject({
      where: { templateKey: SHARED_TEMPLATE_KEY, version: 1 },
      data: { fieldsSchema: { fields: [] }, version: { increment: 1 } },
    });
    expect(Object.keys(delegate.updateManyAndReturn.mock.calls[0][0].data).sort()).toEqual(['fieldsSchema', 'version']);
    expect(delegate.findUnique).not.toHaveBeenCalled();
  });

  it('rejects invalid definitions before writing', async () => {
    await expect(service.update({ expectedVersion: 1, fieldsSchema: {} })).rejects.toBeInstanceOf(BadRequestException);
    expect(delegate.updateManyAndReturn).not.toHaveBeenCalled();
  });

  it('allows only one winner for two saves based on the same version (atomic database mock)', async () => {
    let row = initial();
    delegate.findUnique.mockImplementation(async () => row);
    delegate.updateManyAndReturn.mockImplementation(async ({ where, data }) => {
      if (where.templateKey !== row.templateKey || where.version !== row.version) return [];
      row = { ...row, fieldsSchema: data.fieldsSchema, version: row.version + data.version.increment };
      return [{ ...row }];
    });
    const schema = { fields: [{ name: 'note', label: 'Note', type: 'text', required: false }] };
    const results = await Promise.allSettled([
      service.update({ expectedVersion: 1, fieldsSchema: schema }),
      service.update({ expectedVersion: 1, fieldsSchema: { fields: [] } }),
    ]);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1]).toMatchObject({ status: 'rejected', reason: expect.any(ConflictException) });
    expect(row.version).toBe(2);
    expect(row.fieldsSchema).toEqual(schema);
  });
});
