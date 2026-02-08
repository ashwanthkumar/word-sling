import * as THREE from 'three';

export class Ship {
  init() {
    this.x = 0;
    this.targetX = 0;
    this.tilt = 0;
    this.dragging = false;
    this.touchStartX = 0;
    this.shipStartX = 0;

    this._createShipMesh();
    this._createEngineGlow();
    this._setupInput();

    // Position ship in lower portion of view
    const bounds = this.game.getPlayBounds();
    this.y = bounds.bottom * 0.45;
    this.group.position.y = this.y;

    // Hide initially (shown during PRE_LAUNCH/PLAYING)
    this.group.visible = false;
  }

  onStateChange(newState) {
    this.group.visible = (newState === 'PRE_LAUNCH' || newState === 'PLAYING' || newState === 'WORD_COMPLETE');
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
    // Engine glow — point light + small glowing sphere
    const glowGeo = new THREE.SphereGeometry(0.25, 6, 4);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.8,
    });
    this.engineGlow = new THREE.Mesh(glowGeo, glowMat);
    this.engineGlow.position.y = -0.9;
    this.group.add(this.engineGlow);

    // Engine light
    this.engineLight = new THREE.PointLight(0xff6600, 0.6, 5);
    this.engineLight.position.y = -1;
    this.group.add(this.engineLight);
  }

  _setupInput() {
    const el = this.game.renderer.domElement;

    // Touch input
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.dragging = true;
      this.touchStartX = touch.clientX;
      this.shipStartX = this.targetX;
    }, { passive: false });

    el.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.dragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - this.touchStartX;
      // Convert pixel delta to world units
      const bounds = this.game.getPlayBounds();
      const worldWidth = bounds.right - bounds.left;
      const screenWidth = window.innerWidth;
      const worldDx = (dx / screenWidth) * worldWidth;
      this.targetX = this.shipStartX + worldDx;
      // Clamp
      this.targetX = Math.max(bounds.left + 1, Math.min(bounds.right - 1, this.targetX));
    }, { passive: false });

    el.addEventListener('touchend', () => {
      this.dragging = false;
    });

    // Mouse input for desktop
    el.addEventListener('mousedown', (e) => {
      this.dragging = true;
      this.touchStartX = e.clientX;
      this.shipStartX = this.targetX;
    });

    el.addEventListener('mousemove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.touchStartX;
      const bounds = this.game.getPlayBounds();
      const worldWidth = bounds.right - bounds.left;
      const screenWidth = window.innerWidth;
      const worldDx = (dx / screenWidth) * worldWidth;
      this.targetX = this.shipStartX + worldDx;
      this.targetX = Math.max(bounds.left + 1, Math.min(bounds.right - 1, this.targetX));
    });

    el.addEventListener('mouseup', () => {
      this.dragging = false;
    });
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

    // Update ship light position
    this.game.shipLight.position.x = this.x;
    this.game.shipLight.position.y = this.y;
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  onResize() {
    const bounds = this.game.getPlayBounds();
    this.y = bounds.bottom * 0.45;
    this.group.position.y = this.y;
  }
}
