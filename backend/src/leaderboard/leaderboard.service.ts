import { Injectable } from '@nestjs/common';
import { ProgressService } from '../progress/progress.service';
import { ProfileService } from '../profile/profile.service';
import { LeaderboardEntryEntity } from './entities/leaderboard-entry.entity';

export interface LeaderboardPage {
  data: LeaderboardEntryEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly progress: ProgressService,
    private readonly profiles: ProfileService,
  ) {}

  /** Paginated leaderboard ranked by lifetime points (best total time = tie-breaker). */
  async topBySats(limit = 20, page = 1): Promise<LeaderboardPage> {
    const [progressRows, profiles] = await Promise.all([this.progress.all(), this.profiles.list()]);
    const profileByKey = new Map(profiles.map((p) => [p.username.toLowerCase(), p]));

    const sorted = progressRows
      .map((p) => {
        const profile = profileByKey.get(p.usernameKey);
        const levels = p.levels ?? [];
        return new LeaderboardEntryEntity({
          rank: 0,
          username: p.username,
          avatarId: profile?.avatarId ?? 'av1',
          points: p.points,
          levelsCompleted: levels.length,
          bestTotalTimeMs: levels.reduce((sum, l) => sum + (l.bestTimeMs || 0), 0),
        });
      })
      .sort(
        (a, b) => b.levelsCompleted - a.levelsCompleted || a.bestTotalTimeMs - b.bestTotalTimeMs,
      );

    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * limit;

    const data = sorted
      .slice(offset, offset + limit)
      .map((entry, i) => new LeaderboardEntryEntity({ ...entry, rank: offset + i + 1 }));

    return { data, total, page: safePage, limit, totalPages };
  }
}
