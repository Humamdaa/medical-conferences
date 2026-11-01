import { PrismaClient, Role } from '../generated/prisma/client';

export class DevelopmentBootstrapError extends Error {}

export function developmentBootstrapConfig(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== 'development' || env.DEV_BOOTSTRAP_CONFIRM !== 'local-development-only') {
    throw new DevelopmentBootstrapError('Requires NODE_ENV=development and DEV_BOOTSTRAP_CONFIRM=local-development-only');
  }
  let url: URL;
  try { url = new URL(env.DATABASE_URL ?? ''); }
  catch { throw new DevelopmentBootstrapError('DATABASE_URL must be a valid local PostgreSQL URL'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.searchParams.has('host')) {
    throw new DevelopmentBootstrapError('Bootstrap only permits a loopback PostgreSQL host with no host query override');
  }

  const supervisor = env.DEV_TEMPLATE_SUPERVISOR?.trim();
  if (!supervisor) {
    throw new DevelopmentBootstrapError('Set DEV_TEMPLATE_SUPERVISOR to an existing Supervisor email or positive user ID');
  }
  const where = /^[1-9]\d*$/.test(supervisor)
    ? { id: BigInt(supervisor) }
    : { email: supervisor.toLowerCase() };
  if ('id' in where && where.id! > 9223372036854775807n) {
    throw new DevelopmentBootstrapError('Supervisor ID exceeds PostgreSQL BIGINT range');
  }
  return { databaseUrl: env.DATABASE_URL!, where };
}

/** No automatic invocation, dotenv loading, or connection on import. */
export async function bootstrapDevelopment(
  prisma: PrismaClient,
  config: ReturnType<typeof developmentBootstrapConfig>,
) {
  return prisma.$transaction(async (tx) => {
    const supervisor = await tx.user.findUnique({
      where: config.where, select: { id: true, role: true },
    });
    if (!supervisor) {
      throw new DevelopmentBootstrapError('DEV_TEMPLATE_SUPERVISOR does not identify an existing account. Create a Supervisor through the agreed account setup procedure first');
    }
    if (supervisor.role !== Role.SUPERVISOR) {
      throw new DevelopmentBootstrapError('The selected account is not a SUPERVISOR. No user or role was changed');
    }
    // Reuse without modifying the version, content, name or creator.
    const existing = await tx.activityFormConfig.findUnique({ where: { templateKey: 'shared-activity' } });
    if (!existing) {
      await tx.activityFormConfig.upsert({
        where: { templateKey: 'shared-activity' }, update: {},
        create: {
          templateKey: 'shared-activity', formName: 'Shared Activity Form', version: 1,
          fieldsSchema: { fields: [] }, supervisorId: supervisor.id,
        },
      });
    }
  }, { timeout: 15000 });
}
