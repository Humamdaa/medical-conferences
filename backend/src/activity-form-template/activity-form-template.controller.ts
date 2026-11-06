import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiBody, ApiConflictResponse, ApiCookieAuth,
  ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse,
  ApiTags, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth/session-auth.guard';
import { Role } from '../generated/prisma/client';
import { ActivityFormTemplateService } from './activity-form-template.service';
import { UpdateActivityFormTemplateDto } from './dto/update-activity-form-template.dto';
import { templateResponseExample, templateResponseSchema, templateSchemaExample } from './activity-form-template.swagger';

@ApiTags('Activity form template')
@ApiCookieAuth('medical.sid')
@ApiUnauthorizedResponse({ description: 'Missing or invalid session.' })
@ApiForbiddenResponse({ description: 'Insufficient role permissions.' })
@ApiServiceUnavailableResponse({ description: 'Shared template has not been initialized.' })
@Controller('activity-form-template')
@UseGuards(SessionAuthGuard, RolesGuard)
export class ActivityFormTemplateController {
  constructor(private readonly template: ActivityFormTemplateService) {}

  @Get()
  @Roles(Role.SUPERVISOR, Role.ADMIN)
  @ApiOperation({ summary: 'Get the shared Activity template (Supervisor or Admin)' })
  @ApiOkResponse({ description: 'Current template.', schema: { ...templateResponseSchema, example: templateResponseExample } })
  get() { return this.template.get(); }

  @Put()
  @Roles(Role.SUPERVISOR)
  @ApiOperation({ summary: 'Save the shared Activity template (Supervisor)', description: 'Immediately publishes the definition. Use expectedVersion from GET.' })
  @ApiBody({ type: UpdateActivityFormTemplateDto, examples: {
    default: { value: { expectedVersion: 1, fieldsSchema: templateSchemaExample } },
  } })
  @ApiOkResponse({ description: 'Saved template; version incremented.', schema: { ...templateResponseSchema, example: { ...templateResponseExample, version: 2 } } })
  @ApiBadRequestResponse({ description: 'Invalid version or field definitions.' })
  @ApiConflictResponse({ description: 'Stale version. Reload and reconcile before retrying.' })
  update(@Body() dto: UpdateActivityFormTemplateDto) { return this.template.update(dto); }
}
