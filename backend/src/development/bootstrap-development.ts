// Manual entry point only. Not imported by AppModule or tests.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { bootstrapDevelopment, developmentBootstrapConfig, DevelopmentBootstrapError } from './bootstrap';

async function main() {
  // Refuse before constructing a client/adapter or opening a connection.
  const config = developmentBootstrapConfig(process.env);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) });
  try {
    await bootstrapDevelopment(prisma, config);
    console.log('Shared Activity template is ready. Existing template and all users were preserved.');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  // Do not print Prisma errors, connection URLs, account data, or stack traces.
  console.error(error instanceof DevelopmentBootstrapError
    ? error.message
    : 'Development bootstrap failed. Check local database availability/schema and retry; failed transactions roll back and reruns preserve existing records. No diagnostic secrets are logged.');
  process.exitCode = 1;
});
