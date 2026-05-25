/**
 * LightningInfoEntity — public-safe wallet status returned by GET /api/lightning/:username/info.
 *
 * Mirrors {@link import('@breeztech/breez-sdk-spark').GetInfoResponse} but uses
 * a plain number for the balance (the SDK returns it as `number`, no bigint here)
 * and adds the owner's username so the client can correlate multiple wallets.
 */
export class LightningInfoEntity {
  /** Owner of the wallet (matches ProfileEntity.username) */
  username!: string;

  /** Spark/Lightning identity public key — safe to expose, like a node id */
  identityPubkey!: string;

  /** Spendable Lightning + Spark balance in satoshis */
  balanceSats!: number;

  /** Network the wallet is running on ("mainnet" | "regtest") */
  network!: string;

  /** Public Lightning Address (e.g. "emeka_lagos@breez.tips") if registered */
  lightningAddress?: string;

  constructor(partial: Partial<LightningInfoEntity> = {}) {
    Object.assign(this, partial);
  }
}
