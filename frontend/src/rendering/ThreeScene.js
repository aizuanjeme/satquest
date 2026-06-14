import * as THREE from 'three'
import { LightingSystem } from './LightingSystem'
import { CameraController } from './CameraController'

/*
  ThreeScene — the persistent immersive backdrop that lives behind the whole
  app. It renders:
    - a large gradient "sky" dome (deep black -> indigo) so it's never flat,
    - a drifting starfield / particle nebula in two colours,
    - slowly tumbling abstract glass shards for depth + parallax,
    - low fog for atmosphere.

  It exposes a tiny API (mount/resize/dispose + setMood) so React can drive it
  without re-creating the WebGL context on every screen change.
*/
export class ThreeScene {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x05060a, 0.022)

    this.cameraCtl = new CameraController(window.innerWidth / window.innerHeight)
    this.lights = new LightingSystem(this.scene)

    this.clock = new THREE.Clock()
    this._raf = null
    this._mood = 'idle'

    this._buildSky()
    this._buildNebula()
    this._buildShards()

    this._onResize = this._onResize.bind(this)
    this._onPointer = this._onPointer.bind(this)
    window.addEventListener('resize', this._onResize)
    window.addEventListener('pointermove', this._onPointer)

    this._loop = this._loop.bind(this)
  }

  /* ---- gradient sky dome (never flat colour) ---- */
  _buildSky() {
    const geo = new THREE.SphereGeometry(90, 32, 32)
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor:    { value: new THREE.Color(0x0a0a12) },
        midColor:    { value: new THREE.Color(0x130a26) },
        bottomColor: { value: new THREE.Color(0x05070d) },
        uTime:       { value: 0 },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform float uTime;
        void main() {
          float h = vPos.y * 0.5 + 0.5;
          vec3 col = mix(bottomColor, midColor, smoothstep(0.0, 0.55, h));
          col = mix(col, topColor, smoothstep(0.45, 1.0, h));
          // faint drifting glow band
          float band = 0.06 * sin(vPos.x * 3.0 + uTime * 0.1) * sin(vPos.y * 2.0);
          col += vec3(0.10, 0.18, 0.35) * band;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
    this.sky = new THREE.Mesh(geo, mat)
    this.scene.add(this.sky)
  }

  /* ---- particle nebula (two colour clouds) ---- */
  _makeStarTexture() {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const ctx = c.getContext('2d')
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.25, 'rgba(255,255,255,0.7)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(c)
    return tex
  }

  _cloud(count, color, spread, size) {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * spread
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread - 6
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({
      color,
      size,
      map: this._starTex || (this._starTex = this._makeStarTexture()),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.9,
    })
    return new THREE.Points(geo, mat)
  }

  _buildNebula() {
    this.nebula = new THREE.Group()
    this.starsWhite = this._cloud(900, 0xcfe4ff, 80, 0.18)
    this.starsBlue = this._cloud(400, 0x2ad8ff, 60, 0.42)
    this.starsPurple = this._cloud(350, 0x9945ff, 55, 0.5)
    this.nebula.add(this.starsWhite, this.starsBlue, this.starsPurple)
    this.scene.add(this.nebula)
  }

  /* ---- abstract floating glass shards for depth ---- */
  _buildShards() {
    this.shards = new THREE.Group()
    const geo = new THREE.IcosahedronGeometry(1, 0)
    for (let i = 0; i < 7; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: i % 2 ? 0x2ad8ff : 0x9945ff,
        emissive: i % 2 ? 0x0a3a55 : 0x2a0f55,
        emissiveIntensity: 0.7,
        metalness: 0.4,
        roughness: 0.2,
        transparent: true,
        opacity: 0.32,
        flatShading: true,
      })
      const m = new THREE.Mesh(geo, mat)
      const s = 0.6 + Math.random() * 1.6
      m.scale.setScalar(s)
      m.position.set(
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 16,
        -4 - Math.random() * 16,
      )
      m.userData.spin = {
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.2,
        floatPhase: Math.random() * Math.PI * 2,
        floatAmp: 0.4 + Math.random() * 0.8,
      }
      this.shards.add(m)
    }
    this.scene.add(this.shards)
  }

  /* ---- mood: subtly shift the vibe per screen ---- */
  setMood(mood) {
    this._mood = mood
    // Different resting camera framing per phase for cinematic variety.
    const moods = {
      idle:    { x: 0, y: 0, z: 14 },
      menu:    { x: 0, y: 0.4, z: 13 },
      map:     { x: 0, y: 0, z: 16 },
      playing: { x: 0, y: 0, z: 12 },
      reveal:  { x: 0, y: 0.6, z: 11 },
    }
    this.cameraCtl.flyTo(moods[mood] || moods.idle)
  }

  /* ---- theme: recolour the 3D scene per theme ---- */
  setTheme(themeId) {
    const SKY = {
      dark:   { top: 0x0a0a12, mid: 0x130a26, bot: 0x05070d, star1: 0x2ad8ff, star2: 0x9945ff, shard1: 0x2ad8ff, shard2: 0x9945ff },
      light:  { top: 0xb8c8f0, mid: 0xd0dcf8, bot: 0xe8eeff, star1: 0x0077cc, star2: 0x5522cc, shard1: 0x0077cc, shard2: 0x5522cc },
      market: { top: 0x020802, mid: 0x051005, bot: 0x030603, star1: 0x00ff41, star2: 0xff1744, shard1: 0x00ff41, shard2: 0xff1744 },
      bank:   { top: 0x04060e, mid: 0x0a1020, bot: 0x060810, star1: 0xc8a84b, star2: 0x4a90d9, shard1: 0xc8a84b, shard2: 0x4a90d9 },
      rainy:  { top: 0x060a12, mid: 0x0c1424, bot: 0x040810, star1: 0x4fc3f7, star2: 0x546e7a, shard1: 0x4fc3f7, shard2: 0x37474f },
      disco:  { top: 0x0c0010, mid: 0x1a0028, bot: 0x080010, star1: 0xff00ff, star2: 0x00ffff, shard1: 0xff00ff, shard2: 0xffff00 },
    }
    const c = SKY[themeId] || SKY.dark
    this.sky.material.uniforms.topColor.value.set(c.top)
    this.sky.material.uniforms.midColor.value.set(c.mid)
    this.sky.material.uniforms.bottomColor.value.set(c.bot)
    this.scene.fog.color.set(c.bot)
    this.starsBlue.material.color.set(c.star1)
    this.starsPurple.material.color.set(c.star2)
    this.shards.children.forEach((m, i) => {
      m.material.color.set(i % 2 ? c.shard1 : c.shard2)
      m.material.emissive.set(i % 2 ? c.shard1 : c.shard2)
    })
  }

  get camera() { return this.cameraCtl.camera }

  _onPointer(e) {
    const nx = (e.clientX / window.innerWidth) * 2 - 1
    const ny = -((e.clientY / window.innerHeight) * 2 - 1)
    this.cameraCtl.setPointer(nx, ny)
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight
    this.renderer.setSize(w, h)
    this.cameraCtl.setAspect(w / h)
  }

  start() {
    if (!this._raf) this._loop()
  }

  _loop() {
    this._raf = requestAnimationFrame(this._loop)
    const t = this.clock.getElapsedTime()

    this.sky.material.uniforms.uTime.value = t
    this.lights.update(t)
    this.cameraCtl.update()

    // Slow rotation of star clouds for drift.
    this.starsWhite.rotation.y = t * 0.01
    this.starsBlue.rotation.y = -t * 0.015
    this.starsPurple.rotation.x = t * 0.012

    this.shards.children.forEach((m) => {
      m.rotation.x += m.userData.spin.x * 0.01
      m.rotation.y += m.userData.spin.y * 0.01
      m.position.y += Math.sin(t * 0.4 + m.userData.spin.floatPhase) * 0.002 * m.userData.spin.floatAmp
    })

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this._raf)
    this._raf = null
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('pointermove', this._onPointer)
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose?.()
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => { m.map?.dispose?.(); m.dispose?.() })
      }
    })
    this.renderer.dispose()
  }
}
