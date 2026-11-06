import 'reflect-metadata';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth/session-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../generated/prisma/client';
import { ActivityFormTemplateController } from './activity-form-template.controller';

describe('Shared template route permissions', () => {
  const findUnique = jest.fn();
  const roles = new RolesGuard(new Reflector(), { user: { findUnique } } as unknown as PrismaService);
  const session = new SessionAuthGuard();
  function context(method: 'get' | 'update', userId?: string) {
    return {
      getClass: () => ActivityFormTemplateController,
      getHandler: () => ActivityFormTemplateController.prototype[method],
      switchToHttp: () => ({ getRequest: () => ({ session: { userId } }) }),
    } as unknown as ExecutionContext;
  }

  it('attaches authentication before authorization on both routes', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ActivityFormTemplateController)).toEqual([SessionAuthGuard, RolesGuard]);
    for (const method of ['get', 'update'] as const) {
      expect(() => session.canActivate(context(method))).toThrow(UnauthorizedException);
    }
  });

  it.each([
    ['get', Role.SUPERVISOR, true], ['get', Role.ADMIN, true], ['get', Role.DOCTOR, false],
    ['update', Role.SUPERVISOR, true], ['update', Role.ADMIN, false], ['update', Role.DOCTOR, false],
  ] as const)('%s for %s: allowed=%s', async (method, role, allowed) => {
    findUnique.mockResolvedValue({ role });
    const ctx = context(method, '99');
    expect(session.canActivate(ctx)).toBe(true);
    if (allowed) await expect(roles.canActivate(ctx)).resolves.toBe(true);
    else await expect(roles.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a deleted user session', async () => {
    findUnique.mockResolvedValue(null);
    await expect(roles.canActivate(context('get', '99'))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
