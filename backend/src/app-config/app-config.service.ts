import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigEntity } from './entities/app-config.entity';

export const CONFIG_KEYS = {
  POINTS_PER_SAT: 'POINTS_PER_SAT',
} as const;

const DEFAULTS: Record<string, { value: string; description: string }> = {
  [CONFIG_KEYS.POINTS_PER_SAT]: {
    value: '100',
    description: 'How many points equal 1 sat. E.g. 100 means 100 pts = 1 sat.',
  },
};

@Injectable()
export class AppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(
    @InjectRepository(AppConfigEntity)
    private readonly repo: Repository<AppConfigEntity>,
  ) {}

  /** Seed default rows on startup (idempotent). */
  async onModuleInit() {
    for (const [key, { value, description }] of Object.entries(DEFAULTS)) {
      const existing = await this.repo.findOne({ where: { key } });
      if (!existing) {
        await this.repo.save(this.repo.create({ key, value, description }));
        this.logger.log(`Seeded config "${key}" = ${value}`);
      }
    }
  }

  async getAll(): Promise<AppConfigEntity[]> {
    return this.repo.find();
  }

  async get(key: string): Promise<AppConfigEntity | null> {
    return this.repo.findOne({ where: { key } });
  }

  async set(key: string, value: string): Promise<AppConfigEntity> {
    let row = await this.repo.findOne({ where: { key } });
    if (row) {
      row.value = value;
    } else {
      row = this.repo.create({ key, value, description: DEFAULTS[key]?.description });
    }
    return this.repo.save(row);
  }

  /** Returns the number of points that equal 1 sat (default 100). */
  async getPointsPerSat(): Promise<number> {
    const row = await this.repo.findOne({ where: { key: CONFIG_KEYS.POINTS_PER_SAT } });
    const parsed = parseInt(row?.value ?? DEFAULTS[CONFIG_KEYS.POINTS_PER_SAT].value, 10);
    return isNaN(parsed) || parsed <= 0 ? 100 : parsed;
  }

  /** Convert a points amount to sats using the current exchange rate. */
  async pointsToSats(points: number): Promise<number> {
    const rate = await this.getPointsPerSat();
    return Math.floor(points / rate);
  }
}
