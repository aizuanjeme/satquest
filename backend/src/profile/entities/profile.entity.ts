import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Profile entity — the domain model for a SatQuest player's identity.
 *
 * Mirrors the localStorage shape used by the frontend (see
 * `frontend/src/lib/storage.js`). Persisted in Postgres via TypeORM.
 */
@Entity({ name: 'profiles' })
export class ProfileEntity {
  /** Display username (case-preserving). Lowercased copy lives in `usernameKey`. */
  @PrimaryColumn({ type: 'varchar', length: 30 })
  username!: string;

  /** Lowercased username used for case-insensitive uniqueness + lookups. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  usernameKey!: string;

  /** Avatar id from the frontend AVATARS list, e.g. "av3" */
  @Column({ type: 'varchar', length: 32 })
  avatarId!: string;

  /** Optional stable per-browser identifier */
  @Column({ type: 'varchar', length: 128, nullable: true })
  deviceId?: string;

  /** Profile creation timestamp (managed by TypeORM) */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  /** Last update timestamp (managed by TypeORM) */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  /**
   * BIP-39 mnemonic used to derive this player's Breez/Spark Lightning wallet.
   * Generated on profile creation and never sent to the client.
   *
   * `select: false` — must be loaded explicitly via .addSelect() so it never
   * leaks into casual finds. NEVER expose through a controller response.
   *
   * SECURITY NOTE: stored as plaintext for the MVP. In production you MUST
   * encrypt this column at rest (e.g. AES-GCM with a server key in a KMS,
   * libsodium secretbox, or pgcrypto column-level encryption).
   */
  @Column({ type: 'text', nullable: true, select: false })
  mnemonic?: string;

  constructor(partial: Partial<ProfileEntity> = {}) {
    Object.assign(this, partial);
  }
}
