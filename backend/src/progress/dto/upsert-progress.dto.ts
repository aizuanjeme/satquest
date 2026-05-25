import { IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

/** Per-level performance record (matches the frontend storage shape). */
export class LevelResultDto {
  @IsInt()
  @Min(0)
  sats!: number;

  @IsInt()
  @Min(0)
  bestTimeMs!: number;

  @IsInt()
  @Min(0)
  attempts!: number;

  @IsNumber()
  completedAt!: number;
}

export class UpsertProgressDto {
  @IsString()
  username!: string;

  @IsInt()
  @Min(0)
  sats!: number;

  @IsInt()
  @Min(0)
  unlockedUpTo!: number;

  /** Map of levelIdx → LevelResultDto */
  @IsObject()
  levels!: Record<string, LevelResultDto>;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
