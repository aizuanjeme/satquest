import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { LEVELS } from '../data/levels'
import Avatar from './Avatar'
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

// 5 horizontal lane offsets (as % of the map width).
// Snaking pattern: outer-left, inner-left, center, inner-right, outer-right, back…
const LANE_OFFSETS = [18, 35, 50, 65, 82]
const LANE_PATTERN = [0, 1, 2, 3, 4, 3, 2, 1] // 8-step cycle

const laneX = (i) => LANE_OFFSETS[LANE_PATTERN[i % LANE_PATTERN.length]]

// Vertical spacing between nodes (in px). Tight enough to fit several on screen
// but loose enough that the curved connectors feel like a lane.
const ROW_HEIGHT = 110
const TOP_PAD    = 80
const BOTTOM_PAD = 80

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
  const positions  = useMemo(() => (
    LEVELS.map((_, i) => ({
      xPct: laneX(i),
      y:    laneHeight - BOTTOM_PAD - i * ROW_HEIGHT,
    }))
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
          <p className={s.heroSatNum}>⚡ {sats}</p>
          <p className={s.heroSatLbl}>sats</p>
        </div>
      </div>

      {/* The lane is scrollable on its own so the hero stays put.
          The .scene wrapper applies a 3-D perspective tilt so the lane feels
          like a road receding into the distance. */}
      <div className={s.scroller} ref={scrollerRef}>
        <div className={s.scene} style={{ height: laneHeight }}>
        <div className={s.lane} style={{ height: laneHeight }}>

          {/* Background lane (the path the player walks on) */}
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
            </defs>

            {/* dashed pending lane */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="2 14"
            />
            {/* solid completed lane (drawn from the start of the path — which
                is at the BOTTOM — up to the player's progress). Using
                pathLength=1 lets us express dasharray in fractions. */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#laneProgress)"
              strokeWidth="10"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray={`${progressPct} 1`}
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,229,160,0.45))' }}
            />
          </svg>

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
                  className={`${s.node} ${done ? s.done : ''} ${active ? s.active : ''} ${locked ? s.locked : ''} ${lv.type === 'wordhunt' ? s.hunt : ''}`}
                  onClick={() => unlocked && onSelect(i)}
                  disabled={locked}
                  aria-label={`Level ${lv.id}: ${lv.title}`}
                >
                  <span className={s.nodeEmoji}>
                    {done ? '✅' : locked ? '🔒' : (lv.type === 'wordhunt' ? '🧩' : lv.badge)}
                  </span>
                  <span className={s.nodeSats}>+{lv.sats}⚡</span>

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

          {/* Start flag at the bottom, finish trophy at the top */}
          <div className={s.startFlag}  style={{ top: laneHeight - 30 }}>🏁 Start</div>
          <div className={s.finishFlag} style={{ top: 10 }}>🏆 Finish</div>
        </div>
        </div>
      </div>
    </div>
  )
}
