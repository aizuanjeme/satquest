import * as THREE from 'three'
import gsap from 'gsap'

/*
  CameraController — smooth, cinematic camera moves.

  Wraps a PerspectiveCamera and exposes GSAP-eased transitions plus a gentle
  parallax that reacts to pointer position so the world feels alive even when
  idle.
*/
export class CameraController {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 200)
    this.camera.position.set(0, 0, 14)
    this.target = new THREE.Vector3(0, 0, 0)

    this._parallax = { x: 0, y: 0 }
    this._base = { x: 0, y: 0, z: 14 }
  }

  setAspect(aspect) {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  /** Pointer-driven parallax (values in -1..1). */
  setPointer(nx, ny) {
    this._parallax.x = nx
    this._parallax.y = ny
  }

  /** Cinematic move to a new resting position. */
  flyTo({ x = 0, y = 0, z = 14, duration = 1.4 } = {}) {
    this._base = { x, y, z }
    gsap.to(this.camera.position, {
      x, y, z, duration, ease: 'power3.inOut',
      onUpdate: () => this.camera.lookAt(this.target),
    })
  }

  update() {
    // Ease the camera toward base + parallax offset each frame.
    const px = this._base.x + this._parallax.x * 1.1
    const py = this._base.y + this._parallax.y * 0.7
    this.camera.position.x += (px - this.camera.position.x) * 0.05
    this.camera.position.y += (py - this.camera.position.y) * 0.05
    this.camera.lookAt(this.target)
  }
}
