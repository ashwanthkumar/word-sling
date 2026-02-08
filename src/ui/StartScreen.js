import { loadProgress, saveProgress, getGunLevel, getEffectiveConfidence, getWordStatus } from '../utils.js';
import { WORD_LIST } from '../config/words.js';

export class StartScreen {
  init() {
    this.el = null;
    this._create();
  }

  _create() {
    const progress = loadProgress();
    const difficulty = progress.settings.difficulty || 'medium';
    this.game.difficulty = difficulty;

    const totalWords = progress.settings.totalWordsCompleted || 0;
    const gun = getGunLevel(totalWords);

    const ui = document.getElementById('ui-layer');
    this.el = document.createElement('div');
    this.el.className = 'start-screen fade-in';
    this.el.innerHTML = `
      <div class="game-title">WORD SLING</div>
      <div class="difficulty-label">SELECT DIFFICULTY</div>
      <div class="difficulty-grid">
        <button class="diff-btn ${difficulty === 'easy' ? 'selected' : ''}" data-diff="easy">EASY</button>
        <button class="diff-btn ${difficulty === 'medium' ? 'selected' : ''}" data-diff="medium">MEDIUM</button>
        <button class="diff-btn ${difficulty === 'hard' ? 'selected' : ''}" data-diff="hard">HARD</button>
      </div>
      <button class="launch-btn">LAUNCH</button>
      <div class="stats-line">Words Built: ${totalWords} &nbsp;&middot;&nbsp; ${gun.name}</div>
      <div class="start-btns-row">
        <button class="words-btn">WORDS</button>
        <button class="options-btn">OPTIONS</button>
        <button class="credits-btn">CREDITS</button>
      </div>
      <div class="game-author">Made with ❤️ at Chennai, India</div>
    `;

    // Difficulty selection
    this.el.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.el.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.game.difficulty = btn.dataset.diff;
        const p = loadProgress();
        p.settings.difficulty = btn.dataset.diff;
        saveProgress(p);
      });
    });

    // Launch
    this.el.querySelector('.launch-btn').addEventListener('click', () => {
      this.hide();
      this.game.setState('PRE_LAUNCH');
    });

    // Words
    this.el.querySelector('.words-btn').addEventListener('click', () => {
      this._showWordBrowser();
    });

    // Options
    this.el.querySelector('.options-btn').addEventListener('click', () => {
      this._showOptions();
    });

    // Credits
    this.el.querySelector('.credits-btn').addEventListener('click', () => {
      this._showCredits();
    });

    ui.appendChild(this.el);
  }

  _showOptions() {
    const ui = document.getElementById('ui-layer');
    const progress = loadProgress();
    const s = progress.settings;

    const overlay = document.createElement('div');
    overlay.className = 'options-overlay fade-in';
    overlay.innerHTML = `
      <div class="options-content">
        <h2>Options</h2>
        <div class="option-row">
          <span class="option-label">Music</span>
          <button class="option-toggle ${s.music !== false ? 'on' : ''}" data-key="music">${s.music !== false ? 'ON' : 'OFF'}</button>
        </div>
        <div class="option-row">
          <span class="option-label">SFX</span>
          <button class="option-toggle ${s.sfx !== false ? 'on' : ''}" data-key="sfx">${s.sfx !== false ? 'ON' : 'OFF'}</button>
        </div>
        <div class="option-row">
          <span class="option-label">Vibration</span>
          <button class="option-toggle ${s.vibration !== false ? 'on' : ''}" data-key="vibration">${s.vibration !== false ? 'ON' : 'OFF'}</button>
        </div>
        <p class="options-dismiss">Tap outside to close</p>
      </div>
    `;

    overlay.querySelectorAll('.option-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.key;
        const p = loadProgress();
        const newVal = p.settings[key] === false;
        p.settings[key] = newVal;
        saveProgress(p);
        btn.classList.toggle('on', newVal);
        btn.textContent = newVal ? 'ON' : 'OFF';
      });
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    ui.appendChild(overlay);
  }

  _showWordBrowser() {
    const ui = document.getElementById('ui-layer');
    const progress = loadProgress();
    const wordData = progress.words || {};

    const overlay = document.createElement('div');
    overlay.className = 'words-overlay fade-in';

    let activeFilter = 'all';
    let activeLengthFilter = 0; // 0 = all lengths

    const getStatus = (word) => {
      const key = word.toLowerCase();
      return getWordStatus(wordData[key]);
    };

    const getConfidence = (word) => {
      const key = word.toLowerCase();
      return Math.round(getEffectiveConfidence(wordData[key]) * 100);
    };

    const renderList = () => {
      const listEl = overlay.querySelector('.words-list');
      listEl.innerHTML = '';

      const filtered = WORD_LIST.map((entry, idx) => ({ ...entry, idx }))
        .filter(entry => {
          if (activeFilter !== 'all' && getStatus(entry.word) !== activeFilter) return false;
          if (activeLengthFilter > 0) {
            if (activeLengthFilter >= 12 ? entry.word.length < 12 : entry.word.length !== activeLengthFilter) return false;
          }
          return true;
        });

      if (filtered.length === 0) {
        listEl.innerHTML = '<div class="words-list-empty">No words in this category yet.</div>';
        return;
      }

      for (const entry of filtered) {
        const status = getStatus(entry.word);
        const confidence = getConfidence(entry.word);
        const statusLabel = status === 'new' ? 'NEW' : status.toUpperCase();

        const row = document.createElement('div');
        row.className = 'word-item';
        row.innerHTML = `
          <div class="word-item-info">
            <div class="word-item-top">
              <span class="word-item-word">${entry.word}</span>
              <span class="word-status ${status}">${statusLabel}</span>
            </div>
            <div class="word-item-meaning">${entry.meaning}</div>
            <div class="word-confidence-bar">
              <div class="word-confidence-fill ${status}" style="width: ${confidence}%"></div>
            </div>
          </div>
          <button class="word-play-btn">PLAY</button>
        `;

        row.querySelector('.word-play-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.remove();
          this.hide();
          this.game.forceWord = { word: entry.word, meaning: entry.meaning };
          this.game.wordIndex = entry.idx;
          this.game.setState('PRE_LAUNCH');
        });

        listEl.appendChild(row);
      }
    };

    overlay.innerHTML = `
      <div class="words-header">
        <h2>WORDS</h2>
        <button class="words-close-btn">\u2715</button>
      </div>
      <div class="words-filters">
        <button class="words-filter-btn active" data-filter="all">ALL</button>
        <button class="words-filter-btn" data-filter="mastered">MASTERED</button>
        <button class="words-filter-btn" data-filter="learning">LEARNING</button>
        <button class="words-filter-btn" data-filter="new">NEW</button>
      </div>
      <div class="words-filters words-length-filters">
        <button class="words-filter-btn active" data-length="0">ALL</button>
        <button class="words-filter-btn" data-length="3">3</button>
        <button class="words-filter-btn" data-length="4">4</button>
        <button class="words-filter-btn" data-length="5">5</button>
        <button class="words-filter-btn" data-length="6">6</button>
        <button class="words-filter-btn" data-length="7">7</button>
        <button class="words-filter-btn" data-length="8">8</button>
        <button class="words-filter-btn" data-length="9">9</button>
        <button class="words-filter-btn" data-length="10">10</button>
        <button class="words-filter-btn" data-length="11">11</button>
        <button class="words-filter-btn" data-length="12">12+</button>
      </div>
      <div class="words-list"></div>
    `;

    overlay.querySelector('.words-close-btn').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.querySelectorAll('.words-filters:not(.words-length-filters) .words-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.words-filters:not(.words-length-filters) .words-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderList();
      });
    });

    overlay.querySelectorAll('.words-length-filters .words-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.words-length-filters .words-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeLengthFilter = parseInt(btn.dataset.length);
        renderList();
      });
    });

    ui.appendChild(overlay);
    renderList();
  }

  _showCredits() {
    const ui = document.getElementById('ui-layer');
    const overlay = document.createElement('div');
    overlay.className = 'credits-overlay fade-in';
    overlay.innerHTML = `
      <div class="credits-content">
        <h2>Credits</h2>

        <div class="credits-section">
          <h3>Created By</h3>
          <div class="credits-row">
            <a href="https://www.linkedin.com/in/ashwanthkumar/" target="_blank" rel="noopener">Ashwanth Kumar</a>
          </div>
        </div>

        <div class="credits-section">
          <h3>Built With</h3>
          <div class="credits-row"><span class="credits-label">Three.js</span><span class="credits-desc">3D rendering engine</span></div>
          <div class="credits-row"><span class="credits-label">Vite</span><span class="credits-desc">Build tool &amp; dev server</span></div>
          <div class="credits-row"><span class="credits-label">Web Audio API</span><span class="credits-desc">Procedural sound effects</span></div>
          <div class="credits-row"><span class="credits-label">Speech Synthesis</span><span class="credits-desc">Text-to-speech for words</span></div>
          <div class="credits-row"><span class="credits-label">Vanilla JS</span><span class="credits-desc">No frameworks, just ES modules</span></div>
        </div>

        <div class="credits-section">
          <h3>AI Assist</h3>
          <div class="credits-row"><span class="credits-label">Claude Code</span><span class="credits-desc">Development assistant</span></div>
        </div>

        <div class="credits-section">
          <h3>Deployed With</h3>
          <div class="credits-row"><span class="credits-label">GitHub Pages</span><span class="credits-desc">Hosting &amp; CI/CD</span></div>
        </div>

        <div class="credits-footer">
          <a href="https://github.com/ashwanthkumar/word-sling" target="_blank" rel="noopener">View on GitHub</a>
          <span class="credits-license">MIT License</span>
        </div>

        <p class="credits-dismiss">Tap anywhere to close</p>
      </div>
    `;
    overlay.addEventListener('click', () => overlay.remove());
    ui.appendChild(overlay);
  }

  show() {
    this.hide();
    this._create();
  }

  hide() {
    if (this.el) {
      const el = this.el;
      this.el = null;
      el.remove();
    }
  }

  onStateChange(newState) {
    if (newState === 'MENU') {
      this.show();
    }
  }

  update() {}
}
