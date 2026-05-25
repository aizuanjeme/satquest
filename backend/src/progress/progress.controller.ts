import { Body, Controller, Get, Param, Put } from '@nestjs/common';

import { ProgressService } from './progress.service';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { ProgressEntity } from './entities/progress.entity';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  /** PUT /api/progress — full upsert (merged server-side) */
  @Put()
  upsert(@Body() dto: UpsertProgressDto): Promise<ProgressEntity> {
    return this.progress.upsert(dto);
  }

  /** GET /api/progress/:username — latest server progress */
  @Get(':username')
  findOne(@Param('username') username: string): Promise<ProgressEntity> {
    return this.progress.findOne(username);
  }
}
