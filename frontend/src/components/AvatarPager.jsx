import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import s from './AvatarPager.module.css'

// Minimum horizontal distance (px) before a drag is treated as a swipe.
// Anything shorter is considered a tap and lets the underlying button click.
const SWIPE_THRESHOLD = 30

/*
  AvatarPager
  -----------
  Paginates a list of avatars into pages of `perPage` (default 8 → 4 cols × 2 rows).
  - Left / right arrows step one page at a time.
  - Dot indicators show which page you're on; tap a dot to jump.
  - Horizontal swipe gestures (touch + mouse drag) page through.
  - When the selected avatar changes from outside, the pager auto-jumps to that page.

  Props:
    avatars   : array of { id, img, emoji, name }
    selectedId: currently selected avatar id (or null)
    onPick    : (avatarId) => void
    perPage   : how many tiles per page (default 8)
    cardClass / wrapClass / imgClass : style hooks so the parent screen can
      re-skin the tiles to match its own look (we just pass the className strings
      down rather than duplicating CSS).
*/
export default function AvatarPager({
  avatars,
  selectedId,
  onPick,
  perPage = 8,
  cardClass = '',
  selectedClass = '',
  wrapClass = '',
  imgClass = '',
  checkClass = '',
}) {
  const pages = useMemo(() => {
    const out = []
    for (let i = 0; i < avatars.length; i += perPage) {
      out.push(avatars.slice(i, i + perPage))
    }
    return out
  }, [avatars, perPage])

  // Find the page that contains the current selection so we open on it
  const initialPage = useMemo(() => {
    if (!selectedId) return 0
    const idx = avatars.findIndex(a => a.id === selectedId)
    if (idx < 0) return 0
    return Math.floor(idx / perPage)
  }, [avatars, selectedId, perPage])

  const [page, setPage]       = useState(initialPage)
  const [dragPx, setDragPx]   = useState(0)        // live drag offset for follow-finger feel
  const [isDragging, setDrag] = useState(false)
  const totalPages            = pages.length
  const viewportRef           = useRef(null)
  const dragStartX            = useRef(null)
  const dragWidth             = useRef(0)
  const pointerIdRef          = useRef(null)
  const justSwipedRef         = useRef(false)      // suppress the click after a drag

  // If the parent changes the selection to something on a different page, jump to it
  useEffect(() => {
    if (!selectedId) return
    const idx = avatars.findIndex(a => a.id === selectedId)
    if (idx < 0) return
    const target = Math.floor(idx / perPage)
    if (target !== page) setPage(target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const goPrev = useCallback(
    () => setPage(p => Math.max(0, p - 1)),
    [],
  )
  const goNext = useCallback(
    () => setPage(p => Math.min(totalPages - 1, p + 1)),
    [totalPages],
  )

  /* ----------------------------------------------------------------------
     Swipe handling via Pointer Events.

     IMPORTANT: we deliberately do NOT call setPointerCapture on pointerdown.
     If we did, the browser would re-target the synthetic `click` event that
     follows pointerup to the viewport element instead of the inner avatar
     button, and clicking an avatar would silently do nothing.

     Instead, we only "promote" the gesture to a real drag once the pointer
     has actually moved past a small distance, and only then capture so we
     keep receiving move events even if the cursor leaves the viewport.
     A pure click never trips that threshold, so the button onClick fires.
     ---------------------------------------------------------------------- */
  const isDraggingRef = useRef(false)

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dragStartX.current   = e.clientX
    dragWidth.current    = viewportRef.current?.offsetWidth || 1
    pointerIdRef.current = e.pointerId
    isDraggingRef.current = false
  }

  const onPointerMove = (e) => {
    if (dragStartX.current == null) return
    const delta = e.clientX - dragStartX.current

    // Promote to a real drag once the pointer crosses ~6px of movement.
    if (!isDraggingRef.current && Math.abs(delta) > 6) {
      isDraggingRef.current = true
      setDrag(true)
      // NOW it's safe to capture — the click won't be misrouted because the
      // user is clearly swiping, and we want pointerup outside the element.
      try { e.currentTarget.setPointerCapture?.(pointerIdRef.current) } catch (_) {}
    }
    if (!isDraggingRef.current) return

    // Add resistance at the edges so it doesn't drag past page 0 / last page
    let clamped = delta
    if (page === 0 && delta > 0)               clamped = delta * 0.35
    if (page === totalPages - 1 && delta < 0)  clamped = delta * 0.35
    setDragPx(clamped)
  }

  const endDrag = (e) => {
    if (dragStartX.current == null) return
    const delta     = dragPx
    const wasDrag   = isDraggingRef.current
    dragStartX.current   = null
    isDraggingRef.current = false

    if (pointerIdRef.current != null) {
      try { e?.currentTarget?.releasePointerCapture?.(pointerIdRef.current) } catch (_) {}
      pointerIdRef.current = null
    }

    setDrag(false)
    setDragPx(0)

    if (!wasDrag || Math.abs(delta) < SWIPE_THRESHOLD) return  // tap → let click through

    // Real swipe — swallow the click that the browser fires after pointerup
    justSwipedRef.current = true
    setTimeout(() => { justSwipedRef.current = false }, 350)

    if (delta < 0) goNext()
    else            goPrev()
  }

  const handleTileClick = (id) => (e) => {
    if (justSwipedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    onPick(id)
  }

  // Compute the live transform: base page offset plus the current drag
  const offsetPct = -(page * 100)
  const dragPct   = dragWidth.current ? (dragPx / dragWidth.current) * 100 : 0
  const trackStyle = {
    transform: `translateX(calc(${offsetPct}% + ${dragPx}px))`,
    transition: isDragging ? 'none' : undefined,
  }
  // (dragPct is unused but kept for clarity; we use pixel offset for accuracy)
  void dragPct

  return (
    <div className={s.pager}>
      {/* Track: each page is a flex slide; we translate the track horizontally */}
      <div
        ref={viewportRef}
        className={s.viewport}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className={s.track}
          style={trackStyle}
        >
          {pages.map((slice, i) => (
            <div key={i} className={s.slide}>
              <div className={s.grid}>
                {slice.map(av => (
                  <button
                    key={av.id}
                    type="button"
                    className={`${cardClass} ${selectedId === av.id ? selectedClass : ''}`}
                    onClick={handleTileClick(av.id)}
                  >
                    {selectedId === av.id && checkClass && (
                      <span className={checkClass}>✓</span>
                    )}
                    <div className={wrapClass}>
                      {av.img
                        ? <img src={av.img} alt="" className={imgClass} draggable={false} />
                        : <span style={{ fontSize: 32 }}>{av.emoji}</span>
                      }
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls row: ‹  • • •  › */}
      <div className={s.controls}>
        <button
          type="button"
          className={s.arrow}
          onClick={goPrev}
          disabled={page === 0}
          aria-label="Previous page"
        >
          ‹
        </button>

        <div className={s.dots} role="tablist" aria-label="Avatar pages">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === page}
              aria-label={`Page ${i + 1} of ${totalPages}`}
              className={`${s.dot} ${i === page ? s.dotActive : ''}`}
              onClick={() => setPage(i)}
            />
          ))}
        </div>

        <button
          type="button"
          className={s.arrow}
          onClick={goNext}
          disabled={page === totalPages - 1}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  )
}
