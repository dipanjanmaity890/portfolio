const orbit = document.querySelector('[data-orbit]');

if (orbit) {
  const updateOrbit = () => {
    const rect = orbit.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const total = rect.height + viewportHeight;
    const traveled = viewportHeight - rect.top;
    const progress = Math.min(Math.max(traveled / total, 0), 1);
    const ringRotation = progress * 220;
    const logoRotation = progress * -300;

    orbit.style.setProperty('--orbit-rotation', `${ringRotation}deg`);
    orbit.style.setProperty('--logo-rotation', `${logoRotation}deg`);
  };

  updateOrbit();
  window.addEventListener('scroll', updateOrbit, { passive: true });
  window.addEventListener('resize', updateOrbit);
}

document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

document.addEventListener('copy', (event) => {
  event.preventDefault();
});

document.addEventListener('cut', (event) => {
  event.preventDefault();
});

document.addEventListener('selectstart', (event) => {
  event.preventDefault();
});

document.addEventListener('dragstart', (event) => {
  event.preventDefault();
});

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  const blockedCombo = (event.ctrlKey || event.metaKey) && ['a', 'c', 'x', 's', 'u', 'p'].includes(key);

  if (blockedCombo || key === 'f12') {
    event.preventDefault();
  }
});
