
import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';

import type { Request, Response } from 'express';
import { AppError } from '../errors/app-error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';
        let code = 'INTERNAL_SERVER_ERROR';

        if (exception instanceof AppError) {
            switch (exception.code) {
                case 'EMAIL_ALREADY_EXISTS':
                    status = HttpStatus.CONFLICT;
                    message = exception.message;
                    code = exception.code;
                    break;
                case 'INVALID_CREDENTIALS':
                    status = HttpStatus.UNAUTHORIZED;
                    message = exception.message;
                    code = exception.code;
                    break;
                case 'USER_NOT_FOUND':
                    status = HttpStatus.UNAUTHORIZED;
                    message = 'Session is no longer valid';
                    code = exception.code;
                    break;
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
                `${request.method} ${request.url}`,
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
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}
