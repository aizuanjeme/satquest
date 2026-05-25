import { useCallback, useEffect, useState } from 'react'
import { LEVELS, TOTAL_SATS } from '../data/levels'
import { lightningApi, rewardsApi } from '../lib/api'
import { useLightningEvents } from '../hooks/useLightningEvents'
import Avatar from './Avatar'
import BackupSeed from './BackupSeed'
import ProfileEditor from './ProfileEditor'
import QrCode from './QrCode'
import s from './Wallet.module.css'

export default function Wallet({ sats, avatar, username, progress, unlockedUpTo, onBack, onReset, onUpdateProfile }) {
  const [editing, setEditing]         = useState(false)
  const [backingUp, setBackingUp]     = useState(false)

  // Server-side wallet info (balance, pubkey).
  const [walletInfo, setWalletInfo]     = useState(null)
  const [walletErr, setWalletErr]       = useState(null)

  // Pending rewards waiting to be claimed.
  const [pending, setPending]           = useState({ rewards: [], totalSats: 0 })
  const [claiming, setClaiming]         = useState(false)
  const [claimResult, setClaimResult]   = useState(null)
  const [claimErr, setClaimErr]         = useState(null)

  // Top-up: generate an invoice for the player's own wallet so anyone can pay them.
  const [invoiceSats, setInvoiceSats]   = useState(1000)
  const [invoice, setInvoice]           = useState(null)
  const [invoiceBusy, setInvoiceBusy]   = useState(false)
  const [invoiceErr, setInvoiceErr]     = useState(null)

  // ── Load wallet + pending rewards from the backend ────────────────────
  const loadWallet = useCallback(async () => {
    if (!username) return
    try {
      const info = await lightningApi.info(username)
      setWalletInfo(info)
      setWalletErr(null)
    } catch (e) {
      setWalletErr(e)
    }
  }, [username])

  const loadPending = useCallback(async () => {
    if (!username) return
    try {
      const p = await rewardsApi.pending(username)
      setPending(p || { rewards: [], totalSats: 0 })
    } catch {
      // Silent — pending stays zero
    }
  }, [username])

  useEffect(() => { loadWallet(); loadPending() }, [loadWallet, loadPending])

  // ── Live push: refresh wallet + show toast when a payment lands ───────
  const [paymentToast, setPaymentToast] = useState(null)
  useLightningEvents(username, (evt) => {
    if (evt.type === 'paymentSucceeded') {
      loadWallet()
      loadPending()
      // Auto-close any open invoice — if it was paid, no point keeping it up.
      if (evt.direction === 'incoming') setInvoice(null)
      setPaymentToast({
        kind: evt.direction === 'incoming' ? 'in' : 'out',
        sats: evt.amountSats || 0,
        at: evt.timestamp,
      })
      setTimeout(() => setPaymentToast(null), 4500)
    } else if (evt.type === 'synced' || evt.type === 'claimedDeposits' || evt.type === 'newDeposits') {
      loadWallet()
    }
  })

  const lightningDisabled = walletErr?.status === 503

  // ── Claim all pending rewards ─────────────────────────────────────────
  const handleClaim = useCallback(async () => {
    if (!username || pending.totalSats <= 0 || claiming) return
    setClaiming(true)
    setClaimErr(null)
    try {
      const result = await rewardsApi.claim(username)
      setClaimResult(result)
      // Refresh wallet + pending in parallel after the payment.
      await Promise.all([loadWallet(), loadPending()])
    } catch (e) {
      setClaimErr(e)
    } finally {
      setClaiming(false)
    }
  }, [username, pending.totalSats, claiming, loadWallet, loadPending])

  // ── Generate a top-up invoice ─────────────────────────────────────────
  const handleGenerateInvoice = useCallback(async () => {
    if (!username || invoiceBusy) return
    setInvoiceBusy(true)
    setInvoiceErr(null)
    setInvoice(null)
    try {
      const inv = await lightningApi.invoice(username, {
        description: 'SatQuest top-up',
        amountSats: Math.max(1, Math.floor(invoiceSats)),
        expirySecs: 3600,
      })
      setInvoice(inv)
    } catch (e) {
      setInvoiceErr(e)
    } finally {
      setInvoiceBusy(false)
    }
  }, [username, invoiceSats, invoiceBusy])

  const copy = (text) => {
    try { navigator.clipboard?.writeText(text) } catch { /* ignore */ }
  }

  const completed = LEVELS.slice(0, unlockedUpTo)
  const remaining = LEVELS.slice(unlockedUpTo)
  const remainingSats = remaining.reduce((a, l) => a + l.sats, 0)
  const pct = Math.round((sats / TOTAL_SATS) * 100)

  return (
    <div className={s.body}>
      {/* Real-time payment toast (driven by SSE) */}
      {paymentToast && (
        <div className={`${s.toast} ${paymentToast.kind === 'in' ? s.toastIn : s.toastOut}`}>
          <span className={s.toastIcon}>{paymentToast.kind === 'in' ? '⚡' : '↗'}</span>
          <span className={s.toastText}>
            {paymentToast.kind === 'in' ? 'Received' : 'Sent'} {paymentToast.sats} sats
          </span>
        </div>
      )}

      <div className={s.topbar}>
        <span className={s.topTitle}>⚡ Lightning Wallet</span>
        <Avatar avatar={avatar} size="md" className={s.ava} />
      </div>

      {/* Username header */}
      {username && (
        <div className={s.userHeader}>
          <p className={s.userHandle}>@{username}</p>
          {onUpdateProfile && (
            <button className={s.editBtn} onClick={() => setEditing(true)}>
              ✏️ Edit profile
            </button>
          )}
        </div>
      )}

      {/* Edit profile modal */}
      {editing && (
        <ProfileEditor
          currentUsername={username}
          currentAvatarId={avatar?.id}
          onSave={(updates) => {
            onUpdateProfile(updates)
            setEditing(false)
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {/* Balance card */}
      <div className={s.balCard}>
        <div className={s.balGlow} />
        <p className={s.balLabel}>Your Balance</p>
        <div className={s.balRow}>
          <span className={s.boltBig}>⚡</span>
          <span className={s.balNum}>{sats}</span>
          <span className={s.balUnit}>sats</span>
        </div>
        <div className={s.balBarWrap}>
          <div className={s.balBar} style={{ width: `${pct}%` }} />
        </div>
        <p className={s.balPct}>{pct}% of {TOTAL_SATS} sats earned</p>
      </div>

      {/* Stats row */}
      <div className={s.statsRow}>
        <div className={s.stat}>
          <span className={s.statNum}>{completed.length}</span>
          <span className={s.statLabel}>Levels done</span>
        </div>
        <div className={s.statDivider} />
        <div className={s.stat}>
          <span className={s.statNum}>{remaining.length}</span>
          <span className={s.statLabel}>To unlock</span>
        </div>
        <div className={s.statDivider} />
        <div className={s.stat}>
          <span className={s.statNum}>+{remainingSats}⚡</span>
          <span className={s.statLabel}>Still to earn</span>
        </div>
      </div>

      {/* On-chain Lightning wallet status (from backend) */}
      {walletInfo && (
        <div className={s.walletCard}>
          <div className={s.walletRow}>
            <span className={s.walletLabel}>Wallet balance</span>
            <span className={s.walletBal}>{walletInfo.balanceSats ?? 0} ⚡</span>
          </div>

          {walletInfo.lightningAddress && (
            <div className={s.addrRow}>
              <span className={s.addrLabel}>Lightning Address</span>
              <div className={s.addrPill}>
                <code className={s.addrText}>{walletInfo.lightningAddress}</code>
                <button
                  className={s.addrCopy}
                  onClick={() => copy(walletInfo.lightningAddress)}
                  title="Copy"
                >
                  Copy
                </button>
              </div>
              <p className={s.addrHint}>
                Anyone can send sats to this address from any Lightning wallet.
              </p>
            </div>
          )}

          <p className={s.walletNet}>
            {walletInfo.network} · <code className={s.pubkey}>{walletInfo.identityPubkey?.slice(0, 14)}…</code>
          </p>
        </div>
      )}
      {lightningDisabled && (
        <div className={s.warnCard}>
          <p className={s.warnTitle}>⚠️ Lightning offline</p>
          <p className={s.warnSub}>
            The server hasn't enabled its Breez API key yet. Pending rewards are still tracked and
            will pay out as soon as the operator turns it on.
          </p>
        </div>
      )}

      {/* Claim section — real payout */}
      <div className={s.claimBox}>
        <p className={s.claimTitle}>⚡ Claim your rewards</p>
        <p className={s.claimSub}>
          {pending.totalSats > 0
            ? `You have ${pending.totalSats} sats ready to claim into your wallet.`
            : 'Pass a level to earn sats. They\u2019ll show up here ready to claim.'}
        </p>

        {claimResult && claimResult.claimedSats > 0 && (
          <div className={s.claimOk}>
            ✅ Sent {claimResult.claimedSats} sats — payment id <code>{claimResult.paymentId.slice(0, 10)}…</code>
          </div>
        )}
        {claimErr && (
          <div className={s.claimError}>
            Couldn't claim: {claimErr.message}
          </div>
        )}

        <button
          className={s.claimBtn}
          onClick={handleClaim}
          disabled={pending.totalSats <= 0 || claiming || lightningDisabled}
        >
          {claiming
            ? 'Sending Lightning payment…'
            : pending.totalSats > 0
              ? `Claim ${pending.totalSats} sats →`
              : 'Nothing to claim yet'}
        </button>
      </div>

      {/* Top-up: generate an invoice anyone can pay (into the player's wallet) */}
      <div className={s.topupBox}>
        <p className={s.topupTitle}>Receive Lightning ⚡</p>
        <p className={s.topupSub}>Generate an invoice so anyone can send sats to your wallet.</p>
        <div className={s.topupRow}>
          <input
            type="number"
            min={1}
            className={s.topupInput}
            value={invoiceSats}
            onChange={(e) => setInvoiceSats(Number(e.target.value) || 0)}
            disabled={invoiceBusy || lightningDisabled}
          />
          <button
            className={s.topupBtn}
            onClick={handleGenerateInvoice}
            disabled={invoiceBusy || lightningDisabled || invoiceSats <= 0}
          >
            {invoiceBusy ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {invoiceErr && <p className={s.claimError}>{invoiceErr.message}</p>}
        {invoice && (
          <div className={s.invoiceBox}>
            <div className={s.qrWrap}>
              <QrCode value={invoice.paymentRequest} size={220} />
            </div>
            <p className={s.invoiceAmount}>
              <span className={s.invoiceAmountNum}>{invoice.amountSats}</span>
              <span className={s.invoiceAmountUnit}> sats</span>
            </p>
            <p className={s.invoiceAddr}>{invoice.paymentRequest}</p>
            <div className={s.invoiceActions}>
              <button className={s.copyBtn} onClick={() => copy(invoice.paymentRequest)}>
                Copy invoice
              </button>
              <button className={s.closeBtn} onClick={() => setInvoice(null)}>Close</button>
            </div>
            <p className={s.invoiceNote}>
              Scan with any Lightning wallet · expires in {Math.max(0, Math.round((invoice.expiresAt - Date.now()) / 60000))} min
            </p>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className={s.section}>
        <p className={s.sectionTitle}>Transaction History</p>

        {completed.length === 0 && (
          <p className={s.empty}>No transactions yet. Play a level to earn sats!</p>
        )}

        {completed.map((lv, i) => {
          const perf = progress?.levels?.[i]
          const seconds = perf?.bestTimeMs != null ? Math.round(perf.bestTimeMs / 1000) : null
          const earned = perf?.sats ?? lv.sats
          return (
            <div key={lv.id} className={s.tx} style={{ animationDelay: i * 0.05 + 's' }}>
              <div className={s.txIcon}>
                <span>{lv.type === 'wordhunt' ? '🧩' : lv.badge}</span>
              </div>
              <div className={s.txInfo}>
                <p className={s.txTitle}>{lv.title}</p>
                <p className={s.txChapter}>
                  {lv.chapter}
                  {seconds != null && <> · ⏱ {seconds}s</>}
                  {perf?.attempts > 1 && <> · {perf.attempts} tries</>}
                </p>
              </div>
              <div className={s.txAmt}>
                <span className={s.txSats}>+{earned} ⚡</span>
                <span className={s.txTag}>
                  {earned === 0 ? 'Skipped' : 'Earned'}
                </span>
              </div>
            </div>
          )
        })}

        {remaining.length > 0 && (
          <div className={s.locked}>
            <span className={s.lockedIcon}>🔒</span>
            <p className={s.lockedTxt}>
              {remaining.length} more level{remaining.length > 1 ? 's' : ''} to unlock
            </p>
            <span className={s.lockedSats}>+{remainingSats} ⚡</span>
          </div>
        )}
      </div>

      {/* Lightning education */}
      <div className={s.learn}>
        <p className={s.learnTitle}>What is Lightning? ⚡</p>
        <p className={s.learnText}>
          Lightning Network is Bitcoin's layer-2 — instant, near-free payments across the globe.
          No banks. No borders. No KYC. Peer-to-peer money that settles in milliseconds.
        </p>
        <div className={s.learnStats}>
          <div className={s.lStat}><span className={s.lNum}>~1ms</span><span className={s.lLbl}>to settle</span></div>
          <div className={s.lStat}><span className={s.lNum}>&lt;1¢</span><span className={s.lLbl}>per tx</span></div>
          <div className={s.lStat}><span className={s.lNum}>∞</span><span className={s.lLbl}>no borders</span></div>
        </div>
      </div>

      {/* Back-up your wallet (lets a player play again on another device) */}
      <div className={s.backupZone}>
        <p className={s.backupTitle}>🔑 Back up your wallet</p>
        <p className={s.backupSub}>
          Save your 12-word recovery phrase. Without it, clearing browser data
          means your sats are gone forever — but with it, you can restore on
          any device, including the Breez mobile app.
        </p>
        <button className={s.backupBtn} onClick={() => setBackingUp(true)}>
          Show recovery words →
        </button>
      </div>

      {backingUp && (
        <BackupSeed username={username} onClose={() => setBackingUp(false)} />
      )}

      {/* Reset zone */}
      {onReset && (
        <div className={s.resetZone}>
          <button
            className={s.resetBtn}
            onClick={() => {
              if (
                confirm(
                  '⚠️ This wipes everything on this device.\n\n' +
                  'If you have NOT backed up your 12 recovery words, your sats are GONE FOREVER.\n\n' +
                  'Continue?',
                )
              ) {
                onReset()
              }
            }}
          >
            Reset profile &amp; progress
          </button>
          <p className={s.resetHint}>
            Wiping is permanent. Back up your wallet first if you want to come back.
          </p>
        </div>
      )}
    </div>
  )
}
