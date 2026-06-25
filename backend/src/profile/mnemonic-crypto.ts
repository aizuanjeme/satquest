import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'crypto';

/**
 * At-rest encryption for the BIP-39 wallet mnemonic.
 *
 * Format of an encrypted value: `enc.v1:<ivB64>.<tagB64>.<cipherB64>` using
 * AES-256-GCM. The key is resolved from a raw config string via `resolveKey`:
 *   - 64 hex chars   → used directly as 32 raw bytes
 *   - 32-byte base64 → used directly
 *   - anything else  → treated as a passphrase, stretched with scrypt
 *
 * When the key is `null` (config value unset), values are stored as plaintext
 * (dev only) and `decryptMnemonic` returns legacy plaintext untouched, so
 * existing rows keep working. Provide a key in production to encrypt at rest.
 */

const PREFIX = 'enc.v1:';
const SCRYPT_SALT = 'satquest.mnemonic.v1';

/** Resolve a raw config string into a 32-byte AES key, or null when unset. */
export function resolveKey(raw?: string | null): Buffer | null {
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  const asB64 = Buffer.from(raw, 'base64');
  if (asB64.length === 32) return asB64;
  return scryptSync(raw, SCRYPT_SALT, 32);
}

/** Normalise a mnemonic the same way everywhere: trimmed, lowercased, single-spaced. */
export function normalizeMnemonic(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Deterministic lookup key for a mnemonic (so we never query by ciphertext). */
export function mnemonicHash(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex');
}

/** True when a stored value is already encrypted. */
export function isEncrypted(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

/** Encrypt for storage. Returns plaintext unchanged when no key is provided. */
export function encryptMnemonic(plain: string, key: Buffer | null): string {
  if (!key) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}.${tag.toString('base64')}.${enc.toString('base64')}`;
}

/** Decrypt a stored value. Legacy plaintext (no prefix) is returned as-is. */
export function decryptMnemonic(stored: string, key: Buffer | null): string {
  if (!isEncrypted(stored)) return stored;
  if (!key) {
    throw new Error('PROFILE_ENC_KEY is required to decrypt a stored mnemonic');
  }
  const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split('.');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
