import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { LevelEntity } from './entities/level.entity';
import { LEVELS_SEED, RawLevel } from './levels.seed';

/**
 * Read a level's reward in points. New rows store it as `points`; legacy rows
 * (and raw seed data) may still call it `sats` — the value has always meant
 * points, converted to sats only at claim time.
 */
function levelPoints(level: Record<string, unknown>): number {
  const v = level?.points ?? level?.sats;
  return typeof v === 'number' ? v : 0;
}

export interface LevelsPayload {
  /** Content hash — changes whenever any level changes. Used for cache busting. */
  version: string;
  /** Total number of levels. */
  count: number;
  /** Number of Stage 1 levels (index where Stage 2 begins). */
  stage1Count: number;
  /** Sum of every level's points reward. */
  totalSats: number;
  /** The ordered level objects, exactly as the frontend expects them. */
  levels: Record<string, unknown>[];
}

@Injectable()
export class LevelsService {
  private readonly logger = new Logger(LevelsService.name);

  constructor(
    @InjectRepository(LevelEntity)
    private readonly repo: Repository<LevelEntity>,
  ) {}

  /**
   * Seed (replace) the `levels` table from the bundled dataset. This is a
   * manual ACTION — the server does NOT seed on boot, so an empty or changed
   * dataset never silently rewrites/clears a live database. Run it explicitly:
   *
   *   npm run seed:levels   (from backend/)
   *
   * Replaces the whole set in a transaction so readers never see a half-seed.
   * Refuses to run on an empty dataset so it can't wipe existing content.
   */
  async seed(): Promise<{ seeded: number; replaced: number }> {
    if (LEVELS_SEED.length === 0) {
      throw new Error('LEVELS_SEED is empty — refusing to clear the levels table');
    }

    const seedRows = LEVELS_SEED.map((lv) => this.toEntity(lv));
    const seedHash = this.hash(seedRows.map((r) => r.data));

    const current = await this.repo.find({ order: { sortOrder: 'ASC' } });
    const currentHash = this.hash(current.map((r) => r.data));

    if (current.length > 0 && currentHash === seedHash) {
      this.logger.log('Levels already up to date — nothing to do');
      return { seeded: current.length, replaced: 0 };
    }

    await this.repo.manager.transaction(async (tx) => {
      if (current.length > 0) {
        await tx.createQueryBuilder().delete().from(LevelEntity).execute();
      }
      await tx.save(seedRows);
    });
    this.logger.log(
      `${current.length === 0 ? 'Seeded' : 'Re-seeded'} ${seedRows.length} levels`,
    );
    return { seeded: seedRows.length, replaced: current.length };
  }

  /** Build the full payload the frontend caches for offline play. */
  async getPayload(): Promise<LevelsPayload> {
    const rows = await this.repo.find({ order: { sortOrder: 'ASC' } });
    const levels = rows.map((r) => r.data);
    const stage1Count = rows.filter((r) => r.stage !== 2).length;
    const totalSats = levels.reduce((sum, l) => sum + levelPoints(l), 0);

    return {
      version: this.hash(levels),
      count: levels.length,
      stage1Count,
      totalSats,
      levels,
    };
  }

  /**
   * Authoritative points table: maps a 0-based level index (as a string, the
   * same key the frontend uses in its `progress.levels`) to the points that
   * level awards. The server uses this so reward amounts come from the
   * database, not from a (spoofable) client-supplied value. Points are
   * converted to sats only at claim time (see RewardsService).
   */
  async getRewardTable(): Promise<Map<string, number>> {
    const rows = await this.repo.find({ order: { sortOrder: 'ASC' } });
    const table = new Map<string, number>();
    rows.forEach((r, idx) => {
      table.set(String(idx), levelPoints(r.data));
    });
    return table;
  }

  private toEntity(lv: RawLevel): LevelEntity {
    const row = new LevelEntity();
    row.sortOrder = lv.id;
    row.type = lv.type;
    row.stage = lv.stage === 2 ? 2 : 1;
    // Persist the reward under `points` (it has always represented points, not
    // sats — conversion to sats happens at claim time). Legacy seed/source data
    // may still call it `sats`; normalise it here so the DB is consistent.
    const data: Record<string, unknown> = { ...(lv as Record<string, unknown>) };
    if (data.points === undefined && typeof data.sats === 'number') {
      data.points = data.sats;
    }
    delete data.sats;
    row.data = data;
    return row;
  }

  private hash(levels: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(levels))
      .digest('hex')
      .slice(0, 16);
  }
}
