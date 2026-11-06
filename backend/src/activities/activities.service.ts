
import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SHARED_TEMPLATE_KEY } from '../activity-form-template/activity-form-template.service';
import { validateCustomFields } from './custom-fields.validator';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';

// Fields shared by creation, list, and details responses.
const activitySelect = {
  id: true,
  name: true,
  activityType: true,
  startAt: true,
  endAt: true,
  location: true,
  institution: true,
  description: true,
  activitySeriesId: true,
  annualSequence: true,
  governorateId: true,
  capacity: true,
  activityPresidentName: true,
  attendanceCpdPoints: true,
  participationCpdPoints: true,
  registrationFeeSyp: true,
  latitude: true,
  longitude: true,
  formConfigId: true,
  specialist: {
    select: { id: true, name: true },
  },
} as const satisfies Prisma.ActivitySelect;

const activityDetailSelect = {
  ...activitySelect,
  customFields: true,
  formSchemaSnapshot: true,
} as const satisfies Prisma.ActivitySelect;

type ActivityRow = Prisma.ActivityGetPayload<{
  select: typeof activitySelect;
}>;

// Single mapper avoids repeating BigInt/Decimal conversions.
function serializeActivity<T extends ActivityRow>(activity: T) {
  const {
    id,
    activitySeriesId,
    formConfigId,
    specialist,
    ...fields
  } = activity;

  return {
    ...fields,
    id: id.toString(),
    activitySeriesId: activitySeriesId.toString(),
    formConfigId: formConfigId.toString(),
    specialist: {
      id: specialist.id.toString(),
      name: specialist.name,
    },
    attendanceCpdPoints: activity.attendanceCpdPoints.toNumber(),
    participationCpdPoints: activity.participationCpdPoints.toNumber(),
    registrationFeeSyp: activity.registrationFeeSyp.toString(),
    latitude: activity.latitude?.toString() ?? null,
    longitude: activity.longitude?.toString() ?? null,
  };
}

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateActivityDto) {
    const specialistId = BigInt(dto.specialistId);
    const activitySeriesId = BigInt(dto.activitySeriesId);

    // Only retry concurrency conflicts, not normal validation errors.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // Read the shared template using Prisma ORM.
            const template = await tx.activityFormConfig.findUnique({
              where: { templateKey: SHARED_TEMPLATE_KEY },
              select: {
                id: true,
                version: true,
                fieldsSchema: true,
              },
            });

            if (!template) {
              throw new ServiceUnavailableException(
                'Shared activity template is not initialized',
              );
            }

            if (template.version !== dto.expectedFormVersion) {
              throw new ConflictException(
                'Activity template changed. Reload the form.',
              );
            }

            const customFields = validateCustomFields(
              template.fieldsSchema,
              dto.customFields,
            );

            const specialist = await tx.specialist.findUnique({
              where: { id: specialistId },
              select: { id: true },
            });

            if (!specialist) {
              throw new NotFoundException('Specialist not found');
            }

            const series = await tx.activitySeries.findUnique({
              where: { id: activitySeriesId },
              select: { id: true },
            });

            if (!series) {
              throw new NotFoundException('Activity series not found');
            }

            const governorate = await tx.governorate.findUnique({
              where: { id: dto.governorateId },
              select: { id: true },
            });

            if (!governorate) {
              throw new NotFoundException('Governorate not found');
            }

            // Generate the next annual sequence within this transaction.
            const now = new Date();
            const year = now.getUTCFullYear();

            const previous = await tx.activity.aggregate({
              where: {
                activitySeriesId,
                createdAt: {
                  gte: new Date(Date.UTC(year, 0, 1)),
                  lt: new Date(Date.UTC(year + 1, 0, 1)),
                },
              },
              _max: { annualSequence: true },
            });

            const annualSequence =
              (previous._max.annualSequence ?? 0) + 1;

            const activity = await tx.activity.create({
              data: {
                name: dto.name,
                activityType: dto.activityType,
                startAt: new Date(dto.startAt),
                endAt: new Date(dto.endAt),
                location: dto.location,
                institution: dto.institution,
                description: dto.description,

                specialistId,
                activitySeriesId,
                annualSequence,
                createdAt: now,
                formConfigId: template.id,

                governorateId: dto.governorateId,
                capacity: dto.capacity,
                activityPresidentName: dto.activityPresidentName,

                attendanceCpdPoints: dto.attendanceCpdPoints,
                participationCpdPoints: dto.participationCpdPoints,
                registrationFeeSyp: dto.registrationFeeSyp,

                latitude: dto.latitude ?? null,
                longitude: dto.longitude ?? null,

                customFields,
                formSchemaSnapshot: structuredClone(
                  template.fieldsSchema,
                ) as Prisma.InputJsonObject,
              },
              select: activityDetailSelect,
            });

            return serializeActivity(activity);
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 10000,
          },
        );
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || error.code === 'P2002');

        if (!retryable || attempt === 2) {
          throw error;
        }
      }
    }

    throw new ConflictException('Could not create activity. Retry.');
  }

  async findAll({ page, pageSize }: ListActivitiesQueryDto) {
    const [total, activities] = await this.prisma.$transaction([
      this.prisma.activity.count(),
      this.prisma.activity.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startAt: 'desc' },
        select: activitySelect,
      }),
    ]);

    return {
      items: activities.map(serializeActivity),
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: bigint) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      select: activityDetailSelect,
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return serializeActivity(activity);
  }
}
