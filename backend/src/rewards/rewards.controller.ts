import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { AppConfigService } from '../app-config/app-config.service';

/**
 * Reward endpoints (deferred Lightning payouts).
 *
 * GET  /api/rewards/:username          — list unclaimed sats
 * POST /api/rewards/:username/claim    — trigger Lightning payout for all unclaimed sats
 * POST /api/rewards/:username/share    — add social share bonus to pending rewards
 */
@Controller('rewards/:username')
export class RewardsController {
  constructor(
    private readonly rewards: RewardsService,
    private readonly appConfig: AppConfigService,
  ) {}

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
    const amount = await this.appConfig.getShareRewardPts();
    await this.rewards.addPending(username, 'share', amount);
    return { ok: true, amountPoints: amount };
  }
}
