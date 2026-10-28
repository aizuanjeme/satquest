import { useEffect, useRef, useState } from 'react'
import { sound } from '../../../audio/SoundManager'
import { Draggable, useDropZone } from '../../../larp/drag'
import {
  KIT, opLabel, peersOf, headerHash, utxoDiff, confirmations, tipHash, txFee,
} from '../../../larp/kit'
import { txName } from '../../../larp/engine'
import {
  NETWORK, PAY, FEES, PLAYERS, draftTx, rewardFor, playerBlock,
} from '../../../larp/mission'
import { TX_SHEET, BLOCK_SHEET } from '../../../larp/missionText'
import { Lock, Grown } from '../LarpPanels'
import {
  Basket, CoinTag, NewCoinTag, KeySticker, StickerSheet, KitCard, Worksheet, HeaderKit, MinerKit,
} from './KitPieces'
import s from './Mission.module.css'
import ls from '../Larp.module.css'

/*
  One component per mission stage. Each reads the mission state `m` and
  sends actions with `dispatch` — all rules live in larp/mission.js.
*/

const fmt = (n) => Math.round(n).toLocaleString()
const person = (id) => PLAYERS.find((p) => p.id === id)
const FEE_ICONS = ['🐢', '🚶', '🚀']

/* ============================================================ 1. create */

export function CreateStage({ m, dispatch }) {
  const { world, draft } = m
  const tx = draftTx(m)
  const coins = Object.keys(world.utxos).filter((o) => !draft.inputs.includes(o))

  const inputsZone = useDropZone('card-inputs', {
    accepts: (p) => p.kind === 'coin',
    onDrop: (p) => dispatch({ type: 'addInput', op: p.id }),
  })
  const lock0 = useDropZone('lock-0', { accepts: (p) => p.kind === 'lock', onDrop: (p) => dispatch({ type: 'setLock', out: 0, lock: p.id }) })
  const lock1 = useDropZone('lock-1', { accepts: (p) => p.kind === 'lock' && tx.change > 0, onDrop: (p) => dispatch({ type: 'setLock', out: 1, lock: p.id }) })

  const tapLock = (pid) => {
    const out = !draft.locks[0] ? 0 : tx.change > 0 && !draft.locks[1] ? 1 : 0
    dispatch({ type: 'setLock', out, lock: pid })
  }
  const tapKey = () => {
    const o = draft.inputs.find((x) => !draft.sigs[x])
    if (o) dispatch({ type: 'sign', op: o, signer: 'alice' })
  }

  return (
    <>
      <Basket kind="utxo" coach="utxo" note="Alice’s coins have the blue lock. Drag them (or tap) into the card.">
        {coins.map((o) => (
          <Draggable key={o} payload={{ kind: 'coin', id: o }} onTap={() => dispatch({ type: 'addInput', op: o })}>
            <CoinTag world={world} op={o} />
          </Draggable>
        ))}
      </Basket>

      <div className={`${s.card} ${s.cardBig}`} style={{ '--stripe': person('alice').lock.hex }}>
        <p className={s.cardTxid}>txid: <span className={ls.hand}>{txName('talice')}</span></p>

        <div className={s.cardSection}>
          <span className={s.cardLabel}>inputs <Grown word="inputs" /></span>
          <div className={s.dropArea} {...inputsZone}>
            {draft.inputs.length === 0 && <p className={s.cardHint}>⬇️ Drop Alice’s coins here</p>}
            {draft.inputs.map((o) => <InputRow key={o} m={m} op={o} dispatch={dispatch} />)}
          </div>
        </div>

        <div className={s.cardSection} data-coach="locks">
          <span className={s.cardLabel}>outputs <Grown word="outputs" /></span>
          <div className={s.outGrid}>
            <div className={`${s.cardRow} ${s.slot}`} {...lock0}>
              <span className={ls.hand}>{fmt(PAY)}</span>
              {draft.locks[0] ? <Lock player={person(draft.locks[0])} /> : <span className={s.emptySticker}>lock?</span>}
              <span className={s.outN}>#0</span>
              <span className={s.cardHint}>for Bob</span>
            </div>
            {tx.change > 0 && (
              <div className={`${s.cardRow} ${s.slot}`} {...lock1}>
                <span className={ls.hand}>{fmt(tx.change)}</span>
                {draft.locks[1] ? <Lock player={person(draft.locks[1])} /> : <span className={s.emptySticker}>lock?</span>}
                <span className={s.outN}>#1</span>
                <span className={s.cardHint}>change</span>
              </div>
            )}
          </div>
        </div>

        <div className={s.cardSection}>
          <span className={s.cardLabel}>⛏ tip for the miner <Grown word="fee" /></span>
          <div className={s.feeRow}>
            {FEES.map((f, i) => (
              <button key={f} className={`${s.feeBtn} ${draft.fee === f ? s.feeOn : ''}`} onClick={() => { sound.tap(); dispatch({ type: 'setFee', fee: f }) }}>
                <span>{FEE_ICONS[i]}</span>{fmt(f)}
              </button>
            ))}
          </div>
        </div>

        <p className={s.sums}>
          In <b>{fmt(tx.inSum)}</b> · Out <b>{fmt(PAY + Math.max(0, tx.change))}</b> · Tip <b>{fmt(Math.max(0, tx.inSum - PAY - Math.max(0, tx.change)))}</b>
          {tx.change < 0 && <span className={s.short}> — need {fmt(-tx.change)} more</span>}
        </p>
      </div>

      <div className={s.sheetsRow}>
        <StickerSheet
          title="🔒 Lock stickers (who can spend)" kind="lock" coach={undefined}
          players={['bob', 'alice', 'carol', 'dave', 'mallory'].map(person)} onTap={tapLock}
        />
        <StickerSheet title="🔑 Alice’s key stickers" kind="key" coach="keys" players={[person('alice')]} onTap={tapKey} />
      </div>

      <button className={`${ls.cta} ${ls.ctaBig}`} data-coach="send" onClick={() => { sound.select(); dispatch({ type: 'send' }) }}>📣 Send the card</button>
    </>
  )
}

function InputRow({ m, op, dispatch }) {
  const zone = useDropZone(`sig-${op}`, {
    accepts: (p) => p.kind === 'key',
    onDrop: (p) => dispatch({ type: 'sign', op, signer: p.id }),
  })
  const coin = m.world.utxos[op]
  const signer = m.draft.sigs[op]
  return (
    <div className={s.cardRow}>
      <span className={ls.hand}>{opLabel(op)}</span>
      <span className={s.cardHint}>{fmt(coin.value)}</span>
      <Lock player={person(coin.owner)} small open={!!signer && signer === coin.owner} />
      <span className={`${s.sigBox} ${s.slot}`} {...zone}>
        {signer ? <KeySticker player={person(signer)} small /> : <span className={s.cardHint}>key?</span>}
      </span>
      <button className={s.xBtn} onClick={() => { sound.tap(); dispatch({ type: 'removeInput', op }) }} aria-label="Take coin out">✕</button>
    </div>
  )
}

/* ============================================================= 2. relay */

export function RelayStage({ m, dispatch }) {
  const { have, relays } = m.relay
  const [pulses, setPulses] = useState([])
  const byId = Object.fromEntries(NETWORK.nodes.map((n) => [n.id, n]))

  const tap = (node) => {
    sound.tap()
    if (have.includes(node)) {
      const fresh = peersOf(NETWORK, node).filter((p) => !have.includes(p))
      setPulses((ps) => [...ps, ...fresh.map((to) => ({ key: `${node}-${to}-${Date.now()}`, from: node, to }))])
      if (fresh.length) sound.success()
    }
    dispatch({ type: 'relay', node })
  }

  return (
    <div className={s.board} data-coach="network">
      <svg viewBox="0 0 100 66" className={s.net} role="img" aria-label="Network of computers">
        {NETWORK.edges.map(([a, b]) => (
          <line key={`${a}${b}`} x1={byId[a].x} y1={byId[a].y} x2={byId[b].x} y2={byId[b].y} className={s.edge} />
        ))}
        {pulses.map((p) => (
          <circle key={p.key} r="2" className={s.pulse}>
            <animateMotion dur="0.7s" fill="freeze" path={`M${byId[p.from].x},${byId[p.from].y} L${byId[p.to].x},${byId[p.to].y}`} />
          </circle>
        ))}
        {NETWORK.nodes.map((n) => {
          const on = have.includes(n.id)
          return (
            <g key={n.id} className={s.node} onClick={() => tap(n.id)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') tap(n.id) }}>
              <circle cx={n.x} cy={n.y} r="7" className={on ? s.nodeOn : s.nodeOff} />
              <text x={n.x} y={n.y + 1.8} textAnchor="middle" className={s.nodeIcon}>{on ? '📄' : '💻'}</text>
              <text x={n.x} y={n.y + 11.5} textAnchor="middle" className={s.nodeLabel}>{n.label}</text>
            </g>
          )
        })}
      </svg>
      <p className={s.boardNote}>
        Alice’s computer is not connected to Bob’s. Tap a glowing computer to pass the card to its neighbours.
        <Grown word="peer-to-peer network" />
      </p>
      <p className={s.boardNote}>Have the card: <b>{have.length}/{NETWORK.nodes.length}</b> · Passes: <b>{relays}</b></p>
    </div>
  )
}

/* ========================================================== 3. validate */

export function ValidateStage({ m, dispatch }) {
  const v = m.validate
  const tx = v.queue[v.idx]
  return (
    <>
      <p className={s.counter}>Card {v.idx + 1} of {v.queue.length}</p>
      <KitCard world={m.world} tx={tx} highlight />
      <Worksheet
        title="TRANSACTION VALIDATION" coach="sheet" questions={TX_SHEET} answers={v.answers}
        onAnswer={(q, value) => dispatch({ type: 'answer', q, value })}
        onDone={() => dispatch({ type: 'decide' })}
      >
        <p className={s.wsTip}>Look for the card’s coins (txid #n) in the baskets below.</p>
      </Worksheet>
      <Basket kind="utxo">
        {Object.keys(m.world.utxos).map((o) => <CoinTag key={o} world={m.world} op={o} faded={!tx.inputs.includes(o)} />)}
      </Basket>
      <Basket kind="mempool">
        {m.world.mempool.length === 0 && <p className={s.cardHint}>Empty</p>}
        {m.world.mempool.map((id) => <KitCard key={id} world={m.world} tx={m.world.txs[id]} compact />)}
      </Basket>
      <RejectedPile m={m} />
    </>
  )
}

function RejectedPile({ m, draggable }) {
  if (!m.validate.rejected.length) return null
  return (
    <div className={s.pile}>
      <p className={s.cardLabel}>❌ Rejected pile</p>
      <div className={s.pileCards}>
        {m.validate.rejected.map((tx) => {
          const card = <KitCard world={m.world} tx={tx} compact stamp="REJECTED" />
          return draggable
            ? <Draggable key={tx.id} payload={{ kind: 'card', id: tx.id }}>{card}</Draggable>
            : <div key={tx.id}>{card}</div>
        })}
      </div>
    </div>
  )
}

/* ============================================================= 4. build */

export function BuildStage({ m, dispatch }) {
  const b = m.build
  const [auto, setAuto] = useState(false)
  const reward = rewardFor(m)
  const fees = reward - KIT.subsidy
  const block = playerBlock(m)
  const found = b.rig.lowest != null && b.rig.lowest < KIT.target

  // Robot helper: keep mining while on, stop when a winner is found.
  useEffect(() => {
    if (!auto || !b.loaded || found) { if (found) setAuto(false); return undefined }
    const id = setInterval(() => dispatch({ type: 'mine', tries: 8 }), 250)
    return () => clearInterval(id)
  }, [auto, b.loaded, found, dispatch])

  const txidsZone = useDropZone('block-txids', { accepts: (p) => p.kind === 'card', onDrop: (p) => dispatch({ type: 'pick', txid: p.id }) })
  const cbLock = useDropZone('cb-lock', { accepts: (p) => p.kind === 'lock', onDrop: (p) => dispatch({ type: 'lockCoinbase', lock: p.id }) })

  return (
    <>
      <Basket kind="mempool" coach="mempool" note="Drag cards (or tap) onto the block txids card.">
        {m.world.mempool.filter((id) => !b.picked.includes(id)).map((id) => (
          <Draggable key={id} payload={{ kind: 'card', id }} onTap={() => dispatch({ type: 'pick', txid: id })}>
            <KitCard world={m.world} tx={m.world.txs[id]} compact highlight={id === 'talice'} />
          </Draggable>
        ))}
      </Basket>
      <RejectedPile m={m} draggable />

      <div className={s.txidsCard} {...txidsZone}>
        <p className={s.cardLabel}>block txids <span className={s.cardHint}>{b.picked.length}/{KIT.blockSlots} cards</span></p>
        <div className={s.txidLine}><span className={ls.hand}>coinbase</span><span className={s.cardHint}>always first</span></div>
        {b.picked.map((id) => (
          <div key={id} className={s.txidLine}>
            <span className={ls.hand}>{txName(id)}</span>
            <span className={s.cardHint}>tip {fmt(txFee(m.world, m.world.txs[id]))}</span>
            <button className={s.xBtn} onClick={() => { sound.tap(); dispatch({ type: 'unpick', txid: id }) }} aria-label="Take card out">✕</button>
          </div>
        ))}
        {Array.from({ length: KIT.blockSlots - b.picked.length }).map((_, i) => <div key={i} className={`${s.txidLine} ${s.txidEmpty}`}>⬇️ drop a card</div>)}
      </div>

      <div className={`${s.card} ${s.cardBig}`} style={{ '--stripe': '#888' }} data-coach="coinbase">
        <p className={s.cardTxid}>txid: <span className={ls.hand}>coinbase</span> <Grown word="coinbase transaction" /></p>
        <div className={`${s.cardSection} ${s.crossed}`}>
          <span className={s.cardLabel}>inputs</span>
          <span className={s.cardHint}>none — a coinbase makes brand-new coins</span>
        </div>
        <p className={s.sums}>Block reward <b>{fmt(KIT.subsidy)}</b> + tips <b>{fmt(fees)}</b> = most you may claim <b>{fmt(reward)}</b></p>
        <div className={s.feeRow}>
          <button className={`${s.feeBtn} ${b.coinbase.value === reward ? s.feeOn : ''}`} onClick={() => { sound.tap(); dispatch({ type: 'claim', value: reward }) }}>
            <span>🪙</span>Claim {fmt(reward)}
          </button>
          <button className={s.feeBtn} onClick={() => { sound.tap(); dispatch({ type: 'claim', value: reward + 10000 }) }}>
            <span>🤑</span>Claim {fmt(reward + 10000)}
          </button>
        </div>
        <div className={`${s.cardRow} ${s.slot}`} {...cbLock}>
          <span className={ls.hand}>{b.coinbase.value != null ? fmt(b.coinbase.value) : '____'}</span>
          {b.coinbase.lock ? <Lock player={person(b.coinbase.lock)} /> : <span className={s.emptySticker}>lock?</span>}
          <span className={s.outN}>#0</span>
        </div>
        <StickerSheet
          title="🔒 Lock stickers" kind="lock" players={['miner', 'alice', 'sneaky'].map(person)}
          onTap={(id) => dispatch({ type: 'lockCoinbase', lock: id })}
        />
      </div>

      <HeaderKit
        coach="header" header={{ ...b.header, nonce: b.header.nonce }} target={KIT.target}
        fills={{ prev: () => dispatch({ type: 'fillPrev' }), commit: () => dispatch({ type: 'fillCommit' }) }}
      />
      <p className={s.cardHint}>Last block on the chain: #{m.world.chain.length - 1} · hash {String(tipHash(m.world)).padStart(5, '0')}</p>

      <MinerKit
        coach="gadget" rig={b.rig} target={KIT.target} loaded={b.loaded}
        onLoad={() => dispatch({ type: 'load' })}
        onTap={() => dispatch({ type: 'mine', tries: 12 })}
        auto={auto} onAuto={setAuto}
      />
      <div className={s.btnRow}>
        <button className={`${ls.cta} ${ls.ctaGold}`} data-coach="write" disabled={!found || b.header.nonce != null} onClick={() => { sound.correct(); dispatch({ type: 'writeNonce' }) }}>
          ✍️ Write nonce {b.rig.bestNonce ?? ''} on the header
        </button>
        <button className={`${ls.cta} ${ls.ctaBig}`} data-coach="share" disabled={b.header.nonce == null} onClick={() => { sound.success(); dispatch({ type: 'share' }) }}>
          📣 Share my block
        </button>
      </div>
      {block.header.nonce != null && <p className={s.cardHint}>Your block’s hash: {fmt(headerHash(block.header))}</p>}
    </>
  )
}

/* ======================================================== 5. blockcheck */

export function BlockCheckStage({ m, dispatch }) {
  const c = m.blockcheck
  const block = c.blocks[c.idx]
  const cb = block.txs[block.txids[0]]
  const cards = block.txids.slice(1).map((id) => block.txs[id])
  const fees = cards.reduce((n, t) => n + txFee(m.world, t), 0)
  const miner = person(block.miner)

  return (
    <>
      <p className={s.counter}>Block {c.idx + 1} of {c.blocks.length} — from {miner.emoji} {miner.name}</p>
      <HeaderKit header={block.header} target={block.header.target} />
      <div className={s.evidence}>
        <p>Last block on the chain has hash <b className={ls.hand}>{String(tipHash(m.world)).padStart(5, '0')}</b></p>
        {c.revealed.hash
          ? <p>This block’s hash is <b className={ls.hand}>{fmt(headerHash(block.header))}</b> (target {fmt(block.header.target)})</p>
          : <button className={s.fillBtn} onClick={() => { sound.tap(); dispatch({ type: 'reveal', what: 'hash' }) }}>🔢 Hash it!</button>}
        {c.revealed.sum
          ? <p>Tips in the block <b>{fmt(fees)}</b> + block reward <b>{fmt(KIT.subsidy)}</b> = <b>{fmt(fees + KIT.subsidy)}</b>. Coinbase claims <b>{fmt(cb.outputs.reduce((a, o) => a + o.value, 0))}</b></p>
          : <button className={s.fillBtn} onClick={() => { sound.tap(); dispatch({ type: 'reveal', what: 'sum' }) }}>➕ Add up the tips</button>}
      </div>
      <div className={s.pileCards}>
        <KitCard world={m.world} tx={cb} compact />
        {cards.map((tx) => (
          <KitCard key={tx.id} world={m.world} tx={tx} compact stamp={m.world.mempool.includes(tx.id) ? 'ok' : undefined} />
        ))}
      </div>
      <p className={s.cardHint}>“OK” stamp = you already checked this card and it’s in your MEMPOOL.</p>
      <Worksheet
        title="BLOCK VALIDATION" coach="sheet" questions={BLOCK_SHEET} answers={c.answers}
        onAnswer={(q, value) => dispatch({ type: 'answer', q, value })}
        onDone={() => dispatch({ type: 'decide' })}
      />
    </>
  )
}

/* ============================================================ 6. update */

export function UpdateStage({ m, dispatch }) {
  const u = m.update
  const diff = utxoDiff(m.world, u.block)
  const coins = Object.keys(m.world.utxos).filter((o) => !u.removed.includes(o))
  const added = diff.add.filter((c) => u.added.includes(c.op))
  const waiting = diff.add.filter((c) => !u.added.includes(c.op))
  const mempool = m.world.mempool.filter((id) => !u.cleared.includes(id))

  const utxoZone = useDropZone('utxo-basket', { accepts: (p) => p.kind === 'newcoin', onDrop: (p) => dispatch({ type: 'addUtxo', op: p.id }) })
  const spentZone = useDropZone('spent-bin', { accepts: (p) => p.kind === 'coin', onDrop: (p) => dispatch({ type: 'removeUtxo', op: p.id }) })
  const doneZone = useDropZone('done-bin', { accepts: (p) => p.kind === 'card', onDrop: (p) => dispatch({ type: 'clearMempool', txid: p.id }) })

  return (
    <div data-coach="baskets" className={s.stack}>
      <div className={s.progressRow}>
        <span>🗑 Spent coins out <b>{u.removed.length}/{diff.remove.length}</b></span>
        <span>✨ New coins in <b>{u.added.length}/{diff.add.length}</b></span>
        <span>🧹 Cards cleared <b>{u.cleared.length}/{diff.mempool.length}</b></span>
      </div>

      <div className={s.newCoins}>
        <p className={s.cardLabel}>✨ New coins from the block — drag (or tap) into the UTXO SET</p>
        <div className={s.basketBody}>
          {waiting.length === 0 && <p className={s.cardHint}>All in!</p>}
          {waiting.map((c) => (
            <Draggable key={c.op} payload={{ kind: 'newcoin', id: c.op }} onTap={() => dispatch({ type: 'addUtxo', op: c.op })}>
              <NewCoinTag world={m.world} coin={c} />
            </Draggable>
          ))}
        </div>
      </div>

      <Basket kind="utxo" zone={utxoZone} note="Drag (or tap) coins that the block spent into the SPENT bin.">
        {coins.map((o) => (
          <Draggable key={o} payload={{ kind: 'coin', id: o }} onTap={() => dispatch({ type: 'removeUtxo', op: o })}>
            <CoinTag world={m.world} op={o} />
          </Draggable>
        ))}
        {added.map((c) => <NewCoinTag key={c.op} world={m.world} coin={c} />)}
      </Basket>

      <div className={s.spentBin} {...spentZone}>
        <span className={s.spentStamp}>SPENT</span>
        <span className={s.cardHint}>{u.removed.map(opLabel).join(', ') || 'Drop spent coins here'}</span>
      </div>

      <Basket kind="mempool" note="Cards that are now in the block leave the MEMPOOL — drag (or tap) them out.">
        {mempool.map((id) => (
          <Draggable key={id} payload={{ kind: 'card', id }} onTap={() => dispatch({ type: 'clearMempool', txid: id })}>
            <KitCard world={m.world} tx={m.world.txs[id]} compact />
          </Draggable>
        ))}
      </Basket>
      <div className={s.spentBin} {...doneZone}>
        <span className={`${s.spentStamp} ${s.stampOk}`}>IN BLOCK</span>
        <span className={s.cardHint}>{u.cleared.map(txName).join(', ') || 'Drop confirmed cards here'}</span>
      </div>
    </div>
  )
}

/* =========================================================== 7. confirm */

export function ConfirmStage({ m, dispatch }) {
  const confs = confirmations(m.world, 'talice')
  const prev = useRef(confs)
  useEffect(() => { if (confs > prev.current) sound.win(); prev.current = confs }, [confs])
  return (
    <div className={s.stack} data-coach="confirm">
      <div className={s.chainRow}>
        {m.world.chain.map((bl) => (
          <div key={bl.height} className={`${s.chainBlock} ${bl.txids.includes('talice') ? s.chainHot : ''}`}>
            <b>#{bl.height}</b>
            <span>{bl.miner ? person(bl.miner)?.emoji : '🌱'}</span>
            <span className={s.cardHint}>{bl.txids.includes('talice') ? 'Alice → Bob' : bl.height === 0 ? 'start' : `${bl.txids.length} cards`}</span>
          </div>
        ))}
      </div>
      <KitCard world={m.world} tx={m.world.txs.talice} compact />
      <div className={s.confBox}>
        <div className={s.bricks}>{Array.from({ length: confs }).map((_, i) => <span key={i}>🧱</span>)}</div>
        <p><b>{confs}</b> confirmation{confs === 1 ? '' : 's'} <Grown word="confirmations" /></p>
        <p className={s.cardHint}>Bob can now spend <span className={ls.hand}>{opLabel('talice:0')}</span> ({fmt(m.world.utxos['talice:0']?.value || PAY)} sats) with his green key.</p>
      </div>
      {!m.confirm.extra
        ? <button className={`${ls.cta} ${ls.ctaBig}`} onClick={() => dispatch({ type: 'nextBlock' })}>⏳ Wait for the next block</button>
        : <button className={`${ls.cta} ${ls.ctaGold} ${ls.ctaBig}`} onClick={() => dispatch({ type: 'finish' })}>🏁 Finish the mission</button>}
    </div>
  )
}

