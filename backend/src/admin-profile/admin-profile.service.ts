import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@Injectable()
export class AdminProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    if (!user) throw new NotFoundException('Admin not found');
    return { ...user, id: user.id.toString() };
  }

  async updateMe(userId: string, dto: UpdateAdminProfileDto) {
    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();

    if (firstName === undefined && lastName === undefined) {
      throw new BadRequestException('Provide a name field to update');
    }
    if (firstName === '' || lastName === '') {
      throw new BadRequestException('Name cannot be empty');
    }

    await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data: { firstName, lastName },
    });

    return this.getMe(userId);
  }
}
