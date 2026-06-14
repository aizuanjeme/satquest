import * as THREE from 'three'

/*
  LightingSystem — cinematic, low-key lighting rig.

  A dim ambient base so nothing is pure black, plus two coloured rim/point
  lights (electric blue + violet) that give floating objects glowing edges,
  and a soft directional key light for gentle form.
*/
export class LightingSystem {
  constructor(scene) {
    this.scene = scene
    this.group = new THREE.Group()

    this.ambient = new THREE.AmbientLight(0x223044, 0.55)

    this.key = new THREE.DirectionalLight(0xbfd4ff, 0.6)
    this.key.position.set(4, 8, 6)

    this.rimBlue = new THREE.PointLight(0x2ad8ff, 1.6, 60, 2)
    this.rimBlue.position.set(-7, 3, 4)

    this.rimPurple = new THREE.PointLight(0x9945ff, 1.4, 60, 2)
    this.rimPurple.position.set(7, -2, 3)

    this.gold = new THREE.PointLight(0xf7c948, 0.5, 40, 2)
    this.gold.position.set(0, -6, 5)

    this.group.add(this.ambient, this.key, this.rimBlue, this.rimPurple, this.gold)
    scene.add(this.group)
  }

  /** Subtle living motion so highlights drift across surfaces. */
  update(t) {
    this.rimBlue.position.x = Math.sin(t * 0.18) * 8
    this.rimBlue.position.y = Math.cos(t * 0.13) * 4 + 2
    this.rimPurple.position.x = Math.cos(t * 0.15) * 8
    this.rimPurple.position.y = Math.sin(t * 0.11) * 4
  }

  dispose() {
    this.scene.remove(this.group)
  }
}
