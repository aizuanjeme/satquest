import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { LightningModule } from '../lightning/lightning.module';
import { PendingRewardEntity } from './entities/pending-reward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PendingRewardEntity]), LightningModule],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
