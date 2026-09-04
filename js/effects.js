// Window Manager System
let highestZ = 20;

function focusWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;
  
  highestZ++;
  win.style.zIndex = highestZ;
  
  // Mark all windows as inactive except this one
  document.querySelectorAll('.win95-window').forEach(w => {
    if (w.id === winId) {
      w.classList.remove('is-inactive');
    } else {
      w.classList.add('is-inactive');
    }
  });

  // Update taskbar button states
  document.querySelectorAll('.win95-taskbar-btn').forEach(btn => {
    if (btn.id === `task-${winId}`) {
      btn.classList.add('active');
    } else if (btn.id !== 'btn-start') {
      btn.classList.remove('active');
    }
  });
}

function openWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;
  
  win.classList.remove('is-hidden');
  focusWindow(winId);
}

function closeWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;
  
  win.classList.add('is-hidden');
  const taskBtn = document.getElementById(`task-${winId}`);
  if (taskBtn) {
    taskBtn.classList.remove('active');
  }

  // Focus next available open window
  const openWindows = Array.from(document.querySelectorAll('.win95-window:not(.is-hidden)'));
  if (openWindows.length > 0) {
    focusWindow(openWindows[openWindows.length - 1].id);
  }
}

function minimizeWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;
  
  win.classList.add('is-hidden');
  const taskBtn = document.getElementById(`task-${winId}`);
  if (taskBtn) {
    taskBtn.classList.remove('active');
  }

  // Focus next available open window
  const openWindows = Array.from(document.querySelectorAll('.win95-window:not(.is-hidden)'));
  if (openWindows.length > 0) {
    focusWindow(openWindows[openWindows.length - 1].id);
  }
}

function maximizeWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;
  
  win.classList.toggle('is-maximized');
  focusWindow(winId);
}

function toggleWindow(winId) {
  const win = document.getElementById(winId);
  if (!win) return;
  
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
  
  const isHidden = menu.classList.toggle('is-hidden');
  if (btnStart) {
    if (!isHidden) {
      btnStart.classList.add('active');
    } else {
      btnStart.classList.remove('active');
    }
  }
}

// Close Start menu on click outside
document.addEventListener('click', (e) => {
  const menu = document.getElementById('start-menu');
  const btnStart = document.getElementById('btn-start');
  if (!menu || menu.classList.contains('is-hidden')) return;
  
  if (!menu.contains(e.target) && !btnStart.contains(e.target)) {
    menu.classList.add('is-hidden');
    if (btnStart) btnStart.classList.remove('active');
  }
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
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputs = form.querySelectorAll('input, textarea');
    for (const input of inputs) {
      if (!input.value.trim()) {
        input.focus();
        return;
      }
    }
    const msg = document.createElement('div');
    msg.textContent = 'Transmission sent successfully! (Demo)';
    msg.style.cssText = 'color:#00ff41;font-family:VT323,monospace;font-size:1.25rem;margin-top:0.75rem;text-align:center;';
    form.appendChild(msg);
    form.reset();
    setTimeout(() => msg.remove(), 4000);
  });
});
