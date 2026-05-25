import { Controller, Get } from '@nestjs/common';
import { HealthStatusEntity } from './entities/health-status.entity';

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthStatusEntity {
    return new HealthStatusEntity({
      status: 'ok',
      service: 'satquest-backend',
      time: new Date().toISOString(),
    });
  }
}
