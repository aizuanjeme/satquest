import { IsString, Matches, Length, IsOptional } from 'class-validator';

/**
 * Mirrors the localStorage shape used by the frontend
 * (see frontend/src/lib/storage.js).
 */
export class CreateProfileDto {
  /**
   * Must end with one of: -satquest  .satquest  _satquest
   * Examples: emeka_lagos.satquest  | player-one_satquest | gamer.satquest
   * Base portion: letters, numbers, underscore, hyphen (2–20 chars).
   * Full string length: 11–30 chars (base + separator + "satquest").
   */
  @IsString()
  @Length(11, 30)
  @Matches(/^[a-zA-Z0-9_-]{2,20}[-._]satquest$/, {
    message: 'username must follow the pattern <name>[-._]satquest  (e.g. emeka_lagos.satquest)',
  })
  username!: string;

  /** Avatar id from the frontend AVATARS list, e.g. "av3" */
  @IsString()
  avatarId!: string;

  /** Optional stable per-browser device id */
  @IsOptional()
  @IsString()
  deviceId?: string;
}
