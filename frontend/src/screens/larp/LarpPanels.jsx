import { useEffect, useMemo, useState } from 'react'
import { sound } from '../../audio/SoundManager'
import { Draggable, useDropZone } from '../../larp/drag'
import {
  spendableCoins, buildPayment, sign, txBody, sortedMempool, feeRate, confirmations,
  templateStats, bestTemplate, txName, hashNumber, targetNumber, tipHash, hash,
} from '../../larp/engine'
import { YOU } from '../../larp/chapters'
import { t } from '../../i18n'
import s from './Larp.module.css'

/*
  The LARP table's stations, styled after the paper LARP kit and written for
  young players:
   - coins carry a padlock in their owner's colour (= public key);
     your matching key (= private key) is the only thing that opens it;
   - transaction cards have a nickname ("eagle33"), inputs and outputs;
   - miners fill a block, see the block-header card, and tap the handheld
     miner until it finds a number smaller than the target;
   - checkers (nodes) run through a check sheet before saying yes or no.

  Every panel uses simple words first, with the grown-up word in a chip.
*/

const fmt = (n) => Math.round(n).toLocaleString()

/** Stable id from a tx's contents, so the card keeps its nickname after it's shouted out. */
const idFor = (tx) => `x${hash(txBody(tx)).slice(0, 12)}`

export const TIPS = [
  { id: 'slow', rate: 2, icon: '🐢' },
  { id: 'normal', rate: 8, icon: '🚶' },
  { id: 'fast', rate: 25, icon: '🚀' },
]

/* ------------------------------------------------------------ pieces */

export function Grown({ word }) {
  return <span className={s.grown}>{t('larp.grown', { word })}</span>
}

/** A padlock sticker in the owner's colour. */
export function Lock({ player, open, small }) {
  const color = player?.lock?.hex || '#888'
  return (
    <span
      className={`${s.lock} ${open ? s.lockOpen : ''} ${small ? s.lockSmall : ''}`}
      style={{ '--lock': color }}
      title={player ? t('larp.lockOf', { name: player.id === YOU ? t('larp.you') : player.name }) : ''}
    >
      <span className={s.shackle} />
      <span className={s.lockBody} />
    </span>
  )
}

function KeyChip({ player, dim }) {
  return (
    <span className={`${s.keyChip} ${dim ? s.keyIdle : ''}`} style={{ '--lock': player?.lock?.hex }}>
      <span className={s.keyIcon}>🔑</span>
      {player?.id === YOU ? t('larp.wallet.key') : t('larp.keyOf', { name: player?.name })}
    </span>
  )
}

function Who({ state, id }) {
  const p = state.players[id]
  if (!p) return <span>?</span>
  return (
    <span className={s.who}>
      {p.team && <span className={`${s.teamDot} ${s[p.team]}`} />}
      {p.emoji} {id === YOU ? t('larp.you') : p.name}
    </span>
  )
}

function Panel({ icon, title, grown, hint, children, coach }) {
  return (
    <section className={s.panel} data-coach={coach}>
      <header className={s.panelHead}>
        <span className={s.panelIcon}>{icon}</span>
        <h3 className={s.panelTitle}>{title}</h3>
        {grown && <Grown word={grown} />}
      </header>
      {hint && <p className={s.panelHint}>{hint}</p>}
      {children}
    </section>
  )
}

function Coin({ state, coin, selected, open }) {
  return (
    <span className={`${s.coin} ${selected ? s.coinIn : ''} ${coin.coinbase ? s.coinMined : ''}`}>
      <span className={s.coinVal}>{fmt(coin.value)}</span>
      <Lock player={state.players[coin.owner]} open={open} small />
    </span>
  )
}

/** Paper transaction card: nickname, inputs (coins + locks), outputs (amount + lock). */
export function TxCard({ state, tx, open, compact }) {
  return (
    <div className={`${s.paper} ${compact ? s.paperCompact : ''}`}>
      <p className={s.txid}>txid: <span className={s.hand}>{txName(tx.id || txBody(tx))}</span></p>
      {!compact && (
        <>
          <p className={s.paperLabel}>{t('larp.card.in')}</p>
          {tx.inputs.map((id) => {
            const coin = state.utxos[id]
            return (
              <div key={id} className={s.paperRow}>
                <span className={s.hand}>{fmt(coin?.value || 0)}</span>
                <Lock player={state.players[coin?.owner]} open={open} />
              </div>
            )
          })}
        </>
      )}
      <p className={s.paperLabel}>{t('larp.card.out')}</p>
      <div className={s.outGrid}>
        {tx.outputs.map((o, i) => (
          <div key={i} className={s.paperRow}>
            <span className={s.hand}>{fmt(o.value)}</span>
            <Lock player={state.players[o.to]} />
            <span className={s.outN}>#{i}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- Wallet */

export function WalletPanel({ game, chapter, report }) {
  const { state, act } = game
  const me = state.players[YOU]
  const payees = Object.values(state.players).filter((p) => p.id !== YOU && p.role !== 'miner')
  const [inputs, setInputs] = useState([])
  const [to, setTo] = useState(chapter.task?.to || payees[0]?.id)
  const [amount, setAmount] = useState(chapter.task?.amount || 1000)
  const [tipId, setTipId] = useState('normal')
  const [tipPicked, setTipPicked] = useState(false)
  const [signed, setSigned] = useState(false)
  const rate = TIPS.find((f) => f.id === tipId).rate

  const coins = spendableCoins(state, YOU)
  const liveInputs = inputs.filter((id) => coins.some((c) => c.id === id))
  const basket = coins.filter((c) => !liveInputs.includes(c.id))
  const draft = liveInputs.length && amount > 0
    ? buildPayment(state, { from: YOU, inputs: liveInputs, to, amount: Number(amount), rate })
    : null
  const ready = !!draft && draft.shortBy === 0
  const draftId = draft ? idFor(draft) : null

  useEffect(() => { report?.({ ready, signed, tipPicked }) }, [ready, signed, tipPicked]) // eslint-disable-line

  const touch = (fn) => (...args) => { setSigned(false); fn(...args) }
  const addCoin = touch((id) => setInputs((xs) => (xs.includes(id) ? xs : [...xs, id])))
  const removeCoin = touch((id) => setInputs((xs) => xs.filter((x) => x !== id)))

  const doSign = () => { if (ready) { sound.correct(); setSigned(true) } }
  const inputsZone = useDropZone('tx-inputs', { accepts: (p) => p.kind === 'coin', onDrop: (p) => addCoin(p.id) })
  const signZone = useDropZone('tx-sign', { accepts: (p) => p.kind === 'key' && ready, onDrop: doSign })

  const shout = () => {
    const tx = { from: draft.from, inputs: draft.inputs, outputs: draft.outputs, fee: draft.fee, size: draft.size }
    act({ type: 'broadcast', tx: { ...tx, id: draftId, sig: sign(me.secret, txBody(tx)) } })
    sound.success()
    setInputs([])
    setSigned(false)
  }

  const payee = state.players[to]

  return (
    <Panel icon="👛" title={t('larp.wallet.title')} hint={t('larp.wallet.hint')}>
      {chapter.task && (
        <div className={s.taskBanner}>
          <span className={s.taskEmoji}>{payee?.emoji}</span>
          <span>{t('larp.wallet.task', { name: payee?.name, n: fmt(chapter.task.amount) })}</span>
          <Lock player={payee} />
        </div>
      )}

      <div className={s.labelRow}>
        <span className={s.label}>{t('larp.wallet.basket')}</span>
        <Grown word="UTXOs" />
      </div>
      <div className={s.basket} data-coach="coins">
        {basket.length === 0 && <p className={s.empty}>{t('larp.wallet.noCoins')}</p>}
        {basket.map((c) => (
          <Draggable key={c.id} payload={{ kind: 'coin', id: c.id }} onTap={() => addCoin(c.id)}>
            <Coin state={state} coin={c} />
          </Draggable>
        ))}
      </div>

      <div className={`${s.paper} ${s.builder} ${signed ? s.paperSigned : ''}`} {...signZone}>
        <p className={s.txid}>txid: <span className={s.hand}>{draftId ? txName(draftId) : '……'}</span></p>

        <p className={s.paperLabel}>{t('larp.card.in')}</p>
        <div className={s.dropTray} {...inputsZone}>
          {liveInputs.length === 0
            ? <p className={s.empty}>⬇️ {t('larp.wallet.dropCoins')}</p>
            : liveInputs.map((id) => (
              <button key={id} className={s.plain} onClick={() => removeCoin(id)} title={t('larp.wallet.remove')}>
                <Coin state={state} coin={state.utxos[id]} selected open={signed} />
              </button>
            ))}
        </div>

        {!chapter.task && (
          <div className={s.formRow}>
            <label className={s.field}>
              <span className={s.label}>{t('larp.wallet.payTo')}</span>
              <select className={s.select} value={to} onChange={(e) => touch(setTo)(e.target.value)}>
                {payees.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
              </select>
            </label>
            <label className={s.field}>
              <span className={s.label}>{t('larp.wallet.amount')}</span>
              <input
                className={s.input} type="number" min="500" step="500" inputMode="numeric" value={amount}
                onChange={(e) => touch(setAmount)(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
          </div>
        )}

        <p className={s.paperLabel}>{t('larp.card.out')}</p>
        {draft ? (
          <div className={s.outGrid}>
            <div className={s.paperRow}>
              <span className={s.hand}>{fmt(amount)}</span><Lock player={payee} /><span className={s.outN}>#0</span>
            </div>
            {draft.outputs[1] && (
              <div className={s.paperRow}>
                <span className={s.hand}>{fmt(draft.outputs[1].value)}</span><Lock player={me} /><span className={s.outN}>#1</span>
                <span className={s.changeTag}>{t('larp.wallet.change')}</span>
              </div>
            )}
          </div>
        ) : <p className={s.empty}>{t('larp.wallet.outHint')}</p>}

        <div className={s.labelRow}>
          <span className={s.label}>{t('larp.wallet.feeRate')}</span>
          <Grown word={t('larp.grown.fee')} />
        </div>
        <div className={s.tips} data-coach="tip">
          {TIPS.map((f) => (
            <button
              key={f.id}
              className={`${s.tipBtn} ${tipId === f.id ? s.tipOn : ''}`}
              onClick={() => { sound.tap(); setTipPicked(true); touch(setTipId)(f.id) }}
            >
              <span className={s.tipIcon}>{f.icon}</span>
              <span>{t(`larp.fee.${f.id}`)}</span>
            </button>
          ))}
        </div>
        {ready && <p className={s.tipLine}>⛏ {t('larp.card.tip', { n: fmt(draft.fee) })}</p>}
        {draft && draft.shortBy > 0 && <p className={s.warn}>{t('larp.wallet.short', { n: fmt(draft.shortBy) })}</p>}

        <div className={s.signRow} data-coach="key">
          <Draggable payload={{ kind: 'key', id: 'key' }} onTap={doSign} disabled={!ready || signed}>
            <KeyChip player={me} dim={!ready || signed} />
          </Draggable>
          <span className={s.signHint}>
            {signed ? `🔓 ${t('larp.wallet.signed')}` : ready ? t('larp.wallet.dragKey') : t('larp.wallet.buildFirst')}
          </span>
        </div>
      </div>

      <button className={`${s.cta} ${s.ctaBig}`} disabled={!signed} onClick={shout} data-coach="shout">
        📣 {t('larp.wallet.broadcast')}
      </button>

      <MyTxs game={game} />
    </Panel>
  )
}

function MyTxs({ game }) {
  const { state, act } = game
  const me = state.players[YOU]
  const mine = Object.values(state.txs).filter((tx) => tx.from === YOU).reverse().slice(0, 4)
  if (!mine.length) return null

  const bump = (tx) => {
    const pay = tx.outputs.find((o) => !o.change)
    const top = sortedMempool(state)[0]
    const rate = Math.max(Math.ceil(feeRate(tx) * 3), Math.ceil((top ? feeRate(top) : 0) + 2))
    const next = buildPayment(state, { from: YOU, inputs: tx.inputs, to: pay.to, amount: pay.value, rate })
    if (next.shortBy > 0) { sound.wrong(); return }
    const body = { from: YOU, inputs: next.inputs, outputs: next.outputs, fee: next.fee, size: next.size }
    act({ type: 'broadcast', tx: { ...body, id: idFor(body), sig: sign(me.secret, txBody(body)) } })
    sound.success()
  }

  return (
    <div className={s.myTxs} data-coach="mytx">
      <p className={s.label}>{t('larp.wallet.yourTxs')}</p>
      {mine.map((tx) => (
        <div key={tx.id} className={s.myTx}>
          <span className={s.hand}>{txName(tx.id)}</span>
          <TxStatus state={state} tx={tx} />
          {tx.status === 'mempool' && (
            <button className={s.miniBtn} onClick={() => bump(tx)}>🚀 {t('larp.wallet.bump')}</button>
          )}
        </div>
      ))}
    </div>
  )
}

export function TxStatus({ state, tx }) {
  const label = {
    mempool: `⏳ ${t('larp.status.waiting')}`,
    confirmed: `✅ ${t('larp.status.conf', { n: confirmations(state, tx.id) })}`,
    replaced: `♻️ ${t('larp.status.replaced')}`,
    dropped: `🗑 ${t('larp.status.dropped')}`,
    rejected: `❌ ${t(`larp.reason.${tx.reason}`)}`,
    inbox: `📥 ${t('larp.status.inbox')}`,
  }[tx.status]
  return <span className={`${s.status} ${s[`st_${tx.status}`] || ''}`}>{label}</span>
}

/** Tip as stars so a child can compare at a glance (rate in sat/vB under it). */
function TipStars({ tx }) {
  const r = feeRate(tx)
  const stars = r >= 20 ? 3 : r >= 8 ? 2 : 1
  return (
    <span className={s.stars} title={`${r.toFixed(1)} sat/vB`}>
      <span>{'⭐'.repeat(stars)}</span>
      <span className={s.rateSmall}>{r.toFixed(0)} sat/vB</span>
    </span>
  )
}

/* ------------------------------------------------------------ Mempool */

export function MempoolPanel({ game, draggable }) {
  const { state, template, addToTemplate } = game
  const txs = sortedMempool(state)
  const nextBlock = useMemo(() => new Set(bestTemplate(state)), [state])

  return (
    <Panel
      icon="🚦" coach="mempool"
      title={t('larp.mempool.title', { n: txs.length })}
      grown="mempool"
      hint={draggable ? t('larp.mempool.hintMiner') : t('larp.mempool.hint')}
    >
      <div className={s.memList}>
        {txs.length === 0 && <p className={s.empty}>{t('larp.mempool.empty')}</p>}
        {txs.map((tx) => {
          const row = (
            <div className={`${s.memRow} ${tx.from === YOU ? s.memMine : ''} ${template?.includes(tx.id) ? s.memPicked : ''}`}>
              <Who state={state} id={tx.from} />
              <span className={s.hand}>{txName(tx.id)}</span>
              <TipStars tx={tx} />
              <span className={s.nextTag}>{nextBlock.has(tx.id) ? t('larp.mempool.next') : ''}</span>
            </div>
          )
          return draggable && !template.includes(tx.id)
            ? <Draggable key={tx.id} payload={{ kind: 'tx', id: tx.id }} onTap={() => addToTemplate(tx.id)}>{row}</Draggable>
            : <div key={tx.id}>{row}</div>
        })}
      </div>
    </Panel>
  )
}

/* -------------------------------------------------------------- Miner */

export function MinerPanel({ game, report }) {
  const { state, template, addToTemplate, removeFromTemplate, setTemplate, mining, setMining, rig, mineTap } = game
  const [full, setFull] = useState(false)
  const { vb, fees } = templateStats(state, template)

  useEffect(() => { report?.({ template: template.length }) }, [template.length]) // eslint-disable-line

  const zone = useDropZone('block', {
    accepts: (p) => p.kind === 'tx' && !template.includes(p.id),
    onDrop: (p) => {
      const tx = state.txs[p.id]
      if (!tx || vb + tx.size > state.blockVb) { sound.wrong(); setFull(true); setTimeout(() => setFull(false), 1400); return }
      addToTemplate(p.id)
    },
  })

  const target = targetNumber(state.difficulty)
  const last = rig.last ? hashNumber(rig.last) : null
  const now = new Date()
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <Panel icon="⛏️" title={t('larp.miner.title')} grown={t('larp.grown.miner')} hint={t('larp.miner.hint', { target: fmt(target) })}>
      <div className={`${s.blockTpl} ${full ? s.shake : ''}`} {...zone}>
        <div className={s.txRow}>
          <span className={s.label}>🧺 {t('larp.miner.block', { h: state.height + 1 })}</span>
          <button className={s.miniBtn} onClick={() => { sound.tap(); setTemplate(bestTemplate(state)) }}>✨ {t('larp.miner.autofill')}</button>
        </div>
        <div className={s.capBar}><div className={s.capFill} style={{ width: `${Math.min(100, (vb / state.blockVb) * 100)}%` }} /></div>
        <p className={s.capText}>{full ? t('larp.miner.full') : t('larp.miner.space', { n: Math.round((vb / state.blockVb) * 100) })}</p>
        <div className={s.tplList}>
          {template.length === 0 && <p className={s.empty}>⬇️ {t('larp.miner.drop')}</p>}
          {template.map((id) => (
            <button key={id} className={`${s.memRow} ${s.plain}`} onClick={() => { sound.tap(); removeFromTemplate(id) }}>
              <Who state={state} id={state.txs[id].from} />
              <span className={s.hand}>{txName(id)}</span>
              <TipStars tx={state.txs[id]} />
              <span className={s.nextTag}>✕</span>
            </button>
          ))}
        </div>
        <div className={s.reward}>
          <span>🎁 {t('larp.miner.subsidy')} <b>{fmt(state.subsidy)}</b></span>
          <span>+ ⛏ {t('larp.miner.fees')} <b>{fmt(fees)}</b></span>
          <span>= <b className={s.gold}>{fmt(state.subsidy + fees)}</b></span>
        </div>
      </div>

      {/* Laminated block-header card, like the paper kit */}
      <div className={s.headerCard}>
        <span className={s.headerTag}>{t('larp.header.title')}</span>
        <div className={s.headerRow}><span>{t('larp.header.prev')}</span><b className={s.hand}>{String(hashNumber(tipHash(state))).padStart(5, '0')}</b></div>
        <div className={s.headerRow}><span>{t('larp.header.commit')}</span><b className={s.hand}>{hashNumber(hash(template.join(','))) % 100}</b></div>
        <div className={s.headerRow}><span>{t('larp.header.time')}</span><b className={s.hand}>{clock}</b></div>
        <div className={s.headerRow}><span>{t('larp.header.target')}</span><b className={`${s.hand} ${s.targetNum}`}>{fmt(target)}</b></div>
        <div className={s.headerRow}><span>{t('larp.header.nonce')}</span><b className={s.hand}>{rig.lastNonce ?? '—'}</b></div>
      </div>

      {/* Handheld miner */}
      <div className={s.gadget} data-coach="rig">
        <div className={s.screen}>
          <p>{t('larp.rig.lowest')}: <b>{rig.lowest != null ? fmt(rig.lowest) : '—'}</b></p>
          <p className={s.screenHot}>{t('larp.rig.tries')}: <b>{fmt(rig.tries)}</b></p>
          <p>{t('larp.rig.best')}: <b>{rig.bestNonce ?? '—'}</b></p>
          <p className={s.screenDim}>
            {t('larp.rig.now')}: {last != null ? fmt(last) : '—'} {last != null && (last < target ? '✅' : `> ${fmt(target)}`)}
          </p>
        </div>
        <button className={s.mineBtn} onClick={() => { sound.tick(); mineTap() }}>
          <span className={s.mineIcon}>⛏</span>
          <span>{t('larp.rig.tap')}</span>
        </button>
        <button
          className={`${s.autoBtn} ${mining ? s.autoOn : ''}`}
          onClick={() => { sound.select(); setMining(!mining) }}
        >
          🤖 {mining ? t('larp.rig.autoOff') : t('larp.rig.autoOn')}
        </button>
      </div>
    </Panel>
  )
}

/* --------------------------------------------------------------- Node */

export function NodePanel({ game }) {
  const { state, act } = game
  const tx = state.txs[state.inbox[0]]
  const lastVerdict = state.nodeVerdicts[state.nodeVerdicts.length - 1]

  const judge = (verdict) => {
    sound.tap()
    act({ type: 'verdict', txid: tx.id, verdict })
  }

  return (
    <Panel icon="🛡️" coach="node" title={t('larp.node.title')} grown="node" hint={t('larp.node.hint')}>
      {lastVerdict && (
        <div className={`${s.verdict} ${lastVerdict.correct ? s.vRight : s.vWrong}`}>
          <b>{lastVerdict.correct ? t('larp.node.right') : t('larp.node.wrong')}</b>{' '}
          {lastVerdict.truth === 'valid' ? t('larp.node.wasValid') : t(`larp.reason.${lastVerdict.reason}`)}
        </div>
      )}

      {!tx ? (
        <p className={s.listening}>📡 {t('larp.node.listening')}</p>
      ) : (
        <div className={s.inspect}>
          <TxCard state={state} tx={tx} />
          <div className={s.signedBy}>
            <span className={s.label}>{t('larp.node.signedWith')}</span>
            <KeyChip player={state.players[tx.signedBy]} />
          </div>

          <div className={s.checkSheet}>
            <p className={s.sheetHead}>📋 {t('larp.node.sheet')}</p>
            <div className={s.check}>
              <span className={s.checkQ}>🔑 {t('larp.node.q1')}</span>
              <span className={s.checkA}>
                {tx.inputs.map((id) => <Lock key={id} player={state.players[state.utxos[id]?.owner]} small />)}
                <span className={s.vsKey}>↔</span>
                <span className={s.keyDot} style={{ '--lock': state.players[tx.signedBy]?.lock?.hex }}>🔑</span>
              </span>
            </div>
            <div className={s.check}>
              <span className={s.checkQ}>🪙 {t('larp.node.q2')}</span>
              <span className={s.checkA}>
                {tx.inputs.map((id) => {
                  const coin = state.utxos[id]
                  const h = coin?.spentIn && state.txs[coin.spentIn]?.blockHeight
                  return (
                    <span key={id} className={coin?.spentIn ? s.bad : s.good}>
                      {coin?.spentIn ? t('larp.node.spentIn', { h }) : t('larp.node.unspent')}
                    </span>
                  )
                })}
              </span>
            </div>
            <div className={s.check}>
              <span className={s.checkQ}>⚖️ {t('larp.node.q3')}</span>
              <span className={s.checkA}>
                {t('larp.node.totalIn')} <b className={s.mono}>{fmt(tx.inputs.reduce((n, id) => n + (state.utxos[id]?.value || 0), 0))}</b>
                {' · '}
                {t('larp.node.totalOut')} <b className={s.mono}>{fmt(tx.outputs.reduce((n, o) => n + o.value, 0))}</b>
              </span>
            </div>
          </div>

          <div className={s.choices}>
            <button className={`${s.choice} ${s.choiceGood}`} onClick={() => judge('valid')}>👍 {t('larp.node.accept')}</button>
            <button className={`${s.choice} ${s.choiceBad}`} onClick={() => judge('invalid')}>👎 {t('larp.node.reject')}</button>
          </div>
        </div>
      )}
    </Panel>
  )
}

/* ----------------------------------------------------------- Merchant */

export function MerchantPanel({ game }) {
  const { state, act } = game
  const pay = state.txs[state.flags.payTx]
  const confs = pay ? confirmations(state, pay.id) : 0
  const handed = state.flags.handedAt

  return (
    <Panel icon="🏪" coach="merchant" title={t('larp.merchant.title')} hint={t('larp.merchant.hint')}>
      {!pay ? (
        <p className={s.listening}>⏳ {t('larp.merchant.waiting')}</p>
      ) : (
        <div className={s.merchant}>
          <TxCard state={state} tx={pay} compact />
          <TxStatus state={state} tx={pay} />
          <div className={s.confBig}>
            <div className={s.bricks}>
              {confs === 0
                ? <span className={s.brickEmpty}>{t('larp.merchant.noBlock')}</span>
                : Array.from({ length: Math.min(confs, 6) }).map((_, i) => <span key={i} className={s.brick}>🧱</span>)}
            </div>
            <span className={s.label}>{t('larp.merchant.confs', { n: confs })}</span>
            <Grown word="confirmations" />
          </div>
          {handed == null ? (
            <button
              className={`${s.cta} ${s.ctaGold} ${s.ctaBig}`}
              onClick={() => { sound.select(); act({ type: 'flag', key: 'handedAt', value: confs }) }}
            >
              📱 {t('larp.merchant.handover')}
            </button>
          ) : (
            <p className={s.handed}>{t('larp.merchant.handed', { n: handed })}</p>
          )}
        </div>
      )}
    </Panel>
  )
}

/* -------------------------------------------------------- Chain + log */

export function ChainStrip({ state, mining }) {
  const blocks = state.chain.slice(-6)
  return (
    <div data-coach="chain">
      <div className={s.labelRow}>
        <span className={s.label}>🔗 {t('larp.chain.title')}</span>
        <Grown word="blockchain" />
      </div>
      <div className={s.chain}>
        {blocks.length === 0 && <span className={s.genesis}>{t('larp.chain.genesis')}</span>}
        {blocks.map((b) => (
          <div key={b.height} className={`${s.block} ${b.miner === YOU ? s.blockMine : ''}`}>
            <span className={s.blockH}>#{b.height}</span>
            <span className={s.blockMiner}>{state.players[b.miner]?.emoji}</span>
            <span className={s.blockTx}>{t('larp.chain.txs', { n: b.txids.length })}</span>
          </div>
        ))}
        <div className={`${s.block} ${s.blockNext} ${mining ? s.blockMining : ''}`}>
          <span className={s.blockH}>#{state.height + 1}</span>
          <span className={s.blockMiner}>⛏</span>
          <span className={s.blockTx}>{t('larp.chain.next')}</span>
        </div>
      </div>
    </div>
  )
}

export function LogFeed({ state }) {
  const name = (id) => (id === YOU ? t('larp.you') : state.players[id]?.name || '?')
  const items = state.log.slice(-4).reverse()
  if (!items.length) return null
  return (
    <ul className={s.log}>
      {items.map((e) => (
        <li key={e.at} className={`${s.logItem} ${s[`log_${e.kind}`] || ''}`}>
          {t(`larp.log.${e.kind}`, {
            who: name(e.from ?? e.miner),
            h: e.height,
            n: e.count,
            reward: e.reward?.toLocaleString(),
            reason: e.reason ? t(`larp.reason.${e.reason}`) : '',
            subsidy: e.subsidy?.toLocaleString(),
          })}
        </li>
      ))}
    </ul>
  )
}
