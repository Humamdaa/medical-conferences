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

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body() dto: LoginDto,
        @Req() request: Request,
    ) {
        const userId = await this.authService.login(dto);

        // Create a new session ID after authentication
        await new Promise<void>((resolve, reject) => {
            request.session.regenerate((error) => {
                if (error) return reject(error);
                resolve();
            });
        });

        request.session.userId = userId;

        // Ensure session is saved before responding
        await new Promise<void>((resolve, reject) => {
            request.session.save((error) => {
                if (error) return reject(error);
                resolve();
            });
        });

        return {
            message: 'Login successful',
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
