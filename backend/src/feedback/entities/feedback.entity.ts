import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { ProfileEntity } from '../../profile/entities/profile.entity';

export type FeedbackCategory = 'general' | 'bug' | 'suggestion' | 'other';

/**
 * Feedback entity — stores player-submitted feedback linked to their profile.
 * One profile can have many feedback entries.
 */
@Entity({ name: 'feedbacks' })
export class FeedbackEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Username of the player who submitted this feedback. */
  @Index()
  @Column({ type: 'varchar', length: 30 })
  username!: string;

  /** Relation to the profile row (used for JOINs / cascade deletes). */
  @ManyToOne(() => ProfileEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  profile!: ProfileEntity;

  /** Optional 1-5 star rating. */
  @Column({ type: 'smallint', nullable: true })
  rating?: number;

  /** Optional category tag. */
  @Column({ type: 'varchar', length: 20, nullable: true })
  category?: FeedbackCategory;

  /** The feedback message body. */
  @Column({ type: 'text' })
  message!: string;

  /** When the feedback was submitted (managed by TypeORM). */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  constructor(partial: Partial<FeedbackEntity> = {}) {
    Object.assign(this, partial);
  }
}
