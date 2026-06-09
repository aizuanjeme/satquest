import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { LEVELS } from '../data/levels'
import Avatar from './Avatar'
import { sfx } from '../lib/sfx'
import s from './LevelMap.module.css'

/*
  LevelMap (Candy-Crush style)
  ----------------------------
  - Levels stack from the bottom UP. Level 1 sits at the very bottom; the last
    level is at the top of the lane.
  - Nodes zig-zag horizontally between 5 lane columns so the path snakes.
  - A single <svg> overlay paints smooth curved connector segments between
    consecutive nodes; the segment turns green once the level it leads to is
    completed.
  - The player's avatar rides on the active (next-to-play) node and gently bobs.
  - On mount, we scroll the active node into view so returning players land
    right where they left off.
*/

// Vertical spacing between nodes (in px).
const ROW_HEIGHT = 120
const TOP_PAD    = 90
const BOTTOM_PAD = 90

// Side characters — real avatar images walking along the road edges.
const avUrl = (gender, n) =>
  new URL(
    `../avatars/Size_XXL__2048px______Avatar_${gender}_${n}_____Round_no.webp`,
    import.meta.url,
  ).href

const SIDE_CHARS = [
  { src: avUrl('female',  1), bitcoin: false },
  { src: avUrl('male',    4), bitcoin: true  },
  { src: avUrl('female',  7), bitcoin: false },
  { src: avUrl('male',   10), bitcoin: false },
  { src: avUrl('female', 13), bitcoin: true  },
  { src: avUrl('male',   16), bitcoin: false },
  { src: avUrl('female', 19), bitcoin: false },
  { src: avUrl('male',    2), bitcoin: true  },
]

// 10 building variants + grass patch, cycling per node.
const BLDG_CONFIGS = [
  'spire','block','tower','twin','stepped','slab','dome','castle','arch','pagoda',
]

// Colours — fully solid so buildings pop on the bright terrain
const BLDG_COLORS = [
  'rgba(140,60,240,1)',
  'rgba(0,140,220,1)',
  'rgba(220,90,10,1)',
  'rgba(0,170,90,1)',
  'rgba(215,30,100,1)',
  'rgba(190,150,0,1)',
  'rgba(30,150,235,1)',
  'rgba(110,185,30,1)',
  'rgba(225,100,30,1)',
  'rgba(160,90,225,1)',
]

function Building({ variant, c }) {
  const cD  = c.replace(/[\d.]+\)$/, '0.72)')   // shadow face
  const cM  = c.replace(/[\d.]+\)$/, '0.92)')   // lit face
  const win = { fill: 'rgba(255,224,60,1)' }
  const sw  = { strokeWidth: '1.6', stroke: c.replace(/[\d.]+\)$/, '1)') }

  switch (variant) {

    case 'spire': return (
      <svg width="34" height="100" viewBox="0 0 34 100" fill="none">
        {/* base wing */}
        <rect x="0" y="52" width="34" height="48" fill={cD} {...sw}/>
        {/* mid shaft */}
        <rect x="8" y="18" width="18" height="52" fill={cM} {...sw}/>
        {/* spire tip */}
        <polygon points="17,0 25,18 9,18" fill={c}/>
        {/* antenna */}
        <line x1="17" y1="0" x2="17" y2="-6" stroke={c} strokeWidth="1.5"/>
        {/* windows */}
        {[58,70,82].map(y=>[3,13,23].map(x=><rect key={x+y} x={x} y={y} width="6" height="7" {...win}/>))}
        {[26,38].map(y=>[11,19].map(x=><rect key={x+y} x={x} y={y} width="4" height="5" {...win}/>))}
      </svg>
    )

    case 'block': return (
      <svg width="58" height="60" viewBox="0 0 58 60" fill="none">
        {/* penthouse */}
        <rect x="10" y="0" width="38" height="12" fill={cM} {...sw}/>
        {/* main body */}
        <rect x="0" y="12" width="58" height="48" fill={cD} {...sw}/>
        {/* window grid 3×3 */}
        {[18,30,42].map(y=>[4,20,36].map(x=><rect key={x+y} x={x} y={y} width="10" height="8" {...win}/>))}
      </svg>
    )

    case 'tower': return (
      <svg width="26" height="108" viewBox="0 0 26 108" fill="none">
        {/* antennae */}
        <line x1="10" y1="0" x2="10" y2="18" stroke={c} strokeWidth="1.5"/>
        <line x1="16" y1="4" x2="16" y2="18" stroke={c} strokeWidth="1.5"/>
        <rect x="0" y="18" width="26" height="90" fill={cD} {...sw}/>
        {/* vertical highlight stripe */}
        <rect x="11" y="18" width="4" height="90" fill={cM}/>
        {[28,42,56,70,84,98].map(y=>[3,16].map(x=><rect key={x+y} x={x} y={y} width="6" height="8" {...win}/>))}
      </svg>
    )

    case 'twin': return (
      <svg width="54" height="82" viewBox="0 0 54 82" fill="none">
        <rect x="0" y="10" width="22" height="72" fill={cD} {...sw}/>
        <rect x="32" y="24" width="22" height="58" fill={cM} {...sw}/>
        <polygon points="11,0 20,10 2,10"  fill={c}/>
        <polygon points="43,14 52,24 34,24" fill={c}/>
        {[18,32,46,60,72].map(y=>[3,13].map(x=><rect key={'L'+x+y} x={x} y={y} width="5" height="7" {...win}/>))}
        {[32,46,60,72].map(y=>[35,45].map(x=><rect key={'R'+x+y} x={x} y={y} width="5" height="7" {...win}/>))}
      </svg>
    )

    case 'stepped': return (
      <svg width="50" height="84" viewBox="0 0 50 84" fill="none">
        <rect x="0"  y="62" width="50" height="22" fill={cD} {...sw}/>
        <rect x="7"  y="40" width="36" height="28" fill={cM} {...sw}/>
        <rect x="15" y="18" width="20" height="28" fill={cD} {...sw}/>
        <rect x="20" y="4"  width="10" height="18" fill={cM} {...sw}/>
        {[66,74].map(y=>[4,18,34].map(x=><rect key={x+y} x={x} y={y} width="8" height="6" {...win}/>))}
        {[46].map(y=>[11,28].map(x=><rect key={x+y} x={x} y={y} width="6" height="6" {...win}/>))}
        {[25].map(y=>[17,28].map(x=><rect key={x+y} x={x} y={y} width="4" height="5" {...win}/>))}
      </svg>
    )

    case 'slab': return (
      <svg width="18" height="110" viewBox="0 0 18 110" fill="none">
        <rect x="0" y="0" width="18" height="110" fill={cD} {...sw}/>
        <rect x="6" y="0" width="6" height="110" fill={cM}/>
        {[6,18,30,42,54,66,78,90,102].map(y=>
          <rect key={y} x="4" y={y} width="10" height="8" {...win}/>
        )}
      </svg>
    )

    case 'dome': return (
      <svg width="56" height="72" viewBox="0 0 56 72" fill="none">
        {/* base */}
        <rect x="0" y="40" width="56" height="32" fill={cD} {...sw}/>
        {/* dome */}
        <ellipse cx="28" cy="40" rx="28" ry="20" fill={cM} stroke={c} strokeWidth="1.4"/>
        {/* highlight arc */}
        <path d="M10,35 Q28,14 46,35" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2"/>
        {/* lantern */}
        <rect x="24" y="20" width="8" height="10" fill={cD} {...sw}/>
        <rect x="26" y="10" width="4" height="12" fill={c}/>
        {[46,58].map(y=>[6,20,36].map(x=><rect key={x+y} x={x} y={y} width="8" height="8" {...win}/>))}
      </svg>
    )

    case 'castle': return (
      <svg width="60" height="88" viewBox="0 0 60 88" fill="none">
        {/* battlements */}
        {[0,12,24,36,48].map(x=><rect key={x} x={x} y="0" width="8" height="12" fill={cM} stroke={c} strokeWidth="1"/>)}
        {/* main wall */}
        <rect x="0" y="12" width="60" height="76" fill={cD} {...sw}/>
        {/* gate arch */}
        <path d="M20,88 L20,60 Q30,48 40,60 L40,88" fill="rgba(0,0,0,0.5)" stroke={c} strokeWidth="1"/>
        {/* turrets */}
        <rect x="0"  y="20" width="12" height="68" fill={cM} {...sw}/>
        <rect x="48" y="20" width="12" height="68" fill={cM} {...sw}/>
        {/* windows */}
        {[28,46,64].map(y=>[16,36].map(x=><rect key={x+y} x={x} y={y} width="6" height="8" {...win}/>))}
      </svg>
    )

    case 'arch': return (
      <svg width="48" height="78" viewBox="0 0 48 78" fill="none">
        {/* left pillar */}
        <rect x="0"  y="14" width="14" height="64" fill={cD} {...sw}/>
        {/* right pillar */}
        <rect x="34" y="14" width="14" height="64" fill={cD} {...sw}/>
        {/* arch keystone */}
        <path d="M0,32 Q24,-4 48,32" fill={cM} stroke={c} strokeWidth="1.4"/>
        {/* crossbar */}
        <rect x="0" y="30" width="48" height="10" fill={cM} stroke={c} strokeWidth="1"/>
        {/* spires on top of pillars */}
        <polygon points="7,0 13,14 1,14" fill={c}/>
        <polygon points="41,0 47,14 35,14" fill={c}/>
        {[22,38,54,66].map(y=>[2,36].map(x=><rect key={x+y} x={x} y={y} width="6" height="7" {...win}/>))}
      </svg>
    )

    case 'pagoda': return (
      <svg width="50" height="96" viewBox="0 0 50 96" fill="none">
        {/* base */}
        <rect x="0"  y="76" width="50" height="20" fill={cD} {...sw}/>
        {/* tier 3 */}
        <rect x="6"  y="56" width="38" height="22" fill={cM} {...sw}/>
        <path d="M2,56 Q25,46 48,56" fill={c} stroke={c} strokeWidth="1"/>
        {/* tier 2 */}
        <rect x="11" y="36" width="28" height="22" fill={cD} {...sw}/>
        <path d="M7,36 Q25,26 43,36" fill={c} stroke={c} strokeWidth="1"/>
        {/* tier 1 */}
        <rect x="16" y="18" width="18" height="20" fill={cM} {...sw}/>
        <path d="M12,18 Q25,8 38,18"  fill={c} stroke={c} strokeWidth="1"/>
        {/* finial */}
        <line x1="25" y1="0" x2="25" y2="10" stroke={c} strokeWidth="2"/>
        <circle cx="25" cy="0" r="3" fill={c}/>
        {/* windows */}
        {[44,62,80].map(y=><rect key={y} x="21" y={y} width="8" height="8" {...win}/>)}
      </svg>
    )

    default: return null
  }
}

// Cartoon tree — round canopy or pine, layered for 3-D depth
function Tree({ seed = 0 }) {
  const isPine = seed % 3 === 2
  const hue    = 116 + ((seed * 9) % 20) - 10
  const trk    = '#7A4820'
  const dark   = `hsl(${hue - 8},62%,24%)`
  const mid    = `hsl(${hue},68%,36%)`
  const lite   = `hsl(${hue + 10},76%,52%)`
  const shine  = `hsl(${hue + 18},82%,70%)`

  if (isPine) return (
    <svg width="24" height="46" viewBox="0 0 36 68" fill="none">
      <ellipse cx="18" cy="67" rx="10" ry="3" fill="rgba(0,0,0,0.18)"/>
      <rect x="14" y="52" width="8" height="15" rx="2" fill={trk}/>
      <polygon points="18,4 34,54 2,54"  fill={dark}/>
      <polygon points="18,10 30,46 6,46" fill={mid}/>
      <polygon points="18,20 26,38 10,38" fill={lite}/>
      <ellipse cx="13" cy="20" rx="4" ry="3" fill={shine} opacity="0.6"/>
    </svg>
  )
  return (
    <svg width="30" height="46" viewBox="0 0 44 68" fill="none">
      <ellipse cx="22" cy="67" rx="13" ry="4" fill="rgba(0,0,0,0.18)"/>
      <rect x="18" y="44" width="8" height="23" rx="2" fill={trk}/>
      <ellipse cx="22" cy="42" rx="22" ry="17" fill={dark}/>
      <ellipse cx="22" cy="38" rx="19" ry="14" fill={mid}/>
      <ellipse cx="22" cy="33" rx="15" ry="11" fill={lite}/>
      <ellipse cx="16" cy="26" rx="5" ry="4" fill={shine} opacity="0.65"/>
    </svg>
  )
}

// 3-D ground strip — terrain platform
function GroundStrip({ seed = 0 }) {
  const w = 96, h = 38
  const hue   = 120 + ((seed * 11) % 16) - 8
  const surf  = `hsl(${hue + 8},82%,50%)`
  const body  = `hsl(${hue},72%,36%)`
  const front = `hsl(${hue - 10},62%,24%)`
  const hilit = `hsl(${hue + 20},90%,68%)`

  const flowers = [w * 0.15, w * 0.48, w * 0.80].map((fx, fi) => ({
    x:   Math.round(fx + ((seed * (fi + 1) * 7) % 10) - 5),
    y:   7 + ((seed * fi * 3) % 4),
    col: ['rgba(255,218,50,1)', 'rgba(255,120,200,1)', 'rgba(100,220,255,1)'][fi],
  }))

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <ellipse cx={w / 2} cy={h} rx={w * 0.47} ry={4} fill="rgba(0,0,0,0.22)"/>
      <rect x={2} y={15} width={w - 4} height={19} rx={5} fill={front}/>
      <rect x={0} y={7}  width={w}     height={22} rx={6} fill={body}/>
      <path d={`M0,11 Q${w * 0.5},3 ${w},11 L${w},18 Q${w * 0.5},10 0,18 Z`} fill={surf}/>
      <path d={`M${w * 0.08},9 Q${w * 0.28},4 ${w * 0.46},8`} stroke={hilit} strokeWidth={2.5} strokeLinecap="round" opacity={0.7}/>
      {flowers.map((f, fi) => (
        <g key={fi}>
          <circle cx={f.x} cy={f.y} r={3.5} fill={f.col}/>
          <circle cx={f.x} cy={f.y} r={1.4} fill="white"/>
        </g>
      ))}
    </svg>
  )
}

export default function LevelMap({
  avatar, username, sats, unlockedUpTo, progress, onSelect,
}) {
  const totalLevels = LEVELS.length
  const doneCount   = Object.keys(progress?.levels || {}).length

  const scrollerRef = useRef(null)
  const activeRef   = useRef(null)
  const [width, setWidth] = useState(380)

  // Track the map's actual width so we can convert lane % → px for the SVG path
  useLayoutEffect(() => {
    if (!scrollerRef.current) return
    const update = () => setWidth(scrollerRef.current.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(scrollerRef.current)
    return () => ro.disconnect()
  }, [])

  // On first mount: jump straight to the BOTTOM of the lane (Level 1 lives
  // there). After that, smoothly scroll to wherever the active node is so
  // returning players land on their next level.
  const didInitialScroll = useRef(false)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!didInitialScroll.current) {
        // Land at the bottom — "Start"
        if (scrollerRef.current) {
          scrollerRef.current.scrollTo({
            top: scrollerRef.current.scrollHeight,
            behavior: 'auto',
          })
        }
        didInitialScroll.current = true
      } else {
        activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }, 150)
    return () => clearTimeout(t)
  }, [unlockedUpTo])

  // Build positions for every level. Index 0 (Level 1) sits at the BOTTOM,
  // so we compute Y from the bottom of the lane upward.
  const laneHeight = TOP_PAD + (totalLevels - 1) * ROW_HEIGHT + BOTTOM_PAD
  // Sine-wave X gives a looping-oval feel as you scroll; cosine Y adds a small
  // vertical wobble so the path traces actual ellipses instead of flat S-curves.
  const positions  = useMemo(() => (
    LEVELS.map((_, i) => {
      const a = i * Math.PI / 4
      return {
        xPct: 50 + 30 * Math.sin(a),
        y:    laneHeight - BOTTOM_PAD - i * ROW_HEIGHT + 16 * Math.cos(a),
      }
    })
  ), [laneHeight])

  // Build the SVG path that weaves through every node (smooth cubic curves)
  const pathD = useMemo(() => {
    if (positions.length === 0) return ''
    const pxFor = (p) => ({ x: (p.xPct / 100) * width, y: p.y })
    const pts = positions.map(pxFor)

    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      // Vertical control points give a soft S-curve between nodes
      const midY = (prev.y + curr.y) / 2
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`
    }
    return d
  }, [positions, width])

  // The lane is drawn twice: a dashed full path underneath, and a green
  // "progress" path on top whose length is clipped to how far the player
  // has reached. The progress path is drawn from the START (bottom) upward.
  const completedSegments = Math.min(unlockedUpTo, positions.length - 1)
  const totalSegments     = Math.max(1, positions.length - 1)
  const progressPct       = completedSegments / totalSegments

  return (
    <div className={s.body}>
      {/* Sticky hero at the top — does not scroll with the lane */}
      <div className={s.hero}>
        <Avatar avatar={avatar} size="lg" className={s.heroemoji} />
        <div className={s.heroText}>
          <p className={s.heroname}>@{username || avatar.name}</p>
          <p className={s.herorole}>{doneCount}/{totalLevels} levels done</p>
        </div>
        <div className={s.heroSats}>
          <p className={s.heroSatNum}>{sats}</p>
          <p className={s.heroSatLbl}>sats</p>
        </div>
      </div>

      {/* The lane scrolls on its own so the hero stays put. */}
      <div className={s.scroller} ref={scrollerRef}>
        <div className={s.scene} style={{ height: laneHeight }}>
        <div className={s.lane} style={{ height: laneHeight }}>

          {/* Candy-Crush rope road — pink layered strokes with white centre dashes */}
          <svg
            className={s.laneSvg}
            width={width}
            height={laneHeight}
            viewBox={`0 0 ${width} ${laneHeight}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="laneProgress" x1="0" y1="100%" x2="0" y2="0%">
                <stop offset="0%"   stopColor="#00E5A0" />
                <stop offset="100%" stopColor="#FFD60A" />
              </linearGradient>
              <filter id="roadGlow">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Deep gutter shadow */}
            <path d={pathD} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="58" strokeLinecap="round" />
            {/* Outer kerb — dark charcoal */}
            <path d={pathD} fill="none" stroke="#1A1A2E" strokeWidth="48" strokeLinecap="round" />
            {/* Road surface — dark asphalt */}
            <path d={pathD} fill="none" stroke="#2C2C3E" strokeWidth="38" strokeLinecap="round" />
            {/* Edge highlight — subtle lighter rim */}
            <path d={pathD} fill="none" stroke="#3E3E55" strokeWidth="30" strokeLinecap="round" />
            {/* Centre dashes — yellow road markings */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(255,214,10,0.70)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="22 16"
            />
            {/* Completed progress glow */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#laneProgress)"
              strokeWidth="12"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray={`${progressPct} 1`}
              filter="url(#roadGlow)"
            />
          </svg>

          {/* Ground groups — sparse: every 3rd node gets a strip */}
          {positions.map((pos, i) => {
            if (i % 3 !== 0) return null            // skip 2 out of every 3 nodes
            const c        = BLDG_COLORS[i % BLDG_COLORS.length]
            const variant  = BLDG_CONFIGS[i % BLDG_CONFIGS.length]
            const bldgLeft = i % 6 === 0            // building only every 6th node
            const hasTree  = i % 6 === 3            // tree only on alternate sparse slots
            const hasChar  = i % 12 === 0           // walker every 12th node
            const char     = hasChar ? SIDE_CHARS[(i / 12 | 0) % SIDE_CHARS.length] : null
            const charLeft = !bldgLeft

            return (
              <div key={'env-' + i}>
                {/* LEFT ground group */}
                <div className={s.groundGroup} style={{ left: '11%', top: pos.y, '--di': i }}>
                  {bldgLeft && <div className={s.bldgOnStrip}><Building variant={variant} c={c} /></div>}
                  {hasTree && !bldgLeft && <div className={s.treeOnStrip}><Tree seed={i} /></div>}
                  {char && charLeft && (
                    <div className={s.walkerWrap} style={{ '--ci': (i / 4 | 0) }}>
                      {char.bitcoin && <span className={s.catCoin}>₿</span>}
                      <img src={char.src} alt="" className={s.walkerImg} draggable={false} />
                    </div>
                  )}
                  <GroundStrip seed={i * 2} />
                </div>
                {/* RIGHT ground group */}
                <div className={s.groundGroup} style={{ left: '89%', top: pos.y, '--di': i + 0.5 }}>
                  {!bldgLeft && <div className={s.bldgOnStrip}><Building variant={variant} c={c} /></div>}
                  {hasTree && bldgLeft && <div className={s.treeOnStrip}><Tree seed={i + 5} /></div>}
                  {char && !charLeft && (
                    <div className={s.walkerWrap} style={{ '--ci': (i / 4 | 0) }}>
                      {char.bitcoin && <span className={s.catCoin}>₿</span>}
                      <img src={char.src} alt="" className={s.walkerImg} draggable={false} />
                    </div>
                  )}
                  <GroundStrip seed={i * 2 + 1} />
                </div>
              </div>
            )
          })}

          {/* Nodes — rendered in original order; positioned absolutely by Y/X */}
          {LEVELS.map((lv, i) => {
            const { xPct, y } = positions[i]
            const unlocked = i <= unlockedUpTo
            const done     = i < unlockedUpTo
            const active   = i === unlockedUpTo
            const locked   = !unlocked

            return (
              <div
                key={lv.id}
                ref={active ? activeRef : null}
                className={s.nodeSlot}
                style={{ left: `${xPct}%`, top: y }}
              >
                <button
                  className={`${s.node} ${done ? s.done : ''} ${active ? s.active : ''} ${locked ? s.locked : ''} ${lv.type === 'wordhunt' ? s.hunt : ''} ${lv.type === 'crossover' ? s.crossover : ''}`}
                  onClick={() => { if (unlocked) { sfx.select(); onSelect(i) } }}
                  disabled={locked}
                  aria-label={`Level ${lv.id}: ${lv.title}`}
                >
                  <span className={s.nodeEmoji}>
                    {done
                      ? <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" fill="rgba(0,229,160,0.25)" stroke="#00E5A0" strokeWidth="1.5"/><path d="M6 11.5l3.5 3.5 6.5-6.5" stroke="#00E5A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : locked
                      ? <svg width="20" height="22" viewBox="0 0 20 22" fill="none"><rect x="3" y="10" width="14" height="10" rx="2" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/><path d="M6 10V7a4 4 0 0 1 8 0v3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      : lv.type === 'crossover'
                      ? <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><polygon points="11,2 13.9,8.6 21,9.3 15.8,14.1 17.6,21 11,17.3 4.4,21 6.2,14.1 1,9.3 8.1,8.6" fill="rgba(255,214,10,0.3)" stroke="#FFD60A" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                      : lv.type === 'wordhunt'
                      ? <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="18" height="18" rx="3" fill="rgba(0,207,255,0.15)" stroke="#00CFFF" strokeWidth="1.5"/><text x="11" y="15" textAnchor="middle" fontSize="10" fontWeight="900" fill="#00CFFF">W</text></svg>
                      : <span className={s.nodeBadge}>{lv.badge}</span>
                    }
                  </span>
                  <span className={s.nodeSats}>+{lv.sats} sat</span>
                  <span className={s.nodeLvl}>{lv.id}</span>

                  {/* The player's avatar rides on the active node */}
                  {active && (
                    <span className={s.player}>
                      <Avatar avatar={avatar} size="md" />
                    </span>
                  )}
                </button>

                {/* Title card next to the node, alternating sides for readability */}
                <div className={`${s.nodeInfo} ${xPct < 50 ? s.infoRight : s.infoLeft}`}>
                  <p className={s.nodeChapter}>{lv.chapter}</p>
                  <p className={`${s.nodeTitle} ${active ? s.nodeTitleActive : ''}`}>
                    {lv.title}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Start / finish markers */}
          <div className={s.startFlag}  style={{ top: laneHeight - 30 }}>Start</div>
          <div className={s.finishFlag} style={{ top: 10 }}>Finish</div>
        </div>
        </div>
      </div>
    </div>
  )
}
