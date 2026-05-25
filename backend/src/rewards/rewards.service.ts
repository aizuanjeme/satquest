import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PendingRewardEntity } from './entities/pending-reward.entity';
import { LightningService } from '../lightning/lightning.service';

export interface ClaimResult {
  username: string;
  claimedSats: number;
  paymentId: string;
  rewarded: PendingRewardEntity[];
}

/**
 * Postgres-backed deferred reward lifecycle:
 *  1. addPending()  — called by ProgressService when a level is first completed.
 *  2. getPending()  — returns unclaimed rewards (and their total) for a player.
 *  3. claim()       — triggers the Lightning payout, then marks rows claimed.
 */
@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectRepository(PendingRewardEntity)
    private readonly repo: Repository<PendingRewardEntity>,
    private readonly lightning: LightningService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────
  // Write
  // ──────────────────────────────────────────────────────────────────────

  async addPending(username: string, levelId: string, amountSats: number): Promise<void> {
    const key = username.toLowerCase();
    const row = this.repo.create({
      username,
      usernameKey: key,
      levelId,
      amountSats,
      claimed: false,
    });
    await this.repo.save(row);
    this.logger.log(
      `+${amountSats} sats pending for "${username}" (level ${levelId}). Total pending: ${await this.totalUnclaimed(key)}`,
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // Read
  // ──────────────────────────────────────────────────────────────────────

  async getPending(
    username: string,
  ): Promise<{ rewards: PendingRewardEntity[]; totalSats: number }> {
    const key = username.toLowerCase();
    const rewards = await this.repo.find({
      where: { usernameKey: key, claimed: false },
      order: { earnedAt: 'ASC' },
    });
    const totalSats = rewards.reduce((acc, r) => acc + r.amountSats, 0);
    return { rewards, totalSats };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Claim
  // ──────────────────────────────────────────────────────────────────────

  async claim(username: string): Promise<ClaimResult> {
    const key = username.toLowerCase();
    const unclaimed = await this.repo.find({
      where: { usernameKey: key, claimed: false },
    });

    if (unclaimed.length === 0) {
      return { username, claimedSats: 0, paymentId: '', rewarded: [] };
    }

    const totalSats = unclaimed.reduce((acc, r) => acc + r.amountSats, 0);

    // Send Lightning payment: server wallet → player wallet.
    const payment = await this.lightning.rewardPlayer(username, totalSats);

    // Mark all as claimed only after the payment succeeds.
    const now = new Date();
    for (const reward of unclaimed) {
      reward.claimed = true;
      reward.claimedAt = now;
      reward.paymentId = payment.id;
    }
    await this.repo.save(unclaimed);

    this.logger.log(`Claimed ${totalSats} sats for "${username}" (tx: ${payment.id})`);

    return { username, claimedSats: totalSats, paymentId: payment.id, rewarded: unclaimed };
  }

  // ──────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────

  private async totalUnclaimed(key: string): Promise<number> {
    const { sum } = (await this.repo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.amountSats), 0)', 'sum')
      .where('r.usernameKey = :key AND r.claimed = false', { key })
      .getRawOne()) ?? { sum: 0 };
    return Number(sum);
  }
}
