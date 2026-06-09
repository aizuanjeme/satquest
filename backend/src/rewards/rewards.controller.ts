import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { RewardsService } from './rewards.service';

/**
 * Reward endpoints (deferred Lightning payouts).
 *
 * GET  /api/rewards/:username          — list unclaimed sats
 * POST /api/rewards/:username/claim    — trigger Lightning payout for all unclaimed sats
 * POST /api/rewards/:username/share    — add +2 sat pending reward for social share bonus
 */
@Controller('rewards/:username')
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get()
  getPending(@Param('username') username: string) {
    return this.rewards.getPending(username);
  }

  @Post('claim')
  @HttpCode(200)
  async claim(@Param('username') username: string) {
    return this.rewards.claim(username);
  }

  @Post('share')
  @HttpCode(200)
  async addShareBonus(@Param('username') username: string) {
    await this.rewards.addPending(username, 'share', 20);
    return { ok: true };
  }
}
