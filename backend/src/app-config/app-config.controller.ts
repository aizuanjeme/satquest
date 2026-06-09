import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { AppConfigService } from './app-config.service';

/**
 * GET  /api/config               — list all config entries
 * GET  /api/config/:key          — get one entry
 * PUT  /api/config/:key          — update a value  { value: string }
 */
@Controller('config')
export class AppConfigController {
  constructor(private readonly configService: AppConfigService) {}

  @Get()
  getAll() {
    return this.configService.getAll();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.configService.get(key.toUpperCase());
  }

  @Put(':key')
  set(@Param('key') key: string, @Body() body: { value: string }) {
    return this.configService.set(key.toUpperCase(), String(body.value));
  }
}
