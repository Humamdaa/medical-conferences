import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiCookieAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiParam, ApiServiceUnavailableResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth/session-auth.guard';
import { ActivitiesService } from './activities.service';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/client';
import { CreateActivityDto } from './dto/create-activity.dto';

@ApiTags('Activities')
@Controller('activities')
@UseGuards(SessionAuthGuard)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiCookieAuth('medical.sid')
  @ApiOperation({ summary: 'Create an Activity (Admin)', description: 'Uses the current shared template and a server-created snapshot. Replace example IDs/version with values from GET /specialists and GET /activity-form-template; supply required custom values.' })
  @ApiCreatedResponse({ description: 'Activity created with string IDs and creation-time schema snapshot.' })
  @ApiBadRequestResponse({ description: 'Invalid fixed fields or dynamic values.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid session.' })
  @ApiForbiddenResponse({ description: 'Admin role required.' })
  @ApiNotFoundResponse({ description: 'Specialist does not exist.' })
  @ApiConflictResponse({ description: 'Template changed; reload and review before submitting.' })
  @ApiServiceUnavailableResponse({ description: 'Shared template is missing or invalid.' })
  create(@Body() dto: CreateActivityDto) { return this.activities.create(dto); }

  @Get()
  @ApiOperation({ summary: 'List medical activities (read only)' })
  findAll(@Query() query: ListActivitiesQueryDto) {
    return this.activities.findAll(query);
  }


@Get(':id')
@ApiOperation({ summary: 'Get activity details (read only)' })
@ApiParam({ name: 'id', type: String })
findOne(@Param('id', ParseBigIntPipe) id: bigint) { 
  return this.activities.findOne(id); 
}
}
