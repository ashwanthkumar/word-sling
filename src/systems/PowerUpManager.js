import { BOOST_CONFIG } from '../config/guns.js';

export class PowerUpManager {
  init() {
    this.boostActive = false;
    this.boostTimer = 0;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.thunderActive = false;
    this.thunderTimer = 0;
  }

  activateBoost() {
    this.boostActive = true;
    this.boostTimer = BOOST_CONFIG.duration;
  }

  activateShield() {
    this.shieldActive = true;
    this.shieldTimer = 5;
  }

  activateThunder() {
    this.thunderActive = true;
    this.thunderTimer = 3;
  }

  isBoostActive() {
    return this.boostActive;
  }

  isShieldActive() {
    return this.shieldActive;
  }

  isThunderActive() {
    return this.thunderActive;
  }

  reset() {
    this.boostActive = false;
    this.boostTimer = 0;
    this.shieldActive = false;
    this.shieldTimer = 0;
    this.thunderActive = false;
    this.thunderTimer = 0;
  }

  update(dt) {
    if (this.boostActive) {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) {
        this.boostActive = false;
        this.boostTimer = 0;
      }
    }
    if (this.shieldActive) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        this.shieldTimer = 0;
      }
    }
    if (this.thunderActive) {
      this.thunderTimer -= dt;
      if (this.thunderTimer <= 0) {
        this.thunderActive = false;
        this.thunderTimer = 0;
      }
    }
  }

  onStateChange(newState) {
    if (newState === 'PRE_LAUNCH' || newState === 'MENU') {
      this.reset();
    }
  }
}
