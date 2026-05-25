/**
 * LeaderboardEntry — a single row in the global rankings response.
 *
 * Computed (not stored) by aggregating ProfileEntity + ProgressEntity per
 * player. Sorted server-side, so the client just renders the rows in order.
 */
export class LeaderboardEntryEntity {
  /** 1-based position in the ranking */
  rank!: number;

  /** Player's display username */
  username!: string;

  /** Avatar id (so the client can show the portrait next to the name) */
  avatarId!: string;

  /** Lifetime sats earned */
  sats!: number;

  /** Number of levels the player has finished at least once */
  levelsCompleted!: number;

  /** Sum of all per-level best times — used as the tie-breaker for `sats` */
  bestTotalTimeMs!: number;

  constructor(partial: Partial<LeaderboardEntryEntity> = {}) {
    Object.assign(this, partial);
  }
}
