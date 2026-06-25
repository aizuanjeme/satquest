import { Controller, Get } from '@nestjs/common';
import { LevelsService } from './levels.service';

/**
 * GET /api/levels  — the full ordered level set plus a content `version`.
 *
 * The frontend fetches this once, stores it in IndexedDB, and replays from the
 * cache so the game works fully offline. A changed `version` tells the client
 * to refresh its cache.
 */
@Controller('levels')
export class LevelsController {
  constructor(private readonly levels: LevelsService) {}

  @Get()
  getAll() {
    return this.levels.getPayload();
  }
}
