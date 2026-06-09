import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LevelResultEntity } from './level-result.entity';

/**
 * Progress entity — aggregate player progress across all levels.
 * One row per player (keyed by lowercase username).
 */
@Entity({ name: 'progress' })
export class ProgressEntity {
  /** Owner's display username (case-preserving) */
  @Column({ type: 'varchar', length: 30 })
  username!: string;

  /** Lowercased username — the actual primary key (case-insensitive lookup). */
  @PrimaryColumn({ type: 'varchar', length: 30 })
  @Index()
  usernameKey!: string;

  /** Lifetime points accumulated by the player */
  @Column({ type: 'int', default: 0 })
  points!: number;

  /** Highest level index the player has unlocked (0-based) */
  @Column({ type: 'int', default: 0 })
  unlockedUpTo!: number;

  /** Device that last synced this row */
  @Column({ type: 'varchar', length: 128, nullable: true })
  deviceId?: string;

  /** Last server-side write (managed by TypeORM) */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  // NOTE: do NOT initialise this property (no `= []`, no default in the
  // constructor). TypeORM throws InitializedRelationError if a relation field
  // is touched before it loads the children.
  @OneToMany(() => LevelResultEntity, (l) => l.progress, {
    cascade: true,
    eager: true,
  })
  levels!: LevelResultEntity[];

  constructor(partial: Partial<ProgressEntity> = {}) {
    Object.assign(this, partial);
  }
}
