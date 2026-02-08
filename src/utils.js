const STORAGE_KEY = 'wordSling_progress';

export function loadProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    // ignore
  }
  return {
    settings: {
      lastGrade: 3,
      totalScore: 0,
      totalWordsLearned: 0,
      totalLevelsCompleted: 0,
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

export function updateWordProgress(word, grade, wasClean) {
  const progress = loadProgress();
  const key = word.toLowerCase();

  if (!progress.words[key]) {
    progress.words[key] = {
      grade,
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

  // Update totals
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

export function selectWordsForLevel(grade, count = 5) {
  const { WORD_DB } = require_worddb();
  const now = new Date();
  const gradeWords = WORD_DB[grade] || [];
  const progress = loadProgress();

  const dueForReview = gradeWords.filter(w => {
    const data = progress.words[w.word.toLowerCase()];
    return data && new Date(data.nextReview) <= now && data.confidence < 0.8;
  });

  const newWords = gradeWords.filter(w => {
    return !progress.words[w.word.toLowerCase()];
  });

  const masteredDue = gradeWords.filter(w => {
    const data = progress.words[w.word.toLowerCase()];
    return data && data.status === 'mastered' && new Date(data.nextReview) <= now;
  });

  let selected = [];
  selected.push(...shuffle(dueForReview).slice(0, 2));
  selected.push(...shuffle(newWords).slice(0, count - selected.length));
  if (selected.length < count) {
    selected.push(...shuffle(masteredDue).slice(0, count - selected.length));
  }
  if (selected.length < count) {
    const remaining = gradeWords.filter(w => !selected.includes(w));
    selected.push(...shuffle(remaining).slice(0, count - selected.length));
  }

  return shuffle(selected.slice(0, count));
}

function require_worddb() {
  // This will be replaced by the dynamic import in main.js
  // For now, this is a placeholder used by the word selection
  return { WORD_DB: window.__WORD_DB || {} };
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
