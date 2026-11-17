import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../assets/js/aircraft.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { getSceneProgress, getExplosion, getSceneStep } = await import(moduleUrl);
const approximately = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);

assert.equal(getSceneProgress(100, 3000, 1000), 0);
assert.equal(getSceneProgress(-1000, 3000, 1000), 0.5);
assert.equal(getSceneProgress(-3000, 3000, 1000), 1);
for (const dimensions of [[-1, 0, 1000], [-1, 1000, 1000], [-1, 500, 1000], [-1, 3000, 0], [NaN, 3000, 1000], [-1, Infinity, 1000]]) {
  assert.equal(getSceneProgress(...dimensions), 0);
}
for (const progress of [-1, 0, 0.1, 0.9, 1, 2, NaN, Infinity]) assert.equal(getExplosion(progress), 0);
for (const progress of [0.45, 0.5, 0.6]) assert.equal(getExplosion(progress), 1);
approximately(getExplosion(0.275), 0.5);
approximately(getExplosion(0.75), 0.5);
for (let index = 0; index <= 100; index += 1) {
  const progress = index / 100;
  const explosion = getExplosion(progress);
  assert.ok(Number.isFinite(explosion) && explosion >= 0 && explosion <= 1);
  if (progress < 0.44) assert.ok(explosion <= getExplosion(progress + 0.01));
  if (progress > 0.6) assert.ok(explosion >= getExplosion(progress + 0.01));
}
assert.deepEqual([-1, NaN, 0.29, 0.3, 0.77, 0.78, 2].map(getSceneStep), [0, 0, 0, 1, 1, 2, 2]);

// A small DOM fixture checks switching without moving the scroll position or animating hidden parts.
function element(dataset = {}) {
  const attributes = new Map();
  return {
    dataset, attributes, events: {}, hidden: false, textContent: '',
    style: { setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } },
    classList: { toggle() {} },
    setAttribute(key, value) { attributes.set(key, value); },
    removeAttribute(key) { attributes.delete(key); },
    hasAttribute(key) { return attributes.has(key); },
    toggleAttribute(key, enabled) { if (enabled) attributes.set(key, ''); else attributes.delete(key); },
    addEventListener(type, callback) { this.events[type] = callback; },
  };
}
const helicopterPart = element({ explodeX: '100', explodeY: '-50', explodeRotate: '12' });
const fixedWingPart = element({ explodeX: '100', explodeY: '-50', explodeRotate: '12' });
const helicopter = element({ aircraftModel: 'helicopter' });
const fixedWing = element({ aircraftModel: 'fixed-wing' });
helicopter.querySelectorAll = () => [helicopterPart];
fixedWing.querySelectorAll = () => [fixedWingPart];
fixedWing.setAttribute('hidden', '');
const helicopterButton = element({ aircraftSelect: 'helicopter' });
const fixedWingButton = element({ aircraftSelect: 'fixed-wing' });
const selector = element();
selector.hidden = true;
const family = element({ helicopter: 'Rotores y transmisión', fixedWing: 'Motores y componentes' });
const label = element({ helicopter: 'Helicóptero', fixedWing: 'Ala fija' });
const state = element();
const bar = element();
const scene = element({ stateAssembled: 'Ensamblada', stateExploded: 'Separada', stateReassembled: 'Reensamblada' });
let top = -1000;
scene.offsetHeight = 3000;
scene.getBoundingClientRect = () => ({ top });
scene.querySelectorAll = (query) => ({
  '[data-aircraft-model]': [helicopter, fixedWing],
  '[data-aircraft-select]': [helicopterButton, fixedWingButton],
  '[data-aircraft-step]': [element(), element(), element()],
}[query] || []);
scene.querySelector = (query) => ({
  '[data-aircraft-selector]': selector,
  '[data-aircraft-family]': family,
  '[data-aircraft-model-label]': label,
  '[data-aircraft-state]': state,
  '[data-aircraft-progress]': bar,
}[query] || null);
const preference = element();
const shortViewport = element();
preference.matches = shortViewport.matches = false;
const listeners = {};
let queuedFrame;
globalThis.document = { querySelector: () => scene };
globalThis.window = {
  innerHeight: 1000,
  matchMedia: (query) => query.includes('reduced-motion') ? preference : shortViewport,
  addEventListener: (type, callback) => { listeners[type] = callback; },
  requestAnimationFrame: (callback) => { queuedFrame = callback; return 1; },
  cancelAnimationFrame: () => { queuedFrame = undefined; },
};
try {
  await import(`${moduleUrl}#scene`);
  assert.equal(selector.hidden, false);
  assert.equal(helicopter.hasAttribute('hidden'), false);
  assert.equal(fixedWing.hasAttribute('hidden'), true);
  assert.equal(helicopterPart.style.transform, 'translate(100px, -50px) rotate(12deg)');
  assert.equal(fixedWingPart.style.transform, undefined);
  fixedWingButton.events.click();
  assert.equal(helicopter.hasAttribute('hidden'), true);
  assert.equal(fixedWing.hasAttribute('hidden'), false);
  assert.equal(fixedWingButton.attributes.get('aria-pressed'), 'true');
  assert.equal(helicopterButton.attributes.get('aria-pressed'), 'false');
  assert.equal(family.textContent, 'Motores y componentes');
  assert.equal(label.textContent, 'Ala fija');
  assert.equal(fixedWingPart.style.transform, helicopterPart.style.transform);
  assert.equal(bar.style.transform, 'scaleX(0.5)');
  top = -1500;
  listeners.scroll();
  queuedFrame();
  approximately(Number(fixedWingPart.style.transform.match(/translate\(([^p]+)/)[1]), 50);
  assert.equal(helicopterPart.style.transform, 'translate(100px, -50px) rotate(12deg)');
  preference.matches = true;
  preference.events.change();
  assert.equal(fixedWingPart.style.transform, undefined);
  assert.equal(helicopterPart.style.transform, undefined);
  helicopterButton.events.click();
  assert.equal(label.textContent, 'Helicóptero');
  assert.equal(family.textContent, 'Rotores y transmisión');
  assert.equal(helicopterPart.style.transform, undefined);
  assert.equal(state.textContent, 'Ensamblada');
  preference.matches = false;
  preference.events.change();
  approximately(Number(helicopterPart.style.transform.match(/translate\(([^p]+)/)[1]), 50);
  shortViewport.matches = true;
  shortViewport.events.change();
  fixedWingButton.events.click();
  assert.equal(fixedWingPart.style.transform, undefined);
  assert.equal(helicopterPart.style.transform, undefined);
} finally {
  delete globalThis.document;
  delete globalThis.window;
}
console.log('Aircraft checks passed: scroll phases, model selection, hidden parts and static alternatives.');
