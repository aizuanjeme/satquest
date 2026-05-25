import { Module } from '@nestjs/common';
import { LightningController } from './lightning.controller';
import { LightningService } from './lightning.service';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [ProfileModule],
  controllers: [LightningController],
  providers: [LightningService],
  exports: [LightningService],
})
export class LightningModule {}
