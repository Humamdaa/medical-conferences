import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DoctorProfileController } from './doctor-profile.controller';
import { DoctorProfileService } from './doctor-profile.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DoctorProfileController],
  providers: [DoctorProfileService],
})
export class DoctorProfileModule {}
