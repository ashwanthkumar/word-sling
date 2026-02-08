export class LevelComplete {
  init() {
    this.el = null;
  }

  show() {
    this.hide();
    const results = this.game.levelResults;
    const totalStars = results.reduce((sum, r) => {
      return sum + (r.wrongGrabs === 0 ? 3 : r.wrongGrabs <= 2 ? 2 : 1);
    }, 0);
    const avgStars = Math.round(totalStars / results.length);
    const overallStarStr = '\u2b50'.repeat(avgStars);

    const ui = document.getElementById('ui-layer');
    this.el = document.createElement('div');
    this.el.className = 'level-complete fade-in';
    this.el.innerHTML = `
      <h1>LEVEL COMPLETE!</h1>
      <div class="overall-stars">${overallStarStr}</div>
      <div class="word-results">
        ${results.map(r => {
          const s = r.wrongGrabs === 0 ? 3 : r.wrongGrabs <= 2 ? 2 : 1;
          return `
            <div class="word-result-row">
              <span class="word-text">${r.word}</span>
              <span class="stars">${'\u2b50'.repeat(s)}</span>
              <button class="replay-btn" data-word="${r.word}" data-meaning="${r.meaning}">&#x1f50a;</button>
            </div>
          `;
        }).join('')}
      </div>
      <div class="level-score">Score: ${this.game.score}</div>
      <div class="btn-group">
        <button class="primary-btn next-btn">NEXT LEVEL</button>
        <button class="home-btn">HOME</button>
      </div>
    `;

    // Replay buttons
    this.el.querySelectorAll('.replay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tts = this.game.systems.find(s => s.constructor.name === 'TTS');
        if (tts) {
          tts.speakWordAndMeaning(btn.dataset.word, btn.dataset.meaning);
        }
      });
    });

    // Next level
    this.el.querySelector('.next-btn').addEventListener('click', () => {
      this.hide();
      this.game.setState('PRE_LAUNCH');
    });

    // Home
    this.el.querySelector('.home-btn').addEventListener('click', () => {
      this.hide();
      this.game.setState('MENU');
    });

    ui.appendChild(this.el);
  }

  hide() {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }

  onStateChange(newState) {
    if (newState === 'LEVEL_COMPLETE') {
      this.show();
    } else {
      this.hide();
    }
  }

  update() {}
}
