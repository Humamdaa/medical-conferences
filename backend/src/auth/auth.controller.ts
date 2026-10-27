import {
    Body,
    Controller,
    Get,
    Post,
    Res,
    UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import {
    HttpCode,
    HttpStatus,
    Req,

} from '@nestjs/common';

import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { SessionAuthGuard } from './guards/session-auth/session-auth.guard';
import { Throttle } from '@nestjs/throttler';
import type { Role } from '../generated/prisma/client';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }


    private async createSession(
        request: Request,
        userId: string,
    ): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            request.session.regenerate((error) => {
                if (error) return reject(error);
                resolve();
            });
        });

        request.session.userId = userId;

        await new Promise<void>((resolve, reject) => {
            request.session.save((error) => {
                if (error) return reject(error);
                resolve();
            });
        });
    }

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @HttpCode(HttpStatus.CREATED)
    async register(
        @Body() dto: RegisterDto,
        @Req() request: Request,
    ) {
        const user = await this.authService.register(dto);

        await this.createSession(request, user.id);

        return {
            message: 'Registration successful',
            user,
        };
    }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() dto: LoginDto,
        @Req() request: Request,
    ) {
        const user = await this.authService.login(dto);

        await this.createSession(request, user.id);

        return {
            message: 'Login successful',
            user,
        };
    }


    @UseGuards(SessionAuthGuard)
    @Get('me')
    getCurrentUser(@Req() request: Request) {
        return this.authService.getCurrentUser(
            request.session.userId!,
        );
    }


    @UseGuards(SessionAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ) {
        await new Promise<void>((resolve, reject) => {
            request.session.destroy((error) => {
                if (error) {
                    return reject(error);
                }

                resolve();
            });
        });

        response.clearCookie('medical.sid', {
            path: '/',
        });

        return {
            message: 'Logout successful',
        };
    }


}
