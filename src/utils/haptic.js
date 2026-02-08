// Haptic feedback utility — works on iOS Safari 18+ and Android
// Based on the technique from https://github.com/posaune0423/use-haptic

const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

let labelEl = null;
let inputEl = null;

function ensureElements() {
  if (labelEl) return;

  inputEl = document.createElement('input');
  inputEl.type = 'checkbox';
  inputEl.setAttribute('switch', '');
  inputEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
  inputEl.id = '_haptic_switch';

  labelEl = document.createElement('label');
  labelEl.htmlFor = '_haptic_switch';
  labelEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';

  document.body.appendChild(inputEl);
  document.body.appendChild(labelEl);
}

export function triggerHaptic(duration = 5) {
  if (!isIOS && navigator.vibrate) {
    navigator.vibrate(duration);
  } else {
    ensureElements();
    labelEl.click();
  }
}
