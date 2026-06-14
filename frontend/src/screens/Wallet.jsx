import { useCallback, useEffect, useState } from 'react'
import { LevelManager, TOTAL_SATS } from '../core/LevelManager'
import { lightningApi, rewardsApi } from '../core/APIClient'
import { useLightningEvents } from '../hooks/useLightningEvents'
import { sound } from '../audio/SoundManager'
import Avatar from '../ui/Avatar'
import GlassPanel from '../ui/GlassPanel'
import NeonButton from '../ui/NeonButton'
import ProgressRing from '../ui/ProgressRing'
import QrCode from '../ui/QrCode'
import BackupSeed from './BackupSeed'
import s from './Wallet.module.css'

/*
  Wallet — cinematic Lightning wallet. All backend flows preserved exactly:
  lightningApi.info/invoice, rewardsApi.pending/claim, SSE live updates,
  seed backup. Only the presentation is re-imagined.
*/
export default function Wallet({ sats, avatar, username, progress, unlockedUpTo, onBack }) {
  const [walletInfo, setWalletInfo] = useState(null)
  const [walletErr, setWalletErr] = useState(null)
  const [pending, setPending] = useState({ rewards: [], totalPoints: 0, exchangeRate: 100 })
  const [claiming, setClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState(null)
  const [claimErr, setClaimErr] = useState(null)
  const [invoiceSats, setInvoiceSats] = useState(1000)
  const [invoice, setInvoice] = useState(null)
  const [invoiceBusy, setInvoiceBusy] = useState(false)
  const [invoiceErr, setInvoiceErr] = useState(null)
  const [paymentToast, setPaymentToast] = useState(null)
  const [showSeed, setShowSeed] = useState(false)

  const loadWallet = useCallback(async () => {
    if (!username) return
    try { setWalletInfo(await lightningApi.info(username)); setWalletErr(null) }
    catch (e) { setWalletErr(e) }
  }, [username])

  const loadPending = useCallback(async () => {
    if (!username) return
    try { setPending((await rewardsApi.pending(username)) || { rewards: [], totalPoints: 0, exchangeRate: 100 }) }
    catch { /* silent */ }
  }, [username])

  useEffect(() => { loadWallet(); loadPending() }, [loadWallet, loadPending])

  useLightningEvents(username, (evt) => {
    if (evt.type === 'paymentSucceeded') {
      loadWallet(); loadPending()
      if (evt.direction === 'incoming') { setInvoice(null); sound.success() }
      setPaymentToast({ kind: evt.direction === 'incoming' ? 'in' : 'out', sats: evt.amountSats || 0 })
      setTimeout(() => setPaymentToast(null), 4500)
    } else if (evt.type === 'synced' || evt.type === 'claimedDeposits' || evt.type === 'newDeposits') {
      loadWallet()
    }
  })

  const lightningDisabled = walletErr?.status === 503
  const pendingSats = Math.floor((pending.totalPoints || 0) / (pending.exchangeRate || 100))

  const handleClaim = useCallback(async () => {
    if (!username || pending.totalPoints <= 0 || claiming) return
    setClaiming(true); setClaimErr(null)
    try {
      const result = await rewardsApi.claim(username)
      setClaimResult(result); sound.win()
      await Promise.all([loadWallet(), loadPending()])
    } catch (e) { setClaimErr(e) }
    finally { setClaiming(false) }
  }, [username, pending.totalPoints, claiming, loadWallet, loadPending])

  const handleGenerateInvoice = useCallback(async () => {
    if (!username || invoiceBusy) return
    setInvoiceBusy(true); setInvoiceErr(null); setInvoice(null)
    try {
      setInvoice(await lightningApi.invoice(username, {
        description: 'SatQuest top-up',
        amountSats: Math.max(1, Math.floor(invoiceSats)),
        expirySecs: 3600,
      }))
      sound.click()
    } catch (e) { setInvoiceErr(e) }
    finally { setInvoiceBusy(false) }
  }, [username, invoiceSats, invoiceBusy])

  const copy = (text) => { try { navigator.clipboard?.writeText(text) } catch { /* ignore */ } }

  const completed = LevelManager.all.slice(0, unlockedUpTo)
  const remaining = LevelManager.all.slice(unlockedUpTo)
  const remainingSats = remaining.reduce((a, l) => a + l.sats, 0)
  const ratio = Math.max(0, Math.min(1, sats / TOTAL_SATS))

  return (
    <div className={s.body}>
      {paymentToast && (
        <div className={`${s.toast} ${paymentToast.kind === 'in' ? s.toastIn : s.toastOut}`}>
          <span>{paymentToast.kind === 'in' ? '⚡' : '↗'}</span>
          {paymentToast.kind === 'in' ? 'Received' : 'Sent'} {paymentToast.sats} sats
        </div>
      )}

      <header className={s.header}>
        <div>
          <p className={s.kicker}>LIGHTNING</p>
          <h2 className={s.title}>Wallet</h2>
        </div>
        <Avatar avatar={avatar} size={44} />
      </header>

      <GlassPanel glow="blue" className={s.balCard}>
        <ProgressRing value={ratio} size={92} stroke={6} color="#f7c948">
          <span className={s.ringPct}>{Math.round(ratio * 100)}%</span>
        </ProgressRing>
        <div className={s.balMeta}>
          <p className={s.balLabel}>Points earned</p>
          <p className={s.balNum}>{sats}<span className={s.balUnit}> pts</span></p>
          <p className={s.balRate}>{pending.exchangeRate} pts = 1 sat · of {TOTAL_SATS} total</p>
        </div>
      </GlassPanel>

      <div className={s.stats}>
        <div className={s.stat}><b>{completed.length}</b><span>Cleared</span></div>
        <div className={s.stat}><b>{remaining.length}</b><span>Locked</span></div>
        <div className={s.stat}><b>+{remainingSats}</b><span>To earn</span></div>
      </div>

      {walletInfo && (
        <GlassPanel className={s.section}>
          <div className={s.wRow}><span className={s.wLabel}>Wallet balance</span><span className={s.wBal}>{walletInfo.balanceSats ?? 0} ⚡</span></div>
          {walletInfo.lightningAddress && (
            <div className={s.addrBlock}>
              <span className={s.wLabel}>Lightning Address</span>
              <div className={s.addrPill}>
                <code>{walletInfo.lightningAddress}</code>
                <button className={s.copyMini} onClick={() => copy(walletInfo.lightningAddress)}>Copy</button>
              </div>
            </div>
          )}
          <p className={s.netLine}>{walletInfo.network} · <code>{walletInfo.identityPubkey?.slice(0, 14)}…</code></p>
        </GlassPanel>
      )}

      {lightningDisabled && (
        <GlassPanel className={s.warn}>
          <p className={s.warnTitle}>⚠ Lightning offline</p>
          <p className={s.warnSub}>The operator hasn't enabled payouts yet. Rewards are still tracked and pay out once it's on.</p>
        </GlassPanel>
      )}

      <GlassPanel glow="purple" className={s.section}>
        <p className={s.secTitle}>⚡ Claim rewards</p>
        <p className={s.secSub}>
          {pendingSats > 0 ? `${pendingSats} sats ready to claim into your wallet.` : 'Clear levels to stack claimable sats.'}
        </p>
        {claimResult?.claimedSats > 0 && <div className={s.ok}>✅ Sent {claimResult.claimedSats} sats · <code>{claimResult.paymentId.slice(0, 10)}…</code></div>}
        {claimErr && <div className={s.bad}>Couldn't claim: {claimErr.message}</div>}
        <NeonButton variant="purple" full disabled={pendingSats <= 0 || claiming || lightningDisabled} onClick={handleClaim}>
          {claiming ? 'Sending…' : pendingSats > 0 ? `Claim ${pendingSats} sats →` : 'Nothing to claim'}
        </NeonButton>
      </GlassPanel>

      <GlassPanel className={s.section}>
        <p className={s.secTitle}>Receive ⚡</p>
        <p className={s.secSub}>Generate an invoice so anyone can send you sats.</p>
        <div className={s.invRow}>
          <input
            type="number" min={1} className={s.invInput} value={invoiceSats}
            onChange={(e) => setInvoiceSats(Number(e.target.value) || 0)}
            disabled={invoiceBusy || lightningDisabled}
          />
          <NeonButton variant="blue" disabled={invoiceBusy || lightningDisabled || invoiceSats <= 0} onClick={handleGenerateInvoice}>
            {invoiceBusy ? '…' : 'Generate'}
          </NeonButton>
        </div>
        {invoiceErr && <p className={s.bad}>{invoiceErr.message}</p>}
        {invoice && (
          <div className={s.invoiceBox}>
            <div className={s.qrWrap}><QrCode value={invoice.paymentRequest} size={210} /></div>
            <p className={s.invAmt}>{invoice.amountSats}<span> sats</span></p>
            <p className={s.invAddr}>{invoice.paymentRequest}</p>
            <div className={s.invActions}>
              <NeonButton variant="ghost" onClick={() => copy(invoice.paymentRequest)}>Copy</NeonButton>
              <NeonButton variant="ghost" onClick={() => setInvoice(null)}>Close</NeonButton>
            </div>
          </div>
        )}
      </GlassPanel>

      <GlassPanel className={s.section}>
        <p className={s.secTitle}>🔑 Back up your wallet</p>
        <p className={s.secSub}>Reveal your 12 recovery words. Write them down — they restore your wallet anywhere.</p>
        <NeonButton variant="gold" full onClick={() => { sound.tap(); setShowSeed(true) }}>Reveal recovery words</NeonButton>
      </GlassPanel>

      <div className={s.section}>
        <p className={s.secTitle}>History</p>
        {completed.length === 0 && <p className={s.empty}>No transactions yet. Clear a level to earn.</p>}
        {completed.map((lv, i) => {
          const perf = progress?.levels?.[i]
          const seconds = perf?.bestTimeMs != null ? Math.round(perf.bestTimeMs / 1000) : null
          const earned = perf?.points ?? perf?.sats ?? lv.sats
          return (
            <div key={lv.id} className={s.tx} style={{ animationDelay: `${i * 0.04}s` }}>
              <span className={s.txIcon}>{lv.type === 'wordhunt' ? '⚡' : lv.type === 'crossover' ? '★' : '◆'}</span>
              <div className={s.txInfo}>
                <p className={s.txTitle}>{lv.title}</p>
                <p className={s.txMeta}>{lv.chapter}{seconds != null && ` · ${seconds}s`}{perf?.attempts > 1 && ` · ${perf.attempts} tries`}</p>
              </div>
              <span className={s.txAmt}>+{earned} 🏆</span>
            </div>
          )
        })}
      </div>

      {showSeed && <BackupSeed username={username} onClose={() => setShowSeed(false)} />}
    </div>
  )
}
