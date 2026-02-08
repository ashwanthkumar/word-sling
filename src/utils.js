import { WORD_LIST } from './config/words.js';
import { GUN_LEVELS } from './config/guns.js';

const STORAGE_KEY = 'wordSling_progress';

export function loadProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Migrate old format
      if (parsed.settings && parsed.settings.lastGrade !== undefined) {
        parsed.settings.wordIndex = parsed.settings.wordIndex || 0;
        parsed.settings.totalWordsCompleted = parsed.settings.totalWordsCompleted || 0;
        parsed.settings.difficulty = parsed.settings.difficulty || 'medium';
        delete parsed.settings.lastGrade;
        delete parsed.settings.totalLevelsCompleted;
      }
      return parsed;
    }
  } catch (e) {
    // ignore
  }
  return {
    settings: {
      totalScore: 0,
      totalWordsLearned: 0,
      wordIndex: 0,
      totalWordsCompleted: 0,
      difficulty: 'medium',
      vibration: true,
      music: true,
      sfx: true,
    },
    words: {},
  };
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    // ignore
  }
}

export function updateWordProgress(word, wasClean) {
  const progress = loadProgress();
  const key = word.toLowerCase();

  if (!progress.words[key]) {
    progress.words[key] = {
      attempts: 0,
      perfectAttempts: 0,
      wrongGrabs: 0,
      lastSeen: null,
      confidence: 0,
      nextReview: new Date().toISOString(),
      status: 'learning',
      streak: 0,
    };
  }

  const data = progress.words[key];

  if (wasClean) {
    data.perfectAttempts++;
    data.streak++;
    data.confidence = Math.min(1.0, data.confidence + (1 - data.confidence) * 0.3);
  } else {
    data.streak = 0;
    data.confidence = Math.max(0, data.confidence - 0.2);
  }

  data.attempts++;
  data.lastSeen = new Date().toISOString();

  const hours = calculateReviewInterval(data.confidence, data.streak);
  data.nextReview = new Date(Date.now() + hours * 3600000).toISOString();

  if (data.confidence >= 0.8 && data.streak >= 3) {
    data.status = 'mastered';
  } else if (data.confidence >= 0.4) {
    data.status = 'learning';
  } else {
    data.status = 'struggling';
  }

  const masteredCount = Object.values(progress.words).filter(w => w.status === 'mastered').length;
  progress.settings.totalWordsLearned = masteredCount;

  saveProgress(progress);
  return progress;
}

function calculateReviewInterval(confidence, streak) {
  if (confidence < 0.3) return 1;
  if (confidence < 0.5) return 6;
  if (confidence < 0.7) return 24;
  if (confidence < 0.85) return 72;
  if (confidence < 0.95) return 168;
  return 720;
}

export function getNextWord(wordIndex) {
  // Every 5th word, try to insert a review word
  if (wordIndex > 0 && wordIndex % 5 === 0) {
    const reviewWord = getReviewWord();
    if (reviewWord) return reviewWord;
  }
  // Wrap around if we've exhausted the list
  return WORD_LIST[wordIndex % WORD_LIST.length];
}

function getReviewWord() {
  const now = new Date();
  const progress = loadProgress();
  const dueWords = [];

  for (const [key, data] of Object.entries(progress.words)) {
    if (data.confidence < 0.8 && new Date(data.nextReview) <= now) {
      const entry = WORD_LIST.find(w => w.word.toLowerCase() === key);
      if (entry) dueWords.push(entry);
    }
  }

  if (dueWords.length === 0) return null;
  return dueWords[Math.floor(Math.random() * dueWords.length)];
}

export function getGunLevel(totalWordsCompleted) {
  let best = GUN_LEVELS[0];
  for (const gun of GUN_LEVELS) {
    if (totalWordsCompleted >= gun.wordsNeeded) {
      best = gun;
    }
  }
  return best;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
