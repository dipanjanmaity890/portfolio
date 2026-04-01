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
