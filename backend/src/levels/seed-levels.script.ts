/**
 * One-off action: seed (replace) the `levels` table from the bundled dataset
 * in `levels.seed.ts`.
 *
 * This is DESTRUCTIVE — it deletes every existing level and replaces the table
 * with the bundled set. To make that impossible to do by accident, it only runs
 * when you explicitly confirm:
 *
 *   npm run seed:levels                 (from backend/) → DRY RUN, touches nothing
 *   npm run seed:levels -- --confirm    → actually replaces the table
 *
 * The server never seeds on boot, so a deploy alone can never wipe content.
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { LevelsService } from './levels.service';

async function run() {
  const args = process.argv.slice(2);
  const confirmed =
    args.includes('--confirm') ||
    args.includes('--yes') ||
    args.includes('-y') ||
    process.env.SEED_CONFIRM === '1';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const levels = app.get(LevelsService);

    if (!confirmed) {
      const preview = await levels.previewSeed();
      Logger.warn(
        `DRY RUN — nothing changed. This would DELETE ${preview.current} existing ` +
          `level(s) and replace them with ${preview.incoming} bundled level(s).`,
        'SeedLevels',
      );
      Logger.warn(
        'Re-run with `npm run seed:levels -- --confirm` to actually replace the table.',
        'SeedLevels',
      );
      return;
    }

    const result = await levels.seed();
    Logger.log(`Done — seeded ${result.seeded} levels (replaced ${result.replaced})`, 'SeedLevels');
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
