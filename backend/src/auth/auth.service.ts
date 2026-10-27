
import { Injectable } from '@nestjs/common';
import { hash } from 'argon2';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AppError } from '../common/errors/app-error';
import { Role } from '../generated/prisma/client';
import { verify } from 'argon2';
import { LoginDto } from './dto/login.dto';

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
                role: Role.DOCTOR,
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


    async login(dto: LoginDto): Promise<AuthUser> {
        const email = dto.email.trim().toLowerCase();

        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                password: true,
                role: true,
            },
        });

        if (!user) {
            throw new AppError(
                'INVALID_CREDENTIALS',
                'Invalid email or password',
            );
        }

        const validPassword = await verify(
            user.password,
            dto.password,
        );

        if (!validPassword) {
            throw new AppError(
                'INVALID_CREDENTIALS',
                'Invalid email or password',
            );
        }

        return {
            id: user.id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        };
    }


    async getCurrentUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: BigInt(userId),
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

        if (!user) {
            throw new AppError(
                'USER_NOT_FOUND',
                'User not found',
            );
        }

        return {
            ...user,
            id: user.id.toString(),
        };
    }


}


export type AuthUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
};
