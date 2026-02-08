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

    const [, maxDensity] = config.density;

    this.spawnTimer += dt;
    this.correctSpawnTimer += dt;

    // Guaranteed correct letter spawn on a timer
    if (this.correctSpawnTimer >= config.correctInterval && nextIdx < word.length) {
      this._spawn(word[nextIdx], bounds, config.rainSpeed, true, config.hintLevel);
      this.correctSpawnTimer = 0;
    }

    // Aggressive decoy spawning — fill the screen
    const spawnInterval = 0.15; // spawn a new letter roughly every 150ms
    if (this.spawnTimer >= spawnInterval && this.letters.length < maxDensity) {
      this.spawnTimer = 0;

      // Small chance for a correct letter in the general stream
      const isCorrect = Math.random() < config.correctChance && nextIdx < word.length;
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

      if (letter.mesh.position.y < bounds.bottom - 2) {
        letter.destroy(this.game.scene);
        this.letters.splice(i, 1);
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
