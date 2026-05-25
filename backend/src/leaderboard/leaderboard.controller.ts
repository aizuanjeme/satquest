import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardEntryEntity } from './entities/leaderboard-entry.entity';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  /** GET /api/leaderboard?limit=50 — top players ranked by sats */
  @Get()
  top(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<LeaderboardEntryEntity[]> {
    return this.leaderboard.topBySats(limit);
  }
}
