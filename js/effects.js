// Window Manager System
let highestZ = 20;
const mobileWindowQuery = window.matchMedia('(max-width: 767px)');
const lastWindowTrigger = new Map();
let mobileWindowHistory = ['win-home'];

function isMobileWindowMode() {
  return mobileWindowQuery.matches;
}

function setWindowVisibility(win, visible) {
  win.classList.toggle('is-hidden', !visible);
  win.inert = !visible;
  win.setAttribute('aria-hidden', String(!visible));
}

function updateWindowStates(activeId = null) {
  document.querySelectorAll('.win95-window').forEach((win) => {
    const active = win.id === activeId && !win.classList.contains('is-hidden');
    win.classList.toggle('is-inactive', !active);
  });

  document.querySelectorAll('[data-window-target]').forEach((button) => {
    const target = document.getElementById(button.dataset.windowTarget);
    const active = target?.id === activeId;
    const label = button.dataset.windowLabel;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
    if (isMobileWindowMode()) button.setAttribute('aria-label', `Open ${label}`);
    else if (active) button.setAttribute('aria-label', `Minimize ${label}`);
    else if (target && !target.classList.contains('is-hidden')) button.setAttribute('aria-label', `Activate ${label}`);
    else button.setAttribute('aria-label', `Open ${label}`);
  });
}

function getTopOpenWindow(excludeId = null) {
  return [...document.querySelectorAll('.win95-window:not(.is-hidden)')]
    .filter((win) => win.id !== excludeId)
    .sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0))[0] || null;
}

function focusWindowElement(win) {
  requestAnimationFrame(() => win.focus({ preventScroll: true }));
}

function focusWindow(winId) {
  const win = document.getElementById(winId);
  if (!win || win.classList.contains('is-hidden')) return;
  
  highestZ++;
  win.style.zIndex = highestZ;
  
  updateWindowStates(winId);
}

function openWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;

  const trigger = document.activeElement;
  if (trigger instanceof HTMLElement && trigger !== document.body && !win.contains(trigger)) {
    lastWindowTrigger.set(winId, trigger);
  }

  if (isMobileWindowMode()) {
    document.querySelectorAll('.win95-window').forEach((candidate) => {
      setWindowVisibility(candidate, candidate.id === winId);
    });
    mobileWindowHistory = mobileWindowHistory.filter((id) => id !== winId);
    mobileWindowHistory.push(winId);
  } else {
    setWindowVisibility(win, true);
  }

  SoundFX.open();
  focusWindow(winId);
  focusWindowElement(win);
}

function closeWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;

  setWindowVisibility(win, false);
  win.classList.remove('is-maximized');
  const maximizeButton = win.querySelector('[data-window-action="maximize"]');
  if (maximizeButton) {
    const name = win.dataset.windowName;
    maximizeButton.textContent = '□';
    maximizeButton.setAttribute('aria-label', `Maximize ${name} window`);
    maximizeButton.title = 'Maximize';
  }
  SoundFX.close();
  mobileWindowHistory = mobileWindowHistory.filter((id) => id !== winId);
  activateFallbackWindow(winId);
}

function minimizeWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;

  setWindowVisibility(win, false);
  mobileWindowHistory = mobileWindowHistory.filter((id) => id !== winId);
  activateFallbackWindow(winId);
}

function activateFallbackWindow(closedId) {
  let fallback = null;
  if (isMobileWindowMode()) {
    const previousId = mobileWindowHistory[mobileWindowHistory.length - 1] || 'win-home';
    fallback = document.getElementById(previousId);
    if (fallback) setWindowVisibility(fallback, true);
  } else {
    fallback = getTopOpenWindow(closedId);
  }

  if (fallback) {
    focusWindow(fallback.id);
    const storedTrigger = lastWindowTrigger.get(closedId);
    const trigger = storedTrigger?.closest?.('#start-menu')
      ? document.getElementById('btn-start')
      : storedTrigger;
    if (trigger instanceof HTMLElement && !trigger.inert && trigger.getClientRects().length > 0) {
      requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
    } else {
      focusWindowElement(fallback);
    }
    return;
  }

  updateWindowStates(null);
  const storedTrigger = lastWindowTrigger.get(closedId);
  const trigger = storedTrigger?.closest?.('#start-menu')
    ? document.getElementById('btn-start')
    : storedTrigger || document.getElementById(`task-${closedId}`);
  if (trigger instanceof HTMLElement && !trigger.inert) trigger.focus();
}

function maximizeWindow(winId) {
  const win = document.getElementById(winId);
  if (!win || isMobileWindowMode()) return;

  win.classList.toggle('is-maximized');
  const button = win.querySelector('[data-window-action="maximize"]');
  if (button) {
    const maximized = win.classList.contains('is-maximized');
    const name = win.dataset.windowName;
    button.textContent = maximized ? '❐' : '□';
    button.setAttribute('aria-label', maximized ? `Restore ${name} window` : `Maximize ${name} window`);
    button.title = maximized ? 'Restore' : 'Maximize';
  }
  focusWindow(winId);
}

function toggleWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;

  if (isMobileWindowMode()) {
    openWindow(winId);
    return;
  }

  if (win.classList.contains('is-hidden')) {
    openWindow(winId);
  } else if (win.classList.contains('is-inactive')) {
    focusWindow(winId);
  } else {
    // If active, minimize
    minimizeWindow(winId);
  }
}

function toggleStartMenu() {
  const menu = document.getElementById('start-menu');
  const btnStart = document.getElementById('btn-start');
  if (!menu) return;
  
  SoundFX.click();
  const isHidden = menu.classList.toggle('is-hidden');
  menu.inert = isHidden;
  menu.setAttribute('aria-hidden', String(isHidden));
  if (btnStart) {
    btnStart.classList.toggle('active', !isHidden);
    btnStart.setAttribute('aria-expanded', String(!isHidden));
  }
  if (!isHidden) requestAnimationFrame(() => menu.querySelector('.win95-start-item')?.focus());
}

// Close Start menu on click outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('start-menu');
  const btnStart = document.getElementById('btn-start');
  if (!menu || menu.classList.contains('is-hidden')) return;
  
  if (!menu.contains(e.target) && !btnStart.contains(e.target)) {
    menu.classList.add('is-hidden');
    menu.inert = true;
    menu.setAttribute('aria-hidden', 'true');
    if (btnStart) {
      btnStart.classList.remove('active');
      btnStart.setAttribute('aria-expanded', 'false');
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const menu = document.getElementById('start-menu');
  const btnStart = document.getElementById('btn-start');
  if (!menu || menu.classList.contains('is-hidden')) return;
  menu.classList.add('is-hidden');
  menu.inert = true;
  menu.setAttribute('aria-hidden', 'true');
  btnStart?.classList.remove('active');
  btnStart?.setAttribute('aria-expanded', 'false');
  btnStart?.focus();
});

// Typing Animation
document.addEventListener('DOMContentLoaded', () => {
  const typedText = document.getElementById('typed-text');
  if (!typedText) return;

  const texts = [
    'whoami -> Mochammad Fadhail',
    'go run main.go (SITOR Emotion Detector)',
    'arduino-cli compile --fqbn avr:uno Absenza.ino',
    'python drone_flight_stabilizer.py',
    'git commit -m "feat: Connect physical & digital worlds"'
  ];

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typedText.textContent = texts[0];
    return;
  }
  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 100;

  function type() {
    const currentText = texts[textIndex];
    
    if (isDeleting) {
      typedText.textContent = currentText.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 50;
    } else {
      typedText.textContent = currentText.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 100;
    }

    if (!isDeleting && charIndex === currentText.length) {
      isDeleting = true;
      typingSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      textIndex = (textIndex + 1) % texts.length;
      typingSpeed = 500; // Pause before new text
    }

    setTimeout(type, typingSpeed);
  }

  type();
});

// Live Clock
document.addEventListener('DOMContentLoaded', () => {
  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    const clockEl = document.getElementById('current-time');
    if (clockEl) {
      clockEl.textContent = time;
    }
  }
  
  updateClock();
  setInterval(updateClock, 1000);
});

// Konami Code Easter Egg
document.addEventListener('DOMContentLoaded', () => {
  const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  let konamiIndex = 0;
  
  document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        activateMatrixRain();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });
  
  function activateMatrixRain() {
    if (document.getElementById('matrix-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'matrix-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.9);
    `;
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }
    
    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px VT323, monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }
    
    const interval = setInterval(draw, 33);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      clearInterval(interval);
      canvas.remove();
    }, 10000);
  }
});

// Contact Form Direct Transmission Handler
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      SoundFX.error();
      if (status) status.textContent = 'Complete all fields with a valid email address.';
      form.reportValidity();
      return;
    }
    if (status) status.textContent = 'Demo complete. No message was sent.';
    form.reset();
  });
});

// === Sound FX Engine (Web Audio API, no assets) ===
const SoundFX = (() => {
  let ctx = null;
  let enabled = false;

  try {
    enabled = localStorage.getItem('fadelos-sound') === 'on';
  } catch (err) { /* private mode: keep default */ }

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'square', vol = 0.12, when = 0, slideTo = null) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    const t = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, vol = 0.04, when = 0) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    const t = c.currentTime + when;
    const bufferSize = Math.floor(c.sampleRate * dur);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(gain).connect(c.destination);
    src.start(t);
  }

  return {
    isEnabled: () => enabled,
    setEnabled(v) {
      enabled = v;
      try { localStorage.setItem('fadelos-sound', v ? 'on' : 'off'); } catch (err) {}
      updateSoundButton();
    },
    click() { tone(2200, 0.03, 'square', 0.02); },
    pcClick() { tone(1800, 0.02, 'square', 0.015); },
    open() {
      tone(660, 0.09, 'triangle', 0.09);
      tone(880, 0.12, 'triangle', 0.07, 0.05);
      noise(0.04, 0.03);
    },
    close() {
      tone(660, 0.08, 'triangle', 0.07);
      tone(440, 0.1, 'triangle', 0.07, 0.04);
    },
    error() {
      tone(300, 0.18, 'sawtooth', 0.1);
      tone(220, 0.2, 'sawtooth', 0.08, 0.12);
    },
    boot() {
      tone(110, 0.6, 'sine', 0.07, 0, 220);
      tone(440, 0.5, 'sine', 0.06, 0.3, 880);
      noise(0.3, 0.02);
    },
  };
})();

function toggleSound() {
  SoundFX.setEnabled(!SoundFX.isEnabled());
}

function updateSoundButton() {
  const btn = document.getElementById('btn-sound');
  const on = SoundFX.isEnabled();
  if (btn) {
    btn.textContent = on ? '🔊' : '🔇';
    btn.title = on ? 'Disable sound effects' : 'Enable sound effects';
    btn.setAttribute('aria-label', btn.title);
    btn.setAttribute('aria-pressed', String(on));
  }
  const startIcon = document.getElementById('start-sound-icon');
  if (startIcon) startIcon.textContent = on ? '🔊' : '🔇';
}

// Click feedback for window control buttons
document.addEventListener('click', (e) => {
  if (e.target.closest('.win95-btn')) SoundFX.pcClick();
});

// === Boot Sequence ===
function initBootScreen() {
  const screen = document.getElementById('boot-screen');
  if (!screen) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let booted = false;
  try { booted = sessionStorage.getItem('fadelos-booted') === '1'; } catch (err) {}

  if (reduced || booted) {
    screen.classList.add('is-removed');
    return;
  }

  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    clearInterval(noiseInt);
    clearInterval(progressInt);
    screen.classList.add('is-done');
    setTimeout(() => screen.classList.add('is-removed'), 450);
    try { sessionStorage.setItem('fadelos-booted', '1'); } catch (err) {}
    SoundFX.pcClick();
  }

  SoundFX.boot();

  // CRT static noise on a small canvas stretched full-screen (cheap)
  const noiseCanvas = document.getElementById('boot-noise');
  let noiseInt = null;
  if (noiseCanvas) {
    const nctx = noiseCanvas.getContext('2d');
    const nw = 160, nh = 100;
    noiseCanvas.width = nw;
    noiseCanvas.height = nh;
    noiseInt = setInterval(() => {
      const img = nctx.createImageData(nw, nh);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
      }
      nctx.putImageData(img, 0, 0);
    }, 50);
    setTimeout(() => { if (noiseInt) clearInterval(noiseInt); }, 650);
  } else {
    noiseInt = null;
  }

  // Progress bar animation
  const progress = document.getElementById('boot-progress');
  const statusEl = document.querySelector('.boot-status');
  let progressValue = 0;
  const statuses = [
    'Loading C:\\FADEL\\PORTFOLIO.EXE ...',
    'Loading C:\\FADEL\\PORTFOLIO.EXE ...',
    'Initializing CRT display ...',
    'Loading C:\\FADEL\\PORTFOLIO.EXE ...',
    'Booting FADEL-OS 95 ...',
    'Loading C:\\FADEL\\PORTFOLIO.EXE ...',
    'System ready!'
  ];

  const progressInt = setInterval(() => {
    progressValue += Math.random() * 12 + 4;
    if (progressValue >= 100) {
      progressValue = 100;
      if (progress) progress.style.width = '100%';
      if (statusEl) statusEl.textContent = statuses[statuses.length - 1];
      setTimeout(finish, 350);
    } else {
      if (progress) progress.style.width = `${progressValue}%`;
      if (statusEl) statusEl.textContent = statuses[Math.floor(progressValue / 16)];
    }
  }, 120);

  screen.addEventListener('click', finish);
  document.addEventListener('keydown', finish, { once: true });
}

// === ASCII Particle Layer ===
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const chars = ['0', '1', '*', '·', '+', 'x', '$', '#'];
  let particles = [];
  let raf = 0;
  let running = true;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = canvas.width < 768 ? 15 : canvas.width < 1200 ? 25 : 40;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.15 + Math.random() * 0.35,
      char: chars[Math.floor(Math.random() * chars.length)],
      size: 10 + Math.random() * 14,
      alpha: 0.06 + Math.random() * 0.22,
      hue: Math.random() > 0.8 ? 300 : 135,
    }));
  }

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.y -= p.speed;
      if (p.y < -20) {
        p.y = canvas.height + 20;
        p.x = Math.random() * canvas.width;
      }
      ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.alpha})`;
      ctx.font = `${p.size}px VT323, monospace`;
      ctx.fillText(p.char, p.x, p.y);
    }
    raf = requestAnimationFrame(tick);
  }

  resize();
  tick();

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else {
      running = true;
      tick();
    }
  });
}

// === Draggable Windows ===
function initDrag() {
  const workspace = document.getElementById('windows-workspace');
  if (!workspace) return;

  workspace.addEventListener('pointerdown', (e) => {
    const titlebar = e.target.closest('.win95-titlebar');
    if (!titlebar) return;
    if (matchMedia('(max-width: 767px)').matches) return;
    if (e.target.closest('.win95-titlebar-buttons')) return;

    const win = titlebar.closest('.win95-window');
    if (!win || win.classList.contains('is-maximized')) return;

    const rect = win.getBoundingClientRect();
    const area = workspace.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialLeft = rect.left - area.left;
    const initialTop = rect.top - area.top;

    win.style.left = `${initialLeft}px`;
    win.style.top = `${initialTop}px`;
    win.style.transform = 'none';

    focusWindow(win.id);
    win.classList.add('is-dragging');
    titlebar.setPointerCapture?.(e.pointerId);

    const onMove = (ev) => {
      const currentArea = workspace.getBoundingClientRect();
      const maxLeft = Math.max(0, currentArea.width - rect.width);
      const maxTop = Math.max(0, currentArea.height - titlebar.offsetHeight);
      const left = Math.min(maxLeft, Math.max(0, initialLeft + ev.clientX - startX));
      const top = Math.min(maxTop, Math.max(0, initialTop + ev.clientY - startY));
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    };

    const onUp = () => {
      win.classList.remove('is-dragging');
      titlebar.releasePointerCapture?.(e.pointerId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

// === Desktop Context Menu ===
let aboutDialogTrigger = null;
let aboutBackgroundState = [];

function openAboutDialog(trigger = document.activeElement) {
  SoundFX.click();
  const dlg = document.getElementById('about-dialog');
  if (!dlg) return;
  aboutDialogTrigger = trigger;
  aboutBackgroundState = [
    document.getElementById('desktop-area'),
    document.querySelector('.win95-taskbar'),
    document.getElementById('start-menu'),
    document.getElementById('context-menu'),
  ].filter(Boolean).map((element) => ({ element, inert: element.inert }));
  aboutBackgroundState.forEach(({ element }) => { element.inert = true; });
  dlg.classList.remove('is-hidden');
  dlg.inert = false;
  dlg.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => dlg.querySelector('button')?.focus());
}

function closeAboutDialog() {
  const dlg = document.getElementById('about-dialog');
  if (!dlg) return;
  dlg.classList.add('is-hidden');
  dlg.inert = true;
  dlg.setAttribute('aria-hidden', 'true');
  aboutBackgroundState.forEach(({ element, inert }) => {
    element.inert = element.classList.contains('is-hidden') ? true : inert;
  });
  aboutBackgroundState = [];
  if (aboutDialogTrigger instanceof HTMLElement && !aboutDialogTrigger.inert && aboutDialogTrigger.getClientRects().length > 0) {
    aboutDialogTrigger.focus();
  } else {
    document.getElementById('btn-start')?.focus();
  }
}

function initContextMenu() {
  const desktop = document.getElementById('desktop-area');
  const menu = document.getElementById('context-menu');
  if (!desktop || !menu) return;

  function show(x, y) {
    menu.classList.remove('is-hidden');
    menu.inert = false;
    menu.setAttribute('aria-hidden', 'false');
    const rect = menu.getBoundingClientRect();
    const xPos = Math.min(x, window.innerWidth - rect.width - 4);
    const yPos = Math.min(y, window.innerHeight - rect.height - 40);
    menu.style.left = `${Math.max(0, xPos)}px`;
    menu.style.top = `${Math.max(0, yPos)}px`;
    requestAnimationFrame(() => menu.querySelector('.context-menu-item')?.focus());
  }

  function hide() {
    menu.classList.add('is-hidden');
    menu.inert = true;
    menu.setAttribute('aria-hidden', 'true');
  }

  function refreshDesktop() {
    document.querySelectorAll('.desktop-icon-item').forEach((icon, i) => {
      icon.style.transition = 'none';
      icon.style.opacity = '0';
      icon.style.transform = 'translateY(12px)';
      requestAnimationFrame(() => {
        icon.style.transition = `opacity 0.3s ease ${i * 0.05}s, transform 0.3s ease ${i * 0.05}s`;
        icon.style.opacity = '1';
        icon.style.transform = 'translateY(0)';
      });
    });
  }

  desktop.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.win95-window') || e.target.closest('.about-dialog')) return;
    e.preventDefault();
    SoundFX.pcClick();
    show(e.clientX, e.clientY);
  });

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.context-menu-item');
    if (!item) return;
    SoundFX.pcClick();
    switch (item.dataset.action) {
      case 'new-window': openWindow('win-home'); break;
      case 'refresh': refreshDesktop(); break;
      case 'about': openAboutDialog(document.getElementById('btn-start')); break;
    }
    hide();
  });

  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('is-hidden') && !menu.contains(e.target)) hide();
  });
  document.addEventListener('scroll', hide, true);
  window.addEventListener('blur', hide);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hide();
      if (!document.getElementById('about-dialog')?.classList.contains('is-hidden')) closeAboutDialog();
    }
  });
}

// === Swipe Navigation (mobile) ===
function initSwipe() {
  const workspace = document.getElementById('windows-workspace');
  if (!workspace) return;

  let startX = null;
  let startY = null;

  workspace.addEventListener('pointerdown', (e) => {
    if (!matchMedia('(max-width: 767px)').matches) return;
    if (e.target.closest('.win95-titlebar-buttons')) return;
    startX = e.clientX;
    startY = e.clientY;
  }, { passive: true });

  workspace.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    startX = null;
    startY = null;

    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;

    const content = e.target.closest('.win95-content');
    if (content && content.scrollWidth > content.clientWidth) return;

    const open = Array.from(document.querySelectorAll('.win95-window:not(.is-hidden)'));
    if (open.length < 2) return;

    let current = open.findIndex(w => !w.classList.contains('is-inactive'));
    if (current === -1) current = 0;

    let next;
    if (dx < 0) next = (current + 1) % open.length;
    else next = (current - 1 + open.length) % open.length;

    openWindow(open[next].id);
  }, { passive: true });
}

// === Glitch Triggers ===
function initGlitch() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (matchMedia('(max-width: 767px)').matches) return;

  const heading = document.getElementById('main-title');

  function glitchHeading() {
    if (!heading) return;
    heading.classList.add('is-glitching');
    setTimeout(() => heading.classList.remove('is-glitching'), 400);
    setTimeout(glitchHeading, 4000 + Math.random() * 6000);
  }

  function glitchTitleBar() {
    const active = document.querySelector('.win95-window:not(.is-inactive):not(.is-hidden)');
    if (active) {
      active.classList.add('glitch-window');
      setTimeout(() => active.classList.remove('glitch-window'), 400);
    }
    setTimeout(glitchTitleBar, 9000 + Math.random() * 8000);
  }

  setTimeout(glitchHeading, 4000 + Math.random() * 6000);
  setTimeout(glitchTitleBar, 9000 + Math.random() * 8000);
}

function initViewportSizing() {
  const viewport = window.visualViewport;
  const update = () => {
    const height = viewport ? viewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
  };

  update();
  window.addEventListener('resize', update);
  viewport?.addEventListener('resize', update);

  document.addEventListener('focusin', (e) => {
    if (!e.target.matches('#contact-form input, #contact-form textarea')) return;
    setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
  });
}

function initResponsiveWindowMode() {
  mobileWindowQuery.addEventListener('change', (event) => {
    const active = document.querySelector('.win95-window:not(.is-hidden):not(.is-inactive)')
      || getTopOpenWindow()
      || document.getElementById('win-home');
    if (!event.matches) {
      updateWindowStates(active?.id || null);
      return;
    }
    document.querySelectorAll('.win95-window').forEach((win) => {
      setWindowVisibility(win, win === active);
    });
    if (active) {
      mobileWindowHistory = [active.id];
      focusWindow(active.id);
    }
  });
}

// === Init All Enhancements ===
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.win95-window').forEach((win) => {
    setWindowVisibility(win, !win.classList.contains('is-hidden'));
  });
  updateWindowStates('win-home');
  initViewportSizing();
  initResponsiveWindowMode();
  initBootScreen();
  initParticles();
  initDrag();
  initContextMenu();
  initSwipe();
  initGlitch();
  updateSoundButton();
});
