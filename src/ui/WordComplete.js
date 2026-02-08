export class WordComplete {
  init() {
    this.el = null;
    this.timer = 0;
    this.waiting = false;
  }

  show(word, wrongGrabs, totalWordsCompleted, newGunName) {
    this.hide();
    const stars = wrongGrabs === 0 ? 3 : wrongGrabs <= 2 ? 2 : 1;
    const starStr = '\u2b50'.repeat(stars);

    const ui = document.getElementById('ui-layer');
    this.el = document.createElement('div');
    this.el.className = 'word-complete-overlay fade-in';
    this.el.innerHTML = `
      <div class="completed-word">${word}</div>
      <div class="star-rating">${starStr}</div>
      <div class="word-number">Word #${totalWordsCompleted}</div>
      ${newGunName ? `<div class="gun-upgrade-toast">NEW WEAPON: ${newGunName}!</div>` : ''}
    `;

    // Tap to skip
    this.el.addEventListener('click', () => {
      if (this.waiting) this._advance();
    });

    ui.appendChild(this.el);
    this.timer = 0;
    this.waiting = true;
  }

  _advance() {
    this.waiting = false;
    this.hide();
    this.game.setState('PRE_LAUNCH');
  }

  hide() {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }

  update(dt) {
    if (!this.waiting) return;
    this.timer += dt;
    if (this.timer >= 2.5) {
      this._advance();
    }
  }

  onStateChange(newState) {
    if (newState !== 'WORD_COMPLETE') {
      this.hide();
      this.waiting = false;
    }
  }
}
