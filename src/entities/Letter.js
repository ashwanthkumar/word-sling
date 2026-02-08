import * as THREE from 'three';

// Shared letter textures cache
const textureCache = new Map();

// Monospace font for letter tiles — JetBrains Mono for crisp readability
const FONT = '700 52px "JetBrains Mono", "Noto Sans Mono", "Courier New", monospace';

function createLetterTexture(char, isNextNeeded, hintLevel) {
  // Only cache correct/needed letters (small set), decoys are too numerous
  const cacheKey = isNextNeeded ? `${char}_${isNextNeeded}_${hintLevel}` : null;
  if (cacheKey && textureCache.has(cacheKey)) return textureCache.get(cacheKey);

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

  if (isNextNeeded && hintLevel === 'strong') {
    ctx.fillStyle = 'rgba(0, 200, 100, 0.4)';
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 4;
  } else if (isNextNeeded && hintLevel === 'subtle') {
    ctx.fillStyle = 'rgba(0, 150, 80, 0.2)';
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.5)';
    ctx.lineWidth = 2;
  } else {
    ctx.fillStyle = 'rgba(60, 70, 120, 0.2)';
    ctx.strokeStyle = 'rgba(100, 120, 180, 0.3)';
    ctx.lineWidth = 2;
  }
  ctx.fill();
  ctx.stroke();

  // Letter text
  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isNextNeeded && hintLevel !== 'none' ? '#ffffff' : 'rgba(180, 190, 220, 0.75)';
  ctx.fillText(char, cx, cy + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  if (cacheKey) textureCache.set(cacheKey, texture);
  return texture;
}

export function clearTextureCache() {
  textureCache.forEach(t => t.dispose());
  textureCache.clear();
}

export class LetterObject {
  constructor(char, x, y, speed, isNextNeeded, hintLevel) {
    this.char = char;
    this.speed = speed;
    this.alive = true;
    this.collected = false;

    const texture = createLetterTexture(char, isNextNeeded, hintLevel);
    const geo = new THREE.PlaneGeometry(1.1, 1.1);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, 0);

    // Glow ring for next-needed letters (strong hint)
    if (isNextNeeded && hintLevel === 'strong') {
      const ringGeo = new THREE.RingGeometry(0.6, 0.72, 6);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffaa,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      this.glowRing = new THREE.Mesh(ringGeo, ringMat);
      this.mesh.add(this.glowRing);
    }
  }

  update(dt) {
    if (!this.alive) return;

    // Fall downward
    this.mesh.position.y -= this.speed * dt;

    // Glow ring pulsing
    if (this.glowRing) {
      const pulse = 0.4 + Math.sin(Date.now() * 0.005) * 0.3;
      this.glowRing.material.opacity = pulse;
      const s = 1 + Math.sin(Date.now() * 0.004) * 0.1;
      this.glowRing.scale.set(s, s, 1);
    }
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
