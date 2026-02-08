import * as THREE from 'three';
import { ShootingSystem } from '../systems/ShootingSystem.js';
import { PowerUpManager } from '../systems/PowerUpManager.js';

export class Ship {
  init() {
    this.x = 0;
    this.targetX = 0;
    this.tilt = 0;
    this.dragging = false;
    this.touchStartX = 0;
    this.shipStartX = 0;
    this.isFiring = false;

    this._createShipMesh();
    this._createEngineGlow();
    this._createShieldGlow();
    this._createBoostGlow();
    this._setupInput();

    // Position ship in lower portion of view, z=1 so letters pass behind
    const bounds = this.game.getPlayBounds();
    this.y = bounds.bottom * 0.25;
    this.group.position.y = this.y;
    this.group.position.z = 1;

    // Hide initially (shown during PRE_LAUNCH/PLAYING)
    this.group.visible = false;
  }

  onStateChange(newState) {
    this.group.visible = (newState === 'PRE_LAUNCH' || newState === 'PLAYING' || newState === 'WORD_COMPLETE');
    if (newState !== 'PLAYING') {
      this.isFiring = false;
      this.dragging = false;
    }
  }

  _createShipMesh() {
    this.group = new THREE.Group();

    // Main body — low-poly cone/arrow shape
    const bodyGeo = new THREE.ConeGeometry(0.5, 1.8, 5);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0x00ddcc,
      emissive: 0x003333,
      flatShading: true,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.rotation.x = 0; // pointing up
    this.group.add(this.body);

    // Wings — two small triangles on each side
    const wingGeo = new THREE.BufferGeometry();
    const wingVerts = new Float32Array([
      0, -0.3, 0,
      -1.0, -0.8, 0,
      -0.1, -0.6, 0,
    ]);
    wingGeo.setAttribute('position', new THREE.BufferAttribute(wingVerts, 3));
    wingGeo.computeVertexNormals();
    const wingMat = new THREE.MeshPhongMaterial({
      color: 0x009988,
      emissive: 0x002222,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    this.group.add(leftWing);

    const rightWingGeo = new THREE.BufferGeometry();
    const rightWingVerts = new Float32Array([
      0, -0.3, 0,
      1.0, -0.8, 0,
      0.1, -0.6, 0,
    ]);
    rightWingGeo.setAttribute('position', new THREE.BufferAttribute(rightWingVerts, 3));
    rightWingGeo.computeVertexNormals();
    const rightWing = new THREE.Mesh(rightWingGeo, wingMat);
    this.group.add(rightWing);

    // Cockpit — small sphere
    const cockpitGeo = new THREE.SphereGeometry(0.2, 4, 3);
    const cockpitMat = new THREE.MeshPhongMaterial({
      color: 0x66ffdd,
      emissive: 0x33aa88,
      flatShading: true,
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.y = 0.3;
    this.group.add(cockpit);

    this.game.scene.add(this.group);
  }

  _createEngineGlow() {
    const glowGeo = new THREE.SphereGeometry(0.25, 6, 4);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.8,
    });
    this.engineGlow = new THREE.Mesh(glowGeo, glowMat);
    this.engineGlow.position.y = -0.9;
    this.group.add(this.engineGlow);

    this.engineLight = new THREE.PointLight(0xff6600, 0.6, 5);
    this.engineLight.position.y = -1;
    this.group.add(this.engineLight);
  }

  _createShieldGlow() {
    const geo = new THREE.SphereGeometry(1.0, 12, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    this.shieldSphere = new THREE.Mesh(geo, mat);
    this.group.add(this.shieldSphere);
  }

  _createBoostGlow() {
    const geo = new THREE.SphereGeometry(0.8, 8, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.0,
    });
    this.boostSphere = new THREE.Mesh(geo, mat);
    this.group.add(this.boostSphere);
  }

  setShieldGlow(active) {
    this.shieldSphere.material.opacity = active ? 0.15 : 0.0;
  }

  setBoostGlow(active) {
    this.boostSphere.material.opacity = active ? 0.12 : 0.0;
  }

  _setupInput() {
    const el = this.game.renderer.domElement;
    const isPlayable = () => this.game.state === 'PLAYING';

    // Touch input
    el.addEventListener('touchstart', (e) => {
      if (!isPlayable()) return;
      e.preventDefault();
      const touch = e.touches[0];
      this.dragging = true;
      this.isFiring = true;
      this.touchId = touch.identifier;
      this.touchStartX = touch.clientX;
      this.shipStartX = this.targetX;
      this._startAutoFire();
    }, { passive: false });

    el.addEventListener('touchmove', (e) => {
      if (!this.dragging) return;
      e.preventDefault();
      let touch = null;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === this.touchId) {
          touch = e.touches[i];
          break;
        }
      }
      if (!touch) return;
      const dx = touch.clientX - this.touchStartX;
      const bounds = this.game.getPlayBounds();
      const worldWidth = bounds.right - bounds.left;
      const screenWidth = window.innerWidth;
      const worldDx = (dx / screenWidth) * worldWidth;
      this.targetX = this.shipStartX + worldDx;
      this.targetX = Math.max(bounds.left + 1, Math.min(bounds.right - 1, this.targetX));
    }, { passive: false });

    el.addEventListener('touchend', () => {
      this.dragging = false;
      this.isFiring = false;
      this._stopAutoFire();
    });
    el.addEventListener('touchcancel', () => {
      this.dragging = false;
      this.isFiring = false;
      this._stopAutoFire();
    });

    // Mouse input for desktop
    el.addEventListener('mousedown', (e) => {
      if (!isPlayable()) return;
      this.dragging = true;
      this.isFiring = true;
      this.touchStartX = e.clientX;
      this.shipStartX = this.targetX;
      this._startAutoFire();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.touchStartX;
      const bounds = this.game.getPlayBounds();
      const worldWidth = bounds.right - bounds.left;
      const screenWidth = window.innerWidth;
      const worldDx = (dx / screenWidth) * worldWidth;
      this.targetX = this.shipStartX + worldDx;
      this.targetX = Math.max(bounds.left + 1, Math.min(bounds.right - 1, this.targetX));
    });

    window.addEventListener('mouseup', () => {
      this.dragging = false;
      this.isFiring = false;
      this._stopAutoFire();
    });
  }

  _startAutoFire() {
    const shooting = this.game.getSystem(ShootingSystem);
    if (shooting) {
      shooting.isFiring = true;
    }
  }

  _stopAutoFire() {
    const shooting = this.game.getSystem(ShootingSystem);
    if (shooting) {
      shooting.isFiring = false;
    }
  }

  flashRed() {
    this.body.material.emissive.set(0xff0000);
    setTimeout(() => {
      this.body.material.emissive.set(0x003333);
    }, 150);
  }

  flashWhite() {
    this.body.material.emissive.set(0xffffff);
    setTimeout(() => {
      this.body.material.emissive.set(0x003333);
    }, 100);
  }

  update(dt) {
    if (this.game.state !== 'PLAYING') return;

    // Lerp toward target
    this.x += (this.targetX - this.x) * 0.12;
    this.group.position.x = this.x;

    // Tilt based on movement
    const targetTilt = (this.targetX - this.x) * 0.15;
    this.tilt += (targetTilt - this.tilt) * 0.1;
    this.group.rotation.z = -this.tilt;

    // Engine glow pulsing
    const pulse = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
    this.engineGlow.material.opacity = pulse;
    this.engineLight.intensity = 0.4 + pulse * 0.3;

    // Shield glow pulsing
    const pm = this.game.getSystem(PowerUpManager);
    if (pm) {
      if (pm.isShieldActive()) {
        const sp = 0.1 + Math.sin(Date.now() * 0.005) * 0.08;
        this.shieldSphere.material.opacity = sp;
      } else {
        this.shieldSphere.material.opacity = 0;
      }
      if (pm.isBoostActive()) {
        const bp = 0.08 + Math.sin(Date.now() * 0.008) * 0.06;
        this.boostSphere.material.opacity = bp;
      } else {
        this.boostSphere.material.opacity = 0;
      }
    }

    // Update ship light position
    this.game.shipLight.position.x = this.x;
    this.game.shipLight.position.y = this.y;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  onResize() {
    const bounds = this.game.getPlayBounds();
    this.y = bounds.bottom * 0.25;
    this.group.position.y = this.y;
  }
}
