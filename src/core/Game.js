import * as THREE from 'three';

export class Game {
  constructor(container) {
    this.container = container;
    this.systems = [];
    this.state = 'MENU';
    this.clock = new THREE.Clock();
    this.paused = false;

    // Game data
    this.grade = 3;
    this.score = 0;
    this.currentWordIndex = 0;
    this.wordsPerLevel = 5;
    this.currentWord = null;
    this.nextLetterIndex = 0;
    this.wrongGrabs = 0;
    this.levelWords = [];
    this.levelResults = [];

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._startLoop();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0a0a1a);
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => this._onResize());
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.008);

    // Ambient light
    const ambient = new THREE.AmbientLight(0x334466, 0.6);
    this.scene.add(ambient);

    // Directional light from above-front
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(0, 10, 5);
    this.scene.add(dir);

    // Point light for the ship area
    this.shipLight = new THREE.PointLight(0x00ffaa, 0.5, 30);
    this.shipLight.position.set(0, -5, 3);
    this.scene.add(this.shipLight);
  }

  _initCamera() {
    // Use a perspective camera looking down the play field
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 200);
    // Camera positioned behind and above, looking forward-down
    this.camera.position.set(0, -2, 18);
    this.camera.lookAt(0, 5, 0);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.systems.forEach(s => s.onResize && s.onResize(w, h));
  }

  addSystem(system) {
    system.game = this;
    this.systems.push(system);
    if (system.init) system.init();
    return system;
  }

  getSystem(type) {
    return this.systems.find(s => s instanceof type);
  }

  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.systems.forEach(s => s.onStateChange && s.onStateChange(newState, oldState));
  }

  // Screen-space boundaries for the play field
  getPlayBounds() {
    // Approximate world-space bounds visible at z=0 plane
    const vFov = this.camera.fov * Math.PI / 180;
    const dist = this.camera.position.z;
    const halfH = Math.tan(vFov / 2) * dist;
    const halfW = halfH * this.camera.aspect;
    return { left: -halfW, right: halfW, top: halfH, bottom: -halfH };
  }

  _startLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      if (this.paused) return;

      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.systems.forEach(s => s.update && s.update(dt));
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}
