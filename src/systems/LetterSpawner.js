import { LetterObject, clearTextureCache } from '../entities/Letter.js';
import { DIFFICULTY, getDecoyLetter } from '../config/difficulty.js';

export class LetterSpawner {
  init() {
    this.letters = [];
    this.spawnTimer = 0;
    this.correctSpawnTimer = 0;
  }

  reset() {
    this.letters.forEach(l => l.destroy(this.game.scene));
    this.letters = [];
    this.spawnTimer = 0;
    this.correctSpawnTimer = 0;
    clearTextureCache();
  }

  update(dt) {
    if (this.game.state !== 'PLAYING') return;

    const grade = this.game.grade;
    const config = DIFFICULTY[grade];
    const bounds = this.game.getPlayBounds();
    const word = this.game.currentWord;
    const nextIdx = this.game.nextLetterIndex;

    if (!word) return;

    // Spawn interval based on density
    const [minDensity, maxDensity] = config.density;
    const targetCount = Math.floor((minDensity + maxDensity) / 2);
    const spawnInterval = 1.0 / (targetCount * 0.15);

    this.spawnTimer += dt;
    this.correctSpawnTimer += dt;

    // Ensure the next correct letter appears every 2-3 seconds
    if (this.correctSpawnTimer >= 2.0 && nextIdx < word.length) {
      this._spawn(word[nextIdx], bounds, config.rainSpeed, true, config.hintLevel);
      this.correctSpawnTimer = 0;
    }

    // General spawning
    if (this.spawnTimer >= spawnInterval && this.letters.length < maxDensity) {
      this.spawnTimer = 0;

      const isCorrect = Math.random() < 0.35 && nextIdx < word.length;
      if (isCorrect) {
        this._spawn(word[nextIdx], bounds, config.rainSpeed, true, config.hintLevel);
        this.correctSpawnTimer = 0;
      } else {
        const decoy = getDecoyLetter(word, grade);
        this._spawn(decoy, bounds, config.rainSpeed, false, config.hintLevel);
      }
    }

    // Update and cleanup
    for (let i = this.letters.length - 1; i >= 0; i--) {
      const letter = this.letters[i];
      letter.update(dt);

      // Remove if below screen
      if (letter.mesh.position.y < bounds.bottom - 2) {
        letter.destroy(this.game.scene);
        this.letters.splice(i, 1);
      }
    }
  }

  _spawn(char, bounds, baseSpeed, isNextNeeded, hintLevel) {
    const x = (Math.random() * 0.8 + 0.1) * (bounds.right - bounds.left) + bounds.left;
    const y = bounds.top + 2;
    const speed = (baseSpeed / 60) * 3 + Math.random() * 0.5;

    const letter = new LetterObject(char, x, y, speed, isNextNeeded, hintLevel);
    this.game.scene.add(letter.mesh);
    this.letters.push(letter);
  }

  getLetters() {
    return this.letters;
  }

  removeLetter(letter) {
    const idx = this.letters.indexOf(letter);
    if (idx >= 0) {
      letter.destroy(this.game.scene);
      this.letters.splice(idx, 1);
    }
  }

  onStateChange(newState) {
    if (newState === 'PRE_LAUNCH' || newState === 'MENU' || newState === 'WORD_COMPLETE') {
      this.reset();
    }
  }
}
