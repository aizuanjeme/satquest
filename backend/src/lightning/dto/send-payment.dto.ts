import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

/**
 * Request body for POST /api/lightning/:username/send
 * — pay a BOLT11 invoice, Bitcoin address, or Spark address out of the player's wallet.
 */
export class SendPaymentDto {
  /** BOLT11 invoice, Bitcoin address, or Spark address to pay */
  @IsString()
  @Length(1, 2048)
  paymentRequest!: string;

  /**
   * Optional override amount, in satoshis.
   * Required for "any amount" invoices and on-chain / Spark addresses.
   * Ignored when the invoice already carries an amount.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  amountSats?: number;
}
