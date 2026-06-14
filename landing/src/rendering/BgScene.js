import * as THREE from 'three'

/*
  BgScene — a lightweight Three.js backdrop for the landing page.
  Renders the frontend3 aesthetic: deep gradient sky dome + drifting starfield.
  No game logic — pure atmosphere.
*/
export class BgScene {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x04050a, 0.014)

    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 400)
    this.camera.position.set(0, 0, 1)

    this.clock = new THREE.Clock()
    this._raf = null
    this._pointer = new THREE.Vector2()

    this._buildSky()
    this._buildStars()
    this._buildShards()
    this._buildLights()

    this._onResize = this._onResize.bind(this)
    this._onPointer = this._onPointer.bind(this)
    this._loop = this._loop.bind(this)
    window.addEventListener('resize', this._onResize)
    window.addEventListener('pointermove', this._onPointer, { passive: true })
  }

  _buildSky() {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x080614) },
        midColor: { value: new THREE.Color(0x0d0822) },
        botColor: { value: new THREE.Color(0x040408) },
        uTime:    { value: 0 },
      },
      vertexShader: `
        varying vec3 vPos;
        void main(){
          vPos = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform vec3 topColor, midColor, botColor;
        uniform float uTime;
        void main(){
          float h = vPos.y * 0.5 + 0.5;
          vec3 col = mix(botColor, midColor, smoothstep(0.0, 0.5, h));
          col = mix(col, topColor, smoothstep(0.4, 1.0, h));
          // slow-drifting nebula band
          float band = sin(vPos.x * 2.8 + uTime * 0.09) * 0.5 + 0.5;
          col += vec3(0.03, 0.0, 0.06) * band * smoothstep(0.35, 0.65, h);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
    this._skyMat = mat
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(180, 32, 32), mat))
  }

  _buildStars() {
    const N = 2200
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const sizes = new Float32Array(N)
    const blueC  = new THREE.Color(0x7ad4ff)
    const purpleC = new THREE.Color(0xb07bff)
    const whiteC  = new THREE.Color(0xddeeff)

    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 120 + Math.random() * 40
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = r * Math.cos(phi)
      const pick = Math.random()
      const c = pick < 0.4 ? blueC : pick < 0.7 ? purpleC : whiteC
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b
      sizes[i] = 0.6 + Math.random() * 1.8
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const mat = new THREE.ShaderMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uTime;
        void main(){
          vColor = color;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float twinkle = 0.75 + 0.25 * sin(uTime * 2.3 + position.x * 0.7);
          gl_PointSize = size * twinkle * (280.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main(){
          float d = length(gl_PointCoord - 0.5) * 2.0;
          if(d > 1.0) discard;
          float a = 1.0 - smoothstep(0.3, 1.0, d);
          gl_FragColor = vec4(vColor, a);
        }
      `,
    })
    this._starMat = mat
    this._stars = new THREE.Points(geo, mat)
    this.scene.add(this._stars)
  }

  _buildShards() {
    // Slow-tumbling translucent glass shards for depth
    const SHARD_COUNT = 22
    this._shards = []
    for (let i = 0; i < SHARD_COUNT; i++) {
      const w = 2 + Math.random() * 5
      const h = 3 + Math.random() * 9
      const geo = new THREE.PlaneGeometry(w, h)
      const hue = Math.random() < 0.6 ? 0x1a3a5c : 0x2a1040
      const mat = new THREE.MeshBasicMaterial({
        color: hue,
        transparent: true,
        opacity: 0.04 + Math.random() * 0.07,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40,
        -10 - Math.random() * 50,
      )
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      )
      mesh.userData.rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.004,
      )
      this.scene.add(mesh)
      this._shards.push(mesh)
    }
  }

  _buildLights() {
    this.scene.add(new THREE.AmbientLight(0x1a1a2e, 1.0))
    const pBlue = new THREE.PointLight(0x2ad8ff, 60, 80)
    pBlue.position.set(-20, 12, -10)
    const pPurple = new THREE.PointLight(0x9945ff, 50, 70)
    pPurple.position.set(22, -8, -15)
    this.scene.add(pBlue, pPurple)
    this._pBlue = pBlue; this._pPurple = pPurple
  }

  start() { if (!this._raf) this._loop() }

  _loop() {
    this._raf = requestAnimationFrame(this._loop)
    const t = this.clock.getElapsedTime()

    // Update shader time
    this._skyMat.uniforms.uTime.value = t
    this._starMat.uniforms.uTime.value = t

    // Drift stars + camera parallax
    this._stars.rotation.y = t * 0.008
    this._stars.rotation.x = Math.sin(t * 0.007) * 0.04

    // Camera subtle pointer follow
    this.camera.position.x += (this._pointer.x * 1.5 - this.camera.position.x) * 0.03
    this.camera.position.y += (this._pointer.y * 0.8 - this.camera.position.y) * 0.03
    this.camera.lookAt(0, 0, -10)

    // Tumble shards
    this._shards.forEach((s) => {
      s.rotation.x += s.userData.rotSpeed.x
      s.rotation.y += s.userData.rotSpeed.y
      s.rotation.z += s.userData.rotSpeed.z
    })

    // Drift accent lights
    this._pBlue.position.x   = Math.sin(t * 0.4) * 25
    this._pBlue.position.y   = Math.cos(t * 0.3) * 15
    this._pPurple.position.x = Math.cos(t * 0.35) * 22
    this._pPurple.position.y = Math.sin(t * 0.28) * 12

    this.renderer.render(this.scene, this.camera)
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  _onPointer(e) {
    this._pointer.x = (e.clientX / window.innerWidth  - 0.5) * 2
    this._pointer.y = -(e.clientY / window.innerHeight - 0.5) * 2
  }

  dispose() {
    if (this._raf) cancelAnimationFrame(this._raf)
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('pointermove', this._onPointer)
    this.renderer.dispose()
  }
}
