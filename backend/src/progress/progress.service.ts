import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { ProgressEntity } from './entities/progress.entity';
import { LevelResultEntity } from './entities/level-result.entity';
import { RewardsService } from '../rewards/rewards.service';

/**
 * Postgres-backed progress store. "Last-write-wins per-level" merge semantics:
 * two devices syncing concurrently keep each player's best time / latest
 * completion timestamp. Newly completed levels enqueue a pending reward.
 */
@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ProgressEntity)
    private readonly progressRepo: Repository<ProgressEntity>,
    @InjectRepository(LevelResultEntity)
    private readonly levelRepo: Repository<LevelResultEntity>,
    private readonly rewards: RewardsService,
  ) {}

  async upsert(dto: UpsertProgressDto): Promise<ProgressEntity> {
    const key = dto.username.toLowerCase();

    let progress = await this.progressRepo.findOne({ where: { usernameKey: key } });
    if (!progress) {
      progress = this.progressRepo.create({
        username: dto.username,
        usernameKey: key,
        sats: 0,
        unlockedUpTo: 0,
        levels: [],
      });
    }

    // Index existing levels by levelId for merge logic.
    const existingByLevel = new Map<string, LevelResultEntity>();
    for (const l of progress.levels ?? []) {
      existingByLevel.set(l.levelId, l);
    }

    const newlyCompleted: Array<{ levelId: string; sats: number }> = [];
    const merged: LevelResultEntity[] = [];

    for (const [levelId, incoming] of Object.entries(dto.levels)) {
      const current = existingByLevel.get(levelId);
      if (!current) {
        // First time this level is completed → queue a reward.
        newlyCompleted.push({ levelId, sats: incoming.sats });
        merged.push(
          this.levelRepo.create({
            usernameKey: key,
            levelId,
            sats: incoming.sats,
            bestTimeMs: incoming.bestTimeMs,
            attempts: incoming.attempts,
            completedAt: incoming.completedAt,
          }),
        );
      } else if (incoming.completedAt > current.completedAt) {
        current.sats = incoming.sats;
        current.bestTimeMs = incoming.bestTimeMs;
        current.attempts = incoming.attempts;
        current.completedAt = incoming.completedAt;
        merged.push(current);
        existingByLevel.delete(levelId);
      } else {
        if (incoming.bestTimeMs < current.bestTimeMs) {
          current.bestTimeMs = incoming.bestTimeMs;
        }
        merged.push(current);
        existingByLevel.delete(levelId);
      }
    }
    // Re-attach untouched levels (not present in this upsert payload).
    for (const leftover of existingByLevel.values()) {
      merged.push(leftover);
    }

    progress.sats = Math.max(progress.sats ?? 0, dto.sats);
    progress.unlockedUpTo = Math.max(progress.unlockedUpTo ?? 0, dto.unlockedUpTo);
    progress.deviceId = dto.deviceId ?? progress.deviceId;
    progress.levels = merged;

    const saved = await this.progressRepo.save(progress);

    // Record pending rewards for each newly completed level (no Lightning call yet).
    for (const { levelId, sats } of newlyCompleted) {
      await this.rewards.addPending(dto.username, levelId, sats);
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
