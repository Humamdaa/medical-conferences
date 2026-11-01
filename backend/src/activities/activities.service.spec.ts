import { BadRequestException, ConflictException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from './activities.service';
const validActivity = {
  name: 'Workshop', activityType: 'Workshop', startAt: '2027-01-10T09:00:00+03:00',
  endAt: '2027-01-10T12:00:00+03:00', location: 'Damascus', institution: 'Institution',
  description: 'Description', points: 5, specialistId: '1', expectedFormVersion: 1, customFields: {},
};

describe('Activity creation transaction', () => {
  function setup() {
    const template = { id: 10n, version: 1, fieldsSchema: { fields: [{ name: 'note', label: 'Note', type: 'text', required: true }] } };
    const events: string[] = [];
    const tx = {
      $queryRaw: jest.fn(async () => { events.push('lock'); return [template]; }),
      specialist: { findUnique: jest.fn(async () => ({ id: 1n, name: 'Specialty' })) },
      activity: { create: jest.fn(async ({ data }) => { events.push('insert'); return { ...data, id: 100n }; }) },
    };
    const transaction = jest.fn(async (fn) => {
      events.push('begin');
      try { const result = await fn(tx); events.push('commit'); return result; }
      catch (error) { events.push('rollback'); throw error; }
    });
    const service = new ActivitiesService({ $transaction: transaction } as unknown as PrismaService);
    const dto = { ...validActivity, customFields: { note: 'Original' } };
    return { service, tx, transaction, template, events, dto };
  }
  it('locks the shared row, validates, inserts and commits; snapshot is independent of later template edits', async () => {
    const s = setup();
    const result = await s.service.create(s.dto);
    expect(s.events).toEqual(['begin', 'lock', 'insert', 'commit']);
    const [query, key] = s.tx.$queryRaw.mock.calls[0] as unknown as [TemplateStringsArray, string];
    expect(query.join('?')).toMatch(/WHERE template_key = \?\s+FOR SHARE/);
    expect(key).toBe('shared-activity');
    expect(s.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    expect(s.tx.activity.create.mock.calls[0][0].data).toMatchObject({ specialistId: 1n, formConfigId: 10n, latitude: null, longitude: null, customFields: { note: 'Original' }, startAt: expect.any(Date) });
    expect(result).toMatchObject({ id: '100', formConfigId: '10', specialist: { id: '1' } });
    s.template.fieldsSchema.fields[0].label = 'Changed later';
    s.template.version++;
    expect(result.formSchemaSnapshot).toMatchObject({ fields: [{ label: 'Note' }] });
  });
  it.each([
    ['stale', ConflictException], ['missing', ServiceUnavailableException],
    ['invalid-values', BadRequestException], ['missing-specialist', NotFoundException],
  ])('rolls back %s without inserting', async (scenario, error) => {
    const s = setup();
    if (scenario === 'stale') s.template.version = 2;
    if (scenario === 'missing') s.tx.$queryRaw.mockResolvedValue([]);
    if (scenario === 'invalid-values') s.dto.customFields.note = '';
    if (scenario === 'missing-specialist') s.tx.specialist.findUnique.mockResolvedValue(null as never);
    await expect(s.service.create(s.dto)).rejects.toBeInstanceOf(error);
    expect(s.tx.activity.create).not.toHaveBeenCalled();
    expect(s.events.at(-1)).toBe('rollback');
  });
  it('translates concurrent reference deletion and rolls back insert failure', async () => {
    const s = setup();
    s.tx.activity.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Reference deleted', { code: 'P2003', clientVersion: '7' }));
    await expect(s.service.create(s.dto)).rejects.toBeInstanceOf(NotFoundException);
    expect(s.events.at(-1)).toBe('rollback');
  });

  it('does not insert while awaiting the lock and checks the version obtained after waiting', async () => {
    const s = setup();
    let release!: () => void;
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    s.tx.$queryRaw.mockImplementation(async () => {
      await waiting;
      return [{ ...s.template, version: 2 }]; // A preceding Supervisor save won.
    });
    const attempt = s.service.create(s.dto);
    expect(s.tx.activity.create).not.toHaveBeenCalled();
    release();
    await expect(attempt).rejects.toBeInstanceOf(ConflictException);
    expect(s.tx.specialist.findUnique).not.toHaveBeenCalled();
    expect(s.tx.activity.create).not.toHaveBeenCalled();
    expect(s.events.at(-1)).toBe('rollback');
  });
});
