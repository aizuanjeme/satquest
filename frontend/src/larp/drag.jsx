import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { sound } from '../audio/SoundManager'

/*
  Tiny pointer-based drag & drop that works the same on touch and mouse
  (HTML5 drag events don't fire on mobile).

  <Draggable payload={{ kind: 'coin', id }} onTap={...}>…</Draggable>
  const zone = useDropZone('inputs', { accepts: (p) => p.kind === 'coin', onDrop })
  <div {...zone}>…</div>

  A short press without movement counts as a tap, so every drag has a
  tap fallback for players who'd rather not drag.
*/

const DragCtx = createContext(null)
const THRESHOLD = 6

export function DragProvider({ children }) {
  const zones = useRef(new Map())
  const [drag, setDrag] = useState(null) // { payload, ghost, x, y, over }

  // Innermost zone under the pointer that accepts this payload. Zones can
  // nest (the coin tray sits inside the tx card the key is dropped on), and
  // we look through overlays such as Bitty's speech bubble.
  const zoneAt = (x, y, payload) => {
    for (const hit of document.elementsFromPoint(x, y)) {
      let el = hit.closest('[data-drop]')
      while (el) {
        const id = el.getAttribute('data-drop')
        if (zones.current.get(id)?.accepts(payload)) return id
        el = el.parentElement?.closest('[data-drop]')
      }
    }
    return null
  }

  const dragRef = useRef(null)
  dragRef.current = drag

  // Auto-scroll: hold a lifted item near the top/bottom edge to scroll the
  // play area, so a coin can reach a card that's off-screen on a phone.
  const dragging = !!drag
  useEffect(() => {
    document.body.toggleAttribute('data-dragging', dragging)
    return () => document.body.removeAttribute('data-dragging')
  }, [dragging])
  useEffect(() => {
    if (!dragging) return undefined
    const id = setInterval(() => {
      const d = dragRef.current
      if (!d) return
      const edge = 90
      const h = window.innerHeight
      const speed = d.y < edge ? -Math.ceil((edge - d.y) / 6) : d.y > h - edge ? Math.ceil((d.y - (h - edge)) / 6) : 0
      if (!speed) return
      const root = document.querySelector('[data-drag-scroll]') || document.scrollingElement
      root.scrollBy(0, speed)
      setDrag((cur) => cur && { ...cur, over: zoneAt(cur.x, cur.y, cur.payload) })
    }, 16)
    return () => clearInterval(id)
  }, [dragging]) // eslint-disable-line

  // Methods are created once so drop zones register a single time.
  const methods = useRef({
    register: (id, zone) => { zones.current.set(id, zone); return () => zones.current.delete(id) },
    begin: (payload, ghost, x, y) => { sound.tap(); setDrag({ payload, ghost, x, y, over: null }) },
    move: (x, y) => setDrag((d) => d && { ...d, x, y, over: zoneAt(x, y, d.payload) }),
    end: (x, y) => {
      const d = dragRef.current
      setDrag(null)
      const id = d && zoneAt(x, y, d.payload)
      if (id) zones.current.get(id)?.onDrop(d.payload)
    },
    cancel: () => setDrag(null),
  }).current
  const api = useMemo(() => ({ ...methods, drag }), [methods, drag])

  return (
    <DragCtx.Provider value={api}>
      {children}
      {drag && (
        <div
          style={{
            position: 'fixed', left: drag.x, top: drag.y, zIndex: 200, pointerEvents: 'none',
            transform: 'translate(-50%, -60%) scale(1.08) rotate(-3deg)',
            filter: 'drop-shadow(0 12px 22px rgba(0,0,0,.55))',
          }}
        >
          {drag.ghost}
        </div>
      )}
    </DragCtx.Provider>
  )
}

export function Draggable({ payload, onTap, disabled, className, children }) {
  const ctx = useContext(DragCtx)
  const start = useRef(null)

  const onPointerDown = (e) => {
    if (disabled || e.button > 0) return
    e.preventDefault() // no text selection while dragging
    start.current = { x: e.clientX, y: e.clientY, dragging: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    const st = start.current
    if (!st) return
    if (!st.dragging && Math.hypot(e.clientX - st.x, e.clientY - st.y) > THRESHOLD) {
      st.dragging = true
      ctx.begin(payload, <div className={className}>{children}</div>, e.clientX, e.clientY)
    }
    if (st.dragging) ctx.move(e.clientX, e.clientY)
  }
  const onPointerUp = (e) => {
    const st = start.current
    start.current = null
    if (!st) return
    if (st.dragging) ctx.end(e.clientX, e.clientY)
    else if (onTap) { sound.tap(); onTap() }
  }
  const onPointerCancel = () => { start.current = null; ctx.cancel() }

  const lifted = ctx.drag && ctx.drag.payload.id === payload.id && ctx.drag.payload.kind === payload.kind
  return (
    <div
      className={className}
      style={{ touchAction: 'none', cursor: disabled ? 'default' : 'grab', opacity: lifted ? 0.35 : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-disabled={disabled || undefined}
    >
      {children}
    </div>
  )
}

/** Props for a drop target. `data-armed` while a matching item is lifted, `data-hot` while hovered. */
export function useDropZone(id, { accepts, onDrop }) {
  const ctx = useContext(DragCtx)
  const ref = useRef({ accepts, onDrop })
  ref.current = { accepts, onDrop }
  const stableAccepts = useCallback((p) => ref.current.accepts(p), [])
  const stableDrop = useCallback((p) => { sound.select(); ref.current.onDrop(p) }, [])
  const { register } = ctx
  useEffect(() => register(id, { accepts: stableAccepts, onDrop: stableDrop }), [register, id, stableAccepts, stableDrop])
  const d = ctx.drag
  return {
    'data-drop': id,
    'data-armed': d && accepts(d.payload) ? '' : undefined,
    'data-hot': d && d.over === id ? '' : undefined,
  }
}
