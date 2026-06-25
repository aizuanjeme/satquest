/**
 * One-off action: seed (replace) the `levels` table from the bundled dataset
 * in `levels.seed.ts`.
 *
 * Usage:
 *   npm run seed:levels            (from backend/)
 *
 * The server never seeds on boot — run this explicitly when you want to load
 * or update level content. Replaces the whole table in a transaction and
 * refuses to run on an empty dataset.
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { LevelsService } from './levels.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const levels = app.get(LevelsService);
    const result = await levels.seed();
    Logger.log(
      `Done — seeded ${result.seeded} levels (replaced ${result.replaced})`,
      'SeedLevels',
    );
  } finally {
    await app.close();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    Logger.error(err instanceof Error ? err.message : String(err), undefined, 'SeedLevels');
    process.exit(1);
  });
