import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Role } from '../generated/prisma/client';
import { SessionAuthGuard } from '../auth/guards/session-auth/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminProfileService } from './admin-profile.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@ApiTags('Admin profile')
@Controller('admin-profile')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProfileController {
  constructor(private readonly profile: AdminProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my admin profile' })
  getMe(@Req() request: Request) {
    return this.profile.getMe(request.session.userId!);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my admin first and last name' })
  updateMe(@Req() request: Request, @Body() dto: UpdateAdminProfileDto) {
    return this.profile.updateMe(request.session.userId!, dto);
  }
}
