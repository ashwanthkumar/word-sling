export class CollisionSystem {
  init() {
    this.collisionRadius = 1.2;
  }

  update() {
    if (this.game.state !== 'PLAYING') return;

    const ship = this.game.getSystem(
      this.game.systems.find(s => s.constructor.name === 'Ship')?.constructor
    );
    const spawner = this.game.systems.find(s => s.constructor.name === 'LetterSpawner');
    const audio = this.game.systems.find(s => s.constructor.name === 'AudioManager');
    const particles = this.game.systems.find(s => s.constructor.name === 'ParticleSystem');
    const hud = this.game.systems.find(s => s.constructor.name === 'HUD');

    if (!ship || !spawner) return;

    const shipPos = ship.getPosition();
    const word = this.game.currentWord;
    const nextIdx = this.game.nextLetterIndex;

    if (!word || nextIdx >= word.length) return;

    const letters = spawner.getLetters();

    for (let i = letters.length - 1; i >= 0; i--) {
      const letter = letters[i];
      if (!letter.alive) continue;

      const dx = shipPos.x - letter.mesh.position.x;
      const dy = shipPos.y - letter.mesh.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.collisionRadius) {
        if (letter.char === word[nextIdx]) {
          // Correct letter!
          this._collectCorrect(letter, spawner, audio, particles, hud, shipPos);
        } else {
          // Wrong letter
          this._hitWrong(letter, spawner, audio, particles, ship);
        }
      }
    }
  }

  _collectCorrect(letter, spawner, audio, particles, hud, shipPos) {
    const idx = this.game.nextLetterIndex;
    this.game.nextLetterIndex++;
    this.game.score += 10;

    if (audio) audio.playChime(idx);
    if (particles) particles.burstAt(shipPos.x, shipPos.y, 0x00ffaa, 8);
    if (hud) hud.fillBlank(idx, this.game.currentWord[idx]);

    spawner.removeLetter(letter);

    // Check if word is complete
    if (this.game.nextLetterIndex >= this.game.currentWord.length) {
      this.game.levelResults.push({
        word: this.game.currentWord,
        meaning: this.game.currentMeaning,
        wrongGrabs: this.game.wrongGrabs,
      });
      this.game.setState('WORD_COMPLETE');
    }
  }

  _hitWrong(letter, spawner, audio, particles, ship) {
    this.game.wrongGrabs++;
    this.game.score = Math.max(0, this.game.score - 5);

    if (audio) audio.playBuzz();
    if (particles) particles.burstAt(letter.mesh.position.x, letter.mesh.position.y, 0xff4466, 5);
    if (ship) ship.flashRed();

    // Screen shake via UI
    const uiLayer = document.getElementById('ui-layer');
    uiLayer.classList.add('shake');
    setTimeout(() => uiLayer.classList.remove('shake'), 100);

    spawner.removeLetter(letter);
  }
}
