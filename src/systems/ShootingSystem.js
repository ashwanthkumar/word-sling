import { Projectile } from '../entities/Projectile.js';
import { Ship } from '../entities/Ship.js';
import { LetterSpawner } from './LetterSpawner.js';
import { ParticleSystem } from './ParticleSystem.js';
import { PowerUpManager } from './PowerUpManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { getGunLevel } from '../utils.js';
import { GUN_LEVELS } from '../config/guns.js';
import { BOOST_CONFIG } from '../config/guns.js';

export class ShootingSystem {
  init() {
    this.projectiles = [];
    this.cooldownTimer = 0;
    this.isFiring = false;
  }

  shoot() {
    if (this.cooldownTimer > 0) return;
    if (this.game.state !== 'PLAYING') return;

    const ship = this.game.getSystem(Ship);
    const spawner = this.game.getSystem(LetterSpawner);
    const pm = this.game.getSystem(PowerUpManager);
    const audio = this.game.getSystem(AudioManager);

    if (!ship || !spawner) return;

    const gun = getGunLevel(this.game.totalWordsCompleted);
    const gunIndex = GUN_LEVELS.indexOf(gun);
    const boostActive = pm && pm.isBoostActive();

    const cooldown = boostActive ? gun.cooldown * BOOST_CONFIG.cooldownMultiplier : gun.cooldown;
    this.cooldownTimer = cooldown;

    const shipPos = ship.getPosition();
    const numProjectiles = gun.projectiles + (boostActive ? BOOST_CONFIG.extraProjectiles : 0);
    const speed = boostActive ? gun.speed * BOOST_CONFIG.speedMultiplier : gun.speed;

    // Find decoys in forward cone (60° above ship)
    const letters = spawner.getLetters();
    const word = this.game.currentWord || '';
    const nextIdx = this.game.nextLetterIndex;
    const decoys = letters.filter(l => {
      if (!l.alive) return false;
      // Only target decoys (letters not in the word, or not the next needed)
      if (l.char === word[nextIdx]) return false;
      if (word.includes(l.char)) return false;
      // Must be above ship
      if (l.mesh.position.y <= shipPos.y) return false;
      return true;
    });

    for (let i = 0; i < numProjectiles; i++) {
      let dirX = 0;
      let dirY = 1; // default: straight up

      // Apply spread
      if (numProjectiles > 1 && gun.spread > 0) {
        const spreadAngle = (i / (numProjectiles - 1) - 0.5) * gun.spread;
        dirX = Math.sin(spreadAngle);
        dirY = Math.cos(spreadAngle);
      }

      const gunWithSpeed = { ...gun, speed };
      const proj = new Projectile(shipPos.x, shipPos.y + 0.8, dirX, dirY, gunWithSpeed, gunIndex);
      this.game.scene.add(proj.mesh);
      this.projectiles.push(proj);
    }

    if (audio) audio.playShoot(gunIndex);
  }

  update(dt) {
    if (this.game.state !== 'PLAYING') return;

    // Tick cooldown
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }

    // Auto-fire while ship is firing
    if (this.isFiring) {
      this.shoot();
    }

    const spawner = this.game.getSystem(LetterSpawner);
    const particles = this.game.getSystem(ParticleSystem);
    const bounds = this.game.getPlayBounds();
    const word = this.game.currentWord || '';
    const nextIdx = this.game.nextLetterIndex;

    // Get decoys for homing
    const letters = spawner ? spawner.getLetters() : [];
    const decoys = letters.filter(l => {
      if (!l.alive) return false;
      if (l.char === word[nextIdx]) return false;
      if (word.includes(l.char)) return false;
      return true;
    });

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt, decoys);

      // Out of bounds check
      if (!proj.alive ||
          proj.mesh.position.y > bounds.top + 3 ||
          proj.mesh.position.y < bounds.bottom - 3 ||
          proj.mesh.position.x > bounds.right + 3 ||
          proj.mesh.position.x < bounds.left - 3) {
        proj.destroy(this.game.scene);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Collision with decoy letters
      if (spawner) {
        for (let j = letters.length - 1; j >= 0; j--) {
          const letter = letters[j];
          if (!letter.alive) continue;
          // Don't shoot correct next-needed letters or in-word letters
          if (letter.char === word[nextIdx]) continue;
          if (word.includes(letter.char)) continue;

          const dx = proj.mesh.position.x - letter.mesh.position.x;
          const dy = proj.mesh.position.y - letter.mesh.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 0.8) {
            // Hit!
            const hx = letter.mesh.position.x;
            const hy = letter.mesh.position.y;

            // Blast radius
            if (proj.blast > 0) {
              this._blastRadius(hx, hy, proj.blast, spawner, particles, word, nextIdx);
            }

            // Chain lightning
            if (proj.chain > 0 && !proj.isChainProjectile) {
              this._chainToNearby(hx, hy, proj, spawner, word, nextIdx);
            }

            if (particles) particles.burstAt(hx, hy, proj.color, 5);
            this.game.score += 2;

            spawner.removeLetter(letter);
            proj.destroy(this.game.scene);
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  _blastRadius(x, y, radius, spawner, particles, word, nextIdx) {
    const letters = spawner.getLetters();
    for (let i = letters.length - 1; i >= 0; i--) {
      const l = letters[i];
      if (!l.alive) continue;
      if (l.char === word[nextIdx]) continue;
      if (word.includes(l.char)) continue;

      const dx = x - l.mesh.position.x;
      const dy = y - l.mesh.position.y;
      if (Math.sqrt(dx * dx + dy * dy) < radius) {
        if (particles) particles.burstAt(l.mesh.position.x, l.mesh.position.y, 0xff44ff, 3);
        this.game.score += 2;
        spawner.removeLetter(l);
      }
    }
  }

  _chainToNearby(x, y, sourceProj, spawner, word, nextIdx) {
    const letters = spawner.getLetters();
    let nearest = null;
    let nearestDist = Infinity;

    for (const l of letters) {
      if (!l.alive) continue;
      if (l.char === word[nextIdx]) continue;
      if (word.includes(l.char)) continue;

      const dx = x - l.mesh.position.x;
      const dy = y - l.mesh.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5 && dist > 0.5 && dist < nearestDist) {
        nearestDist = dist;
        nearest = l;
      }
    }

    if (nearest) {
      const dx = nearest.mesh.position.x - x;
      const dy = nearest.mesh.position.y - y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const gun = getGunLevel(this.game.totalWordsCompleted);
      const gunIndex = GUN_LEVELS.indexOf(gun);
      const chainProj = new Projectile(x, y, dx / len, dy / len, gun, gunIndex, true);
      this.game.scene.add(chainProj.mesh);
      this.projectiles.push(chainProj);
    }
  }

  reset() {
    this.projectiles.forEach(p => p.destroy(this.game.scene));
    this.projectiles = [];
    this.cooldownTimer = 0;
    this.isFiring = false;
  }

  onStateChange(newState) {
    if (newState === 'PRE_LAUNCH' || newState === 'MENU' || newState === 'WORD_COMPLETE') {
      this.reset();
    }
  }
}
