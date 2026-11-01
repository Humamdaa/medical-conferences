import 'reflect-metadata';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { SessionAuthGuard } from '../auth/guards/session-auth/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../generated/prisma/client';
import { ActivitiesController } from './activities.controller';

describe('Activity authorization', () => {
  const findUnique = jest.fn();
  const roles = new RolesGuard(new Reflector(), { user: { findUnique } } as unknown as PrismaService);
  const session = new SessionAuthGuard();
  const context = (method: 'create' | 'findAll' | 'findOne', userId?: string) => ({
    getClass: () => ActivitiesController, getHandler: () => ActivitiesController.prototype[method],
    switchToHttp: () => ({ getRequest: () => ({ session: { userId } }) }),
  }) as unknown as ExecutionContext;

  it('preserves session-only GET guards and attaches a role guard only to POST', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, ActivitiesController)).toEqual([SessionAuthGuard]);
    expect(Reflect.getMetadata(GUARDS_METADATA, ActivitiesController.prototype.create)).toEqual([RolesGuard]);
    for (const method of ['findAll', 'findOne'] as const) {
      expect(Reflect.getMetadata(GUARDS_METADATA, ActivitiesController.prototype[method])).toBeUndefined();
      expect(session.canActivate(context(method, '1'))).toBe(true);
    }
    expect(() => session.canActivate(context('create'))).toThrow(UnauthorizedException);
  });
  it.each([Role.ADMIN, Role.SUPERVISOR, Role.DOCTOR])('checks POST role %s against the database', async (role) => {
    findUnique.mockResolvedValue({ role });
    if (role === Role.ADMIN) await expect(roles.canActivate(context('create', '1'))).resolves.toBe(true);
    else await expect(roles.canActivate(context('create', '1'))).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('rejects a deleted user session', async () => {
    findUnique.mockResolvedValue(null);
    await expect(roles.canActivate(context('create', '1'))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
