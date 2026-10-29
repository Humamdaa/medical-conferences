import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Role } from '../generated/prisma/client';
import { SessionAuthGuard } from '../auth/guards/session-auth/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DoctorProfileService } from './doctor-profile.service';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

@ApiTags('Doctor profile')
@Controller('doctor-profile')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorProfileController {
  constructor(private readonly profile: DoctorProfileService) { }

  @Get('me')
  @ApiOperation({ summary: 'Get current doctor profile with completion status' })
  getMe(@Req() request: Request) {
    return this.profile.getMe(request.session.userId!);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current doctor name and specialty' })
  updateMe(@Req() request: Request, @Body() dto: UpdateDoctorProfileDto) {
    return this.profile.updateMe(request.session.userId!, dto);
  }


  @Get('me/points')
  @ApiOperation({ summary: 'Get current doctor points' })
  getMyPoints(@Req() request: Request) {
    return this.profile.getMyPoints(
      request.session.userId!,
    );
  }

}
