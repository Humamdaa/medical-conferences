import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../common/errors/app-error';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';

const DOCTOR_REQUIRED_FIELDS = [
  'specialistId',
  'nationalId',
  'residence',
  'clinicAddress',
  'phoneNumber',
  'certificateIssuedAt',
  'certificateNumber',
  'fatherName',
] as const satisfies ReadonlyArray<keyof UpdateDoctorProfileDto>;

type CompleteDoctorDetails = Required<
  Pick<UpdateDoctorProfileDto, (typeof DOCTOR_REQUIRED_FIELDS)[number]>
>;

function hasCompleteDoctorDetails(
  dto: UpdateDoctorProfileDto,
): dto is UpdateDoctorProfileDto & CompleteDoctorDetails {
  return DOCTOR_REQUIRED_FIELDS.every((field) => {
    const value = dto[field];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

@Injectable()
export class DoctorProfileService {
  constructor(private readonly prisma: PrismaService) {}

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
            nationalId: true,
            residence: true,
            clinicAddress: true,
            phoneNumber: true,
            certificateIssuedAt: true,
            certificateNumber: true,
            fatherName: true,
            specialist: { select: { id: true, name: true } },
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
      specialistId: doctor?.specialist.id.toString() ?? null,
      nationalId: doctor?.nationalId ?? null,
      residence: doctor?.residence ?? null,
      clinicAddress: doctor?.clinicAddress ?? null,
      phoneNumber: doctor?.phoneNumber ?? null,
      certificateIssuedAt:
        doctor?.certificateIssuedAt.toISOString().slice(0, 10) ?? null,
      certificateNumber: doctor?.certificateNumber ?? null,
      fatherName: doctor?.fatherName ?? null,
    };

    const missingFields = Object.entries(fields)
      .filter(([, value]) => value === null || value.trim().length === 0)
      .map(([key]) => key);

    return {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      doctorExists: doctor !== null,
      specialist: doctor
        ? {
            id: doctor.specialist.id.toString(),
            name: doctor.specialist.name,
          }
        : null,
      nationalId: fields.nationalId,
      residence: fields.residence,
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
      throw new AppError('EMPTY_UPDATE', 'Provide at least one field to update');
    }

    const id = BigInt(userId);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: { doctor: { select: { id: true } } },
      });
      if (!user) {
        throw new AppError('USER_NOT_FOUND', 'User not found');
      }

      const specialistId =
        dto.specialistId !== undefined ? BigInt(dto.specialistId) : undefined;
      if (specialistId !== undefined) {
        if (specialistId > 9223372036854775807n) {
          throw new AppError('INVALID_PROFILE', 'Invalid specialist ID');
        }
        const specialist = await tx.specialist.findUnique({
          where: { id: specialistId },
          select: { id: true },
        });
        if (!specialist) {
          throw new AppError('SPECIALIST_NOT_FOUND', 'Specialist not found');
        }
      }

      if (dto.firstName !== undefined || dto.lastName !== undefined) {
        await tx.user.update({
          where: { id },
          data: {
            ...(dto.firstName !== undefined && { firstName: dto.firstName }),
            ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          },
        });
      }

      if (!user.doctor) {
        if (!hasCompleteDoctorDetails(dto)) {
          const missing = DOCTOR_REQUIRED_FIELDS.filter(
            (field) => !dto[field]?.trim(),
          );
          throw new AppError(
            'INCOMPLETE_DOCTOR_PROFILE',
            `Missing required doctor fields: ${missing.join(', ')}`,
          );
        }
        // All eight professional fields are present and validated.
        await tx.doctor.create({
          data: {
            userId: id,
            specialistId: BigInt(dto.specialistId),
            nationalId: dto.nationalId,
            residence: dto.residence,
            clinicAddress: dto.clinicAddress,
            phoneNumber: dto.phoneNumber,
            certificateIssuedAt: new Date(`${dto.certificateIssuedAt}T00:00:00.000Z`),
            certificateNumber: dto.certificateNumber,
            fatherName: dto.fatherName,
          },
        });
      } else if (DOCTOR_REQUIRED_FIELDS.some((field) => dto[field] !== undefined)) {
        await tx.doctor.update({
          where: { userId: id },
          data: {
            ...(specialistId !== undefined && { specialistId }),
            ...(dto.nationalId !== undefined && { nationalId: dto.nationalId }),
            ...(dto.residence !== undefined && { residence: dto.residence }),
            ...(dto.clinicAddress !== undefined && { clinicAddress: dto.clinicAddress }),
            ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
            ...(dto.certificateIssuedAt !== undefined && {
              certificateIssuedAt: new Date(`${dto.certificateIssuedAt}T00:00:00.000Z`),
            }),
            ...(dto.certificateNumber !== undefined && { certificateNumber: dto.certificateNumber }),
            ...(dto.fatherName !== undefined && { fatherName: dto.fatherName }),
          },
        });
      }
    });

    return this.getMe(userId);
  }
}
