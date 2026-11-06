import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityFormTemplateController } from './activity-form-template.controller';
import { ActivityFormTemplateService } from './activity-form-template.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ActivityFormTemplateController],
  providers: [ActivityFormTemplateService],
})
export class ActivityFormTemplateModule {}
