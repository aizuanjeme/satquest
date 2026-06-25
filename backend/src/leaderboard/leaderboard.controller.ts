import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { LeaderboardService, LeaderboardPage } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  /**
   * GET /api/leaderboard?limit=20&page=1
   * Returns { data, total, page, limit, totalPages }
   */
  @Get()
  top(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ): Promise<LeaderboardPage> {
    return this.leaderboard.topBySats(limit, page);
  }
}
