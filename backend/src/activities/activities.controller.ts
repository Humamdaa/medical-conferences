import { BadRequestException, Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth/session-auth.guard';
import { ActivitiesService } from './activities.service';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';

@ApiTags('Activities')
@Controller('activities')
@UseGuards(SessionAuthGuard)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

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
