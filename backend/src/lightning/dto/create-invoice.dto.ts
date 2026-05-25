import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

/**
 * Request body for POST /api/lightning/:username/invoice
 * — generate a BOLT11 invoice the player can share to receive sats.
 */
export class CreateInvoiceDto {
  /** Free-text shown in the payer's wallet (e.g. "SatQuest level 5 reward") */
  @IsString()
  @Length(1, 240)
  description!: string;

  /** Optional amount; omit for an "any amount" invoice */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100_000_000) // hard ceiling: 1 BTC per invoice, sanity guard
  amountSats?: number;

  /**
   * How long the invoice stays payable, in seconds.
   * Defaults to 1 hour on the server if omitted.
   */
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(60 * 60 * 24 * 7) // up to 7 days
  expirySecs?: number;
}
