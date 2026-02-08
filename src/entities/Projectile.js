import * as THREE from 'three';

const GUN_COLORS = [
  0x00ffaa, // Pea Shooter - green
  0x44aaff, // Pulse Blaster - blue
  0x44aaff, // Twin Lasers - blue
  0xff8800, // Scatter Shot - orange
  0xff4466, // Homing Rockets - red
  0xffdd00, // Chain Lightning - yellow
  0xff44ff, // Nova Cannon - purple
];

export class Projectile {
  constructor(x, y, dirX, dirY, gunConfig, gunIndex, isChainProjectile = false) {
    this.alive = true;
    this.speed = gunConfig.speed;
    this.dirX = dirX;
    this.dirY = dirY;
    this.homing = gunConfig.homing && !isChainProjectile;
    this.chain = gunConfig.chain || 0;
    this.blast = gunConfig.blast || 0;
    this.isChainProjectile = isChainProjectile;
    this.target = null;
    this.life = 3.0; // max seconds alive

    const color = GUN_COLORS[gunIndex] || 0x00ffaa;

    const geo = new THREE.ConeGeometry(0.12, 0.4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, 0.5);

    // Rotate cone to point in travel direction
    const angle = Math.atan2(dirY, dirX) - Math.PI / 2;
    this.mesh.rotation.z = angle;

    this.color = color;
  }

  update(dt, decoyLetters) {
    if (!this.alive) return;

    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    // Homing: gently curve toward nearest decoy
    if (this.homing && decoyLetters && decoyLetters.length > 0) {
      let nearest = null;
      let nearestDist = Infinity;
      for (const letter of decoyLetters) {
        if (!letter.alive) continue;
        const dx = letter.mesh.position.x - this.mesh.position.x;
        const dy = letter.mesh.position.y - this.mesh.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = letter;
        }
      }
      if (nearest && nearestDist < 15) {
        const dx = nearest.mesh.position.x - this.mesh.position.x;
        const dy = nearest.mesh.position.y - this.mesh.position.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const targetDirX = dx / len;
        const targetDirY = dy / len;

        // Blend direction toward target
        const homingStrength = 3.0 * dt;
        this.dirX += (targetDirX - this.dirX) * homingStrength;
        this.dirY += (targetDirY - this.dirY) * homingStrength;
        const dirLen = Math.sqrt(this.dirX * this.dirX + this.dirY * this.dirY);
        this.dirX /= dirLen;
        this.dirY /= dirLen;

        // Update rotation
        const angle = Math.atan2(this.dirY, this.dirX) - Math.PI / 2;
        this.mesh.rotation.z = angle;
      }
    }

    this.mesh.position.x += this.dirX * this.speed * dt;
    this.mesh.position.y += this.dirY * this.speed * dt;
  }

  destroy(scene) {
    this.alive = false;
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
