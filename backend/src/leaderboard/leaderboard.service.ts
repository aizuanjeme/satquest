import { Injectable } from '@nestjs/common';
import { ProgressService } from '../progress/progress.service';
import { ProfileService } from '../profile/profile.service';
import { LeaderboardEntryEntity } from './entities/leaderboard-entry.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly progress: ProgressService,
    private readonly profiles: ProfileService,
  ) {}

  /** Top N players ranked by lifetime sats (best total time = tie-breaker). */
  async topBySats(limit = 50): Promise<LeaderboardEntryEntity[]> {
    const [progressRows, profiles] = await Promise.all([this.progress.all(), this.profiles.list()]);
    const profileByKey = new Map(profiles.map((p) => [p.username.toLowerCase(), p]));

    return progressRows
      .map((p) => {
        const profile = profileByKey.get(p.usernameKey);
        const levels = p.levels ?? [];
        return new LeaderboardEntryEntity({
          rank: 0, // assigned after sort
          username: p.username,
          avatarId: profile?.avatarId ?? 'av1',
          sats: p.sats,
          levelsCompleted: levels.length,
          bestTotalTimeMs: levels.reduce((sum, l) => sum + (l.bestTimeMs || 0), 0),
        });
      })
      .sort(
        (a, b) => b.levelsCompleted - a.levelsCompleted || a.bestTotalTimeMs - b.bestTotalTimeMs,
      )
      .slice(0, limit)
      .map((entry, i) => new LeaderboardEntryEntity({ ...entry, rank: i + 1 }));
  }
}
