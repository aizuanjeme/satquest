import * as THREE from 'three'
import gsap from 'gsap'

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
*/

const STATE_COLORS = {
  locked: new THREE.Color(0x3a4258),
  unlocked: new THREE.Color(0x2ad8ff),
  current: new THREE.Color(0xf7c948),
  done: new THREE.Color(0x2bd47a),
}

const QUEST_THEMES = {
  dark:   { top: 0x0b0a18, mid: 0x140a28, bot: 0x05070e, fog: 0x06070d, star: 0xbfd8ff, light1: 0x2ad8ff, light2: 0x9945ff, rail: '#2ad8ff', dash: '#f7c948', ground: 0x06080f, states: { locked: 0x3a4258, unlocked: 0x2ad8ff, current: 0xf7c948, done: 0x2bd47a } },
  light:  { top: 0x8898c8, mid: 0xa8b8e0, bot: 0xd0d8f0, fog: 0xb0c0e0, star: 0x4488cc, light1: 0x0077cc, light2: 0x5522cc, rail: '#0077cc', dash: '#5522cc', ground: 0xc0ccdf, states: { locked: 0x8899bb, unlocked: 0x0077cc, current: 0xee8800, done: 0x118833 } },
  market: { top: 0x020802, mid: 0x051005, bot: 0x030603, fog: 0x030803, star: 0x00ff41, light1: 0x00ff41, light2: 0xff1744, rail: '#00ff41', dash: '#ff1744', ground: 0x020502, states: { locked: 0x1a3320, unlocked: 0x00ff41, current: 0xff1744, done: 0x00cc33 } },
  bank:   { top: 0x04060e, mid: 0x0a1020, bot: 0x060810, fog: 0x04060e, star: 0xc8a84b, light1: 0xc8a84b, light2: 0x4a90d9, rail: '#c8a84b', dash: '#4a90d9', ground: 0x050709, states: { locked: 0x3a3a50, unlocked: 0xc8a84b, current: 0xffd700, done: 0x4a90d9 } },
  rainy:  { top: 0x060a12, mid: 0x0c1424, bot: 0x040810, fog: 0x06090f, star: 0x4fc3f7, light1: 0x4fc3f7, light2: 0x546e7a, rail: '#4fc3f7', dash: '#78909c', ground: 0x05070c, states: { locked: 0x3a4258, unlocked: 0x4fc3f7, current: 0x80deea, done: 0x26c6da } },
  disco:  { top: 0x0c0010, mid: 0x1a0028, bot: 0x080010, fog: 0x0c0018, star: 0xff00ff, light1: 0xff00ff, light2: 0x00ffff, rail: '#ff00ff', dash: '#ffff00', ground: 0x080010, states: { locked: 0x442244, unlocked: 0xff00ff, current: 0x00ffff, done: 0xffff00 } },
}

export class QuestWorld {
  constructor(canvas, { levels, unlockedUpTo = 0, isComplete = () => false, stage2Start = null } = {}) {
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

    // Start focused on the current (next playable) level.
    const startIdx = Math.min(this.unlockedUpTo, this.N - 1)
    this._camT = this._targetCamT = this._tForIndex(startIdx)

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
    const geo = new THREE.SphereGeometry(200, 32, 32)
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0x0b0a18) },
        mid: { value: new THREE.Color(0x140a28) },
        bot: { value: new THREE.Color(0x05070e) },
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
    this._skyMat = mat
    this.scene.add(new THREE.Mesh(geo, mat))
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
    ctx.font = 'bold 76px Orbitron, sans-serif'
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
    ctx.font = 'bold 52px Orbitron, monospace'
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'; ctx.shadowBlur = 24
    ctx.fillText('STAGE 2  \u203a', 256, 64)
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

  /* ---------- interaction ---------- */

  onPick(fn) { this._pickCb = fn }
  onHover(fn) { this._hoverCb = fn }
  onBridgePick(fn) { this._bridgeCb = fn }

  setSelected(index) { this._selected = index }

  focusLevel(index, animate = true) {
    const t = this._tForIndex(index)
    if (animate) {
      gsap.to(this, { _targetCamT: t, duration: 0.9, ease: 'power3.inOut' })
    } else {
      this._camT = this._targetCamT = t
    }
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
      this._dragY = e.clientY
      this._targetCamT = THREE.MathUtils.clamp(this._targetCamT - dy * 0.0016, 0.02, 0.98)
      this._dragMoved = true
    }
  }

  _onPointerDown(e) {
    this._setPointerFromEvent(e)
    this._dragging = true
    this._dragY = e.clientY
    this._dragMoved = false
  }

  _onPointerUp() {
    if (this._dragging && !this._dragMoved) {
      if (this._bridgeHovered) {
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
    this._targetCamT = THREE.MathUtils.clamp(this._targetCamT + e.deltaY * 0.0006, 0.02, 0.98)
  }

  _pick() {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const targets = []
    this._buildings.forEach((g) => g.userData.pickTargets.forEach((m) => targets.push(m)))
    if (this._bridgeMesh) targets.push(this._bridgeMesh)
    const hits = this.raycaster.intersectObjects(targets, false)
    const hit = hits[0]?.object
    const isBridge = !!hit?.userData.isBridge
    const idx = hit && !isBridge ? hit.userData.index : null
    if (idx !== this._hovered || isBridge !== this._bridgeHovered) {
      this._hovered = idx
      this._bridgeHovered = isBridge
      this._hoverCb?.(idx)
      const wantPointer = isBridge || (idx != null && this._buildings[idx]?.userData.unlocked)
      this.canvas.style.cursor = wantPointer ? 'pointer' : 'default'
    }
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
        ctx.font = 'bold 52px Orbitron, monospace'
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'; ctx.shadowBlur = 24
        ctx.fillText('STAGE 2  \u203a', 256, 64)
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
    const t = this.clock.getElapsedTime()
    const dt = Math.min(0.05, this.clock.getDelta())

    // ease camera along the road
    this._camT += (this._targetCamT - this._camT) * 0.08
    const look = this.curve.getPointAt(THREE.MathUtils.clamp(this._camT, 0, 1))
    const behind = this.curve.getPointAt(THREE.MathUtils.clamp(this._camT - 0.05, 0, 1))
    const camPos = behind.clone()
    camPos.y += this._camHeight
    // gentle pointer parallax
    camPos.x += this.pointer.x * 1.2
    camPos.y += this.pointer.y * 0.6
    this.camera.position.lerp(camPos, 0.12)
    this.camera.lookAt(look.x, look.y + 1.2, look.z)

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

    this._pick()
    this.renderer.render(this.scene, this.camera)
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
    window.removeEventListener('resize', this._onResize)
    this.canvas.removeEventListener('pointermove', this._onPointerMove)
    this.canvas.removeEventListener('pointerdown', this._onPointerDown)
    window.removeEventListener('pointerup', this._onPointerUp)
    this.canvas.removeEventListener('wheel', this._onWheel)
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.()
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material]
        mats.forEach((m) => {
          m.map?.dispose?.()
          m.emissiveMap?.dispose?.()
          m.dispose?.()
        })
      }
    })
    this.renderer.dispose()
  }
}
