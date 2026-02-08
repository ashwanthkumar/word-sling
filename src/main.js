import { Game } from './core/Game.js';
import { Background } from './systems/Background.js';
import { Ship } from './entities/Ship.js';
import { LetterSpawner } from './systems/LetterSpawner.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { AudioManager } from './audio/AudioManager.js';
import { TTS } from './audio/TTS.js';
import { StartScreen } from './ui/StartScreen.js';
import { HUD } from './ui/HUD.js';
import { WordIntro } from './ui/WordIntro.js';
import { WordComplete } from './ui/WordComplete.js';
import { LevelComplete } from './ui/LevelComplete.js';
import { selectWordsForLevel, updateWordProgress, saveProgress, loadProgress } from './utils.js';

// Init game
const container = document.getElementById('game-container');
const game = new Game(container);

// Add systems
const background = game.addSystem(new Background());
const ship = game.addSystem(new Ship());
const letterSpawner = game.addSystem(new LetterSpawner());
const collisionSystem = game.addSystem(new CollisionSystem());
const particleSystem = game.addSystem(new ParticleSystem());
const audioManager = game.addSystem(new AudioManager());
const tts = game.addSystem(new TTS());
const startScreen = game.addSystem(new StartScreen());
const hud = game.addSystem(new HUD());
const wordIntro = game.addSystem(new WordIntro());
const wordComplete = game.addSystem(new WordComplete());
const levelComplete = game.addSystem(new LevelComplete());

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
      case 'LEVEL_COMPLETE':
        this._onLevelComplete();
        break;
    }
  },

  _onMenu() {
    game.currentWordIndex = 0;
    game.score = 0;
    game.levelResults = [];
    game.levelWords = [];
  },

  _onPreLaunch() {
    // Select words if starting a new level
    if (game.levelWords.length === 0) {
      game.levelWords = selectWordsForLevel(game.grade, game.wordsPerLevel);
      game.levelResults = [];
      game.currentWordIndex = 0;
    }

    const wordData = game.levelWords[game.currentWordIndex];
    if (!wordData) {
      game.setState('LEVEL_COMPLETE');
      return;
    }

    game.currentWord = wordData.word;
    game.currentMeaning = wordData.meaning;
    game.nextLetterIndex = 0;
    game.wrongGrabs = 0;

    // Reset ship position
    ship.x = 0;
    ship.targetX = 0;
    ship.group.position.x = 0;

    // Show word intro and HUD
    hud.show(game.currentWord, game.currentWordIndex, game.wordsPerLevel);
    wordIntro.show(game.currentWord, game.currentMeaning);

    // TTS then transition to PLAYING
    tts.speakWordAndMeaning(game.currentWord, game.currentMeaning, () => {
      wordIntro.hide();
      audioManager.playLaunch();
      game.setState('PLAYING');
    });
  },

  _onPlaying() {
    if (game.currentWordIndex === 0) {
      const hint = document.createElement('div');
      hint.className = 'swipe-hint';
      hint.textContent = '\u27f5  SWIPE TO MOVE  \u27f6';
      document.getElementById('ui-layer').appendChild(hint);
      setTimeout(() => hint.remove(), 3500);
    }
  },

  _onWordComplete() {
    const wasClean = game.wrongGrabs === 0;
    updateWordProgress(game.currentWord, game.grade, wasClean);

    const shipPos = ship.getPosition();
    particleSystem.celebrationBurst(shipPos.x, shipPos.y);
    audioManager.playWordComplete();
    tts.speakWordOnly(game.currentWord);

    wordComplete.show(game.currentWord, game.wrongGrabs);
  },

  _onLevelComplete() {
    const progress = loadProgress();
    progress.settings.totalLevelsCompleted++;
    progress.settings.totalScore += game.score;
    progress.settings.lastGrade = game.grade;
    saveProgress(progress);

    audioManager.playLevelComplete();
    hud.hide();

    // Reset for next level
    game.levelWords = [];
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
