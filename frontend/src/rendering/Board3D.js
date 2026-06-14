import * as THREE from 'three'
import gsap from 'gsap'

/*
  Board3D — a self-contained Three.js renderer for the match game.

  Each "card" is a real mesh (rounded plane) whose face is a live CanvasTexture
  showing an emoji + label. Cards float idly, glow on hover, lift + brighten on
  selection, and spin-flip to a matched state. Picks are resolved with a
  raycaster against the pointer.

  This is the Card3D / Board3D requirement realised as true Three.js meshes,
  layered above the persistent background scene on its own transparent canvas.

  API:
    new Board3D(canvas)
    .setCards(cards)      cards: [{ id, emoji, label, side: 'img'|'word' }]
    .onPick(fn)           fn(cardId)
    .setSelected(id, side)
    .setMatched(idSet, matchIndexById)
    .flashWrong(imgId, wordId)
    .start() / .dispose()
*/

const CARD_W = 2.5
const CARD_H = 3.3
const BLUE = 0x2ad8ff
const PURPLE = 0x9945ff
const GOLD = 0xf7c948
const RED = 0xff4d5e

function roundedPlane(w, h, r, seg = 6) {
  const shape = new THREE.Shape()
  const x = -w / 2, y = -h / 2
  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return new THREE.ShapeGeometry(shape, seg)
}

export class Board3D {
  constructor(canvas) {
    this.canvas = canvas
    this._cardsData = []
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this._resize()
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(50, this._aspect(), 0.1, 100)
    this.camera.position.set(0, 0, 12)

    this.scene.add(new THREE.AmbientLight(0x33405e, 0.8))
    const key = new THREE.DirectionalLight(0xcfe0ff, 0.9)
    key.position.set(2, 4, 8)
    this.scene.add(key)
    this.pBlue = new THREE.PointLight(BLUE, 2.0, 40, 2)
    this.pBlue.position.set(-5, 2, 6)
    this.pPurple = new THREE.PointLight(PURPLE, 1.6, 40, 2)
    this.pPurple.position.set(5, -2, 6)
    this.scene.add(this.pBlue, this.pPurple)

    this.cardGeo = roundedPlane(CARD_W, CARD_H, 0.28)
    this.cards = new Map() // id -> { mesh, data, state }
    this.group = new THREE.Group()
    this.scene.add(this.group)

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this._pickCb = () => {}
    this._hovered = null

    this.clock = new THREE.Clock()
    this._raf = null

    this._onResize = this._resize.bind(this)
    this._onClick = this._onClick.bind(this)
    this._onMove = this._onMove.bind(this)
    window.addEventListener('resize', this._onResize)
    canvas.addEventListener('pointerdown', this._onClick)
    canvas.addEventListener('pointermove', this._onMove)

    this._loop = this._loop.bind(this)
  }

  _aspect() {
    const r = this.canvas.getBoundingClientRect()
    return (r.width || window.innerWidth) / (r.height || window.innerHeight)
  }

  _resize() {
    const r = this.canvas.getBoundingClientRect()
    const w = r.width || window.innerWidth
    const h = r.height || window.innerHeight
    this.renderer.setSize(w, h, false)
    if (this.camera) {
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
    }
    // Reflow cards when viewport changes so columns stay on-screen on mobile.
    if (this._cardsData?.length) this.setCards(this._cardsData)
  }

  _viewSizeAtBoard() {
    const dist = this.camera.position.z
    const vFov = THREE.MathUtils.degToRad(this.camera.fov)
    const viewH = 2 * Math.tan(vFov / 2) * dist
    const viewW = viewH * this.camera.aspect
    return { viewW, viewH }
  }

  onPick(fn) { this._pickCb = fn || (() => {}) }

  /* ---- build card face texture ---- */
  _makeTexture(card, state) {
    const dpr = 2
    const W = 256, H = 338
    const c = document.createElement('canvas')
    c.width = W * dpr; c.height = H * dpr
    const ctx = c.getContext('2d')
    ctx.scale(dpr, dpr)

    const matched = state === 'matched'
    const selected = state === 'selected'
    const wrong = state === 'wrong'

    // glass body
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    if (matched) {
      grad.addColorStop(0, 'rgba(20,55,45,0.95)')
      grad.addColorStop(1, 'rgba(10,30,26,0.95)')
    } else if (wrong) {
      grad.addColorStop(0, 'rgba(60,18,26,0.95)')
      grad.addColorStop(1, 'rgba(35,10,16,0.95)')
    } else {
      grad.addColorStop(0, 'rgba(26,32,52,0.92)')
      grad.addColorStop(1, 'rgba(12,15,28,0.95)')
    }
    ctx.fillStyle = grad
    this._rr(ctx, 6, 6, W - 12, H - 12, 26)
    ctx.fill()

    // edge glow
    const edge = matched ? '#2bd47a' : wrong ? '#ff4d5e'
      : selected ? (card.side === 'img' ? '#2ad8ff' : '#b07bff')
      : 'rgba(120,160,255,0.25)'
    ctx.lineWidth = selected || matched || wrong ? 5 : 2
    ctx.strokeStyle = edge
    ctx.shadowColor = edge
    ctx.shadowBlur = selected || matched ? 26 : 8
    this._rr(ctx, 6, 6, W - 12, H - 12, 26)
    ctx.stroke()
    ctx.shadowBlur = 0

    // emoji
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '92px serif'
    ctx.fillText(card.emoji, W / 2, H * 0.36)

    // label
    ctx.fillStyle = matched ? '#bff7d8' : '#e8edff'
    ctx.font = '600 19px Sora, sans-serif'
    this._wrap(ctx, card.label, W / 2, H * 0.64, W - 44, 24)

    // matched check badge
    if (matched) {
      ctx.fillStyle = '#2bd47a'
      ctx.beginPath()
      ctx.arc(W - 34, 34, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#06120c'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(W - 41, 34); ctx.lineTo(W - 36, 39); ctx.lineTo(W - 27, 28)
      ctx.stroke()
    }

    const tex = new THREE.CanvasTexture(c)
    tex.anisotropy = 4
    tex.needsUpdate = true
    return tex
  }

  _rr(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  _wrap(ctx, text, x, y, maxW, lh) {
    const words = String(text).split(' ')
    const lines = []
    let line = ''
    for (const w of words) {
      const test = line ? line + ' ' + w : w
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line); line = w
      } else line = test
    }
    if (line) lines.push(line)
    const start = y - ((lines.length - 1) * lh) / 2
    lines.forEach((ln, i) => ctx.fillText(ln, x, start + i * lh))
  }

  /* ---- layout: images left, words right ---- */
  setCards(cards) {
    this._cardsData = cards
    // remove old
    this.cards.forEach(({ mesh }) => {
      this.group.remove(mesh)
      mesh.material.map?.dispose()
      mesh.material.dispose()
    })
    this.cards.clear()

    const imgs = cards.filter((c) => c.side === 'img')
    const words = cards.filter((c) => c.side === 'word')
    const place = (list, colX) => {
      const n = list.length
      const gapY = CARD_H + 0.5
      const totalH = n * gapY - 0.5
      const startY = totalH / 2 - CARD_H / 2
      list.forEach((card, i) => {
        const mat = new THREE.MeshStandardMaterial({
          map: this._makeTexture(card, 'idle'),
          transparent: true,
          emissive: new THREE.Color(card.side === 'img' ? BLUE : PURPLE),
          emissiveIntensity: 0.0,
          metalness: 0.2,
          roughness: 0.6,
          side: THREE.DoubleSide,
        })
        const mesh = new THREE.Mesh(this.cardGeo, mat)
        mesh.position.set(colX, startY - i * gapY, 0)
        mesh.userData = {
          id: card.id, side: card.side, baseX: colX, baseY: startY - i * gapY,
          phase: Math.random() * Math.PI * 2,
        }
        this.group.add(mesh)
        this.cards.set(card.id + ':' + card.side, { mesh, data: card, state: 'idle' })
      })
    }
    // Scale/space to fit both height and width (portrait-safe).
    const maxRows = Math.max(imgs.length, words.length)
    let scale = maxRows >= 8 ? 0.62 : maxRows >= 6 ? 0.74 : maxRows >= 5 ? 0.86 : 1
    const { viewW, viewH } = this._viewSizeAtBoard()

    const boardH = maxRows * (CARD_H + 0.5) - 0.5
    const safeW = Math.max(0.1, viewW - 0.5)
    const safeH = Math.max(0.1, viewH - 1.0)
    if (boardH * scale > safeH) scale = safeH / boardH

    const maxColGap = ((safeW / 2) / scale) - CARD_W / 2
    const colGap = Math.max(1.25, Math.min(3.4, maxColGap))

    const boardW = 2 * (colGap + CARD_W / 2)
    if (boardW * scale > safeW) scale = safeW / boardW

    this.group.scale.setScalar(Math.max(0.5, Math.min(1, scale)))
    place(imgs, -colGap)
    place(words, colGap)
  }

  _key(id, side) { return id + ':' + side }

  _setState(id, side, state) {
    const entry = this.cards.get(this._key(id, side))
    if (!entry) return
    entry.state = state
    entry.mesh.material.map?.dispose()
    entry.mesh.material.map = this._makeTexture(entry.data, state)
    entry.mesh.material.needsUpdate = true
    const ei = state === 'selected' ? 0.5 : state === 'matched' ? 0.35 : 0
    gsap.to(entry.mesh.material, { emissiveIntensity: ei, duration: 0.3 })
    if (state === 'matched') entry.mesh.material.emissive = new THREE.Color(0x2bd47a)
    if (state === 'selected') {
      gsap.to(entry.mesh.position, { z: 1.1, duration: 0.35, ease: 'power3.out' })
      gsap.fromTo(entry.mesh.scale, { x: 1, y: 1 }, { x: 1.08, y: 1.08, duration: 0.35, ease: 'back.out(2)' })
    } else {
      gsap.to(entry.mesh.position, { z: 0, duration: 0.4, ease: 'power3.out' })
      gsap.to(entry.mesh.scale, { x: 1, y: 1, duration: 0.4, ease: 'power3.out' })
    }
  }

  /** Reconcile every card against the authoritative game state. */
  sync({ matched = {}, selImg = null, selWord = null, wrong = null }) {
    this.cards.forEach((entry, key) => {
      const { id, side } = entry.mesh.userData
      let next = 'idle'
      if (matched[id]) next = 'matched'
      else if (side === 'img' && selImg === id) next = 'selected'
      else if (side === 'word' && selWord === id) next = 'selected'
      if (wrong) {
        const [wi, ww] = wrong.split('|')
        if ((side === 'img' && id === wi) || (side === 'word' && id === ww)) next = 'wrong'
      }
      if (entry.state !== next) this._setState(id, side, next)
    })
  }

  _pointerFromEvent(e) {
    const r = this.canvas.getBoundingClientRect()
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1
  }

  _hit() {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const meshes = []
    this.cards.forEach(({ mesh }) => meshes.push(mesh))
    const hits = this.raycaster.intersectObjects(meshes, false)
    return hits[0]?.object || null
  }

  _onClick(e) {
    this._pointerFromEvent(e)
    const obj = this._hit()
    if (obj) this._pickCb(obj.userData.id, obj.userData.side)
  }

  _onMove(e) {
    this._pointerFromEvent(e)
    const obj = this._hit()
    const id = obj ? this._key(obj.userData.id, obj.userData.side) : null
    if (id === this._hovered) return
    // reset old hover
    if (this._hovered) {
      const prev = this.cards.get(this._hovered)
      if (prev && prev.state === 'idle') {
        gsap.to(prev.mesh.material, { emissiveIntensity: 0, duration: 0.3 })
        gsap.to(prev.mesh.scale, { x: 1, y: 1, duration: 0.3 })
      }
    }
    this._hovered = id
    this.canvas.style.cursor = obj ? 'pointer' : 'default'
    if (id) {
      const cur = this.cards.get(id)
      if (cur && cur.state === 'idle') {
        gsap.to(cur.mesh.material, { emissiveIntensity: 0.28, duration: 0.3 })
        gsap.to(cur.mesh.scale, { x: 1.04, y: 1.04, duration: 0.3, ease: 'power2.out' })
        if (this._onHoverCb) this._onHoverCb()
      }
    }
  }

  onHover(fn) { this._onHoverCb = fn }

  start() {
    if (!this._raf) { this.clock.start(); this._loop() }
    // entrance animation
    let i = 0
    this.cards.forEach(({ mesh }) => {
      gsap.from(mesh.position, {
        z: -8, duration: 0.8, delay: i * 0.05, ease: 'power3.out',
      })
      gsap.from(mesh.material, { opacity: 0, duration: 0.6, delay: i * 0.05 })
      i++
    })
  }

  _loop() {
    this._raf = requestAnimationFrame(this._loop)
    const t = this.clock.getElapsedTime()
    this.cards.forEach(({ mesh, state }) => {
      const u = mesh.userData
      // gentle idle float
      mesh.position.y = u.baseY + Math.sin(t * 0.8 + u.phase) * 0.06
      if (state === 'idle') mesh.rotation.y = Math.sin(t * 0.5 + u.phase) * 0.05
    })
    this.pBlue.position.x = Math.sin(t * 0.4) * 5
    this.pPurple.position.x = Math.cos(t * 0.35) * 5
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this._raf)
    this._raf = null
    window.removeEventListener('resize', this._onResize)
    this.canvas.removeEventListener('pointerdown', this._onClick)
    this.canvas.removeEventListener('pointermove', this._onMove)
    this.cards.forEach(({ mesh }) => {
      mesh.material.map?.dispose()
      mesh.material.dispose()
    })
    this.cardGeo.dispose()
    this.renderer.dispose()
  }
}
