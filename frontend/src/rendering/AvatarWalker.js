import * as THREE from 'three'

/*
  AvatarWalker — the player's little explorer on the quest map.

  A low-poly body (torso, swinging arms and legs, a backpack with a glowing
  ₿ plate) topped with the player's avatar as a round, always-facing-camera
  "bobblehead" portrait. The owner moves `object.position`; update() turns
  that movement into a walk cycle and faces the direction of travel.

  Public API:
    new AvatarWalker({ avatar, accent })
    .object                 — THREE.Group to add to a scene
    .setAvatar(avatar)      — { img } or { emoji }
    .placeAt(pos, yaw?)     — teleport without triggering a walk
    .faceToward(x, z)       — turn to look at a point (while idle)
    .update(t, dt)
*/

const LEG_R = 0.12, LEG_L = 0.5
const ARM_R = 0.09, ARM_L = 0.45
const HIP_Y = 0.82
const SHOULDER_Y = 1.6
const HEAD_Y = 2.3

export class AvatarWalker {
  constructor({ avatar, accent = 0x2ad8ff, coinTexture = null } = {}) {
    this.object = new THREE.Group()
    this._accent = new THREE.Color(accent)
    this._prev = new THREE.Vector3()
    this._phase = 0
    this._speed = 0
    this._targetYaw = 0

    this.body = new THREE.Group()
    this.object.add(this.body)
    this._buildBody(coinTexture)
    this._buildHead()
    this._buildGroundMarks()
    this.setAvatar(avatar)
  }

  _buildBody(coinTexture) {
    const accent = this._accent
    const suit = new THREE.MeshStandardMaterial({ color: 0x1a2238, emissive: accent, emissiveIntensity: 0.12, roughness: 0.55, metalness: 0.3 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x0d1220, roughness: 0.6, metalness: 0.3 })
    const glow = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.2, roughness: 0.3 })

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.45, 6, 14), suit)
    torso.position.y = HIP_Y + 0.42
    this.body.add(torso)

    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.035, 8, 28), glow)
    belt.rotation.x = Math.PI / 2
    belt.position.y = HIP_Y + 0.12
    this.body.add(belt)

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 10), dark)
    neck.position.y = 1.86
    this.body.add(neck)

    // Backpack on the back (-Z), visible from the following camera
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.2), dark)
    pack.position.set(0, HIP_Y + 0.5, -0.36)
    this.body.add(pack)
    const plate = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 24),
      coinTexture
        ? new THREE.MeshBasicMaterial({ map: coinTexture })
        : new THREE.MeshBasicMaterial({ color: 0xf7c948 }),
    )
    plate.position.set(0, HIP_Y + 0.52, -0.465)
    plate.rotation.y = Math.PI
    this.body.add(plate)

    const legGeo = new THREE.CapsuleGeometry(LEG_R, LEG_L, 4, 10)
    legGeo.translate(0, -(LEG_L / 2 + LEG_R), 0) // hang from the hip pivot
    const footGeo = new THREE.BoxGeometry(0.2, 0.12, 0.34)
    this.legs = [-1, 1].map((side) => {
      const pivot = new THREE.Group()
      pivot.position.set(side * 0.15, HIP_Y, 0)
      pivot.add(new THREE.Mesh(legGeo, dark))
      const foot = new THREE.Mesh(footGeo, glow)
      foot.position.set(0, -(LEG_L + LEG_R * 2) + 0.06, 0.06)
      pivot.add(foot)
      this.body.add(pivot)
      return pivot
    })

    const armGeo = new THREE.CapsuleGeometry(ARM_R, ARM_L, 4, 10)
    armGeo.translate(0, -(ARM_L / 2 + ARM_R), 0)
    this.arms = [-1, 1].map((side) => {
      const pivot = new THREE.Group()
      pivot.position.set(side * 0.4, SHOULDER_Y, 0)
      pivot.rotation.z = side * 0.12 // arms rest slightly away from the body
      pivot.add(new THREE.Mesh(armGeo, suit))
      this.body.add(pivot)
      return pivot
    })
  }

  _buildHead() {
    this._headCanvas = document.createElement('canvas')
    this._headCanvas.width = this._headCanvas.height = 256
    this._headTex = new THREE.CanvasTexture(this._headCanvas)
    this._headTex.colorSpace = THREE.SRGBColorSpace
    this.head = new THREE.Sprite(new THREE.SpriteMaterial({ map: this._headTex, transparent: true, depthWrite: false }))
    this.head.scale.set(0.95, 0.95, 1)
    this.head.position.y = HEAD_Y
    this.body.add(this.head)
  }

  _buildGroundMarks() {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 28),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.03
    this.object.add(shadow)

    this._ring = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.74, 40),
      new THREE.MeshBasicMaterial({ color: this._accent, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }),
    )
    this._ring.rotation.x = -Math.PI / 2
    this._ring.position.y = 0.04
    this.object.add(this._ring)
  }

  _drawHead(img, emoji) {
    const S = 256, R = 112
    const ctx = this._headCanvas.getContext('2d')
    const css = `#${this._accent.getHexString()}`
    ctx.clearRect(0, 0, S, S)
    ctx.save()
    ctx.beginPath(); ctx.arc(S / 2, S / 2, R, 0, Math.PI * 2); ctx.closePath()
    ctx.fillStyle = '#0d1220'; ctx.fill()
    ctx.clip()
    if (img) {
      // cover-fit the portrait into the circle
      const k = Math.max((R * 2) / img.width, (R * 2) / img.height)
      const w = img.width * k, h = img.height * k
      ctx.drawImage(img, S / 2 - w / 2, S / 2 - h / 2, w, h)
    } else {
      ctx.font = '120px sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(emoji || '🙂', S / 2, S / 2 + 8)
    }
    ctx.restore()
    ctx.beginPath(); ctx.arc(S / 2, S / 2, R, 0, Math.PI * 2)
    ctx.lineWidth = 10; ctx.strokeStyle = css; ctx.shadowColor = css; ctx.shadowBlur = 18
    ctx.stroke()
    this._headTex.needsUpdate = true
  }

  setAvatar(avatar) {
    this._avatarKey = avatar?.img || avatar?.emoji || null
    this._drawHead(null, avatar?.emoji)
    if (!avatar?.img) return
    const key = this._avatarKey
    const img = new Image()
    img.onload = () => { if (this._avatarKey === key) this._drawHead(img) }
    img.src = avatar.img
  }

  placeAt(pos, yaw) {
    this.object.position.copy(pos)
    this._prev.copy(pos)
    if (yaw != null) this.object.rotation.y = this._targetYaw = yaw
  }

  faceToward(x, z) {
    const p = this.object.position
    this._targetYaw = Math.atan2(x - p.x, z - p.z)
  }

  update(t, dt) {
    const o = this.object
    const dx = o.position.x - this._prev.x
    const dz = o.position.z - this._prev.z
    const dist = Math.hypot(dx, dz)
    this._prev.copy(o.position)

    const speed = dt > 0 ? dist / dt : 0
    this._speed += (Math.min(speed, 8) - this._speed) * 0.15
    const walk = THREE.MathUtils.clamp(this._speed / 2.5, 0, 1)
    this._phase += Math.min(dist, 0.25) * 2.6
    if (dist > 0.002) this._targetYaw = Math.atan2(dx, dz)

    // turn toward the target along the shortest arc
    let d = this._targetYaw - o.rotation.y
    d = Math.atan2(Math.sin(d), Math.cos(d))
    o.rotation.y += d * 0.18

    const s = Math.sin(this._phase)
    this.legs[0].rotation.x = s * 0.7 * walk
    this.legs[1].rotation.x = -s * 0.7 * walk
    this.arms[0].rotation.x = -s * 0.6 * walk
    this.arms[1].rotation.x = s * 0.6 * walk

    // step bounce while walking, gentle breathing while idle
    this.body.position.y = Math.abs(Math.cos(this._phase)) * 0.08 * walk + Math.sin(t * 2) * 0.025 * (1 - walk)
    this.head.material.rotation = Math.sin(this._phase) * 0.06 * walk

    this._ring.material.opacity = 0.45 + Math.sin(t * 3) * 0.25
    this._ring.scale.setScalar(1 + Math.sin(t * 3) * 0.06)
  }
}
