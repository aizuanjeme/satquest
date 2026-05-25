import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Use the Node.js subpath directly so TypeScript's default (classic) module
// resolution can find the typings — the package's root export uses the
// `exports` field which requires moduleResolution: "node16" / "bundler".
import {
  BreezSdk,
  connect,
  defaultConfig,
  Network,
  type Config,
  type ReceivePaymentMethod,
  type SdkEvent,
  type SendPaymentMethod,
  type SendPaymentOptions,
} from '@breeztech/breez-sdk-spark/nodejs';
import { Subject } from 'rxjs';

import { ProfileService } from '../profile/profile.service';
import { InvoiceEntity } from './entities/invoice.entity';
import { LightningInfoEntity } from './entities/lightning-info.entity';
import { PaymentEntity } from './entities/payment.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { SendPaymentDto } from './dto/send-payment.dto';

/** Slim shape that crosses the wire to the frontend SSE stream. */
export interface LightningEventPayload {
  username: string;
  type: SdkEvent['type'];
  /** Sats moved by this event when relevant (paymentSucceeded/Pending/Failed). */
  amountSats?: number;
  /** Direction of the payment, when known. */
  direction?: 'incoming' | 'outgoing';
  /** Breez payment id, when present. */
  paymentId?: string;
  /** Epoch ms. */
  timestamp: number;
}

/**
 * Wraps the Breez SDK (Spark) so each SatQuest player gets their own
 * non-custodial Lightning wallet, keyed by username.
 *
 * Strategy:
 *  - Lazy connect: an SDK instance is only created on first use per player.
 *  - LRU-style cache: instances live in-memory; on shutdown we disconnect all.
 *  - Storage: each wallet gets its own subdir under BREEZ_STORAGE_DIR so the
 *    SDK can persist its state without collisions.
 *  - API key: read once from BREEZ_API_KEY; missing key disables the service.
 *
 * Docs reference: https://sdk-doc-spark.breez.technology/guide/getting_started.html
 */
@Injectable()
export class LightningService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LightningService.name);
  private readonly sdkByUser = new Map<string, BreezSdk>();

  private apiKey?: string;
  private network!: Network;
  private storageRoot!: string;
  private enabled = false;
  private serverMnemonic?: string;
  private serverSdkInstance?: BreezSdk;
  /** Public LNURL-pay domain (e.g. "breez.tips"). When set, each player
   *  gets a `<handle>@<domain>` Lightning Address registered via the SDK. */
  private lnurlDomain?: string;

  /** Live event stream — one subject per username. Consumed by the SSE
   *  controller so the frontend gets push notifications for paymentSucceeded
   *  etc. with millisecond latency. */
  private readonly events$ = new Subject<LightningEventPayload>();
  /** Tracks the listener id returned by addEventListener() per sdk, so we can
   *  unregister cleanly on disconnect. */
  private readonly listenerIds = new WeakMap<BreezSdk, string>();

  /** Read-only event stream for consumers (controller etc.) */
  get events() {
    return this.events$.asObservable();
  }

  constructor(
    private readonly profiles: ProfileService,
    private readonly config: ConfigService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────────────────────────────

  onModuleInit(): void {
    this.apiKey = this.config.get<string>('BREEZ_API_KEY');
    this.network = (this.config.get<string>('BREEZ_NETWORK') ?? 'mainnet') as Network;
    this.storageRoot = this.config.get<string>('BREEZ_STORAGE_DIR') ?? './.breez';

    if (!this.apiKey) {
      this.logger.warn(
        'BREEZ_API_KEY is not set — Lightning endpoints will respond with 503. ' +
          'Request a key at https://breez.technology/request-api-key/',
      );
      return;
    }

    this.serverMnemonic = this.config.get<string>('BREEZ_SERVER_MNEMONIC');
    if (!this.serverMnemonic) {
      this.logger.warn(
        'BREEZ_SERVER_MNEMONIC is not set — the /claim endpoint will return 503.',
      );
    }

    this.lnurlDomain = this.config.get<string>('BREEZ_LNURL_DOMAIN');

    fs.mkdirSync(this.storageRoot, { recursive: true });
    this.enabled = true;
    this.logger.log(
      `Lightning service ready (network=${this.network}, storage=${this.storageRoot})`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    const allSdks = [
      ...this.sdkByUser.values(),
      ...(this.serverSdkInstance ? [this.serverSdkInstance] : []),
    ];
    if (allSdks.length === 0) return;
    this.logger.log(`Disconnecting ${allSdks.length} wallet(s)…`);
    await Promise.allSettled(
      allSdks.map(async (sdk) => {
        try {
          const listenerId = this.listenerIds.get(sdk);
          if (listenerId) {
            await sdk.removeEventListener(listenerId).catch(() => undefined);
          }
          await sdk.disconnect();
        } catch (err) {
          this.logger.warn(`disconnect failed: ${(err as Error).message}`);
        }
      }),
    );
    this.sdkByUser.clear();
    this.serverSdkInstance = undefined;
    this.events$.complete();
  }

  // ──────────────────────────────────────────────────────────────────────
  // Public API (called by the controller)
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Force the player's SDK to connect (if it isn't already) so that
   * payment events start streaming. Called by the SSE endpoint.
   */
  async ensureConnected(username: string): Promise<void> {
    await this.sdkFor(username);
  }

  async getInfo(username: string): Promise<LightningInfoEntity> {
    const sdk = await this.sdkFor(username);
    const [info, addr] = await Promise.all([
      sdk.getInfo({ ensureSynced: false }),
      sdk.getLightningAddress().catch(() => undefined),
    ]);
    return new LightningInfoEntity({
      username,
      identityPubkey: info.identityPubkey,
      balanceSats: info.balanceSats,
      network: this.network,
      lightningAddress: addr?.lightningAddress,
    });
  }

  async createInvoice(username: string, dto: CreateInvoiceDto): Promise<InvoiceEntity> {
    const sdk = await this.sdkFor(username);
    const expirySecs = dto.expirySecs ?? 60 * 60; // 1 h default

    const method: ReceivePaymentMethod = {
      type: 'bolt11Invoice',
      description: dto.description,
      amountSats: dto.amountSats,
      expirySecs,
    };

    const res = await sdk.receivePayment({ paymentMethod: method });
    const createdAt = Date.now();
    return new InvoiceEntity({
      username,
      paymentRequest: res.paymentRequest,
      amountSats: dto.amountSats,
      description: dto.description,
      feeSats: Number(res.fee), // SDK returns bigint
      createdAt,
      expiresAt: createdAt + expirySecs * 1000,
    });
  }

  async sendPayment(username: string, dto: SendPaymentDto): Promise<PaymentEntity> {    const sdk = await this.sdkFor(username);

    // Step 1 — prepare. The SDK expects amounts as bigint at the wire boundary.
    const prep = await sdk.prepareSendPayment({
      paymentRequest: dto.paymentRequest,
      amount: dto.amountSats != null ? BigInt(dto.amountSats) : undefined,
      // The remaining fields are advanced (token conversions etc.) — defaults are fine
      tokenIdentifier: undefined,
      conversionOptions: undefined,
      feePolicy: undefined,
    });

    // Step 2 — choose method-specific options
    const options = this.deriveSendOptions(prep.paymentMethod);

    const res = await sdk.sendPayment({
      prepareResponse: prep,
      options,
      idempotencyKey: undefined,
    });

    const fee = Number(this.feeForMethod(prep.paymentMethod));
    return new PaymentEntity({
      username,
      id: res.payment.id,
      status: this.mapStatus(res.payment.status as string),
      amountSats: Number(res.payment.amount ?? dto.amountSats ?? 0),
      feeSats: fee,
      paymentRequest: dto.paymentRequest,
      timestamp: Date.now(),
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // Internals
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Send a Lightning reward FROM the server wallet TO a player's wallet.
   * The player wallet generates a bolt11 invoice; the server wallet pays it.
   * Called by RewardsService during a claim.
   */
  async rewardPlayer(username: string, amountSats: number): Promise<PaymentEntity> {
    // Step 1: Player wallet generates an invoice for the reward amount.
    const playerSdk = await this.sdkFor(username);
    const invoiceRes = await playerSdk.receivePayment({
      paymentMethod: {
        type: 'bolt11Invoice',
        description: 'SatQuest level reward',
        amountSats,
        expirySecs: 60 * 10, // 10-minute claim window
      },
    });
    const bolt11 = invoiceRes.paymentRequest;

    // Step 2: Server wallet pays that invoice.
    const serverSdk = await this.getServerSdk();
    const prep = await serverSdk.prepareSendPayment({
      paymentRequest: bolt11,
      amount: undefined,
      tokenIdentifier: undefined,
      conversionOptions: undefined,
      feePolicy: undefined,
    });
    const options = this.deriveSendOptions(prep.paymentMethod);
    const res = await serverSdk.sendPayment({
      prepareResponse: prep,
      options,
      idempotencyKey: undefined,
    });

    const fee = Number(this.feeForMethod(prep.paymentMethod));
    return new PaymentEntity({
      username,
      id: res.payment.id,
      status: this.mapStatus(res.payment.status as string),
      amountSats,
      feeSats: fee,
      paymentRequest: bolt11,
      timestamp: Date.now(),
    });
  }

  /** Lazily connect (or return cached) SDK instance for the server reward wallet. */
  private async getServerSdk(): Promise<BreezSdk> {
    if (!this.enabled) {
      throw new ServiceUnavailableException(
        'Lightning service disabled — set BREEZ_API_KEY on the server',
      );
    }
    if (!this.serverMnemonic) {
      throw new ServiceUnavailableException(
        'Reward wallet not configured — set BREEZ_SERVER_MNEMONIC on the server',
      );
    }
    if (this.serverSdkInstance) return this.serverSdkInstance;

    const storageDir = path.join(this.storageRoot, '_server');
    fs.mkdirSync(storageDir, { recursive: true });

    const config: Config = {
      ...defaultConfig(this.network),
      apiKey: this.apiKey,
    };

    this.logger.log('Connecting server reward wallet…');
    this.serverSdkInstance = await connect({
      config,
      seed: { type: 'mnemonic', mnemonic: this.serverMnemonic },
      storageDir,
    });
    await this.subscribeEvents(this.serverSdkInstance, '__server__');
    return this.serverSdkInstance;
  }

  /** Lazily connect (or return cached) SDK instance for a given player. */
  private async sdkFor(username: string): Promise<BreezSdk> {
    if (!this.enabled) {
      throw new ServiceUnavailableException(
        'Lightning service disabled — set BREEZ_API_KEY on the server',
      );
    }
    const key = username.toLowerCase();
    const cached = this.sdkByUser.get(key);
    if (cached) return cached;

    const mnemonic = await this.profiles.getMnemonic(username); // throws 404 if profile missing
    const storageDir = path.join(this.storageRoot, key);
    fs.mkdirSync(storageDir, { recursive: true });

    const config: Config = {
      ...defaultConfig(this.network),
      apiKey: this.apiKey,
      ...(this.lnurlDomain ? { lnurlDomain: this.lnurlDomain } : {}),
    };

    try {
      this.logger.log(`Connecting wallet for "${username}"…`);
      const sdk = await connect({
        config,
        seed: { type: 'mnemonic', mnemonic },
        storageDir,
      });
      this.sdkByUser.set(key, sdk);
      await this.subscribeEvents(sdk, username);

      // Best-effort: register a Lightning Address with the configured
      // LNURL provider (e.g. breez.tips). The SDK persists the registration,
      // so subsequent connects are no-ops.
      this.ensureLightningAddress(sdk, username).catch((err) => {
        this.logger.warn(
          `Lightning Address registration failed for "${username}": ${(err as Error).message}`,
        );
      });

      return sdk;
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error(`Breez connect failed for "${username}": ${msg}`);
      throw new InternalServerErrorException(`failed to open wallet: ${msg}`);
    }
  }

  /**
   * Register a `<handle>@<lnurlDomain>` Lightning Address for the player.
   * Strategy:
   *  1. Skip if no domain configured, or if already registered.
   *  2. Derive a base handle from the display username (strip any existing
   *     `.satquest` / `_satquest` / `-satquest` suffix — Lightning Address
   *     locals can't contain `.`).
   *  3. Register `<base>_satquest` so every player ends up with the SatQuest
   *     brand in their address, e.g. `emeka_satquest@breez.tips`.
   *     On the off chance it's taken, fall back to the bare base handle.
   */
  /**
   * Wire SDK lifecycle events (paymentSucceeded, synced, etc.) into our
   * internal RxJS Subject so the SSE controller can fan them out to any
   * frontend that's watching this user.
   */
  private async subscribeEvents(sdk: BreezSdk, username: string): Promise<void> {
    try {
      const id = await sdk.addEventListener({
        onEvent: (e: SdkEvent) => {
          const payload = this.mapEvent(username, e);
          if (payload) {
            this.events$.next(payload);
            if (payload.type === 'paymentSucceeded') {
              this.logger.log(
                `⚡ ${payload.direction ?? '?'} ${payload.amountSats ?? 0} sats for "${username}" (${payload.paymentId ?? ''})`,
              );
            }
          }
        },
      });
      this.listenerIds.set(sdk, id);
    } catch (err) {
      this.logger.warn(`addEventListener failed for "${username}": ${(err as Error).message}`);
    }
  }

  /** Convert an SDK event into the slim wire payload, dropping noisy ones. */
  private mapEvent(username: string, e: SdkEvent): LightningEventPayload | null {
    const base = { username, type: e.type, timestamp: Date.now() };
    switch (e.type) {
      case 'paymentSucceeded':
      case 'paymentPending':
      case 'paymentFailed': {
        const p = e.payment as { id?: string; amount?: number | bigint; paymentType?: string };
        const direction: 'incoming' | 'outgoing' | undefined =
          p.paymentType === 'receive' ? 'incoming'
            : p.paymentType === 'send' ? 'outgoing'
            : undefined;
        return {
          ...base,
          paymentId: p.id,
          amountSats: p.amount != null ? Number(p.amount) : undefined,
          direction,
        };
      }
      case 'claimedDeposits':
      case 'newDeposits':
      case 'unclaimedDeposits':
      case 'synced':
        return base;
      default:
        return null; // ignore optimization / lightningAddressChanged spam
    }
  }

  private async ensureLightningAddress(sdk: BreezSdk, username: string): Promise<void> {
    if (!this.lnurlDomain) return;

    const existing = await sdk.getLightningAddress();
    if (existing?.lightningAddress) {
      this.logger.log(
        `Lightning Address for "${username}": ${existing.lightningAddress}`,
      );
      return;
    }

    const baseHandle = username
      .toLowerCase()
      .replace(/[-._]satquest$/, '')
      .replace(/[^a-z0-9_-]/g, '');
    // Preferred form is "<base>_satquest" so the brand shows up in the address.
    const candidates = [`${baseHandle}_satquest`, baseHandle];

    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        const available = await sdk.checkLightningAddressAvailable({ username: candidate });
        if (!available) continue;
        const info = await sdk.registerLightningAddress({
          username: candidate,
          description: 'SatQuest player',
        });
        this.logger.log(
          `Registered Lightning Address ${info.lightningAddress} for "${username}"`,
        );
        return;
      } catch (err) {
        this.logger.warn(
          `register attempt "${candidate}" failed: ${(err as Error).message}`,
        );
      }
    }
  }

  private deriveSendOptions(method: SendPaymentMethod): SendPaymentOptions | undefined {
    switch (method.type) {
      case 'bolt11Invoice':
        return { type: 'bolt11Invoice', preferSpark: false, completionTimeoutSecs: 15 };
      case 'bitcoinAddress':
        return { type: 'bitcoinAddress', confirmationSpeed: 'fast' };
      case 'sparkAddress':
        return { type: 'sparkAddress' };
      default:
        return undefined;
    }
  }

  private feeForMethod(method: SendPaymentMethod): number {
    switch (method.type) {
      case 'bolt11Invoice':
        return method.lightningFeeSats ?? 0;
      case 'bitcoinAddress': {
        const q = method.feeQuote.speedFast;
        return q.userFeeSat + q.l1BroadcastFeeSat;
      }
      case 'sparkAddress':
      case 'sparkInvoice':
        return Number(method.fee);
      default:
        return 0;
    }
  }

  private mapStatus(raw: string): PaymentEntity['status'] {
    const s = raw.toLowerCase();
    if (s.includes('success') || s === 'completed' || s === 'succeeded') return 'succeeded';
    if (s.includes('fail')) return 'failed';
    return 'pending';
  }

  // ──────────────────────────────────────────────────────────────────────
  // Guards
  // ──────────────────────────────────────────────────────────────────────

  assertAmountForBitcoin(dto: SendPaymentDto): void {
    // Lightweight heuristic — full validation happens inside prepareSendPayment.
    if (dto.paymentRequest.startsWith('bc1') && dto.amountSats == null) {
      throw new BadRequestException('amountSats is required for on-chain Bitcoin sends');
    }
  }
}
