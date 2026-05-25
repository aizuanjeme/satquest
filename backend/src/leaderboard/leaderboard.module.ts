import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { ProfileModule } from '../profile/profile.module';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

@Module({
  imports: [ProgressModule, ProfileModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
