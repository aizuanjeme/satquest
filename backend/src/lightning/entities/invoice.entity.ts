/**
 * InvoiceEntity — a BOLT11 Lightning invoice generated for a player.
 *
 * Returned by POST /api/lightning/:username/invoice and consumed by the
 * frontend wallet to show a QR code + payment string the user can share or
 * paste into another wallet to pay.
 */
export class InvoiceEntity {
  /** Player who owns the receiving wallet */
  username!: string;

  /** BOLT11 payment request string (lnbc…) — what the payer pastes / scans */
  paymentRequest!: string;

  /** Amount requested in satoshis (undefined = "any amount" invoice) */
  amountSats?: number;

  /** Free-text description shown in the payer's wallet */
  description!: string;

  /** Fee the *receiver* will be charged by Breez when the invoice is settled */
  feeSats!: number;

  /** Epoch ms when the invoice was generated server-side */
  createdAt!: number;

  /** Epoch ms when the invoice will expire (createdAt + expirySecs * 1000) */
  expiresAt!: number;

  constructor(partial: Partial<InvoiceEntity> = {}) {
    Object.assign(this, partial);
  }
}
