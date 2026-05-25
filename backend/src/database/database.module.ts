import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Postgres connection wiring. Reads DATABASE_URL (preferred) or the discrete
 * DB_* variables, with sane local defaults so `docker compose up postgres`
 * "just works".
 *
 * `synchronize` is enabled while we don't yet have migrations — DO NOT keep
 * this true in production. Generate proper migrations before going live.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        const sslEnv = config.get<string>('DATABASE_SSL');

        // SSL rules:
        //  - DATABASE_SSL=true  → force on
        //  - DATABASE_SSL=false → force off
        //  - unset              → auto-on for managed providers
        //                         (supabase, neon, rds, render, railway, etc.)
        const hostedHints = /(supabase|neon|amazonaws|render|railway|fly\.dev|ondigitalocean|aiven)/i;
        const sslRequired =
          sslEnv === 'true' ||
          (sslEnv !== 'false' && !!url && hostedHints.test(url));

        return {
          type: 'postgres',
          ...(url
            ? { url }
            : {
                host: config.get<string>('DB_HOST') ?? 'localhost',
                port: parseInt(config.get<string>('DB_PORT') ?? '5432', 10),
                username: config.get<string>('DB_USERNAME') ?? 'satquest',
                password: config.get<string>('DB_PASSWORD') ?? 'satquest',
                database: config.get<string>('DB_NAME') ?? 'satquest',
              }),
          ssl: sslRequired ? { rejectUnauthorized: false } : false,
          autoLoadEntities: true,
          synchronize: config.get<string>('DB_SYNCHRONIZE') !== 'false',
          logging: config.get<string>('DB_LOGGING') === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
