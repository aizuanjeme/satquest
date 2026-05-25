import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateMnemonic, validateMnemonic } from 'bip39';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ProfileEntity } from './entities/profile.entity';

/**
 * Postgres-backed profile store. The `mnemonic` column uses `select: false`
 * so casual finds never load it — use `getMnemonic()` when the Lightning
 * service needs it.
 */
@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly repo: Repository<ProfileEntity>,
  ) {}

  async create(dto: CreateProfileDto): Promise<ProfileEntity> {
    const key = dto.username.toLowerCase();
    const existing = await this.repo.findOne({ where: { usernameKey: key } });
    if (existing) {
      throw new ConflictException(`username "${dto.username}" is already taken`);
    }

    const profile = this.repo.create({
      username: dto.username,
      usernameKey: key,
      avatarId: dto.avatarId,
      deviceId: dto.deviceId,
      // Mint a fresh 12-word BIP-39 mnemonic for this player's Lightning wallet
      mnemonic: generateMnemonic(128),
    });
    return this.repo.save(profile);
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
    return row.mnemonic;
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
   * Reveal the BIP-39 mnemonic for a profile so the user can back it up
   * (write it on paper, save in a password manager, import into Breez mobile).
   * The mnemonic IS the wallet — if the player clears localStorage without
   * this backup, their sats are GONE unless they remember the seed.
   *
   * Security: keep this behind some authentication in production. For the MVP
   * the controller restricts the endpoint and warns clients to use it only
   * once during onboarding / backup flows.
   */
  async revealSeed(username: string): Promise<{ username: string; mnemonic: string }> {
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
    const mnemonic = rawMnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!validateMnemonic(mnemonic)) {
      throw new NotFoundException('invalid BIP-39 mnemonic');
    }
    const row = await this.repo
      .createQueryBuilder('p')
      .addSelect('p.mnemonic')
      .where('p.mnemonic = :mnemonic', { mnemonic })
      .getOne();
    if (!row) {
      throw new NotFoundException('no profile found for that mnemonic');
    }
    // Strip the secret before returning — controller never echoes it.
    delete (row as Partial<ProfileEntity>).mnemonic;
    return row;
  }
}
