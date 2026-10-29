
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';

import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';
import { AppError } from '../errors/app-error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';
        let code = 'INTERNAL_SERVER_ERROR';

        if (exception instanceof AppError) {
            code = exception.code;
            message = exception.message;

            switch (exception.code) {
                // Authentication
                case 'EMAIL_ALREADY_EXISTS':
                    status = HttpStatus.CONFLICT;
                    break;

                case 'INVALID_CREDENTIALS':
                case 'USER_NOT_FOUND':
                    status = HttpStatus.UNAUTHORIZED;

                    if (exception.code === 'USER_NOT_FOUND') {
                        message = 'Session is no longer valid';
                    }
                    break;

                // Doctor Profile validation
                case 'INVALID_PROFILE':
                case 'INCOMPLETE_DOCTOR_PROFILE':
                case 'EMPTY_UPDATE':
                    status = HttpStatus.BAD_REQUEST;
                    break;

                // Doctor Profile references
                case 'SPECIALIST_NOT_FOUND':
                    status = HttpStatus.NOT_FOUND;
                    break;

                default:
                    status = HttpStatus.INTERNAL_SERVER_ERROR;
                    message = 'Internal server error';
                    break;
            }
        } else if (
            exception instanceof Prisma.PrismaClientKnownRequestError
        ) {
            if (exception.code === 'P2002') {
                status = HttpStatus.CONFLICT;
                code = 'DUPLICATE_RECORD';
                message = 'A record with the same unique value already exists';
            }
        } else if (exception instanceof HttpException) {
            status = exception.getStatus();

            const body = exception.getResponse();
            code = 'HTTP_ERROR';

            if (typeof body === 'string') {
                message = body;
            } else if (
                body !== null &&
                typeof body === 'object' &&
                'message' in body
            ) {
                const value = body.message;

                if (
                    typeof value === 'string' ||
                    (Array.isArray(value) &&
                        value.every((item) => typeof item === 'string'))
                ) {
                    message = value;
                }
            }
        }

        if (status >= 500) {
            this.logger.error(
                `${request.method} ${request.path}`,
                exception instanceof Error
                    ? exception.stack
                    : String(exception),
            );
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            code,
            message,
            path: request.path,
            timestamp: new Date().toISOString(),
        });
    }
}
