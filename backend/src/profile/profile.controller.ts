import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';

import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { RestoreProfileDto } from './dto/restore-profile.dto';
import { ProfileEntity } from './entities/profile.entity';

/** Wire shape for profile responses — never includes the mnemonic. */
type PublicProfile = Omit<ProfileEntity, 'mnemonic'>;

@Controller('profile')
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  /** POST /api/profile  — create a new profile (also mints a Lightning wallet). */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProfileDto): Promise<PublicProfile> {
    const { mnemonic: _mnemonic, ...safe } = await this.profiles.create(dto);
    void _mnemonic;
    return safe;
  }

  /** GET /api/profile/:username — fetch a profile (no mnemonic). */
  @Get(':username')
  findOne(@Param('username') username: string): Promise<PublicProfile> {
    return this.profiles.findOnePublic(username);
  }

  /** PATCH /api/profile/:username — update avatar (username is immutable). */
  @Patch(':username')
  async update(
    @Param('username') username: string,
    @Body() patch: Partial<CreateProfileDto>,
  ): Promise<PublicProfile> {
    const { mnemonic: _mnemonic, ...safe } = await this.profiles.update(username, patch);
    void _mnemonic;
    return safe;
  }

  /**
   * GET /api/profile/:username/seed — reveal the BIP-39 mnemonic so the user
   * can back up their wallet. SECURITY: keep this behind auth in production.
   * For MVP it's open so the in-app "Back up wallet" screen works.
   */
  @Get(':username/seed')
  revealSeed(@Param('username') username: string) {
    return this.profiles.revealSeed(username);
  }

  /**
   * POST /api/profile/restore — re-import an existing account on a new device
   * using its 12-word mnemonic. Returns the original profile so the client
   * can repopulate its local cache. Idempotent.
   */
  @Post('restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Body() dto: RestoreProfileDto): Promise<PublicProfile> {
    return this.profiles.restore(dto.mnemonic);
  }
}
