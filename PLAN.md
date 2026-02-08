# WORD SLING — Game Specification

## For: Coding Agent Implementation
## Platform: Mobile Web (HTML5 Canvas + JS) — Single File React/HTML artifact
## Version: 1.0

---

## 1. GAME OVERVIEW

**Word Sling** is a mobile-first vocabulary learning game set in a low-poly space environment. The player controls a spaceship that flies vertically upward through space. Letters rain down from above. The player hears a word spoken aloud with its meaning via browser TTS, then must swipe to steer the spaceship and collect the correct letters in order to spell the word.

**Target audience:** Non-native English learners, ages 5–14.
**Core learning method:** Hear → See blanks → Collect letters → Reinforce (multisensory phonics + spaced repetition).
**Session length:** ~30 seconds per word, ~3 minutes per level (5 words).

---

## 2. TECH STACK

- Single-file HTML/CSS/JS (or single React .jsx artifact)
- HTML5 Canvas for game rendering
- Browser `speechSynthesis` API for TTS
- LocalStorage for progress and spaced repetition data
- No external game engine — vanilla JS with requestAnimationFrame loop
- Touch events for swipe input
- Portrait orientation, responsive to any mobile screen

---

## 3. SCREENS & FLOW

### 3.1 Start Screen

```
┌──────────────────────────┐
│                          │
│       🚀 WORD SLING      │
│    Collect Words in Space │
│                          │
│      SELECT GRADE         │
│   ┌─────┬─────┬─────┐   │
│   │ 1st │ 2nd │ 3rd │   │
│   ├─────┼─────┼─────┤   │
│   │ 4th │ 5th │ 6th │   │
│   └─────┴─────┴─────┘   │
│                          │
│      [ 🚀 LAUNCH ]       │
│                          │
│   Stats: 47 words learned │
│                          │
└──────────────────────────┘
```

**Elements:**
- Game title with space-themed styling (font: Orbitron or similar monospace/tech font)
- 6 grade buttons in a 3×2 grid, selected grade highlighted with glow
- LAUNCH button — large, prominent, starts the game
- Small stats line showing total words learned (from localStorage)
- Background: dark space with subtle twinkling stars (canvas or CSS)

**Behavior:**
- Default selected grade: 3rd (or last played grade from localStorage)
- Tapping a grade button selects it (visual highlight, deselect others)
- Tapping LAUNCH transitions to the Game Screen

---

### 3.2 Game Screen — Pre-Launch Phase (Word Introduction)

Before each word, there is a 3–4 second introduction phase:

```
┌──────────────────────────┐
│  WORD 1/5       ⭐ 0      │
│                          │
│  [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]  │
│                          │
│                          │
│    🔊 "BRAVE"            │
│    "Ready to face danger  │
│     without fear"         │
│                          │
│                          │
│         🚀               │
│      ═══╤═══             │
│                          │
└──────────────────────────┘
```

**Sequence:**
1. Word blanks appear at the top (number of blanks = number of letters)
2. A brief visual indicator shows TTS is speaking (pulsing speaker icon or sound wave animation)
3. TTS speaks the word slowly and clearly: "BRAVE"
4. Short pause (500ms)
5. TTS speaks the meaning: "Ready to face danger without fear"
6. Short pause (800ms)
7. Ship auto-launches upward — transition to active gameplay

**TTS Implementation:**
```javascript
const utterance = new SpeechSynthesisUtterance();
utterance.lang = 'en-US';
utterance.rate = 0.8; // Slightly slower for clarity
// Speak word first, then meaning after a pause
```

---

### 3.3 Game Screen — Active Gameplay

```
┌──────────────────────────┐
│  WORD 3/5       ⭐ 240    │
│                          │
│  [ B ] [ R ] [ _ ] [ _ ] [ E ]  │
│                          │
│    Z       K       M     │
│        A                 │  ← correct, next needed, subtle glow
│  P           W           │
│       V                  │  ← correct but not next, dimmer
│    N       J       X     │
│         T                │
│                          │
│         🚀               │  ← ship, fixed vertical position
│                          │
│  ⟵  SWIPE TO MOVE  ⟶    │
└──────────────────────────┘
```

**Ship behavior:**
- Ship is positioned at approximately 75% from top of screen (lower quarter)
- Ship does NOT move vertically — it stays at a fixed Y position
- Ship moves horizontally only, controlled by touch/swipe
- Ship has slight momentum/easing for smooth feel (lerp toward target X)
- Ship has a small engine particle trail below it (simple dots moving down)
- The visual effect of "flying up" is created by the background stars scrolling down and letters raining from above

**Letter rain behavior:**
- Letters spawn at random X positions above the top of the screen
- Letters fall downward at a steady speed
- Each letter is rendered as a character inside a low-poly hexagonal or circular shape
- Multiple letters are on screen at any time (8–15 depending on density)
- Letters are a mix of CORRECT letters (letters that exist in the target word) and DECOY letters (random alphabet)
- Correct letters that are the NEXT NEEDED letter have a subtle glow/pulse (brightness or ring animation)
- Correct letters that are NOT the next needed one appear without the glow (player cannot collect them yet)
- Decoy letters appear in a dimmer/greyer color
- Letters rotate slowly as they fall for visual interest
- When a letter exits the bottom of the screen, it is removed and recycled

**Letter spawn rules:**
- The next needed correct letter MUST appear at least once every 2–3 seconds
- The same correct letter may appear multiple times — only the first collected counts
- Decoy letters spawn continuously to fill the field
- At higher difficulty, decoys include visually similar letters (b/d, p/q, m/n, v/w)
- Spawn positions are randomized but avoid clustering (minimum horizontal spacing)

**Collection mechanics:**
- When the ship's hitbox overlaps a letter's hitbox, collection is triggered
- If the letter is the NEXT NEEDED correct letter:
  - Letter "magnetizes" toward the ship with a quick animation (scales up, flies to ship)
  - A chime sound plays (use Web Audio API or simple Audio element — ascending pitch per letter position)
  - The letter animates from the ship upward to its correct blank slot at the top
  - The blank slot fills in with a pop/scale animation
  - Score increases by +10
  - The next letter in sequence becomes the new "next needed" with the glow
- If the letter is a CORRECT letter but NOT the next needed:
  - Ship passes through it — no collection, no penalty
  - Optional: brief visual indicator "not yet"
- If the letter is a DECOY:
  - Brief red flash on the ship
  - Small screen shake (2–3 frames)
  - Score decreases by -5
  - Ship briefly flickers/becomes semi-transparent
  - A wrong-answer counter increments (used for star rating)

**Difficulty scaling by grade:**

| Grade | Rain Speed | Letter Density | Decoy Similarity | Word Length |
|-------|-----------|----------------|-------------------|-------------|
| 1st   | 60 px/s   | Low (6-8 on screen)  | Random letters      | 3 letters   |
| 2nd   | 75 px/s   | Low-Medium (8-10)    | Random letters      | 4-5 letters |
| 3rd   | 90 px/s   | Medium (8-12)        | Some similar        | 4-5 letters |
| 4th   | 100 px/s  | Medium (10-12)       | Similar included    | 5-7 letters |
| 5th   | 115 px/s  | Medium-High (10-14)  | Many similar        | 7-9 letters |
| 6th   | 130 px/s  | High (12-15)         | Highly confusing    | 8-12 letters|

**Hint system (next needed letter glow) by grade:**

| Grade | Hint Level |
|-------|-----------|
| 1st-2nd | Strong green glow + pulsing ring around correct next letter |
| 3rd-4th | Subtle brightness increase on correct next letter |
| 5th-6th | No hints — all letters look identical |

---

### 3.4 Word Completion

When all blanks are filled:

1. Ship stops (floats in place)
2. Background letter rain stops
3. All remaining letters fade out
4. Star burst particle effect around the ship
5. The completed word at the top GLOWS and scales up slightly
6. TTS speaks the word again clearly (reinforcement)
7. Star rating appears below the word:
   - ⭐⭐⭐ = zero wrong letter grabs
   - ⭐⭐ = 1-2 wrong grabs
   - ⭐ = 3+ wrong grabs
8. After 2 seconds (or tap to skip), word shrinks and joins the "collected words" ribbon at the bottom
9. Brief transition (0.5s fade) → next word's Pre-Launch Phase begins

---

### 3.5 Level Complete Screen

After all 5 words are completed:

```
┌──────────────────────────┐
│                          │
│      LEVEL COMPLETE!     │
│         ⭐⭐⭐             │
│                          │
│   ORBIT    ⭐⭐⭐   🔊     │
│   LUNAR    ⭐⭐⭐   🔊     │
│   COMET    ⭐⭐     🔊     │
│   QUEST    ⭐⭐⭐   🔊     │
│   BRAVE    ⭐⭐     🔊     │
│                          │
│   Score: 420              │
│   Words Mastered: 3       │
│                          │
│   [ 🔊 REPLAY ALL ]      │
│   [ ▶ NEXT LEVEL ]       │
│   [ 🏠 HOME ]            │
│                          │
└──────────────────────────┘
```

**Elements:**
- "LEVEL COMPLETE" header with celebration animation
- Overall star rating (average of word stars)
- List of all 5 words with individual star ratings
- 🔊 button next to each word — tapping it plays TTS for that word + meaning
- "REPLAY ALL" button — TTS reads all 5 words and meanings sequentially
- "NEXT LEVEL" button — generates next level with new word mix
- "HOME" button — returns to Start Screen
- Score total for the level
- Words mastered count (words that hit high confidence in spaced repetition)

---

## 4. VISUAL DESIGN

### 4.1 Art Style: Low-Poly Space

**Color Palette:**
- Background: Deep navy/black (#0a0a1a) with purple-blue gradient
- Stars: White, pale blue, pale yellow — varying sizes, some twinkling
- Ship: Bright teal/cyan geometric triangle shape with orange engine glow
- Correct letters: White text on translucent blue hexagonal badge, with green glow when "next needed"
- Decoy letters: Grey text on dark translucent hexagonal badge
- Collected letter slots: Dark with cyan border, filled slots glow green
- UI text: White / cyan, font-family: Orbitron or monospace tech font
- Accents: Neon green (#00ffaa) for success, red (#ff4466) for errors

**Background layers (parallax):**
- Layer 1 (far): Tiny stars, very slow scroll
- Layer 2 (mid): Larger stars, nebula color patches, medium scroll
- Layer 3 (near): Occasional low-poly asteroids or tiny planets drifting by, faster scroll

All background elements scroll DOWNWARD to create the illusion of the ship flying upward.

### 4.2 Ship Design

- Simple geometric triangle/arrow shape pointing UP
- Rendered on canvas as a polygon (5-7 vertices for low-poly feel)
- Small engine glow at the bottom (orange/yellow gradient circle)
- Particle trail: 10-15 small circles that spawn at the engine, fall downward, fade out and shrink
- When hit by wrong letter: ship flashes red briefly
- When collecting correct letter: brief white flash/scale pulse

### 4.3 Letter Rendering

Each letter is drawn as:
- A hexagonal or rounded-hex shape (low-poly feel)
- The letter character centered inside
- Slight rotation animation (slow spin, ±15 degrees)
- Correct next-needed: pulsing ring animation around the hex
- Size: approximately 40-50px wide on mobile

### 4.4 Animations

| Event | Animation |
|-------|-----------|
| Letter collected (correct) | Letter scales up, flies in arc to its blank slot (bezier curve), slot pops |
| Letter hit (wrong) | Ship flashes red, screen shakes 3px for 100ms, letter shatters (3-4 fragments fly outward) |
| Word complete | Star burst particles (20-30 particles expand outward from ship), word glows |
| Level complete | Large particle explosion, background briefly brightens |
| Ship movement | Slight tilt in direction of movement (rotate ±10 degrees) |

---

## 5. CONTROLS

### 5.1 Touch Input

**Primary control: Horizontal swipe / drag**

- Touch and drag horizontally moves the ship
- The ship follows the finger's X position with slight easing (lerp factor: 0.15)
- Ship is clamped to screen bounds (cannot move off-screen)
- Single touch only — no multitouch needed

**Implementation:**
```
touchstart → record touch X, set dragging = true
touchmove  → calculate deltaX from initial touch, update ship target X
touchend   → set dragging = false, ship maintains current X (no auto-center)
```

**Alternative: Tilt control (optional, bonus feature)**
- Use `deviceorientation` event
- Map phone tilt angle to ship X position
- Toggle in settings

### 5.2 UI Touch

- All buttons are large (minimum 44px tap target)
- Grade select buttons, launch button, navigation buttons — standard tap
- 🔊 buttons trigger TTS playback
- Tap during word completion phase skips the wait and moves to next word

---

## 6. WORD DATABASE

### 6.1 Structure

```javascript
const WORD_DB = {
  1: [
    { word: "SUN", meaning: "The star at the center of our solar system that gives us light and heat" },
    { word: "BIG", meaning: "Large in size, amount, or degree" },
    { word: "RUN", meaning: "To move quickly using your legs, faster than walking" },
    { word: "CAT", meaning: "A small furry animal often kept as a pet" },
    { word: "MAP", meaning: "A drawing that shows where places are" },
    { word: "HOP", meaning: "To jump on one foot or make short jumps" },
    { word: "CUP", meaning: "A small container used for drinking" },
    { word: "RED", meaning: "The color of fire trucks and ripe tomatoes" },
    { word: "DOG", meaning: "A friendly animal often kept as a pet that barks" },
    { word: "FIN", meaning: "The flat part on a fish that helps it swim" }
  ],
  2: [
    { word: "BRAVE", meaning: "Ready to face danger or pain without showing fear" },
    { word: "CLIMB", meaning: "To go up something using your hands and feet" },
    { word: "FLOAT", meaning: "To stay on the surface of a liquid without sinking" },
    { word: "PROUD", meaning: "Feeling happy about something you or someone else has done" },
    { word: "SHINY", meaning: "Bright and reflecting light" },
    { word: "STORM", meaning: "Very bad weather with strong winds, rain, and sometimes lightning" },
    { word: "GRASP", meaning: "To take hold of something firmly" },
    { word: "BLOOM", meaning: "When a flower opens up its petals" },
    { word: "CREEK", meaning: "A small narrow stream of water" },
    { word: "SWIFT", meaning: "Moving or able to move very quickly" }
  ],
  3: [
    { word: "ORBIT", meaning: "The curved path a planet follows around a star" },
    { word: "LUNAR", meaning: "Relating to the moon" },
    { word: "COMET", meaning: "A bright object in space with a long tail made of ice and dust" },
    { word: "QUEST", meaning: "A long search for something important" },
    { word: "SOLAR", meaning: "Relating to the sun" },
    { word: "FROST", meaning: "A thin layer of ice that forms on cold surfaces" },
    { word: "BLAZE", meaning: "A large strong fire that burns brightly" },
    { word: "GLOBE", meaning: "A round model of the Earth or the Earth itself" },
    { word: "SWIFT", meaning: "Moving or capable of moving at high speed" },
    { word: "CRANE", meaning: "A large tall machine used to lift heavy things or a large bird with long legs" }
  ],
  4: [
    { word: "GRAVITY", meaning: "The force that pulls objects toward each other and keeps us on the ground" },
    { word: "ANCIENT", meaning: "Belonging to a time long ago in history" },
    { word: "JOURNEY", meaning: "A long trip from one place to another" },
    { word: "IMAGINE", meaning: "To create pictures or ideas in your mind" },
    { word: "MYSTERY", meaning: "Something that is difficult to understand or explain" },
    { word: "BALANCE", meaning: "Being steady and not falling to one side" },
    { word: "HARVEST", meaning: "The time when crops are gathered from the fields" },
    { word: "COURAGE", meaning: "The ability to do something that frightens you" },
    { word: "COMPETE", meaning: "To try to win or do better than others" },
    { word: "SHELTER", meaning: "A place that protects you from bad weather or danger" }
  ],
  5: [
    { word: "ATMOSPHERE", meaning: "The layer of gases surrounding a planet" },
    { word: "TELESCOPE", meaning: "An instrument used to see distant objects in space" },
    { word: "BRILLIANT", meaning: "Extremely clever or bright and shining" },
    { word: "COMMUNITY", meaning: "A group of people living in the same area or sharing interests" },
    { word: "DANGEROUS", meaning: "Able to cause harm or injury to someone" },
    { word: "ELABORATE", meaning: "Very detailed and carefully planned" },
    { word: "FREQUENCY", meaning: "How often something happens in a given time period" },
    { word: "NEGOTIATE", meaning: "To discuss something in order to reach an agreement" },
    { word: "PENINSULA", meaning: "A piece of land almost surrounded by water on three sides" },
    { word: "NARRATIVE", meaning: "A spoken or written account of connected events, a story" }
  ],
  6: [
    { word: "CONSTELLATION", meaning: "A group of stars that form a pattern in the night sky" },
    { word: "PHOTOSYNTHESIS", meaning: "The process plants use to convert sunlight into food" },
    { word: "EXTRAORDINARY", meaning: "Very unusual or remarkably great" },
    { word: "CIRCUMFERENCE", meaning: "The distance around the edge of a circle" },
    { word: "PRECIPITATION", meaning: "Water that falls from clouds as rain, snow, or hail" },
    { word: "REVOLUTIONARY", meaning: "Involving a great or complete change" },
    { word: "ARCHAEOLOGICAL", meaning: "Related to the study of ancient human history through objects" },
    { word: "METAMORPHOSIS", meaning: "A complete change in form, like a caterpillar becoming a butterfly" },
    { word: "INDEPENDENCE", meaning: "The state of being free from the control of others" },
    { word: "BIODIVERSITY", meaning: "The variety of different plants and animals in an environment" }
  ]
};
```

### 6.2 Word Selection Per Level

Each level presents 5 words. The selection algorithm:

1. Check spaced repetition data for words DUE for review (confidence < 0.7 AND next_review <= now)
2. Fill remaining slots with NEW words (never seen before) from the current grade
3. If no new words available in the grade, pull review words or advance to next grade
4. Shuffle the 5 selected words

**Target mix per level:**
- 2-3 new words
- 1-2 review words (from spaced repetition)
- 1 previously mastered word being retested (if available)

---

## 7. SPACED REPETITION SYSTEM

### 7.1 Data Model

Stored in localStorage under key `wordSling_progress`:

```javascript
{
  "settings": {
    "lastGrade": 3,
    "totalScore": 2840,
    "totalWordsLearned": 47,
    "totalLevelsCompleted": 12
  },
  "words": {
    "brave": {
      "grade": 2,
      "attempts": 6,
      "perfectAttempts": 4,
      "wrongGrabs": 3,
      "lastSeen": "2026-02-08T10:30:00Z",
      "confidence": 0.82,
      "nextReview": "2026-02-15T00:00:00Z",
      "status": "mastered",
      "streak": 4
    },
    "orbit": {
      "grade": 3,
      "attempts": 2,
      "perfectAttempts": 0,
      "wrongGrabs": 5,
      "lastSeen": "2026-02-08T09:00:00Z",
      "confidence": 0.25,
      "nextReview": "2026-02-08T15:00:00Z",
      "status": "learning",
      "streak": 0
    }
  }
}
```

### 7.2 Confidence Algorithm

After each word attempt, update confidence:

```javascript
function updateConfidence(wordData, wasClean) {
  // wasClean = true if zero wrong letter grabs

  if (wasClean) {
    wordData.perfectAttempts++;
    wordData.streak++;
    // Increase confidence, diminishing returns
    wordData.confidence = Math.min(1.0, wordData.confidence + (1 - wordData.confidence) * 0.3);
  } else {
    wordData.streak = 0;
    // Decrease confidence
    wordData.confidence = Math.max(0, wordData.confidence - 0.2);
  }

  wordData.attempts++;
  wordData.lastSeen = new Date().toISOString();

  // Schedule next review based on confidence
  const hoursUntilReview = calculateReviewInterval(wordData.confidence, wordData.streak);
  wordData.nextReview = new Date(Date.now() + hoursUntilReview * 3600000).toISOString();

  // Update status
  if (wordData.confidence >= 0.8 && wordData.streak >= 3) {
    wordData.status = "mastered";
  } else if (wordData.confidence >= 0.4) {
    wordData.status = "learning";
  } else {
    wordData.status = "struggling";
  }
}

function calculateReviewInterval(confidence, streak) {
  // Returns hours until next review
  if (confidence < 0.3) return 1;        // 1 hour — struggling
  if (confidence < 0.5) return 6;        // 6 hours
  if (confidence < 0.7) return 24;       // 1 day
  if (confidence < 0.85) return 72;      // 3 days
  if (confidence < 0.95) return 168;     // 1 week
  return 720;                             // 1 month — mastered
}
```

### 7.3 Word Selection Algorithm

```javascript
function selectWordsForLevel(grade, count = 5) {
  const now = new Date();
  const gradeWords = WORD_DB[grade];
  const progress = loadProgress();

  // 1. Words due for review (struggling or due)
  const dueForReview = gradeWords.filter(w => {
    const data = progress.words[w.word.toLowerCase()];
    return data && new Date(data.nextReview) <= now && data.confidence < 0.8;
  });

  // 2. Words never seen
  const newWords = gradeWords.filter(w => {
    return !progress.words[w.word.toLowerCase()];
  });

  // 3. Mastered words due for retest
  const masteredDue = gradeWords.filter(w => {
    const data = progress.words[w.word.toLowerCase()];
    return data && data.status === "mastered" && new Date(data.nextReview) <= now;
  });

  // Build level: prioritize review, then new, then mastered retest
  let selected = [];
  selected.push(...shuffle(dueForReview).slice(0, 2));
  selected.push(...shuffle(newWords).slice(0, count - selected.length));
  if (selected.length < count) {
    selected.push(...shuffle(masteredDue).slice(0, count - selected.length));
  }
  // If still not enough, add random from grade
  if (selected.length < count) {
    const remaining = gradeWords.filter(w => !selected.includes(w));
    selected.push(...shuffle(remaining).slice(0, count - selected.length));
  }

  return shuffle(selected.slice(0, count));
}
```

---

## 8. GAME LOOP ARCHITECTURE

### 8.1 State Machine

```
STATES:
  MENU          → Start screen, grade selection
  PRE_LAUNCH    → TTS speaking word + meaning, blanks shown, ship on pad
  PLAYING       → Letters raining, ship moving, collecting
  WORD_COMPLETE → Celebration, TTS repeat, star rating
  LEVEL_COMPLETE→ Summary of all 5 words, navigation options
```

**State transitions:**
```
MENU → (tap LAUNCH) → PRE_LAUNCH
PRE_LAUNCH → (TTS finished + delay) → PLAYING
PLAYING → (all letters collected) → WORD_COMPLETE
WORD_COMPLETE → (delay or tap) → PRE_LAUNCH (next word) OR LEVEL_COMPLETE (if word 5/5)
LEVEL_COMPLETE → (tap NEXT) → PRE_LAUNCH (new level)
LEVEL_COMPLETE → (tap HOME) → MENU
```

### 8.2 Main Game Loop

```javascript
function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTimestamp) / 1000; // seconds
  lastTimestamp = timestamp;

  update(deltaTime);
  render();

  requestAnimationFrame(gameLoop);
}

function update(dt) {
  switch (gameState) {
    case 'PLAYING':
      updateShipPosition(dt);
      updateLetterRain(dt);
      checkCollisions();
      updateParticles(dt);
      updateBackground(dt);
      break;
    case 'WORD_COMPLETE':
      updateCelebration(dt);
      break;
    // Other states are UI-driven, not loop-driven
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderBackground();
  renderLetters();
  renderShip();
  renderParticles();
  // HUD and UI are DOM elements overlaid on canvas
}
```

### 8.3 Key Update Functions

**Ship position:**
```javascript
function updateShipPosition(dt) {
  // Lerp toward target X (set by touch input)
  ship.x += (ship.targetX - ship.x) * 0.12;
  // Clamp to screen
  ship.x = Math.max(SHIP_HALF_WIDTH, Math.min(canvas.width - SHIP_HALF_WIDTH, ship.x));
  // Tilt based on movement direction
  ship.tilt = (ship.targetX - ship.x) * 0.05; // radians, for visual tilt
}
```

**Letter spawning:**
```javascript
function spawnLetter() {
  const isCorrect = Math.random() < correctLetterChance;
  let char;

  if (isCorrect) {
    char = currentWord[nextLetterIndex]; // Always spawn the next needed letter
  } else {
    // Random decoy, weighted toward confusing letters at higher grades
    char = getDecoyLetter(currentWord, currentGrade);
  }

  letters.push({
    char: char,
    x: Math.random() * (canvas.width - 80) + 40,
    y: -50,
    speed: letterBaseSpeed + Math.random() * 20,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 2,
    isCorrect: currentWord.includes(char) && char === currentWord[nextLetterIndex],
    isInWord: currentWord.includes(char),
    scale: 1,
    opacity: 1
  });
}
```

**Collision detection:**
```javascript
function checkCollisions() {
  for (let i = letters.length - 1; i >= 0; i--) {
    const letter = letters[i];
    const dx = ship.x - letter.x;
    const dy = ship.y - letter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < COLLECTION_RADIUS) {
      if (letter.char === currentWord[nextLetterIndex]) {
        collectCorrectLetter(letter, i);
      } else if (letter.char !== currentWord[nextLetterIndex]) {
        hitWrongLetter(letter, i);
      }
    }
  }
}
```

---

## 9. AUDIO DESIGN

### 9.1 TTS (Text-to-Speech)

```javascript
function speakWord(word, meaning, onComplete) {
  const synth = window.speechSynthesis;

  // Cancel any ongoing speech
  synth.cancel();

  // Speak the word
  const wordUtterance = new SpeechSynthesisUtterance(word);
  wordUtterance.lang = 'en-US';
  wordUtterance.rate = 0.75; // Slow for clarity
  wordUtterance.pitch = 1.0;

  wordUtterance.onend = () => {
    // Pause then speak meaning
    setTimeout(() => {
      const meaningUtterance = new SpeechSynthesisUtterance(meaning);
      meaningUtterance.lang = 'en-US';
      meaningUtterance.rate = 0.9;
      meaningUtterance.pitch = 1.0;
      meaningUtterance.onend = () => {
        setTimeout(onComplete, 800);
      };
      synth.speak(meaningUtterance);
    }, 500);
  };

  synth.speak(wordUtterance);
}
```

### 9.2 Sound Effects (Web Audio API or Generated)

Since we want to keep this as a single file without external audio assets, generate sounds programmatically using Web Audio API:

| Sound | Description | Generation |
|-------|-------------|------------|
| Correct letter collect | Ascending chime, pitch increases per letter position | OscillatorNode, sine wave, frequency = 400 + (letterIndex * 80), duration 150ms |
| Wrong letter hit | Low buzzer | OscillatorNode, sawtooth wave, frequency 150, duration 200ms |
| Word complete | Ascending arpeggio (5 quick notes) | Sequence of oscillators, C-E-G-C-E, 80ms each |
| Launch | Whoosh — rising frequency sweep | OscillatorNode, sine, frequency ramp 200→800 over 500ms |
| Level complete | Triumphant chord | Multiple simultaneous oscillators — C major chord, 500ms |

```javascript
function playChime(letterIndex) {
  const audioCtx = getAudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 400 + letterIndex * 80;
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}
```

---

## 10. RESPONSIVE LAYOUT

### 10.1 Canvas Sizing

```javascript
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);

  // Update game constants based on screen size
  SHIP_Y = window.innerHeight * 0.75;
  LETTER_SIZE = Math.min(50, window.innerWidth * 0.12);
  COLLECTION_RADIUS = LETTER_SIZE * 1.2;
}
```

### 10.2 DOM Overlay Positioning

HUD elements (score, word progress, letter blanks) are HTML/CSS positioned absolutely over the canvas. This allows:
- Crisp text rendering (vs canvas text)
- Easy animation with CSS transitions
- Accessible text for screen readers

The canvas handles: background, ship, letters, particles, effects.
The DOM handles: HUD, blanks, popups, buttons, screens.

---

## 11. POWER-UPS (Bonus Feature — Implement If Time Allows)

Occasionally spawn among the letter rain:

| Power-Up | Visual | Effect | Duration |
|----------|--------|--------|----------|
| 🧲 Magnet | Pink glowing circle | Attracts next correct letter toward ship | 3 seconds |
| 🛡️ Shield | Blue hexagonal badge | Next wrong letter grab has no penalty | 1 use |
| 🔊 Replay | Speaker icon badge | TTS replays word + meaning mid-game | Instant |
| 🌀 Slow-Mo | Clock icon | Letter rain speed halved | 5 seconds |

Power-ups spawn with ~10% probability every 5 seconds during PLAYING state.
Power-ups use the same collision detection as letters.

---

## 12. PERFORMANCE TARGETS

- 60 FPS on mid-range mobile devices
- < 500KB total page weight (single HTML file)
- Touch input latency < 16ms
- TTS latency handled by pre-loading utterances
- Maximum 20 letter objects active at once (recycle pool)
- Canvas rendering uses integer coordinates (no sub-pixel)
- Background stars are pre-rendered to an offscreen canvas

---

## 13. IMPLEMENTATION PRIORITIES

### Phase 1 — Core Playable (MVP)
1. Canvas setup with responsive sizing
2. Star field background with parallax scrolling
3. Ship rendering and touch/swipe horizontal movement
4. Letter rain spawning and falling
5. Collision detection — correct and wrong letter collection
6. Word blank display (DOM) with fill animation
7. TTS integration — speak word + meaning before each word
8. TTS repeat on word completion
9. Basic game state machine (MENU → PRE_LAUNCH → PLAYING → WORD_COMPLETE)
10. Grade selection on start screen
11. Word database for all 6 grades (10 words each minimum)
12. Score tracking (in-session)
13. Level flow — 5 words per level, level complete screen

### Phase 2 — Polish
14. Sound effects (Web Audio API chimes)
15. Particle effects (ship trail, collection burst, word complete celebration)
16. Ship tilt animation on movement
17. Letter rotation animation
18. Hint glow system on next-needed letter
19. Star rating per word (based on wrong grabs)
20. CSS animations on blanks filling, popups appearing

### Phase 3 — Spaced Repetition
21. localStorage progress saving
22. Spaced repetition confidence tracking per word
23. Smart word selection (mix of new + review)
24. Word journal — collected words list with TTS replay
25. Stats on start screen (total words learned)

### Phase 4 — Extras
26. Power-ups
27. Difficulty scaling hints by grade
28. Decoy letter intelligence (similar looking letters)
29. Daily word challenge
30. Streak counter

---

## 14. FILE STRUCTURE

This should be built as a **single HTML file** (or single React .jsx artifact) containing:

```
<html>
  <head>
    <style> /* All CSS inline */ </style>
  </head>
  <body>
    <canvas id="game"></canvas>
    <div id="ui-layer"> /* All DOM overlays */ </div>
    <div id="start-screen"> /* Menu */ </div>
    <script>
      // WORD DATABASE
      // SPACED REPETITION ENGINE
      // AUDIO ENGINE (Web Audio API)
      // TTS ENGINE
      // GAME RENDERER (Canvas)
      // GAME STATE MACHINE
      // INPUT HANDLER (Touch)
      // PARTICLE SYSTEM
      // MAIN LOOP
    </script>
  </body>
</html>
```

No external dependencies. No build step. Single file runs in any modern mobile browser.

---

## 15. TESTING CHECKLIST

- [ ] Ship moves smoothly with swipe on iOS Safari
- [ ] Ship moves smoothly with swipe on Android Chrome
- [ ] Letters rain at correct speed per grade
- [ ] Correct letter collection triggers chime + blank fill
- [ ] Wrong letter collection triggers buzz + screen shake
- [ ] Letters must be collected in order (can't grab letter 3 before letter 2)
- [ ] TTS speaks word clearly before gameplay begins
- [ ] TTS speaks meaning after the word
- [ ] TTS repeats word on completion
- [ ] All 6 grades load correct words
- [ ] Level completes after 5 words
- [ ] Level complete screen shows all words with replay buttons
- [ ] Star rating calculates correctly
- [ ] Score persists across words within a level
- [ ] Spaced repetition saves to localStorage
- [ ] Review words appear in subsequent levels
- [ ] Game runs at 60 FPS on iPhone 12 / mid-range Android
- [ ] Game handles screen rotation gracefully
- [ ] Game handles browser tab switch and resume
- [ ] No memory leaks after 10+ levels

---

END OF SPECIFICATION

