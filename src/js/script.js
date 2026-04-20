const orbit = document.querySelector('[data-orbit]');
const particleCanvas = document.querySelector('[data-particle-text]');
const progressiveForm = document.querySelector('[data-progressive-form]');
const bookSliders = document.querySelectorAll('[data-book-slider]');
const transitionOverlay = document.createElement('div');

transitionOverlay.className = 'page-transition';
transitionOverlay.setAttribute('aria-hidden', 'true');
transitionOverlay.innerHTML = '<div class="page-transition-track"></div>';
document.body.appendChild(transitionOverlay);

const isModifiedNavigation = (event) => event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
const isSamePageLink = (url) => url.pathname === window.location.pathname && url.hash;

let pageTransitionAudio;
let pageTransitionStarted = false;

const getPageTransitionAudio = async () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!pageTransitionAudio) {
    pageTransitionAudio = new AudioContextClass();
  }

  if (pageTransitionAudio.state === 'suspended') {
    try {
      await pageTransitionAudio.resume();
    } catch (error) {
      return null;
    }
  }

  return pageTransitionAudio.state === 'running' ? pageTransitionAudio : null;
};

const playPageTransitionSound = async () => {
  const context = await getPageTransitionAudio();

  if (!context) {
    return;
  }

  const now = context.currentTime;
  const gain = context.createGain();
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(250, now);
  oscillator.frequency.exponentialRampToValueAtTime(760, now + 0.12);
  oscillator.frequency.exponentialRampToValueAtTime(420, now + 0.34);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(2100, now + 0.18);
  filter.Q.value = 0.95;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.36);
};

const startPageTransition = (href) => {
  if (pageTransitionStarted) {
    return;
  }

  pageTransitionStarted = true;
  document.body.classList.add('is-page-transitioning');
  transitionOverlay.classList.remove('is-active');
  void transitionOverlay.offsetWidth;
  transitionOverlay.classList.add('is-active');
  void playPageTransitionSound();

  window.setTimeout(() => {
    window.location.href = href;
  }, 520);
};

const warmPageTransitionAudio = () => {
  void getPageTransitionAudio();
};

document.addEventListener('pointerdown', warmPageTransitionAudio, { passive: true });
document.addEventListener('keydown', warmPageTransitionAudio);

window.addEventListener('pageshow', () => {
  pageTransitionStarted = false;
  document.body.classList.remove('is-page-transitioning');
  transitionOverlay.classList.remove('is-active');
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');

  if (!link) {
    return;
  }

  if (link.hasAttribute('download') || link.target === '_blank' || isModifiedNavigation(event)) {
    return;
  }

  const href = link.getAttribute('href');

  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
    return;
  }

  let url;

  try {
    url = new URL(link.href, window.location.href);
  } catch (error) {
    return;
  }

  if (url.origin !== window.location.origin || isSamePageLink(url)) {
    return;
  }

  event.preventDefault();
  startPageTransition(url.href);
});

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
    const phaseIndex = Math.floor(frame / config.changeThreshold) % words.length;

    if (phaseIndex !== wordIndex) {
      wordIndex = phaseIndex;
      applyTargets(words[wordIndex]);
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
  const statusMessage = progressiveForm.querySelector('[data-form-status]');
  const accessKeyField = progressiveForm.querySelector('input[name="access_key"]');

  const hasValue = (field) => field.value.trim().length > 0;
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const setStatus = (message, type = '') => {
    if (!statusMessage) {
      return;
    }

    statusMessage.textContent = message;
    statusMessage.classList.remove('is-success', 'is-error');

    if (type) {
      statusMessage.classList.add(type);
    }
  };

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

  progressiveForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!fields.every(isFieldComplete)) {
      setStatus('Complete all fields before sending.', 'is-error');
      return;
    }

    if (!accessKeyField || accessKeyField.value === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      setStatus('Add your Web3Forms access key in the contact form before sending.', 'is-error');
      return;
    }

    const originalButtonText = submitButton ? submitButton.textContent : '';
    const formData = new FormData(progressiveForm);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    setStatus('Sending your message...', '');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Something went wrong while sending the message.');
      }

      progressiveForm.reset();
      setStatus('Message sent successfully. Check your inbox for the new contact mail.', 'is-success');
    } catch (error) {
      setStatus(error.message || 'Failed to send the message.', 'is-error');
    } finally {
      if (submitButton) {
        submitButton.textContent = originalButtonText;
      }

      updateProgressiveForm();
    }
  });

  updateProgressiveForm();
}

if (bookSliders.length) {
  let audioContext;
  let audioEnabled = false;

  const getAudioContext = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (error) {
        return null;
      }
    }

    audioEnabled = audioContext.state === 'running';
    return audioEnabled ? audioContext : null;
  };

  const warmFlipAudio = async () => {
    const context = await getAudioContext();

    if (!context) {
      return false;
    }

    return true;
  };

  const playPageFlipSound = async () => {
    const context = await getAudioContext();

    if (!context) {
      return;
    }

    const now = context.currentTime;
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(340, now);
    oscillator.frequency.exponentialRampToValueAtTime(120, now + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.value = 0.7;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.24);
  };

  const isTypingContext = (element) => {
    if (!element) {
      return false;
    }

    const tagName = element.tagName;
    return element.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
  };

  const primeAudioFromInteraction = () => {
    if (audioEnabled) {
      return;
    }

    warmFlipAudio();
  };

  document.addEventListener('pointerdown', primeAudioFromInteraction, { passive: true });
  document.addEventListener('keydown', primeAudioFromInteraction);

  bookSliders.forEach((slider) => {
    const pages = Array.from(slider.querySelectorAll('[data-book-page]'));
    const prevButton = slider.querySelector('[data-book-prev]');
    const nextButton = slider.querySelector('[data-book-next]');
    const currentLabel = slider.querySelector('[data-book-current]');
    const totalLabel = slider.querySelector('[data-book-total]');
    let activeIndex = 0;

    const renderBook = () => {
      pages.forEach((page, index) => {
        page.classList.remove('is-active', 'is-next', 'is-after', 'is-prev', 'is-hidden');

        if (index === activeIndex) {
          page.classList.add('is-active');
        } else if (index === activeIndex + 1) {
          page.classList.add('is-next');
        } else if (index === activeIndex + 2) {
          page.classList.add('is-after');
        } else if (index < activeIndex) {
          page.classList.add('is-prev');
        } else {
          page.classList.add('is-hidden');
        }
      });

      if (currentLabel) {
        currentLabel.textContent = String(activeIndex + 1);
      }

      if (totalLabel) {
        totalLabel.textContent = String(pages.length);
      }

      if (prevButton) {
        prevButton.disabled = activeIndex === 0;
      }

      if (nextButton) {
        nextButton.disabled = activeIndex === pages.length - 1;
      }
    };

    const goPrevious = () => {
      if (activeIndex > 0) {
        activeIndex -= 1;
        renderBook();
        void playPageFlipSound();
      }
    };

    const goNext = () => {
      if (activeIndex < pages.length - 1) {
        activeIndex += 1;
        renderBook();
        void playPageFlipSound();
      }
    };

    prevButton?.addEventListener('click', goPrevious);
    nextButton?.addEventListener('click', goNext);

    pages.forEach((page, index) => {
      page.addEventListener('click', (event) => {
        const rect = page.getBoundingClientRect();
        const clickedLeftSide = event.clientX - rect.left < rect.width * 0.42;

        if (index === activeIndex && !clickedLeftSide) {
          goNext();
          return;
        }

        if (index === activeIndex && clickedLeftSide) {
          goPrevious();
          return;
        }

        if (index < activeIndex) {
          goPrevious();
          return;
        }

        if (index > activeIndex) {
          goNext();
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (isTypingContext(document.activeElement)) {
        return;
      }

      const rect = slider.getBoundingClientRect();
      const inView = rect.bottom > 120 && rect.top < window.innerHeight - 120;

      if (!inView) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    });

    renderBook();
  });
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
