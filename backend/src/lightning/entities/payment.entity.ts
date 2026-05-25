/**
 * PaymentEntity — flattened summary of an outbound payment.
 *
 * The Breez SDK's full `Payment` object has many discriminated-union fields;
 * this entity exposes only what the frontend needs to render a "sent" tile.
 */
export class PaymentEntity {
  /** Player who sent the payment */
  username!: string;

  /** Unique payment identifier from the SDK (txid, payment hash, etc.) */
  id!: string;

  /** "succeeded" | "pending" | "failed" — derived from the SDK status enum */
  status!: 'succeeded' | 'pending' | 'failed';

  /** Net amount that left the wallet, in satoshis */
  amountSats!: number;

  /** Fee paid for routing / on-chain confirmation */
  feeSats!: number;

  /** Echo of the original invoice / address the payment was sent to */
  paymentRequest!: string;

  /** Epoch ms when the payment was initiated server-side */
  timestamp!: number;

  constructor(partial: Partial<PaymentEntity> = {}) {
    Object.assign(this, partial);
  }
}
