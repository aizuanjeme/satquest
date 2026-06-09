import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'pending_rewards' })
@Index(['usernameKey', 'claimed'])
export class PendingRewardEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Display username (case-preserving) */
  @Column({ type: 'varchar', length: 30 })
  username!: string;

  /** Lowercased username used for lookups */
  @Column({ type: 'varchar', length: 30 })
  usernameKey!: string;

  /** Level that produced the reward, e.g. "0", "1", … */
  @Column({ type: 'varchar', length: 16 })
  levelId!: string;

  /** Reward amount in points */
  @Column({ type: 'int' })
  amountPoints!: number;

  /** When the reward was earned (managed by TypeORM) */
  @CreateDateColumn({ type: 'timestamptz' })
  earnedAt!: Date;

  @Column({ type: 'boolean', default: false })
  claimed!: boolean;

  /** Set when claimed; null otherwise */
  @Column({ type: 'timestamptz', nullable: true })
  claimedAt?: Date | null;

  /** Lightning payment id from the claim transaction */
  @Column({ type: 'varchar', length: 128, nullable: true })
  paymentId?: string | null;

  constructor(partial: Partial<PendingRewardEntity> = {}) {
    Object.assign(this, partial);
  }
}
