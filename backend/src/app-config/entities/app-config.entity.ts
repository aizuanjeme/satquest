import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * AppConfigEntity — a simple key-value table for runtime constants.
 *
 * Example rows:
 *  key: "POINTS_PER_SAT"   value: "100"   description: "How many points equal 1 sat"
 */
@Entity({ name: 'app_config' })
export class AppConfigEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  key!: string;

  @Column({ type: 'varchar', length: 256 })
  value!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description?: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
