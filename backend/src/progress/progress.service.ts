import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { ProgressEntity } from './entities/progress.entity';
import { LevelResultEntity } from './entities/level-result.entity';
import { RewardsService } from '../rewards/rewards.service';
import { LevelsService } from '../levels/levels.service';

/**
 * Postgres-backed progress store. "Last-write-wins per-level" merge semantics:
 * two devices syncing concurrently keep each player's best time / latest
 * completion timestamp. Newly completed levels enqueue a pending reward.
 *
 * Point amounts are NEVER taken from the client — they are looked up from the
 * authoritative levels table so a tampered request can't inflate a score.
 * Points are converted to sats only at claim time (see RewardsService).
 */
@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ProgressEntity)
    private readonly progressRepo: Repository<ProgressEntity>,
    @InjectRepository(LevelResultEntity)
    private readonly levelRepo: Repository<LevelResultEntity>,
    private readonly rewards: RewardsService,
    private readonly levels: LevelsService,
  ) {}

  async upsert(dto: UpsertProgressDto): Promise<ProgressEntity> {
    const key = dto.username.toLowerCase();

    // Authoritative points awarded per level, keyed by level index (from the
    // DB, not the client). Unknown indices award 0 points.
    const rewardTable = await this.levels.getRewardTable();
    const pointsForLevel = (levelId: string) => rewardTable.get(levelId) ?? 0;

    let progress = await this.progressRepo.findOne({ where: { usernameKey: key } });
    if (!progress) {
      progress = this.progressRepo.create({
        username: dto.username,
        usernameKey: key,
        points: 0,
        unlockedUpTo: 0,
        levels: [],
      });
    }

    // Index existing levels by levelId for merge logic.
    const existingByLevel = new Map<string, LevelResultEntity>();
    for (const l of progress.levels ?? []) {
      existingByLevel.set(l.levelId, l);
    }

    const newlyCompleted: Array<{ levelId: string; points: number }> = [];
    const merged: LevelResultEntity[] = [];

    for (const [levelId, incoming] of Object.entries(dto.levels)) {
      const current = existingByLevel.get(levelId);
      const awardPoints = pointsForLevel(levelId);
      if (!current) {
        // First time this level is completed → queue a reward using the
        // server-side points value (never the client's).
        newlyCompleted.push({ levelId, points: awardPoints });
        merged.push(
          this.levelRepo.create({
            usernameKey: key,
            levelId,
            points: awardPoints,
            bestTimeMs: incoming.bestTimeMs,
            attempts: incoming.attempts,
            completedAt: incoming.completedAt,
          }),
        );
      } else if (incoming.completedAt > current.completedAt) {
        current.points = awardPoints;
        current.bestTimeMs = incoming.bestTimeMs;
        current.attempts = incoming.attempts;
        current.completedAt = incoming.completedAt;
        merged.push(current);
        existingByLevel.delete(levelId);
      } else {
        if (incoming.bestTimeMs < current.bestTimeMs) {
          current.bestTimeMs = incoming.bestTimeMs;
        }
        // Keep per-level points aligned with the authoritative table.
        current.points = awardPoints;
        merged.push(current);
        existingByLevel.delete(levelId);
      }
    }
    // Re-attach untouched levels (not present in this upsert payload).
    for (const leftover of existingByLevel.values()) {
      merged.push(leftover);
    }

    // Total points are summed server-side from authoritative per-level values,
    // so the client can't inflate its score.
    progress.points = merged.reduce((sum, l) => sum + (l.points || 0), 0);
    progress.unlockedUpTo = Math.max(progress.unlockedUpTo ?? 0, dto.unlockedUpTo);
    progress.deviceId = dto.deviceId ?? progress.deviceId;
    progress.levels = merged;
    if (dto.missedConcepts) {
      // The client owns the spaced-repetition state (it tracks per-session
      // misses and mastery decay), so the latest sync wins.
      progress.missedConcepts = dto.missedConcepts;
    }

    const saved = await this.progressRepo.save(progress);

    // Record pending rewards for each newly completed level (no Lightning call
    // yet). Amounts are in points; conversion to sats happens at claim time.
    for (const { levelId, points } of newlyCompleted) {
      await this.rewards.addPending(dto.username, levelId, points);
    }

    return saved;
  }

  async findOne(username: string): Promise<ProgressEntity> {
    const p = await this.progressRepo.findOne({
      where: { usernameKey: username.toLowerCase() },
    });
    if (!p) throw new NotFoundException(`progress for "${username}" not found`);
    return p;
  }

  async all(): Promise<ProgressEntity[]> {
    return this.progressRepo.find();
  }
}
