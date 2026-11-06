
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

const MAX_BIGINT = 9223372036854775807n;

function parseSpecialistId(value: string): bigint {
  if (!/^[1-9][0-9]*$/.test(value)) {
    throw new BadRequestException('Invalid specialist ID');
  }

  const id = BigInt(value);
  if (id > MAX_BIGINT) {
    throw new BadRequestException('Invalid specialist ID');
  }

  return id;
}

@Injectable()
export class DoctorProfileService {
  constructor(private readonly prisma: PrismaService) { }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        doctor: {
          select: {
            nationality: true,
            nationalId: true,
            passportNumber: true,
            palestinianId: true,
            doctorType: true,
            clinicAddress: true,
            phoneNumber: true,
            certificateIssuedAt: true,
            certificateNumber: true,
            fatherName: true,
            specialist: {
              select: { id: true, name: true },
            },
            governorate: {
              select: { id: true, nameAr: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found');
    }

    const doctor = user.doctor;

    const fields = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      specialistId: doctor?.specialist?.id.toString() ?? null,
      nationality: doctor?.nationality ?? null,
      nationalId: doctor?.nationalId ?? null,
      passportNumber: doctor?.passportNumber ?? null,
      palestinianId: doctor?.palestinianId ?? null,
      doctorType: doctor?.doctorType ?? null,
      residence: doctor?.governorate?.nameAr ?? null,
      governorateId: doctor?.governorate?.id ?? null,
      clinicAddress: doctor?.clinicAddress ?? null,
      phoneNumber: doctor?.phoneNumber ?? null,
      certificateIssuedAt:
        doctor?.certificateIssuedAt?.toISOString().slice(0, 10) ?? null,
      certificateNumber: doctor?.certificateNumber ?? null,
      fatherName: doctor?.fatherName ?? null,
    };

    const required: (keyof typeof fields)[] = [
      'firstName',
      'lastName',
      'email',
      'specialistId',
      'nationality',
      'doctorType',
      'governorateId',
      'clinicAddress',
      'phoneNumber',
      'fatherName',
    ];

    if (fields.nationality === 'SYRIAN') {
      required.push('nationalId');
    } else if (fields.nationality === 'NON_SYRIAN') {
      required.push('passportNumber');
    } else if (fields.nationality === 'PALESTINIAN') {
      required.push('palestinianId');
    }

    if (fields.doctorType === 'SPECIALIST') {
      required.push('certificateIssuedAt', 'certificateNumber');
    }

    const missingFields = required.filter((key) => {
      const value = fields[key];
      return value == null ||
        (typeof value === 'string' && value.trim() === '');
    });

    return {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      doctorExists: doctor !== null,
      specialist: doctor?.specialist
        ? {
          id: doctor.specialist.id.toString(),
          name: doctor.specialist.name,
        }
        : null,
      nationality: fields.nationality,
      nationalId: fields.nationalId,
      passportNumber: fields.passportNumber,
      palestinianId: fields.palestinianId,
      doctorType: fields.doctorType,
      residence: fields.residence,
      governorateId: fields.governorateId,
      clinicAddress: fields.clinicAddress,
      phoneNumber: fields.phoneNumber,
      certificateIssuedAt: fields.certificateIssuedAt,
      certificateNumber: fields.certificateNumber,
      fatherName: fields.fatherName,
      isComplete: doctor !== null && missingFields.length === 0,
      missingFields,
    };
  }

  async updateMe(userId: string, dto: UpdateDoctorProfileDto) {
    if (Object.keys(dto).length === 0) {
      throw new AppError(
        'EMPTY_UPDATE',
        'Provide at least one field to update',
      );
    }

    const id = BigInt(userId);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: {
          doctor: {
            select: { id: true, nationalId: true },
          },
        },
      });

      if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found');
      }

      if (!user.doctor) {
        throw new BadRequestException(
          'Doctor identity must be registered first',
        );
      }

      // Identity cannot be changed through the profile endpoint.
      if (
        dto.nationalId !== undefined &&
        dto.nationalId !== (user.doctor.nationalId ?? '')
      ) {
        throw new BadRequestException(
          'Identification cannot be changed in the profile',
        );
      }

      let specialistId: bigint | undefined;

      if (dto.specialistId !== undefined) {
        specialistId = parseSpecialistId(dto.specialistId);

        const exists = await tx.specialist.findUnique({
          where: { id: specialistId },
          select: { id: true },
        });

        if (!exists) {
          throw new AppError(
            'SPECIALIST_NOT_FOUND',
            'Specialist not found',
          );
        }
      }

      let governorateId: number | undefined;

      // Temporary compatibility with the old profile form.
      // The governorate dropdown will replace this in D06.
      if (dto.residence !== undefined) {
        const governorate = await tx.governorate.findFirst({
          where: {
            OR: [
              { nameAr: dto.residence },
              { nameEn: dto.residence },
            ],
          },
          select: { id: true },
        });

        if (!governorate) {
          throw new BadRequestException(
            'Unknown governorate. Select a valid governorate.',
          );
        }

        governorateId = governorate.id;
      }

      if (
        dto.firstName !== undefined ||
        dto.lastName !== undefined
      ) {
        await tx.user.update({
          where: { id },
          data: {
            ...(dto.firstName !== undefined && {
              firstName: dto.firstName,
            }),
            ...(dto.lastName !== undefined && {
              lastName: dto.lastName,
            }),
          },
        });
      }

      await tx.doctor.update({
        where: { userId: id },
        data: {
          ...(specialistId !== undefined && { specialistId }),
          ...(governorateId !== undefined && { governorateId }),
          ...(dto.clinicAddress !== undefined && {
            clinicAddress: dto.clinicAddress,
          }),
          ...(dto.phoneNumber !== undefined && {
            phoneNumber: dto.phoneNumber,
          }),
          ...(dto.certificateIssuedAt !== undefined && {
            certificateIssuedAt: new Date(
              `${dto.certificateIssuedAt}T00:00:00.000Z`,
            ),
          }),
          ...(dto.certificateNumber !== undefined && {
            certificateNumber: dto.certificateNumber,
          }),
          ...(dto.fatherName !== undefined && {
            fatherName: dto.fatherName,
          }),
        },
      });
    });

    return this.getMe(userId);
  }

  async getMyPoints(userId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: BigInt(userId) },
      select: { id: true },
    });

    if (!doctor) {
      return { totalPoints: 0, activities: [] };
    }

    const records = await this.prisma.activityRegistration.findMany({
      where: { doctorId: doctor.id },
      select: {
        participationRole: true,
        pointsAwarded: true,
        activity: {
          select: {
            id: true,
            name: true,
            startAt: true,
            attendanceCpdPoints: true,
            participationCpdPoints: true,
          },
        },
      },
    });

    const activities = records.map((record) => {
      const availablePoints =
        record.participationRole === 'PARTICIPANT'
          ? record.activity.participationCpdPoints
          : record.activity.attendanceCpdPoints;

      return {
        activityId: record.activity.id.toString(),
        activityName: record.activity.name,
        date: record.activity.startAt,
        participationRole: record.participationRole,

        // Attendance verification is implemented in a later batch.
        status: 'REGISTERED' as const,

        availablePoints: Number(availablePoints),
        earnedPoints: Number(record.pointsAwarded),
      };
    });

    activities.sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    return {
      totalPoints: activities.reduce(
        (sum, activity) => sum + activity.earnedPoints,
        0,
      ),
      activities,
    };
  }
}
