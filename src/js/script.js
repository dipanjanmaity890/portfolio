const orbit = document.querySelector('[data-orbit]');
const particleCanvas = document.querySelector('[data-particle-text]');
const progressiveForm = document.querySelector('[data-progressive-form]');

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

if (particleCanvas) {
  const context = particleCanvas.getContext('2d');
  const words = ['PYTHON', 'JAVA', 'C++', 'C', 'HTML', 'CSS', 'JS'];
  const particles = [];
  const offscreenCanvas = document.createElement('canvas');
  const offscreenContext = offscreenCanvas.getContext('2d', { willReadFrequently: true });
  const config = {
    dwellFrames: 220,
    changeThreshold: 100,
    particleSize: 2.2,
    idleJitter: 0.12
  };

  let frame = 0;
  let wordIndex = 0;
  let animationFrameId = 0;
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let pointer = {
    x: null,
    y: null,
    active: false
  };

  const getFontSize = () => {
    if (width < 520) return Math.max(58, width * 0.16);
    if (width < 900) return Math.max(88, width * 0.15);
    return Math.max(120, width * 0.14);
  };

  const createTextTargets = (word) => {
    const fontSize = getFontSize();
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    offscreenContext.clearRect(0, 0, width, height);
    offscreenContext.fillStyle = '#ffffff';
    offscreenContext.textAlign = 'center';
    offscreenContext.textBaseline = 'middle';
    offscreenContext.font = `800 ${fontSize}px Syne, sans-serif`;
    offscreenContext.fillText(word, width / 2, height / 2);

    const image = offscreenContext.getImageData(0, 0, width, height).data;
    const gap = Math.max(5, Math.round(width / 190));
    const targets = [];

    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const alpha = image[(y * width + x) * 4 + 3];

        if (alpha > 150) {
          targets.push({
            x,
            y
          });
        }
      }
    }

    return targets;
  };

  const randomEdgePosition = () => {
    const side = Math.floor(Math.random() * 4);

    if (side === 0) {
      return { x: Math.random() * width, y: -20 - Math.random() * 50 };
    }

    if (side === 1) {
      return { x: width + 20 + Math.random() * 50, y: Math.random() * height };
    }

    if (side === 2) {
      return { x: Math.random() * width, y: height + 20 + Math.random() * 50 };
    }

    return { x: -20 - Math.random() * 50, y: Math.random() * height };
  };

  const applyTargets = (word) => {
    const targets = createTextTargets(word);
    const count = Math.max(targets.length, 260);

    while (particles.length < count) {
      const start = randomEdgePosition();
      particles.push({
        x: start.x,
        y: start.y,
        vx: 0,
        vy: 0,
        targetX: start.x,
        targetY: start.y,
        baseX: start.x,
        baseY: start.y
      });
    }

    particles.length = count;

    for (let index = 0; index < count; index += 1) {
      const particle = particles[index];
      const target = targets[index % targets.length] || randomEdgePosition();

      particle.targetX = target.x;
      particle.targetY = target.y;
      particle.baseX = target.x;
      particle.baseY = target.y;
    }
  };

  const resizeParticleCanvas = () => {
    const bounds = particleCanvas.getBoundingClientRect();
    width = Math.max(320, Math.round(bounds.width));
    height = Math.max(360, Math.round(bounds.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    particleCanvas.width = width * dpr;
    particleCanvas.height = height * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    applyTargets(words[wordIndex]);
  };

  const updatePointer = (event) => {
    const rect = particleCanvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  };

  const clearPointer = () => {
    pointer.active = false;
  };

  const drawFrame = () => {
    frame += 1;

    if (frame > config.dwellFrames && frame % config.changeThreshold === 0) {
      wordIndex = (wordIndex + 1) % words.length;
      applyTargets(words[wordIndex]);
    }

    if (frame > config.dwellFrames + config.changeThreshold * words.length) {
      frame = config.dwellFrames;
    }

    context.clearRect(0, 0, width, height);
    const gradient = context.createRadialGradient(width * 0.5, height * 0.46, 10, width * 0.5, height * 0.46, width * 0.54);
    gradient.addColorStop(0, 'rgba(99, 210, 255, 0.08)');
    gradient.addColorStop(1, 'rgba(99, 210, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    for (const particle of particles) {
      if (pointer.active) {
        const dxPointer = particle.x - pointer.x;
        const dyPointer = particle.y - pointer.y;
        const pointerDistance = Math.hypot(dxPointer, dyPointer) || 1;

        if (pointerDistance < 90) {
          const repulse = (90 - pointerDistance) * 0.018;
          particle.vx += (dxPointer / pointerDistance) * repulse;
          particle.vy += (dyPointer / pointerDistance) * repulse;
        }
      }

      const offsetX = Math.sin((frame + particle.baseY) * 0.02) * 4;
      const offsetY = Math.cos((frame + particle.baseX) * 0.018) * 4;
      const targetX = particle.targetX + offsetX;
      const targetY = particle.targetY + offsetY;
      const dx = targetX - particle.x;
      const dy = targetY - particle.y;

      particle.vx += dx * 0.028;
      particle.vy += dy * 0.028;
      particle.vx *= 0.84;
      particle.vy *= 0.84;
      particle.x += particle.vx + (Math.random() - 0.5) * config.idleJitter;
      particle.y += particle.vy + (Math.random() - 0.5) * config.idleJitter;

      const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, 7);
      glow.addColorStop(0, 'rgba(255,255,255,0.95)');
      glow.addColorStop(0.35, 'rgba(99,210,255,0.95)');
      glow.addColorStop(1, 'rgba(99,210,255,0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(particle.x, particle.y, config.particleSize + 3, 0, Math.PI * 2);
      context.fill();
    }

    animationFrameId = window.requestAnimationFrame(drawFrame);
  };

  resizeParticleCanvas();
  drawFrame();

  particleCanvas.addEventListener('pointermove', updatePointer);
  particleCanvas.addEventListener('pointerleave', clearPointer);
  window.addEventListener('resize', resizeParticleCanvas);
  window.addEventListener('beforeunload', () => {
    window.cancelAnimationFrame(animationFrameId);
  });
}

if (progressiveForm) {
  const fields = Array.from(progressiveForm.querySelectorAll('[data-step-field]'));
  const submitButton = progressiveForm.querySelector('.form-submit');

  const hasValue = (field) => field.value.trim().length > 0;
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const isFieldComplete = (field) => {
    if (!hasValue(field)) {
      return false;
    }

    if (field.type === 'email') {
      return isValidEmail(field.value);
    }

    return true;
  };

  const updateProgressiveForm = () => {
    let previousFieldsComplete = true;

    fields.forEach((field, index) => {
      if (index === 0) {
        field.disabled = false;
      } else {
        field.disabled = !previousFieldsComplete;
      }

      if (field.disabled) {
        field.value = '';
      }

      previousFieldsComplete = previousFieldsComplete && isFieldComplete(field);
    });

    if (submitButton) {
      submitButton.disabled = !fields.every(isFieldComplete);
    }
  };

  fields.forEach((field) => {
    field.addEventListener('input', updateProgressiveForm);
    field.addEventListener('blur', updateProgressiveForm);
  });

  progressiveForm.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  updateProgressiveForm();
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
