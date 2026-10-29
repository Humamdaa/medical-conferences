import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ page, pageSize }: ListActivitiesQueryDto) {
    const [total, activities] = await this.prisma.$transaction([
      this.prisma.activity.count(),
      this.prisma.activity.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startAt: 'desc' },
        select: {
          id: true, name: true, activityType: true, startAt: true,
          endAt: true, location: true, institution: true,
          description: true, points: true,
          specialist: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      items: activities.map(({ id, specialist, ...activity }) => ({
        ...activity,
        id: id.toString(),
        specialist: { id: specialist.id.toString(), name: specialist.name },
      })),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: bigint) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      select: {
        id: true, name: true, activityType: true, startAt: true,
        endAt: true, location: true, institution: true,
        description: true, points: true,
        specialist: { select: { id: true, name: true } },
      },
    });
    if (!activity) {
      // Use the existing centralized AppError -> HTTP status mapping.
      throw new AppError('ACTIVITY_NOT_FOUND', 'Activity not found');
    }
    const { id: activityId, specialist, ...fields } = activity;
    return {
      ...fields,
      id: activityId.toString(),
      specialist: { id: specialist.id.toString(), name: specialist.name },
    };
  }
}
