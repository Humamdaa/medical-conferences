import { PrismaClient, Role } from '../generated/prisma/client';
import { bootstrapDevelopment, developmentBootstrapConfig } from './bootstrap';

function environment(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'development', DEV_BOOTSTRAP_CONFIRM: 'local-development-only',
    DATABASE_URL: 'postgresql://localhost/disposable_test',
    DEV_TEMPLATE_SUPERVISOR: ' Supervisor@example.test ',
  };
}

describe('Development template bootstrap', () => {
  it.each([
    { NODE_ENV: 'production' }, { NODE_ENV: undefined }, { DEV_BOOTSTRAP_CONFIRM: undefined },
    { DATABASE_URL: 'postgresql://remote.example/test' },
    { DATABASE_URL: 'postgresql://localhost/test?host=remote.example' },
    { DATABASE_URL: 'bad' }, { DEV_TEMPLATE_SUPERVISOR: '' },
    { DEV_TEMPLATE_SUPERVISOR: undefined }, { DEV_TEMPLATE_SUPERVISOR: '9223372036854775808' },
  ])('refuses unsafe/incomplete configuration: %j', (changes) => {
    expect(() => developmentBootstrapConfig({ ...environment(), ...changes })).toThrow();
  });

  it('normalizes emails and accepts IDs without losing BIGINT precision', () => {
    expect(developmentBootstrapConfig(environment()).where).toEqual({ email: 'supervisor@example.test' });
    expect(developmentBootstrapConfig({ ...environment(), DEV_TEMPLATE_SUPERVISOR: '9007199254740993' }).where).toEqual({ id: 9007199254740993n });
  });

  function database(user: { id: bigint; role: Role } | null = { id: 42n, role: Role.SUPERVISOR }) {
    let template: Record<string, unknown> | null = null;
    const tx = {
      // Deliberately expose only a read operation: no account writes allowed.
      user: { findUnique: jest.fn(async () => user) },
      activityFormConfig: {
        findUnique: jest.fn(async () => template),
        upsert: jest.fn(async ({ create }) => { template = create; return template; }),
      },
    };
    const prisma = { $transaction: jest.fn(async (fn) => fn(tx)) } as unknown as PrismaClient;
    return { prisma, tx, template: () => template, setTemplate: (value: Record<string, unknown>) => { template = value; } };
  }

  it.each(['supervisor@example.test', '42'])('initializes with actual Supervisor using %s and reruns without changing the template', async (selector) => {
    const db = database();
    const config = developmentBootstrapConfig({ ...environment(), DEV_TEMPLATE_SUPERVISOR: selector });
    await bootstrapDevelopment(db.prisma, config);
    expect(db.tx.user.findUnique).toHaveBeenCalledWith({ where: config.where, select: { id: true, role: true } });
    expect(db.template()).toEqual({ templateKey: 'shared-activity', formName: 'Shared Activity Form', version: 1, fieldsSchema: { fields: [] }, supervisorId: 42n });
    expect(db.tx.activityFormConfig.upsert.mock.calls[0][0].update).toEqual({});
    await bootstrapDevelopment(db.prisma, config);
    expect(db.tx.activityFormConfig.upsert).toHaveBeenCalledTimes(1);
  });

  it('preserves an existing template including content, version, name, and a different creator', async () => {
    const db = database();
    const existing = { templateKey: 'shared-activity', formName: 'Existing', version: 8, fieldsSchema: { fields: [{ name: 'existing' }] }, supervisorId: 99n };
    db.setTemplate(existing);
    await bootstrapDevelopment(db.prisma, developmentBootstrapConfig(environment()));
    expect(db.template()).toEqual(existing);
    expect(db.tx.activityFormConfig.upsert).not.toHaveBeenCalled();
  });

  it.each([Role.ADMIN, Role.DOCTOR])('rejects an existing %s without writing any records', async (role) => {
    const db = database({ id: 10n, role });
    await expect(bootstrapDevelopment(db.prisma, developmentBootstrapConfig(environment()))).rejects.toThrow('not a SUPERVISOR');
    expect(db.tx.activityFormConfig.findUnique).not.toHaveBeenCalled();
    expect(db.tx.activityFormConfig.upsert).not.toHaveBeenCalled();
  });

  it('fails clearly if the Supervisor does not exist', async () => {
    const db = database(null);
    await expect(bootstrapDevelopment(db.prisma, developmentBootstrapConfig(environment()))).rejects.toThrow('does not identify an existing account');
    expect(db.tx.activityFormConfig.upsert).not.toHaveBeenCalled();
  });
});
