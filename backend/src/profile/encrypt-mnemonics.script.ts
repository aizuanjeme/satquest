/**
 * One-off migration: encrypt every existing plaintext wallet mnemonic at rest
 * (AES-256-GCM) and backfill `mnemonicHash`.
 *
 * Usage:
 *   PROFILE_ENC_KEY=<key> npm run encrypt:mnemonics   (from backend/)
 *
 * Safe to run repeatedly — already-encrypted rows are skipped. Requires
 * PROFILE_ENC_KEY to be set (the same value the running server uses).
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { ProfileService } from './profile.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const profiles = app.get(ProfileService);
    const result = await profiles.encryptExistingAtRest();
    Logger.log(
      `Done — scanned ${result.scanned}, encrypted ${result.encrypted}, hashed ${result.hashed}`,
      'EncryptMnemonics',
    );
  } finally {
    await app.close();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    Logger.error(err instanceof Error ? err.message : String(err), undefined, 'EncryptMnemonics');
    process.exit(1);
  });
