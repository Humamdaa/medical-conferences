
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import session = require('express-session');
import connectPgSimple = require('connect-pg-simple');

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const isProduction = config.get<string>('NODE_ENV') === 'production';

  app.enableCsrfProtection();

  // Trust the reverse proxy only when configured for deployment.
  if (isProduction) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  // Session configuration
  const PgSessionStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgSessionStore({
        conString: config.getOrThrow<string>('DATABASE_URL'),
        createTableIfMissing: !isProduction,
      }),
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      name: 'medical.sid',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

  // Global request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Medical Conferences API')
    .setVersion('1.0')
    .addCookieAuth('medical.sid', {
      type: 'apiKey', in: 'cookie',
      description: 'Session cookie issued by POST /auth/login. Log in on the same origin so the browser sends the HttpOnly cookie; Swagger cannot manually set the Cookie header.',
    }, 'medical.sid')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  if (!isProduction) {
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start server
  await app.listen(config.get<number>('PORT') ?? 3000);
}

bootstrap();
