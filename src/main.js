import { Game } from './core/Game.js';
import { Background } from './systems/Background.js';
import { Ship } from './entities/Ship.js';
import { LetterSpawner } from './systems/LetterSpawner.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { ShootingSystem } from './systems/ShootingSystem.js';
import { PowerUpManager } from './systems/PowerUpManager.js';
import { AudioManager } from './audio/AudioManager.js';
import { TTS } from './audio/TTS.js';
import { StartScreen } from './ui/StartScreen.js';
import { HUD } from './ui/HUD.js';
import { WordIntro } from './ui/WordIntro.js';
import { WordComplete } from './ui/WordComplete.js';
import { getNextWord, updateWordProgress, saveProgress, loadProgress, getGunLevel } from './utils.js';
import { GUN_LEVELS } from './config/guns.js';

// Init game
const container = document.getElementById('game-container');
const game = new Game(container);
window.game = game;

// Load saved progress
const progress = loadProgress();
game.difficulty = progress.settings.difficulty || 'medium';
game.wordIndex = progress.settings.wordIndex || 0;
game.totalWordsCompleted = progress.settings.totalWordsCompleted || 0;

// Add systems
const background = game.addSystem(new Background());
const ship = game.addSystem(new Ship());
const letterSpawner = game.addSystem(new LetterSpawner());
const collisionSystem = game.addSystem(new CollisionSystem());
const particleSystem = game.addSystem(new ParticleSystem());
const shootingSystem = game.addSystem(new ShootingSystem());
const powerUpManager = game.addSystem(new PowerUpManager());
const audioManager = game.addSystem(new AudioManager());
const tts = game.addSystem(new TTS());
const startScreen = game.addSystem(new StartScreen());
const hud = game.addSystem(new HUD());
const wordIntro = game.addSystem(new WordIntro());
const wordComplete = game.addSystem(new WordComplete());

// Game flow controller — orchestrates state transitions
const gameFlow = {
  game: null,

  init() {},

  onStateChange(newState, oldState) {
    switch (newState) {
      case 'MENU':
        this._onMenu();
        break;
      case 'PRE_LAUNCH':
        this._onPreLaunch();
        break;
      case 'PLAYING':
        this._onPlaying();
        break;
      case 'WORD_COMPLETE':
        this._onWordComplete();
        break;
    }
  },

  _onMenu() {
    game.score = 0;
  },

  _onPreLaunch() {
    const wordData = getNextWord(game.wordIndex);
    if (!wordData) return;

    game.currentWord = wordData.word;
    game.currentMeaning = wordData.meaning;
    game.nextLetterIndex = 0;
    game.wrongGrabs = 0;

    // Reset ship position
    ship.x = 0;
    ship.targetX = 0;
    ship.group.position.x = 0;

    // Show word intro and HUD
    hud.show(game.currentWord, game.totalWordsCompleted);
    wordIntro.show(game.currentWord, game.currentMeaning);

    // TTS then transition to PLAYING
    tts.speakWordAndMeaning(game.currentWord, game.currentMeaning, () => {
      wordIntro.hide();
      audioManager.playLaunch();
      game.setState('PLAYING');
    });
  },

  _onPlaying() {
    if (game.totalWordsCompleted === 0) {
      const hint = document.createElement('div');
      hint.className = 'swipe-hint';
      hint.textContent = '\u27f5  SWIPE TO MOVE  \u27f6';
      document.getElementById('ui-layer').appendChild(hint);
      setTimeout(() => hint.remove(), 3500);
    }
  },

  _onWordComplete() {
    const wasClean = game.wrongGrabs === 0;
    updateWordProgress(game.currentWord, wasClean);

    const prevGun = getGunLevel(game.totalWordsCompleted);

    game.wordIndex++;
    game.totalWordsCompleted++;

    const newGun = getGunLevel(game.totalWordsCompleted);
    const gunUpgraded = newGun.wordsNeeded > prevGun.wordsNeeded;

    // Persist progress
    const progress = loadProgress();
    progress.settings.wordIndex = game.wordIndex;
    progress.settings.totalWordsCompleted = game.totalWordsCompleted;
    progress.settings.totalScore += game.score;
    progress.settings.difficulty = game.difficulty;
    saveProgress(progress);

    const shipPos = ship.getPosition();
    particleSystem.celebrationBurst(shipPos.x, shipPos.y);
    audioManager.playWordComplete();
    tts.speakWordOnly(game.currentWord);

    if (gunUpgraded) {
      audioManager.playGunUpgrade();
    }

    wordComplete.show(game.currentWord, game.wrongGrabs, game.totalWordsCompleted, gunUpgraded ? newGun.name : null);
  },

  update() {},
};

gameFlow.game = game;
game.addSystem(gameFlow);

// Start in MENU state
game.setState('MENU');

// Handle visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.paused = true;
    tts.cancel();
  } else {
    game.paused = false;
  }
});
