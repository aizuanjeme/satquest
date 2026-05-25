import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { RewardsService } from './rewards.service';

/**
 * Reward endpoints (deferred Lightning payouts).
 *
 * GET  /api/rewards/:username          — list unclaimed sats
 * POST /api/rewards/:username/claim    — trigger Lightning payout for all unclaimed sats
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
}
