import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * LevelEntity — a single playable level (question set).
 *
 * The full level payload (pairs, reveals, word-hunt words, quiz questions, …)
 * is stored verbatim as JSONB in `data` so the schema never has to change when
 * a new game mode is added. `sortOrder` is the canonical play order and doubles
 * as the primary key, matching the level's `id` from the original dataset.
 */
@Entity({ name: 'levels' })
export class LevelEntity {
  /** Canonical play order (1-based). Equals the level's `id`. */
  @PrimaryColumn({ type: 'int' })
  sortOrder!: number;

  /** 'match' | 'wordhunt' | 'crossover' */
  @Column({ type: 'varchar', length: 32 })
  type!: string;

  /** 1 for Stage 1, 2 for Stage 2. */
  @Column({ type: 'int', default: 1 })
  stage!: number;

  /** The entire level object as authored on the frontend. */
  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
