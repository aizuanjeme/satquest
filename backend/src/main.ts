import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Lock CORS to known origins when CORS_ORIGINS is set (comma-separated).
  // Falls back to reflecting any origin in dev, with a loud warning.
  const allowed = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors(allowed.length ? { origin: allowed, credentials: false } : {});

  if (!allowed.length) {
    Logger.warn(
      'CORS_ORIGINS is not set — allowing all origins. Set it in production.',
      'Bootstrap',
    );
  }

  // Global API prefix → all routes are mounted under /api
  app.setGlobalPrefix('api');

  // Auto-validate incoming bodies against DTOs (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  Logger.log(`⚡ SatQuest API listening on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
