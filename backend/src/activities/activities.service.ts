import { ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ListActivitiesQueryDto } from './dto/list-activities-query.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Prisma } from '../generated/prisma/client';
import { SHARED_TEMPLATE_KEY } from '../activity-form-template/activity-form-template.service';
import { validateCustomFields } from './custom-fields.validator';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateActivityDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // FOR SHARE permits concurrent Activity creation but blocks template
        // UPDATE/DELETE until this transaction commits. Parameters are bound.
        const [template] = await tx.$queryRaw<{ id: bigint; version: number; fieldsSchema: Prisma.JsonValue }[]>`
          SELECT id, version, fields_schema AS "fieldsSchema"
          FROM activity_form_configs
          WHERE template_key = ${SHARED_TEMPLATE_KEY}
          FOR SHARE
        `;
        if (!template) throw new ServiceUnavailableException('Shared Activity template is not initialized; contact an operator');
        if (template.version !== dto.expectedFormVersion) throw new ConflictException('The Activity template has changed. Reload it and review your values before submitting again');
        const customFields = validateCustomFields(template.fieldsSchema, dto.customFields);
        const specialistId = BigInt(dto.specialistId);
        const specialist = await tx.specialist.findUnique({ where: { id: specialistId }, select: { id: true, name: true } });
        if (!specialist) throw new NotFoundException('Specialist not found');
        const activity = await tx.activity.create({
          data: {
            name: dto.name, activityType: dto.activityType,
            startAt: new Date(dto.startAt), endAt: new Date(dto.endAt),
            location: dto.location, institution: dto.institution, description: dto.description,
            points: dto.points, latitude: dto.latitude ?? null, longitude: dto.longitude ?? null,
            specialistId, formConfigId: template.id, customFields,
            formSchemaSnapshot: structuredClone(template.fieldsSchema) as Prisma.InputJsonObject,
          },
        });
        return {
          id: activity.id.toString(), name: activity.name, activityType: activity.activityType,
          startAt: activity.startAt, endAt: activity.endAt, location: activity.location,
          institution: activity.institution, description: activity.description, points: activity.points,
          latitude: activity.latitude?.toString() ?? null, longitude: activity.longitude?.toString() ?? null,
          specialist: { id: specialist.id.toString(), name: specialist.name },
          formConfigId: activity.formConfigId.toString(), customFields: activity.customFields,
          formSchemaSnapshot: activity.formSchemaSnapshot,
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    } catch (error) {
      // A Specialist could be deleted after the lookup. The FK rolls back the
      // insert; translate that reference race using this feature's HTTP policy.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException('Referenced Specialist or template no longer exists');
      }
      throw error;
    }
  }

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
        id: true,
        name: true,
        activityType: true,
        startAt: true,
        endAt: true,
        location: true,
        institution: true,
        description: true,
        points: true,
        customFields: true,
        formSchemaSnapshot: true,
        specialist: {
          select: {
            id: true,
            name: true,
          },
        },

      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return {
      ...activity,
      id: activity.id.toString(),
      specialist: {
        id: activity.specialist.id.toString(),
        name: activity.specialist.name,
      },
    };
  }

}
