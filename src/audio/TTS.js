export class TTS {
  init() {
    this.synth = window.speechSynthesis;
  }

  speak(text, rate = 0.8) {
    return new Promise((resolve) => {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      this.synth.speak(utterance);
    });
  }

  async speakWordAndMeaning(word, meaning, onComplete) {
    this.synth.cancel();

    // Speak word
    await this.speak(word, 0.75);
    // Pause
    await new Promise(r => setTimeout(r, 500));
    // Speak meaning
    await this.speak(meaning, 0.9);
    // Pause before gameplay
    await new Promise(r => setTimeout(r, 800));

    if (onComplete) onComplete();
  }

  speakWordOnly(word) {
    return this.speak(word, 0.75);
  }

  cancel() {
    this.synth.cancel();
  }

  update() {}
}
