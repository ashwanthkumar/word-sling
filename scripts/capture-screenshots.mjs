#!/usr/bin/env node
/**
 * Playwright script to capture Word Sling screenshots for the README.
 *
 * Usage:
 *   1. Start dev server:  npm run dev
 *   2. Capture:           node scripts/capture-screenshots.mjs
 *
 * Saves PNGs to screenshots/
 */

import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'screenshots');

// --- Config ---
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/word-sling/';
const VIEWPORT = { width: 393, height: 852 }; // iPhone 14 Pro
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

    const shipScreenX = toScreenX(shipPos.x, shipPos.y);

    let goalWorldX = null;
    let goalScreenX = null;

    if (target) {
      const dy = target.y - shipPos.y;
      if (dy <= 6) {
        const pathSafe = (destX) => {
          const minX = Math.min(shipPos.x, destX) - dangerR;
          const maxX = Math.max(shipPos.x, destX) + dangerR;
          for (const h of hazards) {
            const hdy = h.y - shipPos.y;
            if (hdy < -dangerR || hdy > dangerR * 2) continue;
            if (h.x >= minX && h.x <= maxX) return false;
          }
          return true;
        };

        if (pathSafe(target.x)) {
          goalWorldX = target.x;
        } else {
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

async function collectLetters(page, count) {
  const cx = VIEWPORT.width / 2;
  const cy = VIEWPORT.height * 0.75;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  let currentMouseX = cx;

  const getTick = makeGetTick();
  const tickParams = { collisionRadius: COLLISION_RADIUS, safetyMargin: SAFETY_MARGIN };

  let collected = 0;
  let stuckCounter = 0;
  let lastNextIdx = -1;
  let justCollected = false;
  let safeFrames = 0;

  while (collected < count) {
    const tick = await page.evaluate(getTick, tickParams);
    if (!tick) break;
    if (tick.state !== 'PLAYING') break;
    if (tick.nextIdx >= tick.wordLen) break;

    if (tick.nextIdx !== lastNextIdx) {
      if (lastNextIdx >= 0 && tick.nextIdx > lastNextIdx) {
        collected++;
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

    if (stuckCounter > 500) {
      await page.mouse.up();
      await page.waitForTimeout(200);
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      currentMouseX = cx;
      stuckCounter = 0;
    }

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
  return collected;
}

async function playFullWord(page) {
  const cx = VIEWPORT.width / 2;
  const cy = VIEWPORT.height * 0.75;

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

    if (tick.nextIdx !== lastNextIdx) {
      if (lastNextIdx >= 0 && tick.nextIdx > lastNextIdx) {
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

    if (stuckCounter > 500) {
      await page.mouse.up();
      await page.waitForTimeout(200);
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      currentMouseX = cx;
      stuckCounter = 0;
    }

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
}

// ---------------------------------------------------------------------------

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOTS_DIR, name);
  await page.screenshot({ path: filePath });
  console.log(`  Saved ${name}`);
}

// ---------------------------------------------------------------------------

(async () => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader'],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
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

  // Select easy difficulty
  const easyBtn = page.locator('.diff-btn[data-diff="easy"]');
  if (await easyBtn.isVisible()) {
    await easyBtn.click();
    await page.waitForTimeout(500);
  }

  // --- 1. Menu screenshot ---
  console.log('\n1. Capturing menu...');
  await waitForState(page, 'MENU');
  await page.waitForTimeout(500);
  await screenshot(page, 'menu.png');

  // --- 2. Word intro screenshot ---
  console.log('\n2. Capturing word intro...');
  const launchBtn = page.locator('.launch-btn');
  await launchBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await launchBtn.click();
  await waitForState(page, 'PRE_LAUNCH', 10_000);
  // Wait for the word intro animation
  await page.waitForTimeout(1500);
  await screenshot(page, 'word-intro.png');

  // --- 3. Gameplay screenshot (collect 1-2 letters) ---
  console.log('\n3. Capturing gameplay...');
  await waitForState(page, 'PLAYING', 20_000);
  await page.waitForTimeout(800);
  // Collect 1-2 letters for a mid-game feel
  await collectLetters(page, 2);
  await page.waitForTimeout(300);
  await screenshot(page, 'gameplay.png');

  // --- 4. Gameplay with power-up (shield) ---
  console.log('\n4. Capturing gameplay with shield power-up...');
  await page.evaluate(() => {
    const pm = window.game.systems.find(s => typeof s.activateShield === 'function');
    if (pm) pm.activateShield();
  });
  await page.waitForTimeout(500);
  await screenshot(page, 'gameplay-powerup.png');

  // --- 5. Word complete screenshot ---
  console.log('\n5. Capturing word complete...');
  // Finish the current word
  await playFullWord(page);
  try {
    await waitForState(page, 'WORD_COMPLETE', 10_000);
  } catch {
    console.log('  (word might have already transitioned)');
  }
  await page.waitForTimeout(1000);
  await screenshot(page, 'word-complete.png');

  // --- 6. Credits screenshot ---
  console.log('\n6. Capturing credits...');
  // Wait for cycle back to PRE_LAUNCH, then quit to menu
  try {
    await waitForState(page, 'PRE_LAUNCH', 15_000);
  } catch {
    // Force back to menu if stuck
    await page.evaluate(() => window.game.setState('MENU'));
  }

  // Click quit to return to menu
  const quitBtn = page.locator('.quit-btn');
  try {
    await quitBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await quitBtn.click();
  } catch {
    await page.evaluate(() => window.game.setState('MENU'));
  }

  await waitForState(page, 'MENU', 5_000);
  await page.waitForTimeout(500);

  const creditsBtn = page.locator('.credits-btn');
  if (await creditsBtn.isVisible()) {
    await creditsBtn.click();
  }
  await page.waitForTimeout(1500);
  await screenshot(page, 'credits.png');

  // Done
  console.log('\nAll screenshots captured!');
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  console.log(`Files in screenshots/: ${files.join(', ')}`);

  await page.close();
  await context.close();
  await browser.close();
})();
