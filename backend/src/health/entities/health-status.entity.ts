/**
 * HealthStatus — payload returned by GET /api/health.
 * Used by load balancers / uptime monitors to verify the service is alive.
 */
export class HealthStatusEntity {
  status!: 'ok' | 'degraded' | 'down';
  service!: string;
  time!: string;

  constructor(partial: Partial<HealthStatusEntity> = {}) {
    Object.assign(this, partial);
  }
}
