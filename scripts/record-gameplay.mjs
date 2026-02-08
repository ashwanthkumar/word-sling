#!/usr/bin/env node
/**
 * Playwright script to record a Word Sling gameplay demo video.
 *
 * Usage:
 *   1. Start dev server:  npm run dev
 *   2. Record:            node scripts/record-gameplay.mjs
 *
 * The video is saved to recordings/
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RECORDINGS_DIR = path.join(ROOT, 'recordings');

// --- Config ---
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/word-sling/';
const VIEWPORT = { width: 393, height: 852 }; // iPhone 14 Pro
const WORDS_TO_PLAY = 2;
const POLL_MS = 50;
const COLLISION_RADIUS = 1.2;
const SAFETY_MARGIN = 0.5;

// ---------------------------------------------------------------------------

async function waitForState(page, state, timeoutMs = 30_000) {
  await page.waitForFunction(
    (s) => window.game && window.game.state === s,
    state,
    { timeout: timeoutMs },
  );
}

async function waitForGameReady(page) {
  await page.waitForFunction(() => !!window.game, null, { timeout: 15_000 });
}

/**
 * Single page.evaluate call that returns everything needed for one tick:
 * game state, world-space info, AND screen-space coordinates.
 */
function makeGetTick() {
  return (params) => {
    const { collisionRadius, safetyMargin } = params;
    const g = window.game;
    if (!g) return null;

    const ship = g.systems.find((s) => typeof s.getPosition === 'function');
    const spawner = g.systems.find((s) => typeof s.getLetters === 'function');
    if (!ship || !spawner) return null;

    const shipPos = ship.getPosition();
    const word = g.currentWord;
    const nextIdx = g.nextLetterIndex;
    const letters = spawner.getLetters();
    const bounds = g.getPlayBounds();
    const dangerR = collisionRadius + safetyMargin;

    // Full 3D→screen projection
    const cam = g.camera;
    const screenW = g.renderer.domElement.clientWidth;
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();

    const toScreenX = (wx, wy) => {
      const e = cam.matrixWorldInverse.elements;
      const vx = e[0]*wx + e[4]*wy + e[8]*0 + e[12];
      const vy = e[1]*wx + e[5]*wy + e[9]*0 + e[13];
      const vz = e[2]*wx + e[6]*wy + e[10]*0 + e[14];
      const vw = e[3]*wx + e[7]*wy + e[11]*0 + e[15];
      const p = cam.projectionMatrix.elements;
      const cx = p[0]*vx + p[4]*vy + p[8]*vz + p[12]*vw;
      const cw = p[3]*vx + p[7]*vy + p[11]*vz + p[15]*vw;
      if (Math.abs(cw) < 0.0001) return screenW / 2;
      return (cx / cw * 0.5 + 0.5) * screenW;
    };

    const neededChar = word && nextIdx < word.length ? word[nextIdx] : null;

    let target = null;
    let bestY = Infinity;
    const hazards = [];

    for (const l of letters) {
      if (!l.alive) continue;
      const lx = l.mesh.position.x;
      const ly = l.mesh.position.y;

      if (l.char === neededChar && ly > shipPos.y && ly < bestY) {
        bestY = ly;
        target = { x: lx, y: ly };
      }

      const isInWord = word && word.includes(l.char);
      const isNext = l.char === neededChar;
      if (!isNext && !isInWord) {
        const dy = ly - shipPos.y;
        if (dy > -dangerR && dy < dangerR * 4) {
          hazards.push({ x: lx, y: ly });
        }
      }
    }

    // Compute ship screen X
    const shipScreenX = toScreenX(shipPos.x, shipPos.y);

    // Now decide target world X using hazard avoidance
    let goalWorldX = null;
    let goalScreenX = null;

    if (target) {
      const dy = target.y - shipPos.y;
      if (dy <= 6) {
        // Check if moving from current X to candidate X would pass through
        // any hazard, or if a hazard sits at the candidate position
        const pathSafe = (destX) => {
          const minX = Math.min(shipPos.x, destX) - dangerR;
          const maxX = Math.max(shipPos.x, destX) + dangerR;
          for (const h of hazards) {
            const hdy = h.y - shipPos.y;
            if (hdy < -dangerR || hdy > dangerR * 2) continue;
            // Is this hazard in the horizontal sweep zone?
            if (h.x >= minX && h.x <= maxX) return false;
          }
          return true;
        };

        if (pathSafe(target.x)) {
          goalWorldX = target.x;
        } else {
          // Try offsets around target
          for (let off = 0.5; off < 3; off += 0.5) {
            const lx = target.x - off;
            const rx = target.x + off;
            if (lx > bounds.left + 1 && pathSafe(lx)) { goalWorldX = lx; break; }
            if (rx < bounds.right - 1 && pathSafe(rx)) { goalWorldX = rx; break; }
          }
        }

        if (goalWorldX !== null) {
          goalScreenX = toScreenX(goalWorldX, shipPos.y);
        }
      }
    }

    return {
      state: g.state,
      word,
      nextIdx,
      wordLen: word ? word.length : 0,
      shipScreenX,
      goalScreenX,
    };
  };
}

// ---------------------------------------------------------------------------

async function playWord(page) {
  const cx = VIEWPORT.width / 2;
  const cy = VIEWPORT.height * 0.75;

  const word = await page.evaluate(() => window.game.currentWord);
  console.log(`Playing word: "${word}"`);

  // Start mouse drag
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  let currentMouseX = cx;

  const getTick = makeGetTick();
  const tickParams = { collisionRadius: COLLISION_RADIUS, safetyMargin: SAFETY_MARGIN };

  let stuckCounter = 0;
  let lastNextIdx = -1;
  let justCollected = false;
  let safeFrames = 0;

  while (true) {
    const tick = await page.evaluate(getTick, tickParams);
    if (!tick) break;
    if (tick.state !== 'PLAYING') break;
    if (tick.nextIdx >= tick.wordLen) break;

    // Track progress
    if (tick.nextIdx !== lastNextIdx) {
      if (lastNextIdx >= 0 && tick.nextIdx > lastNextIdx) {
        console.log(`  Collected ${tick.nextIdx}/${tick.wordLen}: "${tick.word[tick.nextIdx - 1]}"`);
        justCollected = true;
        safeFrames = 0;
      }
      stuckCounter = 0;
      lastNextIdx = tick.nextIdx;
    } else {
      stuckCounter++;
      if (justCollected) {
        safeFrames++;
        if (safeFrames > 8) justCollected = false;
      }
    }

    // Safety: if stuck too long, restart drag from center
    if (stuckCounter > 500) {
      console.log('  Resetting drag (stuck)...');
      await page.mouse.up();
      await page.waitForTimeout(200);
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      currentMouseX = cx;
      stuckCounter = 0;
    }

    // After collecting, hold position briefly to avoid wrong letters
    if (justCollected) {
      await page.waitForTimeout(POLL_MS);
      continue;
    }

    if (tick.goalScreenX !== null) {
      const delta = tick.goalScreenX - tick.shipScreenX;
      const step = delta * 0.6;
      const newMouseX = currentMouseX + step;
      const clampedX = Math.max(10, Math.min(VIEWPORT.width - 10, newMouseX));
      await page.mouse.move(clampedX, cy);
      currentMouseX = clampedX;
    }

    await page.waitForTimeout(POLL_MS);
  }

  await page.mouse.up();
  console.log('Word completed!');
}

// ---------------------------------------------------------------------------

(async () => {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: VIEWPORT,
    },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  console.log(`Navigating to ${BASE_URL}`);
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  console.log('Waiting for game to initialize...');
  await waitForGameReady(page);

  await page.evaluate(() => { window.game.difficulty = 'easy'; });

  await page.waitForTimeout(2000);

  console.log('Selecting easy difficulty...');
  const easyBtn = page.locator('.diff-btn[data-diff="easy"]');
  if (await easyBtn.isVisible()) {
    await easyBtn.click();
    await page.waitForTimeout(500);
  }

  for (let w = 0; w < WORDS_TO_PLAY; w++) {
    console.log(`\n--- Word ${w + 1}/${WORDS_TO_PLAY} ---`);

    if (w === 0) {
      console.log('Clicking LAUNCH...');
      const launchBtn = page.locator('.launch-btn');
      await launchBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await launchBtn.click();
    }

    console.log('Waiting for PLAYING state...');
    await waitForState(page, 'PLAYING', 20_000);
    await page.waitForTimeout(600);

    await playWord(page);

    if (w < WORDS_TO_PLAY - 1) {
      console.log('Waiting for word complete...');
      try { await waitForState(page, 'WORD_COMPLETE', 5_000); } catch { /* ok */ }
      console.log('Waiting for next word cycle...');
    }
  }

  console.log('\nWaiting for word complete to finish...');
  try { await waitForState(page, 'WORD_COMPLETE', 5_000); } catch { /* ok */ }
  try { await waitForState(page, 'PRE_LAUNCH', 10_000); } catch { /* ok */ }

  await page.waitForTimeout(500);

  console.log('Clicking quit to return to menu...');
  const quitBtn = page.locator('.quit-btn');
  try {
    await quitBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await quitBtn.click();
  } catch {
    try {
      await waitForState(page, 'PLAYING', 15_000);
      await page.waitForTimeout(300);
      await page.locator('.quit-btn').click();
    } catch {
      console.log('Forcing MENU state...');
      await page.evaluate(() => window.game.setState('MENU'));
    }
  }

  await waitForState(page, 'MENU', 5_000);
  console.log('Back at menu!');

  await page.waitForTimeout(1500);
  console.log('Opening credits...');
  const creditsBtn = page.locator('.credits-btn');
  if (await creditsBtn.isVisible()) {
    await creditsBtn.click();
  }
  await page.waitForTimeout(4000);

  console.log('Closing credits...');
  const creditsOverlay = page.locator('.credits-overlay');
  if (await creditsOverlay.isVisible()) {
    await creditsOverlay.click();
  }
  await page.waitForTimeout(1500);

  console.log('Closing browser and saving video...');
  await page.close();
  await context.close();
  await browser.close();

  const files = fs.readdirSync(RECORDINGS_DIR).filter((f) => f.endsWith('.webm'));
  if (files.length > 0) {
    const latest = files.sort().pop();
    console.log(`\nVideo saved: ${path.join(RECORDINGS_DIR, latest)}`);
  } else {
    console.log('\nNo video file found in recordings/');
  }
})();
