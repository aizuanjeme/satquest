import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthController } from './health/health.controller';
import { DatabaseModule } from './database/database.module';
import { ProfileModule } from './profile/profile.module';
import { ProgressModule } from './progress/progress.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LightningModule } from './lightning/lightning.module';
import { RewardsModule } from './rewards/rewards.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AppConfigModule } from './app-config/app-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AppConfigModule,
    ProfileModule,
    ProgressModule,
    LeaderboardModule,
    LightningModule,
    RewardsModule,
    FeedbackModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
