import { getGunLevel } from '../utils.js';
import { PowerUpManager } from '../systems/PowerUpManager.js';

export class HUD {
  init() {
    this.el = null;
    this.blanks = [];
    this.gunToastTimer = 0;
  }

  show(word, totalWordsCompleted) {
    this.hide();
    const gun = getGunLevel(totalWordsCompleted);

    const ui = document.getElementById('ui-layer');
    this.el = document.createElement('div');
    this.el.className = 'hud fade-in';
    this.el.innerHTML = `
      <div class="hud-top">
        <button class="quit-btn">&times;</button>
        <span class="hud-gun-name">${gun.name}</span>
        <span class="hud-score">SCORE ${this.game.score}</span>
      </div>
      <div class="hud-powerups"></div>
      <div class="word-blanks">
        ${word.split('').map((_, i) => `<div class="letter-blank" data-index="${i}"></div>`).join('')}
      </div>
    `;

    // Quit button
    this.el.querySelector('.quit-btn').addEventListener('click', () => {
      this.hide();
      this.game.setState('MENU');
    });

    ui.appendChild(this.el);
    this.blanks = this.el.querySelectorAll('.letter-blank');

    // Fade out gun name after 2s
    this.gunToastTimer = 2.0;
  }

  fillBlank(index, letter) {
    if (this.blanks[index]) {
      this.blanks[index].textContent = letter;
      this.blanks[index].classList.add('filled');
    }
    this.updateScore();
  }

  unfillBlank(index) {
    if (this.blanks[index]) {
      this.blanks[index].textContent = '';
      this.blanks[index].classList.remove('filled');
      this.blanks[index].classList.add('lost');
      setTimeout(() => {
        if (this.blanks[index]) this.blanks[index].classList.remove('lost');
      }, 300);
    }
    this.updateScore();
  }

  updateScore() {
    if (this.el) {
      const scoreEl = this.el.querySelector('.hud-score');
      if (scoreEl) scoreEl.textContent = `SCORE ${this.game.score}`;
    }
  }

  _updatePowerUpIndicators() {
    if (!this.el) return;
    const container = this.el.querySelector('.hud-powerups');
    if (!container) return;

    const pm = this.game.getSystem(PowerUpManager);
    if (!pm) { container.innerHTML = ''; return; }

    let html = '';
    if (pm.shieldActive) {
      const t = Math.ceil(pm.shieldTimer);
      html += `<span class="powerup-indicator shield-indicator">SHIELD ${t}s</span>`;
    }
    if (pm.boostActive) {
      const t = Math.ceil(pm.boostTimer);
      html += `<span class="powerup-indicator boost-indicator">BOOST ${t}s</span>`;
    }
    if (pm.thunderActive) {
      const t = Math.ceil(pm.thunderTimer);
      html += `<span class="powerup-indicator thunder-indicator">THUNDER ${t}s</span>`;
    }
    container.innerHTML = html;
  }

  hide() {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
    this.blanks = [];
  }

  onStateChange(newState) {
    if (newState === 'MENU') {
      this.hide();
    }
  }

  update(dt) {
    if (this.game.state === 'PLAYING') {
      this.updateScore();
      this._updatePowerUpIndicators();

      // Fade out gun name
      if (this.gunToastTimer > 0) {
        this.gunToastTimer -= dt;
        if (this.gunToastTimer <= 0 && this.el) {
          const gunEl = this.el.querySelector('.hud-gun-name');
          if (gunEl) gunEl.classList.add('faded');
        }
      }
    }
  }
}
