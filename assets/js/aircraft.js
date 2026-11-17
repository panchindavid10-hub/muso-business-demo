const clamp = (value) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
const smoothstep = (value) => value * value * (3 - 2 * value);

export function getSceneProgress(top, height, viewport) {
  if (![top, height, viewport].every(Number.isFinite) || viewport <= 0 || height <= viewport) return 0;
  return clamp(-top / (height - viewport));
}

export function getExplosion(progress) {
  const value = clamp(progress);
  if (value <= 0.1 || value >= 0.9) return 0;
  if (value < 0.45) return smoothstep((value - 0.1) / 0.35);
  if (value <= 0.6) return 1;
  return 1 - smoothstep((value - 0.6) / 0.3);
}

export function getSceneStep(progress) {
  const value = clamp(progress);
  return value < 0.3 ? 0 : value < 0.78 ? 1 : 2;
}

function setupAircraft() {
  const scene = document.querySelector('#aircraft-experience[data-aircraft-scene]');
  if (!scene) return;

  const parts = [...scene.querySelectorAll('[data-aircraft-part]')].map((element) => {
    const coordinate = (key) => {
      const value = Number(element.dataset[key]);
      return Number.isFinite(value) ? value : 0;
    };
    return { element, x: coordinate('explodeX'), y: coordinate('explodeY'), rotate: coordinate('explodeRotate') };
  });
  const steps = [...scene.querySelectorAll('[data-aircraft-step]')];
  const state = scene.querySelector('[data-aircraft-state]');
  const progressBar = scene.querySelector('[data-aircraft-progress]');
  const states = [scene.dataset.stateAssembled, scene.dataset.stateExploded, scene.dataset.stateReassembled];
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shortViewport = window.matchMedia('(max-height: 640px)');
  let staticScene = preference.matches || shortViewport.matches;
  let frame = 0;
  let active = true;
  let previousStep = -1;

  function paint(progress) {
    const amount = getExplosion(progress);
    scene.style.setProperty('--aircraft-explosion', String(amount));
    for (const { element, x, y, rotate } of parts) {
      if (staticScene) element.style.removeProperty('transform');
      else element.style.transform = `translate(${x * amount}px, ${y * amount}px) rotate(${rotate * amount}deg)`;
    }
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    const currentStep = getSceneStep(progress);
    if (currentStep === previousStep) return;
    previousStep = currentStep;
    steps.forEach((step, index) => {
      const current = index === currentStep;
      step.classList.toggle('is-active', current);
      if (current) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    if (state && states[currentStep]) state.textContent = states[currentStep];
  }

  function render() {
    frame = 0;
    paint(getSceneProgress(scene.getBoundingClientRect().top, scene.offsetHeight, window.innerHeight));
  }

  function schedule() {
    if (!staticScene && active && !frame) frame = window.requestAnimationFrame(render);
  }

  function updatePreference() {
    staticScene = preference.matches || shortViewport.matches;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    scene.classList.toggle('is-ready', !staticScene);
    // Read after the class change, since the static scene removes the sticky scene's extra height.
    if (staticScene) paint(0);
    else render();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) schedule();
      else if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { rootMargin: '100% 0px' });
    observer.observe(scene);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  preference.addEventListener('change', updatePreference);
  shortViewport.addEventListener('change', updatePreference);
  updatePreference();
}

if (typeof document !== 'undefined') setupAircraft();
