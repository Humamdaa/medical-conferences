
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { Specialist } from '../generated/prisma/client';
import { AppError } from '../common/errors/app-error';

import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';
import { SpecialistResponseDto } from './dto/specialist-response.dto';

@Injectable()
export class SpecialistsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    // Convert database model to API response
    private toResponse(
        specialist: Specialist,
    ): SpecialistResponseDto {
        return {
            id: specialist.id.toString(),
            name: specialist.name,
            description: specialist.description,
        };
    }

    // CREATE
    async create(
        dto: CreateSpecialistDto,
    ): Promise<SpecialistResponseDto> {
        const existing = await this.prisma.specialist.findUnique({
            where: { name: dto.name },
            select: { id: true },
        });

        if (existing) {
            throw new AppError(
                'SPECIALIST_ALREADY_EXISTS',
                'Specialist name already exists',
            );
        }

        const specialist = await this.prisma.specialist.create({
            data: {
                name: dto.name,
                description: dto.description,
            },
        });

        return this.toResponse(specialist);
    }

    // READ ALL
    async findAll(): Promise<SpecialistResponseDto[]> {
        const specialists = await this.prisma.specialist.findMany({
            orderBy: { name: 'asc' },
        });

        return specialists.map((specialist) =>
            this.toResponse(specialist),
        );
    }

    // READ ONE
    async findOne(id: bigint): Promise<SpecialistResponseDto> {
        const specialist = await this.prisma.specialist.findUnique({
            where: { id },
        });

        if (!specialist) {
            throw new AppError(
                'SPECIALIST_NOT_FOUND',
                'Specialist not found',
            );
        }

        return this.toResponse(specialist);
    }

    // UPDATE
    async update(
        id: bigint,
        dto: UpdateSpecialistDto,
    ): Promise<SpecialistResponseDto> {
        if (Object.keys(dto).length === 0) {
            throw new AppError(
                'EMPTY_UPDATE',
                'Provide at least one field to update',
            );
        }

        const current = await this.prisma.specialist.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!current) {
            throw new AppError(
                'SPECIALIST_NOT_FOUND',
                'Specialist not found',
            );
        }

        if (dto.name !== undefined) {
            const duplicate = await this.prisma.specialist.findUnique({
                where: { name: dto.name },
                select: { id: true },
            });

            if (duplicate && duplicate.id !== id) {
                throw new AppError(
                    'SPECIALIST_ALREADY_EXISTS',
                    'Specialist name already exists',
                );
            }
        }

        const specialist = await this.prisma.specialist.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
            },
        });

        return this.toResponse(specialist);
    }

    // DELETE
    async remove(id: bigint): Promise<{ message: string }> {
        const specialist = await this.prisma.specialist.findUnique({
            where: { id },
            select: {
                id: true,
                _count: {
                    select: {
                        doctors: true,
                        activities: true,
                    },
                },
            },
        });

        if (!specialist) {
            throw new AppError(
                'SPECIALIST_NOT_FOUND',
                'Specialist not found',
            );
        }

        if (
            specialist._count.doctors > 0 ||
            specialist._count.activities > 0
        ) {
            throw new AppError(
                'SPECIALIST_IN_USE',
                'Cannot delete a specialist linked to doctors or activities',
            );
        }

        await this.prisma.specialist.delete({
            where: { id },
        });

        return { message: 'Specialist deleted successfully' };
    }
}
