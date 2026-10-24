
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { PrismaService } from '../../../prisma/prisma.service';
import { Role } from '../../../generated/prisma/client';
import { ROLES_KEY } from '../../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),//get function
        context.getClass(), //get controller
      ]);

    if (!requiredRoles?.length) {
      throw new ForbiddenException('Access not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.session?.userId!;

    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
