export class HUD {
  init() {
    this.el = null;
    this.blanks = [];
  }

  show(word, wordIndex, totalWords) {
    this.hide();
    const ui = document.getElementById('ui-layer');
    this.el = document.createElement('div');
    this.el.className = 'hud fade-in';
    this.el.innerHTML = `
      <div class="hud-top">
        <span class="hud-word-count">WORD ${wordIndex + 1}/${totalWords}</span>
        <span class="hud-score">SCORE ${this.game.score}</span>
      </div>
      <div class="word-blanks">
        ${word.split('').map((_, i) => `<div class="letter-blank" data-index="${i}"></div>`).join('')}
      </div>
    `;
    ui.appendChild(this.el);
    this.blanks = this.el.querySelectorAll('.letter-blank');
  }

  fillBlank(index, letter) {
    if (this.blanks[index]) {
      this.blanks[index].textContent = letter;
      this.blanks[index].classList.add('filled');
    }
    this.updateScore();
  }

  updateScore() {
    if (this.el) {
      const scoreEl = this.el.querySelector('.hud-score');
      if (scoreEl) scoreEl.textContent = `SCORE ${this.game.score}`;
    }
  }

  hide() {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
    this.blanks = [];
  }

  onStateChange(newState) {
    if (newState === 'MENU' || newState === 'LEVEL_COMPLETE') {
      this.hide();
    }
  }

  update() {
    // Continuously update score display during gameplay
    if (this.game.state === 'PLAYING') {
      this.updateScore();
    }
  }
}
