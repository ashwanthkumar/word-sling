import * as THREE from 'three';
import { Ship } from '../entities/Ship.js';

export class ParticleSystem {
  init() {
    this.particles = [];

    // Engine trail particles
    this.trailParticles = [];
    this._initTrail();
  }

  _initTrail() {
    const geo = new THREE.SphereGeometry(0.06, 4, 3);
    this.trailMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
    });
    this.trailGeo = geo;
  }

  burstAt(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.08, 4, 3);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0.5);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;

      this.game.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
      });
    }
  }

  celebrationBurst(x, y) {
    const colors = [0x00ffaa, 0xffdd00, 0xff6644, 0x44aaff, 0xff44ff];
    for (let i = 0; i < 30; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const geo = new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 4, 3);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0.5);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;

      this.game.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 0.8 + Math.random() * 0.5,
      });
    }
  }

  powerUpBurst(x, y, color) {
    for (let i = 0; i < 15; i++) {
      const geo = new THREE.SphereGeometry(0.1, 4, 3);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0.5);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;

      this.game.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.6 + Math.random() * 0.3,
      });
    }
  }

  shieldBurst(x, y) {
    this.burstAt(x, y, 0x4488ff, 8);
  }

  update(dt) {
    // Update burst particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.game.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;

      const alpha = p.life / p.maxLife;
      p.mesh.material.opacity = alpha;
      p.mesh.scale.setScalar(alpha);
    }

    // Engine trail
    if (this.game.state === 'PLAYING') {
      const ship = this.game.getSystem(Ship);
      if (ship) {
        this._updateTrail(ship, dt);
      }
    }
  }

  _updateTrail(ship, dt) {
    // Spawn trail particle
    if (Math.random() < 0.6) {
      const mesh = new THREE.Mesh(this.trailGeo, this.trailMaterial.clone());
      const pos = ship.getPosition();
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.3,
        pos.y - 1.0,
        0
      );
      this.game.scene.add(mesh);
      this.trailParticles.push({
        mesh,
        life: 0.4 + Math.random() * 0.2,
        maxLife: 0.4 + Math.random() * 0.2,
      });
    }

    // Update trail
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.game.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.trailParticles.splice(i, 1);
        continue;
      }

      p.mesh.position.y -= 2 * dt;
      const alpha = p.life / p.maxLife;
      p.mesh.material.opacity = alpha;
      p.mesh.scale.setScalar(0.5 + alpha * 0.5);
    }
  }
}
