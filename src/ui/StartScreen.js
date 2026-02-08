import { loadProgress } from '../utils.js';

export class StartScreen {
  init() {
    this.el = null;
    this._create();
  }

  _create() {
    const progress = loadProgress();
    const lastGrade = progress.settings.lastGrade || 3;
    this.game.grade = lastGrade;

    const ui = document.getElementById('ui-layer');
    this.el = document.createElement('div');
    this.el.className = 'start-screen fade-in';
    this.el.innerHTML = `
      <div class="game-title">WORD SLING</div>
      <div class="game-subtitle">COLLECT WORDS IN SPACE</div>
      <div class="grade-label">SELECT GRADE</div>
      <div class="grade-grid">
        ${[1,2,3,4,5,6].map(g => `
          <button class="grade-btn ${g === lastGrade ? 'selected' : ''}" data-grade="${g}">
            ${g}${g === 1 ? 'st' : g === 2 ? 'nd' : g === 3 ? 'rd' : 'th'}
          </button>
        `).join('')}
      </div>
      <button class="launch-btn">LAUNCH</button>
      <div class="stats-line">${progress.settings.totalWordsLearned} words learned</div>
    `;

    // Grade selection
    this.el.querySelectorAll('.grade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.el.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.game.grade = parseInt(btn.dataset.grade);
      });
    });

    // Launch
    this.el.querySelector('.launch-btn').addEventListener('click', () => {
      this.hide();
      this.game.setState('PRE_LAUNCH');
    });

    ui.appendChild(this.el);
  }

  show() {
    if (this.el) {
      this.el.remove();
    }
    this._create();
  }

  hide() {
    if (this.el) {
      this.el.classList.add('fade-out');
      setTimeout(() => {
        if (this.el) this.el.remove();
        this.el = null;
      }, 300);
    }
  }

  onStateChange(newState) {
    if (newState === 'MENU') {
      this.show();
    }
  }

  update() {}
}
