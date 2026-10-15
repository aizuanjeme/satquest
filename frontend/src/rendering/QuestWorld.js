import * as THREE from 'three'
import gsap from 'gsap'
import { AvatarWalker } from './AvatarWalker'
import { t as tr } from '../i18n'

/*
  QuestWorld — a self-contained 3D "road map" for the level select screen.

  It renders a neon road winding into the distance with a stylised Bitcoin
  "vault" building at every level. Gold sats-coins stream along the road
  between unlocked buildings to visualise on-chain transactions. The camera
  glides along the road; tapping a building selects that level.

  Public API:
    new QuestWorld(canvas, { levels, unlockedUpTo, isComplete })
    .start() / .dispose()
    .onPick(fn(index))   — fired when an unlocked building is tapped
    .onHover(fn(index|null))
    .focusLevel(index, animate)
    .setSelected(index)
    .setAvatar(avatar)   — the walking character's head portrait

  At the end of the road stand three doors — Explorer, Sovereignty and
  Builder. Tapping one swings it open and flies the camera through it into
  that door's own world (a separate scene, built on first visit). Each world
  has a return door that brings the player back to the road.

    .onDoorPick(fn(id))   — fired when a door is tapped, before the fly-through
    .onRealmEnter(fn(id)) — fired once the player has arrived in a world
    .onRealmExit(fn())    — fired once the player is back on the road
    .exitRealm()
*/

const STATE_COLORS = {
  locked: new THREE.Color(0x3a4258),
  unlocked: new THREE.Color(0x2ad8ff),
  current: new THREE.Color(0xf7c948),
  done: new THREE.Color(0x2bd47a),
}

export const DOOR_DEFS = [
  {
    id: 'explorer', slot: -1, hex: 0x2bd47a, css: '#2bd47a', label: 'EXPLORER', icon: '⬡',
    tagline: ['Learn the basics.', 'Start your journey.'],
    world: 'The Wildlands',
    blurb: 'A glowing forest where every trail teaches the basics — what Bitcoin is, how wallets work and how to keep your sats safe.',
  },
  {
    id: 'sovereignty', slot: 0, hex: 0xf7c948, css: '#f7c948', label: 'SOVEREIGNTY', icon: '♛',
    tagline: ['Go deeper.', 'Understand why.'],
    world: 'The Golden Citadel',
    blurb: 'Halls of sound money. Go deeper into why Bitcoin matters — self-custody, scarcity and financial freedom.',
  },
  {
    id: 'builder', slot: 1, hex: 0xff44ff, css: '#ff44ff', label: 'BUILDER', icon: '⌬',
    tagline: ['Build the future.', 'Master the tools.'],
    world: 'The Forge',
    blurb: 'A neon grid where blocks are forged. Master the tools — Lightning, scripts and building on Bitcoin.',
  },
]

const RETURN_DOOR = { id: 'return', slot: 0, hex: 0x2ad8ff, css: '#2ad8ff', label: 'QUEST MAP', icon: '↩', tagline: ['Head back', 'to the road.'] }

const DOOR_W = 2.2       // doorway width
const DOOR_H = 3.4       // height of the straight sides; the arch sits on top
const DOOR_BASE = 0.24   // plinth height
const DOOR_OPEN = 1.75   // leaf swing (radians) when fully open
const REALM_RING = 10    // radius of the locked quest vaults inside a world
const REALM_NODES = 7

const QUEST_THEMES = {
  dark:   { top: 0x0b0a18, mid: 0x140a28, bot: 0x05070e, fog: 0x06070d, star: 0xbfd8ff, light1: 0x2ad8ff, light2: 0x9945ff, rail: '#2ad8ff', dash: '#f7c948', ground: 0x06080f, states: { locked: 0x3a4258, unlocked: 0x2ad8ff, current: 0xf7c948, done: 0x2bd47a } },
  light:  { top: 0x8898c8, mid: 0xa8b8e0, bot: 0xd0d8f0, fog: 0xb0c0e0, star: 0x4488cc, light1: 0x0077cc, light2: 0x5522cc, rail: '#0077cc', dash: '#5522cc', ground: 0xc0ccdf, states: { locked: 0x8899bb, unlocked: 0x0077cc, current: 0xee8800, done: 0x118833 } },
  market: { top: 0x020802, mid: 0x051005, bot: 0x030603, fog: 0x030803, star: 0x00ff41, light1: 0x00ff41, light2: 0xff1744, rail: '#00ff41', dash: '#ff1744', ground: 0x020502, states: { locked: 0x1a3320, unlocked: 0x00ff41, current: 0xff1744, done: 0x00cc33 } },
  bank:   { top: 0x04060e, mid: 0x0a1020, bot: 0x060810, fog: 0x04060e, star: 0xc8a84b, light1: 0xc8a84b, light2: 0x4a90d9, rail: '#c8a84b', dash: '#4a90d9', ground: 0x050709, states: { locked: 0x3a3a50, unlocked: 0xc8a84b, current: 0xffd700, done: 0x4a90d9 } },
  rainy:  { top: 0x060a12, mid: 0x0c1424, bot: 0x040810, fog: 0x06090f, star: 0x4fc3f7, light1: 0x4fc3f7, light2: 0x546e7a, rail: '#4fc3f7', dash: '#78909c', ground: 0x05070c, states: { locked: 0x3a4258, unlocked: 0x4fc3f7, current: 0x80deea, done: 0x26c6da } },
  disco:  { top: 0x0c0010, mid: 0x1a0028, bot: 0x080010, fog: 0x0c0018, star: 0xff00ff, light1: 0xff00ff, light2: 0x00ffff, rail: '#ff00ff', dash: '#ffff00', ground: 0x080010, states: { locked: 0x442244, unlocked: 0xff00ff, current: 0x00ffff, done: 0xffff00 } },
}

export class QuestWorld {
  constructor(canvas, { levels, unlockedUpTo = 0, isComplete = () => false, stage2Start = null, avatar = null } = {}) {
    this.canvas = canvas
    this.levels = levels || []
    this.unlockedUpTo = unlockedUpTo
    this.isComplete = isComplete
    this.N = this.levels.length
    this._stage2Start = stage2Start

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x06070d, 0.018)

    // Responsive layout: portrait phones need wider FOV + closer buildings
    const aspect = window.innerWidth / window.innerHeight
    this._aspect = aspect
    this._isPortrait = aspect < 0.75
    this._sideOffset = this._isPortrait ? 3.0 : 4.6
    this._camHeight = this._isPortrait ? 6.6 : 5.4
    const fov = this._isPortrait ? 68 : 55
    const nearClip = this._isPortrait ? 1.8 : 0.1

    this.camera = new THREE.PerspectiveCamera(fov, aspect, nearClip, 400)

    this.clock = new THREE.Clock()
    this._raf = null
    this._buildings = []
    this._coins = []
    this._pickCb = null
    this._hoverCb = null
    this._hovered = null
    this._bridgeCb = null
    this._bridgeHovered = false
    this._bridgeMesh = null
    this._waterMesh = null
    this._bridgeLights = null
    this._bridgeGroup = null
    this._selected = -1

    // Camera travels along the curve via this scalar (0..1).
    this._camT = 0
    this._targetCamT = 0
    this._lastLook = new THREE.Vector3()
    this._cameraPanX = 0
    this._targetCameraPanX = 0
    this._focusIndex = Math.min(this.unlockedUpTo, Math.max(this.N - 1, 0))

    // Doors at the end of the road, and the worlds behind them.
    this._doors = []
    this._hoveredDoor = null
    this._realm = null        // active world while the player is inside one
    this._realms = {}         // built lazily, keyed by door id
    this._fromDoor = null     // the road door the player went through
    this._fly = null          // { pos, look } camera override during door transitions
    this._transitioning = false
    this._doorCb = null
    this._realmEnterCb = null
    this._realmExitCb = null

    this.pointer = new THREE.Vector2(-2, -2)
    this.raycaster = new THREE.Raycaster()

    this._buildSky()
    this._buildStars()
    this._buildCurve()
    this._buildGround()
    this._buildRoad()
    this._buildLights()
    this._buildBuildings()
    this._buildCoins()
    // Compute bridge position: midpoint between last Stage 1 and first Stage 2 level
    if (this._stage2Start != null && this._stage2Start > 0 && this._stage2Start < this.N) {
      this._bridgeT = (this._tForIndex(this._stage2Start - 1) + this._tForIndex(this._stage2Start)) / 2
    } else {
      this._bridgeT = 0.978
    }
    this._buildBridge()
    this._buildDoors()
    this._buildFade()

    // Start focused on the current (next playable) level.
    const startIdx = Math.min(this.unlockedUpTo, this.N - 1)
    this._camT = this._targetCamT = this._tForIndex(startIdx)
    this._buildWalker(avatar)

    this._onResize = this._onResize.bind(this)
    this._onPointerMove = this._onPointerMove.bind(this)
    this._onPointerDown = this._onPointerDown.bind(this)
    this._onPointerUp = this._onPointerUp.bind(this)
    this._onWheel = this._onWheel.bind(this)
    this._loop = this._loop.bind(this)

    window.addEventListener('resize', this._onResize)
    canvas.addEventListener('pointermove', this._onPointerMove)
    canvas.addEventListener('pointerdown', this._onPointerDown)
    window.addEventListener('pointerup', this._onPointerUp)
    canvas.addEventListener('wheel', this._onWheel, { passive: false })
  }

  /* ---------- geometry helpers ---------- */

  _tForIndex(i) {
    // Buildings sit between t=0.04 and t=0.96 leaving runway at both ends.
    if (this.N <= 1) return 0.5
    return 0.05 + (i / (this.N - 1)) * 0.9
  }

  _buildSky() {
    const sky = this._makeSky(0x0b0a18, 0x140a28, 0x05070e)
    this._skyMat = sky.material
    this.scene.add(sky)
  }

  _makeSky(top, mid, bot) {
    const geo = new THREE.SphereGeometry(200, 32, 32)
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(top) },
        mid: { value: new THREE.Color(mid) },
        bot: { value: new THREE.Color(bot) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec3 vPos; uniform vec3 top; uniform vec3 mid; uniform vec3 bot;
        void main(){
          float h = vPos.y * 0.5 + 0.5;
          vec3 c = mix(bot, mid, smoothstep(0.0, 0.5, h));
          c = mix(c, top, smoothstep(0.45, 1.0, h));
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    })
    return new THREE.Mesh(geo, mat)
  }

  _starTexture() {
    if (this._starTex) return this._starTex
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.3, 'rgba(255,255,255,0.6)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    this._starTex = new THREE.CanvasTexture(c)
    return this._starTex
  }

  _buildStars() {
    const count = 1100
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Mostly above the horizon so the road floor stays clear.
      const r = 60 + Math.random() * 120
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.5 // upper hemisphere
      pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.7 + 6
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 40
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({
      color: 0xbfd8ff,
      size: 1.1,
      map: this._starTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.stars = new THREE.Points(geo, mat)
    this.scene.add(this.stars)
  }

  _buildCurve() {
    const pts = []
    const seg = 7 // spacing between levels along -Z
    const startZ = 6
    const total = this.N + 1
    for (let i = -1; i <= total; i++) {
      const x = Math.sin(i * 0.85) * 5.5 + Math.sin(i * 0.37) * 2.0
      const z = startZ - i * seg
      const y = 0
      pts.push(new THREE.Vector3(x, y, z))
    }
    this.curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
    this.curve.arcLengthDivisions = 600
    this._curveLen = this.curve.getLength()
  }

  _buildGround() {
    // Dark reflective-ish floor with a radial glow centred on the road.
    const geo = new THREE.PlaneGeometry(400, 400)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x06080f,
      roughness: 0.85,
      metalness: 0.2,
    })
    const ground = new THREE.Mesh(geo, mat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.06
    this._groundMat = mat
    this.scene.add(ground)
  }

  _roadTexture(railColor = '#2ad8ff', dashColor = '#f7c948') {
    if (this._roadTex) return this._roadTex
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 512
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#080b14'
    ctx.fillRect(0, 0, 128, 512)
    // glowing edge rails
    ctx.fillStyle = railColor
    ctx.shadowColor = railColor
    ctx.shadowBlur = 12
    ctx.fillRect(8, 0, 6, 512)
    ctx.fillRect(114, 0, 6, 512)
    // dashed centre line
    ctx.shadowColor = dashColor
    ctx.fillStyle = dashColor
    for (let y = 0; y < 512; y += 56) ctx.fillRect(60, y, 8, 30)
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, Math.max(8, Math.round(this._curveLen / 6)))
    this._roadTex = tex
    return tex
  }

  _buildRoad() {
    const samples = 600
    const halfW = 2.6
    const up = new THREE.Vector3(0, 1, 0)
    const positions = []
    const uvs = []
    const indices = []
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const p = this.curve.getPointAt(t)
      const tan = this.curve.getTangentAt(t).normalize()
      const side = new THREE.Vector3().crossVectors(tan, up).normalize()
      const l = p.clone().addScaledVector(side, -halfW)
      const r = p.clone().addScaledVector(side, halfW)
      positions.push(l.x, l.y, l.z, r.x, r.y, r.z)
      uvs.push(0, t, 1, t)
      if (i < samples) {
        const a = i * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    const tex = this._roadTexture()
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: 0x0a2436,
      emissiveMap: tex,
      emissiveIntensity: 1.4,
      roughness: 0.5,
      metalness: 0.3,
      side: THREE.DoubleSide,
    })
    this._roadMat = mat
    this.road = new THREE.Mesh(geo, mat)
    this.road.position.y = 0.01
    this.scene.add(this.road)
  }

  _buildLights() {
    this.scene.add(new THREE.AmbientLight(0x556688, 0.6))
    const key = new THREE.DirectionalLight(0xbcd2ff, 0.9)
    key.position.set(6, 14, 8)
    this.scene.add(key)
    this._pBlue = new THREE.PointLight(0x2ad8ff, 40, 40)
    this._pPurple = new THREE.PointLight(0x9945ff, 36, 44)
    this.scene.add(this._pBlue, this._pPurple)
  }

  _labelSprite(text, color) {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 128
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, 256, 128)
    ctx.font = 'bold 76px Orbitron, "Noto Sans", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, 128, 64)
    const tex = new THREE.CanvasTexture(c)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
    const sp = new THREE.Sprite(mat)
    sp.scale.set(2.4, 1.2, 1)
    return sp
  }

  _makeBuilding(index) {
    const unlocked = index <= this.unlockedUpTo
    const done = this.isComplete(index)
    const current = index === this.unlockedUpTo && !done
    const state = done ? 'done' : current ? 'current' : unlocked ? 'unlocked' : 'locked'
    const color = STATE_COLORS[state]

    const group = new THREE.Group()

    const h = 2.4 + (index % 4) * 0.7
    const bodyGeo = new THREE.BoxGeometry(1.7, h, 1.7)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.32),
      emissive: color.clone().multiplyScalar(unlocked ? 0.5 : 0.12),
      emissiveIntensity: unlocked ? 1.1 : 0.4,
      roughness: 0.4,
      metalness: 0.5,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = h / 2
    body.userData.role = 'body'
    group.add(body)

    // neon wireframe edges
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(bodyGeo),
      new THREE.LineBasicMaterial({ color: color.clone().multiplyScalar(unlocked ? 1.6 : 0.6), transparent: true, opacity: unlocked ? 0.95 : 0.4 }),
    )
    edges.position.y = h / 2
    edges.userData.role = 'edges'
    group.add(edges)

    // smaller "vault" top block
    const topGeo = new THREE.BoxGeometry(1.0, 0.7, 1.0)
    const top = new THREE.Mesh(topGeo, bodyMat.clone())
    top.position.y = h + 0.35
    top.userData.role = 'top'
    group.add(top)

    // roof beacon
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(2) }),
    )
    beacon.position.y = h + 0.9
    beacon.userData.role = 'beacon'
    group.add(beacon)
    group.userData.beacon = beacon

    // floating state label / number sprite
    const labelText = done ? '✓' : unlocked ? String(index + 1) : '🔒'
    const label = this._labelSprite(labelText, `#${color.getHexString()}`)
    label.position.set(0, h + 1.45, 0)
    group.add(label)

    // done buildings get a spinning coin on the roof
    if (done) {
      const coin = this._makeCoinMesh(0.45)
      coin.position.y = h + 1.5
      group.add(coin)
      group.userData.roofCoin = coin
    }

    group.userData.index = index
    group.userData.unlocked = unlocked
    group.userData.state = state
    group.userData.baseY = 0
    group.userData.pickTargets = [body, top]
    body.userData.index = index
    top.userData.index = index

    return group
  }

  _buildBuildings() {
    const up = new THREE.Vector3(0, 1, 0)
    for (let i = 0; i < this.N; i++) {
      const t = this._tForIndex(i)
      const p = this.curve.getPointAt(t)
      const tan = this.curve.getTangentAt(t).normalize()
      const side = new THREE.Vector3().crossVectors(tan, up).normalize()
      const offset = (i % 2 === 0 ? 1 : -1) * this._sideOffset
      const g = this._makeBuilding(i)
      g.position.copy(p).addScaledVector(side, offset)
      g.lookAt(p.x, g.position.y, p.z) // face the road
      g.userData.basePos = g.position.clone()
      this.scene.add(g)
      this._buildings.push(g)
    }
  }

  _coinTexture() {
    if (this._coinTex) return this._coinTex
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64)
    g.addColorStop(0, '#ffe9a8')
    g.addColorStop(0.6, '#f7c948')
    g.addColorStop(1, '#b8860b')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(64, 64, 60, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#7a5a08'
    ctx.font = 'bold 84px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('₿', 64, 70)
    this._coinTex = new THREE.CanvasTexture(c)
    return this._coinTex
  }

  _makeCoinMesh(radius = 0.35) {
    const geo = new THREE.CylinderGeometry(radius, radius, radius * 0.3, 28)
    const edge = new THREE.MeshStandardMaterial({ color: 0xf7c948, emissive: 0x8a6400, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.8 })
    const face = new THREE.MeshStandardMaterial({ map: this._coinTexture(), emissive: 0x6b4e00, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.6 })
    const coin = new THREE.Mesh(geo, [edge, face, face])
    coin.rotation.x = Math.PI / 2 // stand the coin up
    return coin
  }

  _buildCoins() {
    // Coins flow only across the unlocked portion of the road.
    const frontT = this._tForIndex(Math.min(this.unlockedUpTo, this.N - 1))
    const span = Math.max(0.08, frontT - 0.05)
    const count = Math.min(14, 4 + this.unlockedUpTo)
    for (let i = 0; i < count; i++) {
      const coin = this._makeCoinMesh(0.3 + Math.random() * 0.12)
      coin.userData.t = 0.05 + Math.random() * span
      coin.userData.speed = 0.02 + Math.random() * 0.03
      coin.userData.frontT = frontT
      coin.userData.lift = 0.9 + Math.random() * 0.5
      this.scene.add(coin)
      this._coins.push(coin)
    }
    this._coinSpan = span
    this._coinFrontT = frontT
  }

  /* ---------- doors at the end of the road ---------- */

  _pathHeaderSprite(label, taglines, hex, icon = '★') {
    const W = 400, H = 220
    const c = document.createElement('canvas'); c.width = W; c.height = H
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, W, H)
    // Icon circle
    ctx.beginPath(); ctx.arc(W / 2, 46, 34, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fill()
    ctx.strokeStyle = hex; ctx.lineWidth = 3; ctx.shadowColor = hex; ctx.shadowBlur = 16
    ctx.stroke()
    ctx.font = 'bold 38px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.fillText(icon, W / 2, 46)
    // Label
    ctx.font = 'bold 52px Orbitron, "Noto Sans", sans-serif'
    ctx.shadowColor = hex; ctx.shadowBlur = 22; ctx.fillStyle = hex
    ctx.fillText(label, W / 2, 110, W - 16)
    // Taglines
    ctx.font = '28px Orbitron, "Noto Sans", sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.shadowBlur = 6
    taglines.forEach((line, li) => ctx.fillText(line, W / 2, 152 + li * 36, W - 16))
    const tex = new THREE.CanvasTexture(c)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
    const sp = new THREE.Sprite(mat); sp.scale.set(5.2, 2.86, 1)
    return sp
  }

  // Arch outline: straight sides of height h, semicircle of radius halfW on top.
  _archShape(halfW, h) {
    const s = new THREE.Shape()
    s.moveTo(-halfW, 0)
    s.lineTo(-halfW, h)
    s.absarc(0, h, halfW, Math.PI, 0, true)
    s.lineTo(halfW, 0)
    s.lineTo(-halfW, 0)
    return s
  }

  // Frame as one U-shaped polygon (outer arch, then back along the inner arch).
  _archFrameShape(outerW, innerW, h) {
    const s = new THREE.Shape()
    s.moveTo(-outerW, 0)
    s.lineTo(-outerW, h)
    s.absarc(0, h, outerW, Math.PI, 0, true)
    s.lineTo(outerW, 0)
    s.lineTo(innerW, 0)
    s.lineTo(innerW, h)
    s.absarc(0, h, innerW, 0, Math.PI, false)
    s.lineTo(-innerW, 0)
    s.lineTo(-outerW, 0)
    return s
  }

  // Swirling glimpse of the world beyond the doorway.
  _portalMaterial(hex) {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(hex) },
        uBoost: { value: 0 },
      },
      vertexShader: `
        varying vec2 vP;
        void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        varying vec2 vP; uniform float uTime; uniform vec3 uColor; uniform float uBoost;
        void main(){
          vec2 p = vP - vec2(0.0, ${(DOOR_H * 0.62).toFixed(2)});
          float r = length(p);
          float a = atan(p.y, p.x);
          float swirl = sin(a * 5.0 + r * 6.0 - uTime * 2.5) * 0.5 + 0.5;
          float rings = sin(r * 10.0 - uTime * 4.0) * 0.5 + 0.5;
          float core = exp(-r * 0.9);
          vec3 c = uColor * (0.35 + swirl * 0.45 + rings * 0.2) + vec3(1.0) * core * (0.3 + uBoost);
          c *= 1.0 + uBoost * 1.5;
          gl_FragColor = vec4(c, 0.94);
        }
      `,
    })
  }

  _doorLeafTexture(css) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 384
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#0a0d18'; ctx.fillRect(0, 0, 128, 384)
    ctx.strokeStyle = css; ctx.shadowColor = css; ctx.shadowBlur = 10; ctx.lineWidth = 4
    ctx.strokeRect(16, 16, 96, 156)
    ctx.strokeRect(16, 196, 96, 172)
    ctx.fillStyle = css
    ;[[24, 24], [104, 24], [24, 164], [104, 164], [24, 204], [104, 204], [24, 360], [104, 360]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill()
    })
    return new THREE.CanvasTexture(c)
  }

  _doorEmblem(icon, css) {
    const c = document.createElement('canvas'); c.width = c.height = 128
    const ctx = c.getContext('2d')
    ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fill()
    ctx.strokeStyle = css; ctx.lineWidth = 5; ctx.shadowColor = css; ctx.shadowBlur = 18; ctx.stroke()
    ctx.font = 'bold 60px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'; ctx.fillText(icon, 64, 68)
    const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
    const sp = new THREE.Sprite(mat); sp.scale.set(1.1, 1.1, 1)
    return sp
  }

  _spillTexture() {
    if (this._spillTex) return this._spillTex
    const c = document.createElement('canvas'); c.width = c.height = 128
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(64, 20, 4, 64, 40, 100)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
    this._spillTex = new THREE.CanvasTexture(c)
    return this._spillTex
  }

  // A door group faces local +Z; its leaves swing open toward -Z (inward).
  _makeDoor(def, headerWidth = 5.2) {
    const group = new THREE.Group()
    const col = new THREE.Color(def.hex)
    const halfW = DOOR_W / 2
    const pickTargets = []

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(DOOR_W + 0.9, DOOR_BASE, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x0b1020, emissive: col.clone().multiplyScalar(0.25), metalness: 0.8, roughness: 0.3 }),
    )
    plinth.position.y = DOOR_BASE / 2
    group.add(plinth)

    const frameGeo = new THREE.ExtrudeGeometry(this._archFrameShape(halfW + 0.32, halfW, DOOR_H), { depth: 0.5, bevelEnabled: false, curveSegments: 20 })
    frameGeo.translate(0, DOOR_BASE, -0.25)
    const frame = new THREE.Mesh(frameGeo, new THREE.MeshStandardMaterial({
      color: col.clone().multiplyScalar(0.3), emissive: col, emissiveIntensity: 0.9, metalness: 0.7, roughness: 0.25,
    }))
    group.add(frame); pickTargets.push(frame)

    const portalMat = this._portalMaterial(def.hex)
    const portal = new THREE.Mesh(new THREE.ShapeGeometry(this._archShape(halfW, DOOR_H), 20), portalMat)
    portal.position.set(0, DOOR_BASE, -0.14)
    group.add(portal); pickTargets.push(portal)

    const leafTex = this._doorLeafTexture(def.css)
    const leafMat = new THREE.MeshStandardMaterial({
      map: leafTex, emissive: 0xffffff, emissiveMap: leafTex, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.35,
    })
    const leaves = [-1, 1].map((side) => {
      const geo = new THREE.BoxGeometry(halfW - 0.02, DOOR_H, 0.12)
      geo.translate(-side * (halfW / 2), DOOR_H / 2, 0) // hinge on the outer edge
      const leaf = new THREE.Mesh(geo, leafMat)
      const hinge = new THREE.Group()
      hinge.position.set(side * halfW, DOOR_BASE, 0.06)
      hinge.userData.side = side
      hinge.add(leaf); group.add(hinge); pickTargets.push(leaf)
      return hinge
    })

    const emblem = this._doorEmblem(def.icon, def.css)
    emblem.position.set(0, DOOR_BASE + DOOR_H * 0.62, 0.3)
    group.add(emblem)

    const header = this._pathHeaderSprite(tr(`door.${def.id}.label`), tr(`door.${def.id}.tagline`), def.css, def.icon)
    header.scale.set(headerWidth, headerWidth * 0.55, 1)
    header.position.set(0, DOOR_BASE + DOOR_H + halfW + 0.4 + headerWidth * 0.275, 0)
    group.add(header)

    // Light spilling across the floor as the door opens
    const spill = new THREE.Mesh(
      new THREE.PlaneGeometry(DOOR_W * 1.6, 4),
      new THREE.MeshBasicMaterial({ map: this._spillTexture(), color: col, transparent: true, opacity: 0.15, depthWrite: false, blending: THREE.AdditiveBlending }),
    )
    spill.rotation.x = -Math.PI / 2
    spill.position.set(0, 0.03, 2.6)
    group.add(spill)

    const light = new THREE.PointLight(def.hex, 6, 12)
    light.position.set(0, 2.2, 1.8)
    group.add(light)

    pickTargets.forEach((m) => { m.userData.doorId = def.id })
    Object.assign(group.userData, { def, leaves, portalMat, emblem, spill, light, pickTargets, open: 0, targetOpen: 0 })
    return group
  }

  _updateDoor(door, t, hovered) {
    const ud = door.userData
    const target = Math.max(ud.targetOpen, hovered ? 0.18 : 0)
    ud.open += (target - ud.open) * (target > ud.open ? 0.1 : 0.07)
    ud.leaves.forEach((h) => { h.rotation.y = -h.userData.side * ud.open * DOOR_OPEN })
    ud.portalMat.uniforms.uTime.value = t
    ud.emblem.material.opacity = THREE.MathUtils.clamp(1 - ud.open * 2.5, 0, 1)
    ud.spill.material.opacity = 0.15 + ud.open * 0.85
    ud.light.intensity = 6 + ud.open * 34 + Math.sin(t * 2 + ud.def.slot) * 1.5
  }

  _buildDoors() {
    if (this.N === 0) return
    const up = new THREE.Vector3(0, 1, 0)
    const end = this.curve.getPointAt(1)
    const tan = this.curve.getTangentAt(1).normalize()
    const side = new THREE.Vector3().crossVectors(tan, up).normalize()
    const spacing = this._isPortrait ? 3.4 : 4.6
    const center = end.clone().addScaledVector(tan, 3)
    center.y = 0
    this._doorCenter = center

    // Plaza the doors stand on
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(spacing * 1.7, spacing * 1.8, 0.14, 48),
      new THREE.MeshStandardMaterial({ color: 0x0a2030, emissive: 0x2ad8ff, emissiveIntensity: 0.35, metalness: 0.9, roughness: 0.15 }),
    )
    disc.position.copy(center); disc.position.y = 0.04
    this.scene.add(disc); this._junctionDisc = disc

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spacing * 1.75, 0.08, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0x2ad8ff, transparent: true, opacity: 0.8 }),
    )
    ring.rotation.x = Math.PI / 2
    ring.position.copy(center); ring.position.y = 0.14
    this.scene.add(ring); this._junctionRing = ring

    // Angle the side doors slightly toward the approaching player
    const facing = center.clone().addScaledVector(tan, -16)
    DOOR_DEFS.forEach((def) => {
      const door = this._makeDoor(def, Math.min(5.2, spacing * 0.95))
      door.position.copy(center).addScaledVector(side, def.slot * spacing)
      door.lookAt(facing.x, 0, facing.z)
      this.scene.add(door)
      this._doors.push(door)
    })
  }

  /* ---------- the worlds behind the doors ---------- */

  _makeRealmNode(hexColor, index = 0) {
    const group = new THREE.Group()
    const col = new THREE.Color(hexColor)
    const dim = col.clone().multiplyScalar(0.35)
    const h = 2.0 + (index % 4) * 0.4
    const bodyGeo = new THREE.BoxGeometry(1.7, h, 1.7)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: dim.clone().multiplyScalar(0.4),
      emissive: dim.clone().multiplyScalar(0.3),
      emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.5,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.y = h / 2; group.add(body)
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(bodyGeo),
      new THREE.LineBasicMaterial({ color: col.clone().multiplyScalar(0.9), transparent: true, opacity: 0.6 }),
    )
    edges.position.y = h / 2; group.add(edges)
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.0), bodyMat)
    top.position.y = h + 0.35; group.add(top)
    const label = this._labelSprite('🔒', '#7788aa')
    label.position.set(0, h + 1.45, 0); group.add(label)
    return group
  }

  _floatingPoints(count, color, size, spread) {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * spread.r
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = spread.y0 + Math.random() * (spread.y1 - spread.y0)
      pos[i * 3 + 2] = Math.sin(a) * r
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return new THREE.Points(geo, new THREE.PointsMaterial({
      color, size, map: this._starTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }))
  }

  _buildRealm(def) {
    const scene = new THREE.Scene()
    const realm = {
      id: def.id,
      scene,
      nodes: [],
      update: null,
      cam: { angle: 0, targetAngle: 0, radius: 4, height: 1.6, baseRadius: this._isPortrait ? 23 : 19, baseHeight: 7.5 },
    }
    const look = {
      explorer: this._buildWildlands,
      sovereignty: this._buildCitadel,
      builder: this._buildForge,
    }[def.id]
    const palette = look.call(this, realm, def)

    scene.add(this._makeSky(palette.top, palette.mid, palette.bot))
    scene.fog = new THREE.FogExp2(palette.fog, palette.fogDensity ?? 0.022)
    scene.add(new THREE.AmbientLight(palette.ambient ?? 0x556677, 0.7))
    const key = new THREE.DirectionalLight(0xffffff, 0.6)
    key.position.set(8, 16, 10)
    scene.add(key)
    const accent = new THREE.PointLight(def.hex, 40, 40)
    accent.position.set(0, 6, 0)
    scene.add(accent)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 0.85, metalness: 0.2 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.02
    scene.add(ground)

    // The quests of this world — locked for now
    for (let i = 0; i < REALM_NODES; i++) {
      const a = (i / REALM_NODES) * Math.PI * 2 + Math.PI / REALM_NODES
      const g = this._makeRealmNode(def.hex, i)
      g.position.set(Math.sin(a) * REALM_RING, 0, Math.cos(a) * REALM_RING)
      g.lookAt(0, 0, 0)
      g.userData.basePos = g.position.clone()
      scene.add(g)
      realm.nodes.push(g)
    }

    const title = this._pathHeaderSprite(tr(`door.${def.id}.label`), [tr(`door.${def.id}.world`), tr('world.questsSoon')], def.css, def.icon)
    title.scale.set(7, 3.85, 1)
    title.position.set(0, 11, 0)
    scene.add(title)

    // Return door on the far side, facing the arriving player
    const exit = this._makeDoor(RETURN_DOOR, 4.2)
    exit.position.set(0, 0, -(REALM_RING + 4))
    exit.lookAt(0, 0, 0)
    scene.add(exit)
    realm.exitDoor = exit

    return realm
  }

  // Explorer — a glowing night forest with fireflies and a great crystal.
  _buildWildlands(realm) {
    const { scene } = realm

    const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 32), new THREE.MeshBasicMaterial({ color: 0xd9ffe8, fog: false }))
    moon.position.set(-40, 40, -110)
    scene.add(moon)

    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.2, 6)
    const coneGeo = new THREE.ConeGeometry(1, 2.2, 7)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 0.9 })
    const leafMats = [0x2bd47a, 0x1fae8f, 0x7be36b].map((c) => new THREE.MeshStandardMaterial({
      color: new THREE.Color(c).multiplyScalar(0.25), emissive: c, emissiveIntensity: 0.35, roughness: 0.6, flatShading: true,
    }))
    for (let i = 0; i < 110; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 27 + Math.random() * 45
      const tree = new THREE.Group()
      const trunk = new THREE.Mesh(trunkGeo, trunkMat)
      trunk.position.y = 0.6
      tree.add(trunk)
      for (let k = 0; k < 3; k++) {
        const cone = new THREE.Mesh(coneGeo, leafMats[i % 3])
        cone.position.y = 1.6 + k * 0.9
        cone.scale.setScalar(1 - k * 0.25)
        tree.add(cone)
      }
      tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r)
      tree.scale.setScalar(1.2 + Math.random() * 2.2)
      tree.rotation.y = Math.random() * Math.PI
      scene.add(tree)
    }

    // Ring of standing stones around a floating crystal
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x24302a, emissive: 0x0b3320, roughness: 0.9, flatShading: true })
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), stoneMat)
      stone.scale.set(1, 1.8, 0.8)
      stone.position.set(Math.cos(a) * 3.4, 0.9, Math.sin(a) * 3.4)
      scene.add(stone)
    }
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.4, 0),
      new THREE.MeshStandardMaterial({ color: 0x0d4a2c, emissive: 0x2bd47a, emissiveIntensity: 1.2, metalness: 0.3, roughness: 0.1, flatShading: true }),
    )
    crystal.scale.set(1, 1.6, 1)
    crystal.position.y = 3.6
    scene.add(crystal)

    const flies = this._floatingPoints(320, 0xc8ff7a, 0.45, { r: 34, y0: 0.4, y1: 7 })
    scene.add(flies)
    const base = flies.geometry.attributes.position.array.slice()

    realm.update = (t) => {
      crystal.rotation.y = t * 0.6
      crystal.position.y = 3.6 + Math.sin(t * 1.3) * 0.25
      const arr = flies.geometry.attributes.position.array
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = base[i] + Math.sin(t * 0.6 + i) * 0.6
        arr[i + 1] = base[i + 1] + Math.sin(t * 0.9 + i * 0.3) * 0.4
        arr[i + 2] = base[i + 2] + Math.cos(t * 0.5 + i) * 0.6
      }
      flies.geometry.attributes.position.needsUpdate = true
      flies.material.opacity = 0.7 + Math.sin(t * 3) * 0.3
    }

    return { top: 0x05221a, mid: 0x0a2e22, bot: 0x02080a, fog: 0x03140f, fogDensity: 0.026, ground: 0x04130d, ambient: 0x335544 }
  }

  // Sovereignty — a golden colonnade around a giant floating bitcoin.
  _buildCitadel(realm) {
    const { scene } = realm

    for (let r = 4; r <= 34; r += 5) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r, r + 0.08, 96),
        new THREE.MeshBasicMaterial({ color: 0xf7c948, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }),
      )
      ring.rotation.x = -Math.PI / 2
      ring.position.y = 0.01
      scene.add(ring)
    }

    const colMat = new THREE.MeshStandardMaterial({ color: 0x2a1e08, emissive: 0x8a6200, emissiveIntensity: 0.35, metalness: 0.9, roughness: 0.3 })
    const capMat = new THREE.MeshStandardMaterial({ color: 0x5a4210, emissive: 0xf7c948, emissiveIntensity: 0.8, metalness: 1, roughness: 0.2 })
    const COLS = 16, COL_R = 28, COL_H = 10
    for (let i = 0; i < COLS; i++) {
      const a = (i / COLS) * Math.PI * 2
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, COL_H, 16), colMat)
      col.position.set(Math.cos(a) * COL_R, COL_H / 2, Math.sin(a) * COL_R)
      scene.add(col)
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), capMat)
      cap.position.set(col.position.x, COL_H + 0.25, col.position.z)
      scene.add(cap)
    }
    const crownRing = new THREE.Mesh(new THREE.TorusGeometry(COL_R, 0.35, 8, 96), capMat)
    crownRing.rotation.x = Math.PI / 2
    crownRing.position.y = COL_H + 0.7
    scene.add(crownRing)

    // Stepped pedestal and the floating coin
    const stepMat = new THREE.MeshStandardMaterial({ color: 0x1c1406, emissive: 0x4a3400, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.3 })
    ;[[3.4, 0.4], [2.6, 0.4], [1.8, 0.4]].forEach(([r, h], i) => {
      const step = new THREE.Mesh(new THREE.CylinderGeometry(r, r + 0.1, h, 40), stepMat)
      step.position.y = h / 2 + i * h
      scene.add(step)
    })
    const coin = this._makeCoinMesh(2.0)
    coin.position.y = 5
    scene.add(coin)

    const orbit = new THREE.Group()
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const c = this._makeCoinMesh(0.3)
      c.position.set(Math.cos(a) * 4.4, 5 + Math.sin(a * 2) * 0.6, Math.sin(a) * 4.4)
      orbit.add(c)
    }
    scene.add(orbit)

    const dust = this._floatingPoints(400, 0xffd56a, 0.35, { r: 30, y0: 0, y1: 14 })
    scene.add(dust)

    realm.update = (t, dt) => {
      coin.rotation.z = t * 0.8
      coin.position.y = 5 + Math.sin(t * 1.1) * 0.3
      orbit.rotation.y = t * 0.35
      orbit.children.forEach((c) => { c.rotation.z += dt * 3 })
      const arr = dust.geometry.attributes.position.array
      for (let i = 1; i < arr.length; i += 3) {
        arr[i] += dt * 0.6
        if (arr[i] > 14) arr[i] = 0
      }
      dust.geometry.attributes.position.needsUpdate = true
    }

    return { top: 0x1a0f2a, mid: 0x3a2206, bot: 0x0a0602, fog: 0x1a1004, fogDensity: 0.018, ground: 0x0d0904, ambient: 0x665533 }
  }

  // Builder — a neon grid city with a spiralling chain of blocks and data rain.
  _buildForge(realm) {
    const { scene } = realm

    const grid = new THREE.GridHelper(240, 120, 0xff44ff, 0x552266)
    grid.material.transparent = true
    grid.material.opacity = 0.55
    grid.position.y = 0.01
    scene.add(grid)

    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0c0418, emissive: 0x220033, roughness: 0.4, metalness: 0.7 })
    const edgeMats = [0xff44ff, 0x2ad8ff].map((c) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.7 }))
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 30 + Math.random() * 50
      const w = 2 + Math.random() * 4
      const h = 6 + Math.random() * 28
      const geo = new THREE.BoxGeometry(w, h, w)
      const tower = new THREE.Mesh(geo, towerMat)
      tower.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r)
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMats[i % 2])
      tower.add(edges)
      scene.add(tower)
    }

    // Blockchain helix: blocks linked by glowing lines
    const helix = new THREE.Group()
    const blockGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9)
    const blockEdges = new THREE.EdgesGeometry(blockGeo)
    const blockMat = new THREE.MeshStandardMaterial({ color: 0x1a0626, emissive: 0xff44ff, emissiveIntensity: 0.45, metalness: 0.6, roughness: 0.3 })
    const linkPts = []
    const BLOCKS = 14
    for (let i = 0; i < BLOCKS; i++) {
      const a = i * 0.75
      const p = new THREE.Vector3(Math.cos(a) * 2.6, 0.8 + i * 0.62, Math.sin(a) * 2.6)
      const block = new THREE.Mesh(blockGeo, blockMat)
      block.position.copy(p)
      block.rotation.set(a, a * 0.5, 0)
      block.add(new THREE.LineSegments(blockEdges, edgeMats[1]))
      helix.add(block)
      linkPts.push(p)
    }
    helix.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(linkPts), new THREE.LineBasicMaterial({ color: 0x2ad8ff })))
    scene.add(helix)

    const rain = this._floatingPoints(700, 0xff7bff, 0.3, { r: 40, y0: 0, y1: 24 })
    scene.add(rain)
    const speeds = Array.from({ length: 700 }, () => 3 + Math.random() * 5)

    realm.update = (t, dt) => {
      helix.rotation.y = t * 0.4
      helix.children.forEach((b, i) => { if (b.isMesh) b.rotation.x += dt * (0.4 + (i % 3) * 0.2) })
      const arr = rain.geometry.attributes.position.array
      for (let i = 0; i < speeds.length; i++) {
        arr[i * 3 + 1] -= dt * speeds[i]
        if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 24
      }
      rain.geometry.attributes.position.needsUpdate = true
      grid.material.opacity = 0.45 + Math.sin(t * 1.5) * 0.12
    }

    return { top: 0x0a0018, mid: 0x1a0030, bot: 0x05000c, fog: 0x0c0018, fogDensity: 0.02, ground: 0x05000a, ambient: 0x553366 }
  }

  /* ---------- door transitions ---------- */

  _buildFade() {
    this._fadeScene = new THREE.Scene()
    this._fadeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this._fadeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false,
    })
    this._fadeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this._fadeMat))
  }

  _enterDoor(door) {
    if (this._transitioning || !door) return
    const def = door.userData.def
    this._transitioning = true
    this._doorCb?.(def.id)
    door.userData.targetOpen = 1

    const midY = DOOR_BASE + DOOR_H * 0.55
    const front = door.localToWorld(new THREE.Vector3(0, midY, 3.2))
    const center = door.localToWorld(new THREE.Vector3(0, midY, 0))
    const beyond = door.localToWorld(new THREE.Vector3(0, midY, -4))
    const far = door.localToWorld(new THREE.Vector3(0, midY, -20))
    this._fly = { pos: this.camera.position.clone(), look: this._lastLook.clone() }
    this._fadeMat.color.set(def.hex)

    // The character walks up to the door and through it, the camera following
    this._walkerScripted = true
    const walkerPos = this._walker.object.position
    const doorstep = door.localToWorld(new THREE.Vector3(0, 0, 0.9))
    const inside = door.localToWorld(new THREE.Vector3(0, 0, -3))

    this._tl?.kill()
    this._tl = gsap.timeline()
      .to(walkerPos, { x: doorstep.x, z: doorstep.z, duration: 0.8, ease: 'sine.inOut' }, 0)
      .to(walkerPos, { x: inside.x, z: inside.z, duration: 0.6, ease: 'sine.in' }, 0.8)
      .to(this._fly.look, { x: center.x, y: center.y, z: center.z, duration: 0.6, ease: 'power2.out' }, 0)
      .to(this._fly.pos, { x: front.x, y: front.y, z: front.z, duration: 1.0, ease: 'power2.inOut' }, 0.15)
      .to(door.userData.portalMat.uniforms.uBoost, { value: 1.5, duration: 1.2 }, 0.3)
      .to(this._fly.look, { x: far.x, y: far.y, z: far.z, duration: 0.6, ease: 'power1.in' }, 1.05)
      .to(this._fly.pos, { x: beyond.x, y: beyond.y, z: beyond.z, duration: 0.6, ease: 'power2.in' }, 1.05)
      .to(this._fadeMat, { opacity: 1, duration: 0.35, ease: 'power1.in' }, 1.3)
      .add(() => this._arriveInRealm(door))
      .to(this._fadeMat, { opacity: 0, duration: 0.9, ease: 'power2.out' })
      .add(() => { this._transitioning = false })
  }

  _arriveInRealm(door) {
    const def = door.userData.def
    this._fly = null
    door.userData.portalMat.uniforms.uBoost.value = 0
    const realm = this._realms[def.id] || (this._realms[def.id] = this._buildRealm(def))
    this._realm = realm
    this._fromDoor = door
    this._setHover(null, false, null)

    // Arrive close to the heart of the world, then pull back to look around
    const c = realm.cam
    gsap.killTweensOf(c)
    c.angle = c.targetAngle = 0
    c.radius = 4
    c.height = 1.6
    gsap.to(c, { radius: c.baseRadius, height: c.baseHeight, duration: 2.6, ease: 'power3.out' })

    // The character steps in just behind the arriving camera, revealed as it pulls back
    realm.scene.add(this._walker.object)
    this._walker.placeAt(new THREE.Vector3(0, 0, 7.5), Math.PI)
    gsap.to(this._walker.object.position, { z: 5.5, duration: 1.6, delay: 0.5, ease: 'sine.out' })
    this._realmEnterCb?.(def.id)
  }

  exitRealm() {
    if (!this._realm || this._transitioning) return
    this._transitioning = true
    const realm = this._realm
    const door = this._fromDoor
    realm.exitDoor.userData.targetOpen = 1
    this._fadeMat.color.set(RETURN_DOOR.hex)

    this._tl?.kill()
    this._tl = gsap.timeline()
      .to(this._fadeMat, { opacity: 1, duration: 0.55, ease: 'power1.in' }, 0.25)
      .add(() => {
        realm.exitDoor.userData.targetOpen = 0
        realm.exitDoor.userData.open = 0
        this._realm = null
        this._setHover(null, false, null)

        // Step back out of the door we came through; it swings shut behind us
        this._camT = this._targetCamT = 0.999
        const pose = this._mainCamPose(0.999)
        const midY = DOOR_BASE + DOOR_H * 0.55
        this._fly = {
          pos: door.localToWorld(new THREE.Vector3(0, midY, 2.2)),
          look: door.localToWorld(new THREE.Vector3(0, midY, 0)),
        }
        this.camera.position.copy(this._fly.pos)
        door.userData.open = 1
        door.userData.targetOpen = 0

        // The character walks back out of the door onto the end of the road
        gsap.killTweensOf(this._walker.object.position)
        this.scene.add(this._walker.object)
        this._walker.placeAt(door.localToWorld(new THREE.Vector3(0, 0, -0.6)).setY(0))
        const roadEnd = this.curve.getPointAt(0.999)
        gsap.to(this._walker.object.position, {
          x: roadEnd.x, z: roadEnd.z, duration: 1.5, ease: 'sine.inOut',
          onComplete: () => { this._walkerScripted = false },
        })
        gsap.to(this._fly.pos, { x: pose.pos.x, y: pose.pos.y, z: pose.pos.z, duration: 1.5, ease: 'power3.out' })
        gsap.to(this._fly.look, {
          x: pose.look.x, y: pose.look.y, z: pose.look.z, duration: 1.5, ease: 'power3.out',
          onComplete: () => { this._fly = null; this._transitioning = false },
        })
        this._realmExitCb?.()
      })
      .to(this._fadeMat, { opacity: 0, duration: 0.8, ease: 'power2.out' })
  }

  /* ---------- bridge to Stage 2 ---------- */

  _waterTexture() {
    if (this._waterTex) return this._waterTex
    const W = 256, H = 256
    const c = document.createElement('canvas'); c.width = W; c.height = H
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#030e1a'; ctx.fillRect(0, 0, W, H)
    for (let y = 0; y < H; y += 5) {
      const alpha = 0.04 + Math.random() * 0.10
      ctx.strokeStyle = `rgba(42,216,255,${alpha.toFixed(2)})`
      ctx.lineWidth = 0.8 + Math.random() * 1.6
      ctx.beginPath(); ctx.moveTo(0, y)
      for (let x = 0; x < W; x += 4) ctx.lineTo(x, y + Math.sin(x * 0.14) * 2.5)
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(3, 2)
    this._waterTex = tex; return tex
  }

  _buildBridgeSign(hex = '#2ad8ff') {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, 512, 128)
    ctx.fillStyle = 'rgba(8,16,36,0.90)'
    ctx.beginPath(); ctx.roundRect(8, 8, 496, 112, 20); ctx.fill()
    ctx.strokeStyle = hex; ctx.shadowColor = hex; ctx.shadowBlur = 18
    ctx.lineWidth = 3; ctx.stroke()
    ctx.font = 'bold 52px Orbitron, "Noto Sans", monospace'
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'; ctx.shadowBlur = 24
    ctx.fillText(tr('world.stage2'), 256, 64, 480)
    const tex = new THREE.CanvasTexture(c)
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
    const sp = new THREE.Sprite(mat); sp.scale.set(5.8, 1.45, 1)
    this._bridgeSignMat = mat; this._bridgeSignTex = tex
    return sp
  }

  _buildBridge() {
    const t = this._bridgeT ?? 0.978
    const P  = this.curve.getPointAt(t)
    const tan = this.curve.getTangentAt(t).normalize()

    // Group: local +Z = road tangent, +X = road side
    const group = new THREE.Group()
    group.position.copy(P)
    group.rotation.y = Math.atan2(tan.x, tan.z)

    const CYAN   = 0x2ad8ff
    const ROAD_W = 5.2          // match road half-width × 2
    const BL     = 22           // bridge length along road (Z)
    const TOWER_H = 9
    const COL_X  = ROAD_W / 2 + 1.5   // column outset from road edge

    /* Water: river runs in X, bridge crosses in Z */
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x03101e, emissive: 0x052a42, emissiveIntensity: 0.85,
      roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.94,
      map: this._waterTexture(),
    })
    const water = new THREE.Mesh(new THREE.PlaneGeometry(200, BL + 8), waterMat)
    water.rotation.x = -Math.PI / 2
    water.position.y = -2.0
    group.add(water); this._waterMesh = water

    /* Deck: runs in Z (road direction), road width in X */
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x0c1a2e, emissive: new THREE.Color(CYAN), emissiveIntensity: 0.22,
      metalness: 0.78, roughness: 0.24,
    })
    const deck = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 0.5, 0.38, BL), deckMat)
    deck.position.y = 0; deck.userData.isBridge = true
    group.add(deck); this._bridgeMesh = deck

    /* Guard rails at ±X edges of deck, running full length in Z */
    const railMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(CYAN), emissive: new THREE.Color(CYAN),
      emissiveIntensity: 0.95, metalness: 0.8, roughness: 0.2,
    })
    ;[-(ROAD_W / 2 + 0.16), ROAD_W / 2 + 0.16].forEach((x) => {
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.0, BL + 0.3), railMat.clone())
      topRail.position.set(x, 0.5, 0); group.add(topRail)
      for (let z = -BL / 2 + 1; z <= BL / 2; z += 2.2) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.0, 0.09), railMat.clone())
        post.position.set(x, 0.5, z); group.add(post)
      }
    })

    /* Portal towers: at Z = -(BL/2 - 2) and +(BL/2 - 2), straddle road */
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x0c1e3a, emissive: new THREE.Color(CYAN), emissiveIntensity: 0.48,
      metalness: 0.84, roughness: 0.20,
    })
    const towerZs = [-(BL / 2 - 2), BL / 2 - 2]
    towerZs.forEach((z, ti) => {
      ;[-COL_X, COL_X].forEach((x) => {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.65, TOWER_H, 0.65), towerMat.clone())
        col.position.set(x, TOWER_H / 2, z); group.add(col)
        const beacon = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 12, 12),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(CYAN).multiplyScalar(2.5) }),
        )
        beacon.position.set(x, TOWER_H + 0.32, z); group.add(beacon)
      })
      // Horizontal cross beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(COL_X * 2 + 0.65, 0.52, 0.65), towerMat.clone())
      beam.position.set(0, TOWER_H - 0.58, z); group.add(beam)
      // Sign above entry tower
      if (ti === 0) {
        const sign = this._buildBridgeSign()
        sign.position.set(0, TOWER_H + 2.8, z); group.add(sign)
      }
    })

    /* Suspension cables: running in Z between towers, one per X side */
    const cableMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.68 })
    const tZ1 = towerZs[0], tZ2 = towerZs[1]
    ;[-COL_X, COL_X].forEach((x) => {
      const pts = []
      const steps = 30; const span = tZ2 - tZ1
      for (let i = 0; i <= steps; i++) {
        const z = tZ1 + span * (i / steps)
        const f = (z - tZ1) / span
        const sag = 3.0 * (4 * f * (1 - f))   // parabolic
        pts.push(new THREE.Vector3(x, TOWER_H - 0.58 - sag, z))
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cableMat.clone()))
      // Backstay cables (entry and exit anchors)
      ;[[new THREE.Vector3(x, TOWER_H - 0.58, tZ1), new THREE.Vector3(x, 0.2, tZ1 - 5)],
        [new THREE.Vector3(x, TOWER_H - 0.58, tZ2), new THREE.Vector3(x, 0.2, tZ2 + 5)]].forEach(([a, b]) => {
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), cableMat.clone()))
      })
      // Vertical hangers from cable to deck
      for (let i = 2; i < steps - 1; i += 2) {
        const p = pts[i]
        group.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, p.y, p.z),
            new THREE.Vector3(x, 0.18, p.z),
          ]),
          cableMat.clone(),
        ))
      }
    })

    /* Underglow point lights */
    const glowA = new THREE.PointLight(CYAN, 16, 14); glowA.position.set(-3, 0.3, 0)
    const glowB = new THREE.PointLight(CYAN, 16, 14); glowB.position.set( 3, 0.3, 0)
    group.add(glowA, glowB); this._bridgeLights = [glowA, glowB]

    this._bridgeGroup = group
    this.scene.add(group)
  }

  /* ---------- the player's character ---------- */

  _buildWalker(avatar) {
    this._walker = new AvatarWalker({ avatar, coinTexture: this._coinTexture() })
    this._walkerScripted = false
    const tan = this.curve.getTangentAt(this._camT)
    this._walker.placeAt(this.curve.getPointAt(this._camT), Math.atan2(tan.x, tan.z))
    this.scene.add(this._walker.object)
  }

  setAvatar(avatar) { this._walker?.setAvatar(avatar) }

  /* ---------- interaction ---------- */

  onPick(fn) { this._pickCb = fn }
  onHover(fn) { this._hoverCb = fn }
  onBridgePick(fn) { this._bridgeCb = fn }
  onDoorPick(fn) { this._doorCb = fn }
  onRealmEnter(fn) { this._realmEnterCb = fn }
  onRealmExit(fn) { this._realmExitCb = fn }

  setSelected(index) { this._selected = index }

  focusLevel(index, animate = true) {
    const safeIndex = THREE.MathUtils.clamp(index, 0, Math.max(this.N - 1, 0))
    this._focusIndex = safeIndex
    const t = this._tForIndex(safeIndex)
    if (animate) {
      gsap.to(this, { _targetCamT: t, duration: 0.9, ease: 'power3.inOut' })
    } else {
      this._camT = this._targetCamT = t
    }
  }

  moveRoad(delta) {
    if (this._realm || this._transitioning) return
    this._targetCamT = THREE.MathUtils.clamp(this._targetCamT + delta, 0.02, 0.999)
  }

  panHorizontal(delta) {
    if (this._realm || this._transitioning) return
    this._targetCameraPanX = THREE.MathUtils.clamp(this._targetCameraPanX + delta, -3.2, 3.2)
  }

  _setPointerFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  _onPointerMove(e) {
    this._setPointerFromEvent(e)
    if (this._dragging) {
      const dy = e.clientY - this._dragY
      const dx = e.clientX - this._dragX
      this._dragY = e.clientY
      this._dragX = e.clientX
      // Ignore tiny jitter so quick taps on touch devices still count as clicks.
      const MOVE_THRESHOLD = 4 // pixels
      if (Math.abs(dx) <= MOVE_THRESHOLD && Math.abs(dy) <= MOVE_THRESHOLD) return
      this._dragMoved = true
      if (this._transitioning) return
      if (this._realm) {
        // Inside a world: horizontal drag looks around
        this._realm.cam.targetAngle -= dx * 0.006
      } else {
        this._targetCamT = THREE.MathUtils.clamp(this._targetCamT - dy * 0.0016, 0.02, 0.999)
      }
    }
  }

  _onPointerDown(e) {
    this._setPointerFromEvent(e)
    this._dragging = true
    this._dragY = e.clientY
    this._dragX = e.clientX
    this._dragMoved = false
  }

  _onPointerUp() {
    if (this._dragging && !this._dragMoved && !this._transitioning) {
      if (this._hoveredDoor) {
        if (this._realm) this.exitRealm()
        else this._enterDoor(this._doors.find((d) => d.userData.def.id === this._hoveredDoor))
      } else if (this._bridgeHovered) {
        this._bridgeCb?.()
      } else if (this._hovered != null) {
        const g = this._buildings[this._hovered]
        if (g?.userData.unlocked) this._pickCb?.(this._hovered)
      }
    }
    this._dragging = false
  }

  _onWheel(e) {
    e.preventDefault()
    if (this._transitioning) return
    if (this._realm) {
      const c = this._realm.cam
      gsap.killTweensOf(c)
      c.radius = THREE.MathUtils.clamp(c.radius + e.deltaY * 0.01, 9, 30)
      return
    }
    this._targetCamT = THREE.MathUtils.clamp(this._targetCamT + e.deltaY * 0.0006, 0.02, 0.999)
  }

  _pick() {
    if (this._transitioning) return
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const targets = []
    const doors = this._realm ? [this._realm.exitDoor] : this._doors
    doors.forEach((d) => d.userData.pickTargets.forEach((m) => targets.push(m)))
    if (!this._realm) {
      this._buildings.forEach((g) => g.userData.pickTargets.forEach((m) => targets.push(m)))
      if (this._bridgeMesh) targets.push(this._bridgeMesh)
    }
    const hits = this.raycaster.intersectObjects(targets, false)
    const hit = hits[0]?.object
    const doorId = hit?.userData.doorId ?? null
    const isBridge = !!hit?.userData.isBridge
    const idx = hit && !isBridge && !doorId ? hit.userData.index : null
    this._setHover(idx, isBridge, doorId)
  }

  _setHover(idx, isBridge, doorId) {
    if (idx === this._hovered && isBridge === this._bridgeHovered && doorId === this._hoveredDoor) return
    if (idx !== this._hovered) this._hoverCb?.(idx)
    this._hovered = idx
    this._bridgeHovered = isBridge
    this._hoveredDoor = doorId
    const wantPointer = isBridge || doorId || (idx != null && this._buildings[idx]?.userData.unlocked)
    this.canvas.style.cursor = wantPointer ? 'pointer' : 'default'
  }

  /* ---------- theme ---------- */

  setTheme(themeId) {
    const c = QUEST_THEMES[themeId] || QUEST_THEMES.dark

    // Sky
    if (this._skyMat) {
      this._skyMat.uniforms.top.value.set(c.top)
      this._skyMat.uniforms.mid.value.set(c.mid)
      this._skyMat.uniforms.bot.value.set(c.bot)
    }

    // Fog + ground
    this.scene.fog.color.set(c.fog)
    if (this._groundMat) this._groundMat.color.set(c.ground)

    // Stars
    if (this.stars) this.stars.material.color.set(c.star)

    // Accent point lights
    if (this._pBlue) this._pBlue.color.set(c.light1)
    if (this._pPurple) this._pPurple.color.set(c.light2)

    // Road — regenerate texture with new rail/dash colors
    if (this._roadMat) {
      this._roadTex = null // clear cache
      const tex = this._roadTexture(c.rail, c.dash)
      this._roadMat.map = tex
      this._roadMat.emissiveMap = tex
      this._roadMat.needsUpdate = true
    }

    // Buildings
    this._buildings.forEach((g) => {      const stateHex = c.states[g.userData.state] ?? c.states.locked
      const col = new THREE.Color(stateHex)
      const unlocked = g.userData.unlocked
      g.children.forEach((child) => {
        switch (child.userData.role) {
          case 'body':
          case 'top': {
            const mat = child.material
            mat.color.set(col.clone().multiplyScalar(0.32))
            mat.emissive.set(col.clone().multiplyScalar(unlocked ? 0.5 : 0.12))
            mat.needsUpdate = true
            break
          }
          case 'edges':
            child.material.color.set(col.clone().multiplyScalar(unlocked ? 1.6 : 0.6))
            child.material.needsUpdate = true
            break
          case 'beacon':
            child.material.color.set(col.clone().multiplyScalar(2))
            child.material.needsUpdate = true
            break
        }
      })
    })
    // Bridge + water recolour
    if (this._bridgeGroup) {
      const accent = new THREE.Color(c.light1)
      // Water
      if (this._waterMesh) {
        this._waterMesh.material.emissive.set(accent.clone().multiplyScalar(0.22))
        this._waterMesh.material.needsUpdate = true
      }
      // Deck emissive
      this._bridgeGroup.traverse((o) => {
        if (!o.isMesh && !o.isLine) return
        const mat = o.material
        if (!mat) return
        if (o === this._bridgeMesh) {
          mat.emissive.set(accent)
          mat.needsUpdate = true
        } else if (mat.emissive) {
          mat.emissive.set(accent)
          mat.needsUpdate = true
        }
        if (mat.color && o.isLine) {
          mat.color.set(accent)
          mat.needsUpdate = true
        }
      })
      // Bridge lights
      if (this._bridgeLights) {
        this._bridgeLights.forEach((l) => l.color.set(accent))
      }
      // Regenerate sign with new accent color
      if (this._bridgeSignTex) {
        const hex = '#' + accent.getHexString()
        const signCanvas = document.createElement('canvas')
        signCanvas.width = 512; signCanvas.height = 128
        const ctx = signCanvas.getContext('2d')
        ctx.clearRect(0, 0, 512, 128)
        ctx.fillStyle = 'rgba(8,16,36,0.90)'
        ctx.beginPath(); ctx.roundRect(8, 8, 496, 112, 20); ctx.fill()
        ctx.strokeStyle = hex; ctx.shadowColor = hex; ctx.shadowBlur = 18
        ctx.lineWidth = 3; ctx.stroke()
        ctx.font = 'bold 52px Orbitron, "Noto Sans", monospace'
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'; ctx.shadowBlur = 24
        ctx.fillText(tr('world.stage2'), 256, 64, 480)
        this._bridgeSignTex.image = signCanvas
        this._bridgeSignTex.needsUpdate = true
      }
    }
  }

  /* ---------- loop ---------- */

  start() {
    if (!this._raf) this._loop()
  }

  _loop() {
    this._raf = requestAnimationFrame(this._loop)
    // getDelta() first: getElapsedTime() would reset the delta to ~0
    const dt = Math.min(0.05, this.clock.getDelta())
    const t = this.clock.elapsedTime

    // Inside a world behind a door: orbit its centre and skip the road entirely
    if (this._realm) {
      const realm = this._realm
      const c = realm.cam
      if (!this._dragging) c.targetAngle += dt * 0.05
      c.angle += (c.targetAngle - c.angle) * 0.06
      this.camera.position.set(
        Math.sin(c.angle) * c.radius,
        c.height + this.pointer.y * 0.6,
        Math.cos(c.angle) * c.radius,
      )
      this.camera.lookAt(0, 2.6, 0)
      this._walker.faceToward(this.camera.position.x, this.camera.position.z)
      this._walker.update(t, dt)
      realm.update?.(t, dt)
      realm.nodes.forEach((g, i) => { g.position.y = g.userData.basePos.y + Math.sin(t * 1.2 + i) * 0.12 })
      this._updateDoor(realm.exitDoor, t, this._hoveredDoor === RETURN_DOOR.id)
      this._pick()
      this._render(realm.scene)
      return
    }

    // ease camera along the road (vertical scroll = depth)
    this._camT += (this._targetCamT - this._camT) * 0.08
    this._cameraPanX += (this._targetCameraPanX - this._cameraPanX) * 0.12

    let look
    if (this._fly) {
      // Scripted flight through a door
      this.camera.position.copy(this._fly.pos)
      look = this._fly.look
    } else {
      const pose = this._mainCamPose(this._camT)
      // gentle pointer parallax + optional on-screen pan controls
      pose.pos.x += this.pointer.x * 1.2 + this._cameraPanX
      pose.pos.y += this.pointer.y * 0.6
      this.camera.position.lerp(pose.pos, 0.12)
      look = pose.look
    }
    this.camera.lookAt(look)
    this._lastLook.copy(look)

    // The character walks wherever the camera is heading along the road
    if (!this._walkerScripted) {
      this._walker.object.position.copy(this.curve.getPointAt(THREE.MathUtils.clamp(this._camT, 0, 0.999)))
    }
    this._walker.update(t, dt)

    // drifting accent lights track the camera
    this._pBlue.position.set(look.x - 6, 5, look.z + 2)
    this._pPurple.position.set(look.x + 6, 4, look.z - 6)

    // building idle + state animation
    this._buildings.forEach((g, i) => {
      const bob = Math.sin(t * 1.2 + i) * 0.12
      g.position.y = g.userData.basePos.y + bob
      if (g.userData.state === 'current') {
        const s = 1 + Math.sin(t * 3) * 0.04
        g.scale.setScalar(s)
        if (g.userData.beacon) g.userData.beacon.material.color.setHSL(0.13, 1, 0.5 + Math.sin(t * 4) * 0.2)
      }
      const hovered = i === this._hovered && g.userData.unlocked
      const target = hovered ? 1.12 : g.userData.state === 'current' ? 1.0 : 1.0
      if (g.userData.state !== 'current') g.scale.lerp(new THREE.Vector3(target, target, target), 0.15)
      if (g.userData.roofCoin) g.userData.roofCoin.rotation.z += dt * 2
    })

    // bitcoin transactions flowing along the road
    this._coins.forEach((coin) => {
      coin.userData.t += coin.userData.speed * dt * 6
      if (coin.userData.t > coin.userData.frontT) coin.userData.t = 0.05
      const tt = THREE.MathUtils.clamp(coin.userData.t, 0, 1)
      const p = this.curve.getPointAt(tt)
      coin.position.set(p.x, p.y + coin.userData.lift + Math.sin(t * 3 + coin.userData.lift) * 0.1, p.z)
      coin.rotation.y += dt * 4
    })

    this.stars.rotation.y = t * 0.01

    // Animate water shimmer, UV scroll, and bridge glow
    if (this._waterMesh) {
      this._waterMesh.material.emissiveIntensity = 0.65 + Math.sin(t * 0.7) * 0.35
    }
    if (this._waterTex) {
      this._waterTex.offset.x += dt * 0.055   // river flows sideways (perpendicular to road)
    }
    if (this._bridgeLights) {
      this._bridgeLights.forEach((l, i) => {
        l.intensity = 11 + Math.sin(t * 1.4 + i * Math.PI) * 4
      })
    }

    // Door plaza pulse + doors
    if (this._junctionDisc) {
      this._junctionDisc.material.emissiveIntensity = 0.3 + Math.sin(t * 1.8) * 0.15
    }
    if (this._junctionRing) {
      this._junctionRing.rotation.z = t * 0.6
      this._junctionRing.material.opacity = 0.6 + Math.sin(t * 2.4) * 0.25
    }
    this._doors.forEach((d) => this._updateDoor(d, t, this._hoveredDoor === d.userData.def.id))

    this._pick()
    this._render(this.scene)
  }

  _render(scene) {
    this.renderer.render(scene, this.camera)
    if (this._fadeMat.opacity > 0.001) {
      this.renderer.autoClear = false
      this.renderer.render(this._fadeScene, this._fadeCam)
      this.renderer.autoClear = true
    }
  }

  // Road camera for a given progress; near the end it turns to frame the doors.
  _mainCamPose(camT) {
    const look = this.curve.getPointAt(THREE.MathUtils.clamp(camT, 0, 0.999))
    const pos = this.curve.getPointAt(THREE.MathUtils.clamp(camT - 0.05, 0, 0.999))
    pos.y += this._camHeight
    look.y += 1.2
    if (this._doorCenter) {
      const k = THREE.MathUtils.smoothstep(camT, 0.94, 0.999)
      look.lerp(new THREE.Vector3(this._doorCenter.x, 2.8, this._doorCenter.z), k)
    }
    return { pos, look }
  }

  _onResize() {
    const w = window.innerWidth
    const h = window.innerHeight
    const aspect = w / h
    this._aspect = aspect
    this._isPortrait = aspect < 0.75
    this._sideOffset = this._isPortrait ? 3.0 : 4.6
    this._camHeight = this._isPortrait ? 6.6 : 5.4
    this.camera.fov = this._isPortrait ? 68 : 55
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  dispose() {
    if (this._raf) cancelAnimationFrame(this._raf)
    this._tl?.kill()
    if (this._fly) gsap.killTweensOf([this._fly.pos, this._fly.look])
    gsap.killTweensOf(this._walker.object.position)
    window.removeEventListener('resize', this._onResize)
    this.canvas.removeEventListener('pointermove', this._onPointerMove)
    this.canvas.removeEventListener('pointerdown', this._onPointerDown)
    window.removeEventListener('pointerup', this._onPointerUp)
    this.canvas.removeEventListener('wheel', this._onWheel)
    const scenes = [this.scene, this._fadeScene, ...Object.values(this._realms).map((r) => r.scene)]
    Object.values(this._realms).forEach((r) => gsap.killTweensOf(r.cam))
    scenes.forEach((scene) => scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.()
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => {
          m.map?.dispose?.()
          m.emissiveMap?.dispose?.()
          m.dispose?.()
        })
      }
    }))
    this.renderer.dispose()
  }
}
