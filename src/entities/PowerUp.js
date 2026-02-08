import * as THREE from 'three';

const TYPE_CONFIG = {
  boost:   { color: 0xff8800, label: '\u2191' },   // up arrow
  shield:  { color: 0x4488ff, label: '\u25cb' },   // circle outline
  thunder: { color: 0xffdd00, label: '\u26a1' },   // lightning bolt
};

function createPowerUpTexture(type) {
  const config = TYPE_CONFIG[type];
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Hexagonal background
  ctx.beginPath();
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const colorHex = '#' + config.color.toString(16).padStart(6, '0');
  ctx.fillStyle = colorHex + '44';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 4;
  ctx.fill();
  ctx.stroke();

  // Icon
  ctx.font = '700 52px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colorHex;
  ctx.fillText(config.label, cx, cy + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export class PowerUpObject {
  constructor(type, x, y, speed) {
    this.type = type;
    this.speed = speed;
    this.alive = true;
    this.collected = false;

    const config = TYPE_CONFIG[type];

    const texture = createPowerUpTexture(type);
    const geo = new THREE.PlaneGeometry(1.2, 1.2);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, 0);

    // Glow ring
    const ringGeo = new THREE.RingGeometry(0.65, 0.78, 6);
    const ringMat = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.glowRing = new THREE.Mesh(ringGeo, ringMat);
    this.mesh.add(this.glowRing);
  }

  update(dt) {
    if (!this.alive) return;

    this.mesh.position.y -= this.speed * dt;

    // Pulsing glow
    const pulse = 0.3 + Math.sin(Date.now() * 0.006) * 0.3;
    this.glowRing.material.opacity = pulse;
    const s = 1 + Math.sin(Date.now() * 0.005) * 0.15;
    this.glowRing.scale.set(s, s, 1);
  }

  destroy(scene) {
    this.alive = false;
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    if (this.glowRing) {
      this.glowRing.geometry.dispose();
      this.glowRing.material.dispose();
    }
  }
}
