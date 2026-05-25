import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { RewardsModule } from '../rewards/rewards.module';
import { ProgressEntity } from './entities/progress.entity';
import { LevelResultEntity } from './entities/level-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProgressEntity, LevelResultEntity]), RewardsModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
