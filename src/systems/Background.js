import * as THREE from 'three';

export class Background {
  init() {
    this.starLayers = [];
    this._createStarField();
    this._createNebula();
  }

  _createStarField() {
    const layers = [
      { count: 200, size: 0.04, speed: 0.5, spread: 60, color: 0xffffff },
      { count: 100, size: 0.08, speed: 1.2, spread: 50, color: 0xaaccff },
      { count: 40, size: 0.15, speed: 2.5, spread: 40, color: 0xffeedd },
    ];

    layers.forEach(cfg => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(cfg.count * 3);
      for (let i = 0; i < cfg.count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * cfg.spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * cfg.spread;
        positions[i * 3 + 2] = -5 + Math.random() * -20;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        size: cfg.size,
        color: cfg.color,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geo, mat);
      this.game.scene.add(points);
      this.starLayers.push({ points, speed: cfg.speed, spread: cfg.spread });
    });
  }

  _createNebula() {
    // Simple colored fog-like planes for nebula effect
    const nebulaGeo = new THREE.PlaneGeometry(80, 80);
    const nebulaMat = new THREE.MeshBasicMaterial({
      color: 0x220044,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebula.position.set(5, 10, -15);
    nebula.rotation.z = 0.3;
    this.game.scene.add(nebula);

    const nebula2Geo = new THREE.PlaneGeometry(60, 60);
    const nebula2Mat = new THREE.MeshBasicMaterial({
      color: 0x001144,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const nebula2 = new THREE.Mesh(nebula2Geo, nebula2Mat);
    nebula2.position.set(-8, -5, -18);
    nebula2.rotation.z = -0.5;
    this.game.scene.add(nebula2);
  }

  update(dt) {
    if (this.game.state !== 'PLAYING' && this.game.state !== 'PRE_LAUNCH') return;

    const scrollSpeed = this.game.state === 'PLAYING' ? 1 : 0.3;

    this.starLayers.forEach(layer => {
      const positions = layer.points.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= layer.speed * scrollSpeed * dt;
        if (positions[i + 1] < -layer.spread / 2) {
          positions[i + 1] += layer.spread;
          positions[i] = (Math.random() - 0.5) * layer.spread;
        }
      }
      layer.points.geometry.attributes.position.needsUpdate = true;
    });
  }
}
