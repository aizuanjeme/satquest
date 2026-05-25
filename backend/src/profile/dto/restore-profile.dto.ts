import { IsString, Length, Matches } from 'class-validator';

/**
 * Re-import an existing wallet on a new device using its BIP-39 mnemonic.
 * The server looks up the matching profile row by mnemonic — the user does
 * NOT need to remember their username. If no row matches, returns 404.
 */
export class RestoreProfileDto {
  /** 12-word BIP-39 mnemonic. Words are lowercased + whitespace-normalised. */
  @IsString()
  @Length(20, 500)
  @Matches(/^([a-zA-Z]+\s+){11}[a-zA-Z]+$/, {
    message: 'mnemonic must be exactly 12 lowercase BIP-39 words separated by spaces',
  })
  mnemonic!: string;
}
