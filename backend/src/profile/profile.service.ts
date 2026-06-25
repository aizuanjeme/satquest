import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateMnemonic, validateMnemonic } from 'bip39';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ProfileEntity } from './entities/profile.entity';
import {
  decryptMnemonic,
  encryptMnemonic,
  isEncrypted,
  mnemonicHash,
  normalizeMnemonic,
  resolveKey,
} from './mnemonic-crypto';

/**
 * Postgres-backed profile store. The `mnemonic` column uses `select: false`
 * so casual finds never load it — use `getMnemonic()` when the Lightning
 * service needs it.
 */
@Injectable()
export class ProfileService {
  /** AES key for at-rest mnemonic encryption (null = plaintext / dev). */
  private readonly encKey: Buffer | null;

  constructor(
    @InjectRepository(ProfileEntity)
    private readonly repo: Repository<ProfileEntity>,
    config: ConfigService,
  ) {
    this.encKey = resolveKey(config.get<string>('PROFILE_ENC_KEY'));
  }

  async create(dto: CreateProfileDto): Promise<ProfileEntity> {
    const key = dto.username.toLowerCase();
    const existing = await this.repo.findOne({ where: { usernameKey: key } });
    if (existing) {
      // Idempotent: treat re-registration as success so resuming from the same
      // device or browser doesn't produce errors. Backfill the deviceId (for
      // legacy rows) and update avatarId if it changed so the client stays in
      // sync. Block a re-register that arrives from a *different* device.
      if (dto.deviceId && existing.deviceId && existing.deviceId !== dto.deviceId) {
        throw new ConflictException('this account is bound to another device');
      }
      let dirty = false;
      if (dto.deviceId && !existing.deviceId) {
        existing.deviceId = dto.deviceId;
        dirty = true;
      }
      if (dto.avatarId && dto.avatarId !== existing.avatarId) {
        existing.avatarId = dto.avatarId;
        dirty = true;
      }
      return dirty ? this.repo.save(existing) : existing;
    }

    // One account per device: refuse a second username from a device that
    // already owns one. (Soft control — deviceId is client-supplied.)
    if (dto.deviceId) {
      const owned = await this.repo.findOne({ where: { deviceId: dto.deviceId } });
      if (owned && owned.usernameKey !== key) {
        throw new ConflictException('this device already has an account');
      }
    }

    // Mint a fresh 12-word BIP-39 mnemonic for this player's Lightning wallet.
    const mnemonic = generateMnemonic(128);
    const profile = this.repo.create({
      username: dto.username,
      usernameKey: key,
      avatarId: dto.avatarId,
      deviceId: dto.deviceId,
      mnemonic: encryptMnemonic(mnemonic, this.encKey),
      mnemonicHash: mnemonicHash(mnemonic),
    });
    return this.repo.save(profile);
  }

  /**
   * Assert that `deviceId` is the owner of `username` before a sensitive
   * action (seed reveal, outgoing payment). Trust-on-first-use: if the profile
   * has no bound device yet (legacy rows), the first caller binds it.
   */
  async assertDeviceOwner(username: string, deviceId?: string): Promise<ProfileEntity> {
    const profile = await this.findOne(username);
    const reqDevice = (deviceId ?? '').trim();
    if (!reqDevice) {
      throw new ForbiddenException('device id required for this action');
    }
    if (!profile.deviceId) {
      profile.deviceId = reqDevice;
      return this.repo.save(profile);
    }
    if (profile.deviceId !== reqDevice) {
      throw new ForbiddenException('this account is bound to another device');
    }
    return profile;
  }

  async findOne(username: string): Promise<ProfileEntity> {
    const profile = await this.repo.findOne({ where: { usernameKey: username.toLowerCase() } });
    if (!profile) throw new NotFoundException(`profile "${username}" not found`);
    return profile;
  }

  /**
   * Public-facing copy of a profile — `mnemonic` is excluded by `select: false`,
   * so finds never include it. Returns the entity as-is.
   */
  async findOnePublic(username: string): Promise<ProfileEntity> {
    return this.findOne(username);
  }

  /** Internal-only: hand out the raw mnemonic so the Lightning service can
   *  derive this player's wallet. NEVER expose through a controller. */
  async getMnemonic(username: string): Promise<string> {
    const row = await this.repo
      .createQueryBuilder('p')
      .addSelect('p.mnemonic')
      .where('p.usernameKey = :key', { key: username.toLowerCase() })
      .getOne();
    if (!row) throw new NotFoundException(`profile "${username}" not found`);
    if (!row.mnemonic) {
      throw new NotFoundException(`profile "${username}" has no Lightning wallet`);
    }
    return decryptMnemonic(row.mnemonic, this.encKey);
  }

  async update(username: string, patch: Partial<CreateProfileDto>): Promise<ProfileEntity> {
    const existing = await this.findOne(username);
    if (patch.avatarId !== undefined) existing.avatarId = patch.avatarId;
    if (patch.deviceId !== undefined) existing.deviceId = patch.deviceId;
    // username is immutable on purpose
    return this.repo.save(existing);
  }

  async list(): Promise<ProfileEntity[]> {
    return this.repo.find();
  }

  /**
   * One-off migration: encrypt every existing plaintext mnemonic at rest and
   * backfill `mnemonicHash`. Idempotent — already-encrypted rows are skipped.
   * Run via the `encrypt:mnemonics` npm script. Requires `PROFILE_ENC_KEY`.
   */
  async encryptExistingAtRest(): Promise<{ scanned: number; encrypted: number; hashed: number }> {
    if (!this.encKey) {
      throw new Error('PROFILE_ENC_KEY is not set — nothing to encrypt');
    }
    const rows = await this.repo
      .createQueryBuilder('p')
      .addSelect('p.mnemonic')
      .addSelect('p.mnemonicHash')
      .getMany();

    let encrypted = 0;
    let hashed = 0;
    for (const row of rows) {
      if (!row.mnemonic) continue;
      let changed = false;

      // Recover plaintext whether the row is already encrypted or not.
      const plain = decryptMnemonic(row.mnemonic, this.encKey);
      const normalized = normalizeMnemonic(plain);

      if (!isEncrypted(row.mnemonic)) {
        row.mnemonic = encryptMnemonic(plain, this.encKey);
        encrypted++;
        changed = true;
      }
      if (!row.mnemonicHash) {
        row.mnemonicHash = mnemonicHash(normalized);
        hashed++;
        changed = true;
      }
      if (changed) await this.repo.save(row);
    }
    return { scanned: rows.length, encrypted, hashed };
  }

  /**
   * Reveal the BIP-39 mnemonic for a profile so the user can back it up
   * (write it on paper, save in a password manager, import into Breez mobile).
   * The mnemonic IS the wallet — if the player clears localStorage without
   * this backup, their sats are GONE unless they remember the seed.
   *
   * Security: keep this behind some authentication in production. For the MVP
   * the controller restricts the endpoint and warns clients to use it only
   * once during onboarding / backup flows.
   */
  async revealSeed(
    username: string,
    deviceId?: string,
  ): Promise<{ username: string; mnemonic: string }> {
    // Only the device that owns the account may reveal its recovery phrase.
    await this.assertDeviceOwner(username, deviceId);
    const mnemonic = await this.getMnemonic(username);
    return { username, mnemonic };
  }

  /**
   * Re-import an existing account on a new device using just the 12-word
   * mnemonic. Returns the original profile (so the client can repopulate
   * localStorage). Idempotent: calling it on a device that already has the
   * profile is harmless.
   */
  async restore(rawMnemonic: string): Promise<ProfileEntity> {
    const mnemonic = normalizeMnemonic(rawMnemonic);
    if (!validateMnemonic(mnemonic)) {
      throw new NotFoundException('invalid BIP-39 mnemonic');
    }
    // New rows are found by deterministic hash (the stored mnemonic is
    // ciphertext). Legacy rows that still hold plaintext are matched directly.
    const hash = mnemonicHash(mnemonic);
    let row = await this.repo
      .createQueryBuilder('p')
      .where('p.mnemonicHash = :hash', { hash })
      .getOne();
    if (!row) {
      row = await this.repo
        .createQueryBuilder('p')
        .addSelect('p.mnemonic')
        .where('p.mnemonic = :mnemonic', { mnemonic })
        .getOne();
    }
    if (!row) {
      throw new NotFoundException('no profile found for that mnemonic');
    }
    // Strip the secret before returning — controller never echoes it.
    delete (row as Partial<ProfileEntity>).mnemonic;
    return row;
  }
}
