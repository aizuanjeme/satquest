import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

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
