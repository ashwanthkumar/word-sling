import { Ship } from '../entities/Ship.js';
import { LetterSpawner } from './LetterSpawner.js';
import { ParticleSystem } from './ParticleSystem.js';
import { PowerUpManager } from './PowerUpManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { HUD } from '../ui/HUD.js';
import { loadProgress } from '../utils.js';

export class CollisionSystem {
  init() {
    this.collisionRadius = 1.2;
  }

  update() {
    if (this.game.state !== 'PLAYING') return;

    const ship = this.game.getSystem(Ship);
    const spawner = this.game.getSystem(LetterSpawner);

    if (!ship || !spawner) return;

    const shipPos = ship.getPosition();
    const word = this.game.currentWord;
    const nextIdx = this.game.nextLetterIndex;

    // Check letter collisions
    if (word && nextIdx < word.length) {
      const letters = spawner.getLetters();

      for (let i = letters.length - 1; i >= 0; i--) {
        const letter = letters[i];
        if (!letter.alive) continue;

        const dx = shipPos.x - letter.mesh.position.x;
        const dy = shipPos.y - letter.mesh.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.collisionRadius) {
          if (letter.char === word[nextIdx]) {
            this._collectCorrect(letter, spawner, shipPos);
          } else if (word.includes(letter.char)) {
            // Letter is in the word but not next needed — pass through
            continue;
          } else {
            this._hitWrong(letter, spawner, ship);
          }
        }
      }
    }

    // Check power-up collisions
    const powerUps = spawner.getPowerUps();
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const pu = powerUps[i];
      if (!pu.alive) continue;

      const dx = shipPos.x - pu.mesh.position.x;
      const dy = shipPos.y - pu.mesh.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.collisionRadius + 0.2) {
        this._collectPowerUp(pu, spawner, shipPos);
      }
    }
  }

  _collectCorrect(letter, spawner, shipPos) {
    const idx = this.game.nextLetterIndex;
    this.game.nextLetterIndex++;
    this.game.score += 10;

    const audio = this.game.getSystem(AudioManager);
    const particles = this.game.getSystem(ParticleSystem);
    const hud = this.game.getSystem(HUD);

    if (audio) audio.playChime(idx);
    if (particles) particles.burstAt(shipPos.x, shipPos.y, 0x00ffaa, 8);
    if (hud) hud.fillBlank(idx, this.game.currentWord[idx]);

    spawner.removeLetter(letter);

    if (this.game.nextLetterIndex >= this.game.currentWord.length) {
      this.game.setState('WORD_COMPLETE');
    }
  }

  _hitWrong(letter, spawner, ship) {
    const pm = this.game.getSystem(PowerUpManager);
    const audio = this.game.getSystem(AudioManager);
    const particles = this.game.getSystem(ParticleSystem);
    const hud = this.game.getSystem(HUD);

    // Shield absorbs the hit
    if (pm && pm.isShieldActive()) {
      if (audio) audio.playShieldAbsorb();
      if (particles) particles.shieldBurst(letter.mesh.position.x, letter.mesh.position.y);
      spawner.removeLetter(letter);
      return;
    }

    this.game.wrongGrabs++;
    this.game.score = Math.max(0, this.game.score - 5);

    if (audio) audio.playBuzz();
    if (particles) particles.burstAt(letter.mesh.position.x, letter.mesh.position.y, 0xff4466, 5);
    if (ship) ship.flashRed();
    if (navigator.vibrate && loadProgress().settings.vibration !== false) navigator.vibrate(100);

    // Lose one collected letter
    if (this.game.nextLetterIndex > 0) {
      this.game.nextLetterIndex--;
      if (hud) hud.unfillBlank(this.game.nextLetterIndex);
    }

    const uiLayer = document.getElementById('ui-layer');
    uiLayer.classList.add('shake');
    setTimeout(() => uiLayer.classList.remove('shake'), 100);

    spawner.removeLetter(letter);
  }

  _collectPowerUp(pu, spawner, shipPos) {
    const pm = this.game.getSystem(PowerUpManager);
    const audio = this.game.getSystem(AudioManager);
    const particles = this.game.getSystem(ParticleSystem);
    const ship = this.game.getSystem(Ship);

    if (audio) audio.playPowerUpCollect();
    if (particles) particles.powerUpBurst(shipPos.x, shipPos.y, pu.type === 'boost' ? 0xff8800 : pu.type === 'shield' ? 0x4488ff : 0xffdd00);

    if (pm) {
      switch (pu.type) {
        case 'boost':
          pm.activateBoost();
          if (ship) ship.setBoostGlow(true);
          break;
        case 'shield':
          pm.activateShield();
          if (ship) ship.setShieldGlow(true);
          break;
        case 'thunder':
          pm.activateThunder();
          break;
      }
    }

    spawner.removePowerUp(pu);
  }
}
