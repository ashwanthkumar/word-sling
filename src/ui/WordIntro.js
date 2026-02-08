export class WordIntro {
  init() {
    this.el = null;
  }

  show(word, meaning) {
    this.hide();
    const ui = document.getElementById('ui-layer');
    this.el = document.createElement('div');
    this.el.className = 'word-intro fade-in';
    this.el.innerHTML = `
      <div class="speaker-icon">&#x1f50a;</div>
      <div class="word-display">${word}</div>
      <div class="meaning-display">"${meaning}"</div>
    `;
    ui.appendChild(this.el);
  }

  hide() {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }

  onStateChange(newState) {
    if (newState !== 'PRE_LAUNCH') {
      this.hide();
    }
  }

  update() {}
}
