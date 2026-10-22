
import { Injectable } from '@nestjs/common';
import { hash } from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AppError } from '../common/errors/app-error';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async register(dto: RegisterDto) {
        const email = dto.email.trim().toLowerCase();

        const existingUser = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (existingUser) {
            throw new AppError(
                'EMAIL_ALREADY_EXISTS',
                'Email already registered',
            );
        }

        const hashedPassword = await hash(dto.password);

        const user = await this.prisma.user.create({
            data: {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                email,
                password: hashedPassword,
                role: 'DOCTOR',
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        return {
            message: 'Registration successful',
           
        };
    }
}
