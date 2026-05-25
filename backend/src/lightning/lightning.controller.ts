import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Sse } from '@nestjs/common';
import { Observable, filter, map, merge, of } from 'rxjs';

import { LightningService } from './lightning.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { SendPaymentDto } from './dto/send-payment.dto';
import { InvoiceEntity } from './entities/invoice.entity';
import { LightningInfoEntity } from './entities/lightning-info.entity';
import { PaymentEntity } from './entities/payment.entity';

/**
 * Lightning endpoints. All routes are scoped to a specific player (`:username`)
 * because each player has their own Breez wallet derived from a fresh mnemonic.
 */
@Controller('lightning/:username')
export class LightningController {
  constructor(private readonly lightning: LightningService) {}

  /** GET /api/lightning/:username/info — balance + identity pubkey */
  @Get('info')
  info(@Param('username') username: string): Promise<LightningInfoEntity> {
    return this.lightning.getInfo(username);
  }

  /** POST /api/lightning/:username/invoice — generate a BOLT11 invoice */
  @Post('invoice')
  @HttpCode(HttpStatus.CREATED)
  createInvoice(
    @Param('username') username: string,
    @Body() dto: CreateInvoiceDto,
  ): Promise<InvoiceEntity> {
    return this.lightning.createInvoice(username, dto);
  }

  /** POST /api/lightning/:username/send — pay an invoice / address */
  @Post('send')
  @HttpCode(HttpStatus.OK)
  send(@Param('username') username: string, @Body() dto: SendPaymentDto): Promise<PaymentEntity> {
    this.lightning.assertAmountForBitcoin(dto);
    return this.lightning.sendPayment(username, dto);
  }

  /**
   * GET /api/lightning/:username/events  (Server-Sent Events)
   *
   * Real-time push of Breez SDK events for this player:
   *   - paymentSucceeded  (invoice paid → balance went up)
   *   - paymentPending / paymentFailed
   *   - claimedDeposits / newDeposits
   *   - synced (initial sync done)
   *
   * Open with `new EventSource('/api/lightning/<user>/events')` from the
   * browser. Auto-reconnects on disconnect. Each message is JSON.
   */
  @Sse('events')
  events(@Param('username') username: string): Observable<MessageEvent> {
    const key = username.toLowerCase();

    // Lazily connect this player's wallet so events start flowing immediately.
    // We don't await — if the wallet is offline (no BREEZ_API_KEY), the
    // stream still works and just won't push payment events.
    this.lightning.ensureConnected(username).catch(() => undefined);

    // Send an immediate "hello" event so the client knows the stream is open,
    // then merge in the live event subject filtered to this user.
    const hello = of({
      data: { type: 'hello', username, timestamp: Date.now() },
    } as MessageEvent);

    const live = this.lightning.events.pipe(
      filter((e) => e.username.toLowerCase() === key || e.username === '__server__'),
      map((e) => ({ data: e } as MessageEvent)),
    );

    return merge(hello, live);
  }
}
