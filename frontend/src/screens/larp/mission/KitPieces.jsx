import { sound } from '../../../audio/SoundManager'
import { Draggable } from '../../../larp/drag'
import { opLabel, inputSum } from '../../../larp/kit'
import { txName } from '../../../larp/engine'
import { Lock, Grown } from '../LarpPanels'
import s from './Mission.module.css'
import ls from '../Larp.module.css'

/*
  Digital versions of the paper kit's pieces: baskets, coin tags, transaction
  cards with a coloured stripe, sticker sheets, worksheets, the block header
  card and the handheld miner.
*/

const fmt = (n) => Math.round(n).toLocaleString()

export function Basket({ kind, children, zone, coach, note }) {
  return (
    <section className={`${s.basket} ${kind === 'utxo' ? s.basketUtxo : s.basketMempool}`} data-coach={coach} {...zone}>
      <div className={s.plate}>{kind === 'utxo' ? 'UTXO SET' : 'MEMPOOL'}</div>
      <Grown word={kind === 'utxo' ? 'every unspent coin' : 'checked cards waiting for a block'} />
      {note && <p className={s.basketNote}>{note}</p>}
      <div className={s.basketBody}>{children}</div>
    </section>
  )
}

/** One unspent coin as a kraft tag: "txid #n", amount, owner's lock. */
export function CoinTag({ world, op, fresh, faded }) {
  const coin = world.utxos[op] || {}
  return (
    <span className={`${s.tag} ${fresh ? s.tagFresh : ''} ${faded ? s.tagFaded : ''}`}>
      <span className={s.tagHole} />
      <span className={`${ls.hand} ${s.tagOp}`}>{opLabel(op)}</span>
      <span className={s.tagVal}>{fmt(coin.value || 0)}</span>
      <Lock player={world.players[coin.owner]} small />
    </span>
  )
}

/** Same tag for a coin that only exists on a card's output (not in the UTXO SET yet). */
export function NewCoinTag({ world, coin }) {
  return (
    <span className={`${s.tag} ${s.tagFresh}`}>
      <span className={s.tagHole} />
      <span className={`${ls.hand} ${s.tagOp}`}>{opLabel(coin.op)}</span>
      <span className={s.tagVal}>{fmt(coin.value)}</span>
      <Lock player={world.players[coin.owner]} small />
    </span>
  )
}

export function KeySticker({ player, small }) {
  return (
    <span className={`${s.keySticker} ${small ? s.keySmall : ''}`} style={{ '--lock': player?.lock?.hex || '#888' }}>🔑</span>
  )
}

/** A printed sheet of stickers you can peel (drag) or tap. */
export function StickerSheet({ title, kind, players, onTap, coach }) {
  return (
    <div className={s.sheetOfStickers} data-coach={coach}>
      <p className={s.sheetTitle}>{title}</p>
      <div className={s.stickers}>
        {players.map((p) => (
          <Draggable key={p.id} payload={{ kind, id: p.id }} onTap={() => onTap?.(p.id)}>
            <span className={s.stickerCell}>
              {kind === 'lock' ? <Lock player={p} /> : <KeySticker player={p} />}
              <span className={s.stickerName}>{p.name}</span>
            </span>
          </Draggable>
        ))}
      </div>
    </div>
  )
}

/**
 * A read-only transaction card like the paper ones: coloured stripe (the
 * sender's colour), txid, inputs with their key stickers, outputs with locks.
 * The coinbase card has its inputs crossed out.
 */
export function KitCard({ world, tx, compact, stamp, highlight }) {
  const sender = tx.coinbase ? null : world.players[world.utxos[tx.inputs[0]]?.owner || tx.sigs?.[tx.inputs[0]]]
  const stripe = tx.coinbase ? '#888' : sender?.lock?.hex || '#999'
  return (
    <div className={`${s.card} ${compact ? s.cardCompact : ''} ${highlight ? s.cardHot : ''}`} style={{ '--stripe': stripe }}>
      {stamp && <span className={`${s.stamp} ${stamp === 'ok' ? s.stampOk : ''}`}>{stamp === 'ok' ? 'OK' : stamp}</span>}
      <p className={s.cardTxid}>txid: <span className={ls.hand}>{tx.coinbase ? 'coinbase' : txName(tx.id)}</span></p>
      {!compact && (
        <div className={`${s.cardSection} ${tx.coinbase ? s.crossed : ''}`}>
          <span className={s.cardLabel}>inputs</span>
          {tx.coinbase && <span className={s.cardHint}>no inputs — new coins!</span>}
          {tx.inputs.map((o) => (
            <div key={o} className={s.cardRow}>
              <span className={ls.hand}>{opLabel(o)}</span>
              <span className={s.cardHint}>{world.utxos[o] ? fmt(world.utxos[o].value) : '—'}</span>
              <span className={s.sigBox}>{tx.sigs?.[o] ? <KeySticker player={world.players[tx.sigs[o]]} small /> : <span className={s.cardHint}>signature</span>}</span>
            </div>
          ))}
        </div>
      )}
      <div className={s.cardSection}>
        {!compact && <span className={s.cardLabel}>outputs</span>}
        <div className={s.outGrid}>
          {tx.outputs.map((out, n) => (
            <div key={n} className={s.cardRow}>
              <span className={ls.hand}>{fmt(out.value)}</span>
              <Lock player={world.players[out.lock]} small />
              <span className={s.outN}>#{n}</span>
            </div>
          ))}
        </div>
      </div>
      {compact && !tx.coinbase && (
        <p className={s.cardHint}>
          {tx.inputs.map(opLabel).join(', ')}
          {tx.inputs.every((o) => world.utxos[o]) && ` · tip ${fmt(inputSum(world, tx) - tx.outputs.reduce((a, o) => a + o.value, 0))}`}
        </p>
      )}
    </div>
  )
}

/** A worksheet with a dark title band and ✓ / ✗ for each question. */
export function Worksheet({ title, questions, answers, onAnswer, onDone, children, coach }) {
  return (
    <div className={s.worksheet} data-coach={coach}>
      <div className={s.wsBand}>{title}</div>
      {children}
      <ol className={s.wsList}>
        {questions.map(({ q, text }) => (
          <li key={q} className={s.wsItem}>
            <span className={s.wsQ}>{text}</span>
            <span className={s.wsBtns}>
              <button
                className={`${s.tick} ${answers[q] === true ? s.tickYes : ''}`}
                onClick={() => { sound.tap(); onAnswer(q, true) }}
                aria-pressed={answers[q] === true}
              >✓</button>
              <button
                className={`${s.tick} ${answers[q] === false ? s.tickNo : ''}`}
                onClick={() => { sound.tap(); onAnswer(q, false) }}
                aria-pressed={answers[q] === false}
              >✗</button>
            </span>
          </li>
        ))}
      </ol>
      <button className={`${ls.cta} ${ls.ctaBig}`} onClick={() => { sound.select(); onDone() }}>📋 Done checking</button>
    </div>
  )
}

/** Block header card in its sleeve. Blank fields can have a "fill" button. */
export function HeaderKit({ header, target, fills = {}, coach }) {
  const row = (key, label, value) => (
    <div className={ls.headerRow}>
      <span>{label}</span>
      {value != null
        ? <b className={`${ls.hand} ${key === 'target' ? ls.targetNum : ''}`}>{value}</b>
        : fills[key]
          ? <button className={s.fillBtn} onClick={() => { sound.tap(); fills[key]() }}>✏️ fill in</button>
          : <b className={ls.hand}>____</b>}
    </div>
  )
  return (
    <div className={`${ls.headerCard} ${s.sleeve}`} data-coach={coach}>
      <span className={ls.headerTag}>block header</span>
      {row('prev', 'prev block hash', header.prev != null ? String(header.prev).padStart(5, '0') : null)}
      {row('commit', 'tx commitment', header.commit)}
      {row('time', 'time', header.time)}
      {row('target', 'target', target?.toLocaleString())}
      {row('nonce', 'nonce', header.nonce)}
    </div>
  )
}

/** The handheld miner from the kit. */
export function MinerKit({ rig, target, loaded, onLoad, onTap, auto, onAuto, coach }) {
  return (
    <div className={ls.gadget} data-coach={coach}>
      <div className={ls.screen}>
        {!loaded ? (
          <p className={ls.screenDim}>Load the header to start.</p>
        ) : (
          <>
            <p>Lowest Hash: <b>{rig.lowest != null ? fmt(rig.lowest) : '—'}</b> {rig.lowest != null && rig.lowest < target ? '✅' : ''}</p>
            <p className={ls.screenHot}>Tries: <b>{fmt(rig.tries)}</b></p>
            <p>Best Nonce: <b>{rig.bestNonce ?? '—'}</b></p>
            <p className={ls.screenDim}>Need a hash smaller than {fmt(target)}</p>
          </>
        )}
      </div>
      {!loaded ? (
        <button className={`${ls.cta} ${ls.ctaGold}`} onClick={() => { sound.select(); onLoad() }}>📥 Load the header</button>
      ) : (
        <>
          <button className={ls.mineBtn} onClick={() => { sound.tick(); onTap() }}>
            <span className={ls.mineIcon}>⛏</span>
            <span>MINE!</span>
          </button>
          <button className={`${ls.autoBtn} ${auto ? ls.autoOn : ''}`} onClick={() => { sound.select(); onAuto(!auto) }}>
            🤖 {auto ? 'Stop robot' : 'Robot helper'}
          </button>
        </>
      )}
      <p className={s.gadgetNote}>A pretend puzzle — real Bitcoin mining uses huge machines and much harder numbers.</p>
    </div>
  )
}
