
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import {
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Role } from '../generated/prisma/client';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';

import { SessionAuthGuard } from '../auth/guards/session-auth/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { SpecialistsService } from './specialists.service';
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';
import { SpecialistResponseDto } from './dto/specialist-response.dto';

@ApiTags('Specialists')
@ApiUnauthorizedResponse({ description: 'Unauthenticated' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@ApiBadRequestResponse({ description: 'Invalid request data' })
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERVISOR)
@Controller('specialists')
export class SpecialistsController {
    constructor(
        private readonly specialistsService: SpecialistsService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create specialist' })
    @ApiCreatedResponse({ type: SpecialistResponseDto })
    @ApiConflictResponse({ description: 'Specialist already exists' })
    create(@Body() dto: CreateSpecialistDto) {
        return this.specialistsService.create(dto);
    }

    @Get()
    @Roles(Role.DOCTOR, Role.ADMIN, Role.SUPERVISOR)
    @ApiOperation({ summary: 'Get all specialists' })
    @ApiOkResponse({
        type: SpecialistResponseDto,
        isArray: true,
    })
    findAll() {
        return this.specialistsService.findAll();
    }

    @Get(':id')
    @Roles(Role.DOCTOR, Role.ADMIN, Role.SUPERVISOR)
    @ApiOperation({ summary: 'Get specialist by ID' })
    @ApiParam({ name: 'id', type: String, example: '1' })
    @ApiOkResponse({ type: SpecialistResponseDto })
    @ApiNotFoundResponse({ description: 'Specialist not found' })
    findOne(@Param('id', ParseBigIntPipe) id: bigint) {
        return this.specialistsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update specialist' })
    @ApiParam({ name: 'id', type: String, example: '1' })
    @ApiOkResponse({ type: SpecialistResponseDto })
    @ApiNotFoundResponse({ description: 'Specialist not found' })
    @ApiConflictResponse({ description: 'Specialist name already exists' })
    update(
        @Param('id', ParseBigIntPipe) id: bigint,
        @Body() dto: UpdateSpecialistDto,
    ) {
        return this.specialistsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete specialist' })
    @ApiParam({ name: 'id', type: String, example: '1' })
    @ApiOkResponse({ description: 'Specialist deleted successfully' })
    @ApiNotFoundResponse({ description: 'Specialist not found' })
    @ApiConflictResponse({ description: 'Specialist is in use' })
    remove(@Param('id', ParseBigIntPipe) id: bigint) {
        return this.specialistsService.remove(id);
    }
}
