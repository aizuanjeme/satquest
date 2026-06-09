import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { ProgressEntity } from './progress.entity';

/**
 * LevelResult — per-level performance record for one player.
 *
 * One row per (username, levelId). Owned by a `ProgressEntity` aggregate.
 */
@Entity({ name: 'level_results' })
@Index('uq_level_per_user', ['usernameKey', 'levelId'], { unique: true })
export class LevelResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Lowercased username — FK to ProgressEntity.usernameKey */
  @Column({ type: 'varchar', length: 30 })
  usernameKey!: string;

  /** Level index as a string, e.g. "0", "1", … (mirrors frontend keys) */
  @Column({ type: 'varchar', length: 16 })
  levelId!: string;

  /** Points awarded on the best run of this level */
  @Column({ type: 'int' })
  points!: number;

  /** Fastest completion time across all attempts (ms) */
  @Column({ type: 'int' })
  bestTimeMs!: number;

  /** How many times the player attempted (passed or failed) the level */
  @Column({ type: 'int' })
  attempts!: number;

  /** Epoch ms of the most recent completion */
  @Column({ type: 'bigint', transformer: { to: (v: number) => v, from: (v: string) => Number(v) } })
  completedAt!: number;

  @ManyToOne(() => ProgressEntity, (p) => p.levels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usernameKey', referencedColumnName: 'usernameKey' })
  progress?: ProgressEntity;

  constructor(partial: Partial<LevelResultEntity> = {}) {
    Object.assign(this, partial);
  }
}
