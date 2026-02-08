import { LetterObject, clearTextureCache } from '../entities/Letter.js';
import { PowerUpObject } from '../entities/PowerUp.js';
import { DIFFICULTY, getDecoyLetter } from '../config/difficulty.js';
import { PowerUpManager } from './PowerUpManager.js';

export class LetterSpawner {
  init() {
    this.letters = [];
    this.powerUps = [];
    this.spawnTimer = 0;
    this.correctSpawnTimer = 0;
  }

  reset() {
    this.letters.forEach(l => l.destroy(this.game.scene));
    this.letters = [];
    this.powerUps.forEach(p => p.destroy(this.game.scene));
    this.powerUps = [];
    this.spawnTimer = 0;
    this.correctSpawnTimer = 0;
    clearTextureCache();
  }

  update(dt) {
    if (this.game.state !== 'PLAYING') return;

    const difficulty = this.game.difficulty;
    const config = DIFFICULTY[difficulty];
    const bounds = this.game.getPlayBounds();
    const word = this.game.currentWord;
    const nextIdx = this.game.nextLetterIndex;

    if (!word) return;

    const pm = this.game.getSystem(PowerUpManager);
    const thunderActive = pm && pm.isThunderActive();

    // Thunder boost: faster rain, higher correct chance
    const rainSpeed = thunderActive ? config.rainSpeed * 1.5 : config.rainSpeed;
    const correctChance = thunderActive ? config.correctChance * 2 : config.correctChance;

    const [, maxDensity] = config.density;

    this.spawnTimer += dt;
    this.correctSpawnTimer += dt;

    // Guaranteed correct letter spawn on a timer
    if (this.correctSpawnTimer >= config.correctInterval && nextIdx < word.length) {
      this._spawn(word[nextIdx], bounds, rainSpeed, true, config.hintLevel);
      this.correctSpawnTimer = 0;
    }

    // Aggressive decoy spawning — fill the screen
    const spawnInterval = 0.15;
    if (this.spawnTimer >= spawnInterval && this.letters.length < maxDensity) {
      this.spawnTimer = 0;

      // Small chance for a correct letter in the general stream
      const isCorrect = Math.random() < correctChance && nextIdx < word.length;
      if (isCorrect) {
        this._spawn(word[nextIdx], bounds, rainSpeed, true, config.hintLevel);
        this.correctSpawnTimer = 0;
      } else {
        // Power-up spawn chance (max 1 on screen)
        if (this.powerUps.length === 0 && Math.random() < config.powerUpChance) {
          this._spawnPowerUp(bounds, rainSpeed);
        } else {
          const decoy = getDecoyLetter(word);
          this._spawn(decoy, bounds, rainSpeed, false, config.hintLevel);
        }
      }
    }

    // Update and cleanup letters
    for (let i = this.letters.length - 1; i >= 0; i--) {
      const letter = this.letters[i];
      letter.update(dt);

      if (letter.mesh.position.y < bounds.bottom - 2) {
        letter.destroy(this.game.scene);
        this.letters.splice(i, 1);
      }
    }

    // Update and cleanup power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.update(dt);

      if (pu.mesh.position.y < bounds.bottom - 2) {
        pu.destroy(this.game.scene);
        this.powerUps.splice(i, 1);
      }
    }
  }

  _spawn(char, bounds, baseSpeed, isNextNeeded, hintLevel) {
    const x = (Math.random() * 0.85 + 0.075) * (bounds.right - bounds.left) + bounds.left;
    const y = bounds.top + 1 + Math.random() * 2;
    const speed = (baseSpeed / 60) * 3 + Math.random() * 1.0;

    const letter = new LetterObject(char, x, y, speed, isNextNeeded, hintLevel);
    this.game.scene.add(letter.mesh);
    this.letters.push(letter);
  }

  _spawnPowerUp(bounds, baseSpeed) {
    const types = ['boost', 'shield', 'thunder'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = (Math.random() * 0.7 + 0.15) * (bounds.right - bounds.left) + bounds.left;
    const y = bounds.top + 1 + Math.random() * 2;
    const speed = (baseSpeed / 60) * 2.5;

    const pu = new PowerUpObject(type, x, y, speed);
    this.game.scene.add(pu.mesh);
    this.powerUps.push(pu);
  }

  getLetters() {
    return this.letters;
  }

  getPowerUps() {
    return this.powerUps;
  }

  removeLetter(letter) {
    const idx = this.letters.indexOf(letter);
    if (idx >= 0) {
      letter.destroy(this.game.scene);
      this.letters.splice(idx, 1);
    }
  }

  removePowerUp(pu) {
    const idx = this.powerUps.indexOf(pu);
    if (idx >= 0) {
      pu.destroy(this.game.scene);
      this.powerUps.splice(idx, 1);
    }
  }

  onStateChange(newState) {
    if (newState === 'PRE_LAUNCH' || newState === 'MENU' || newState === 'WORD_COMPLETE') {
      this.reset();
    }
  }
}
