// Typing Animation
document.addEventListener('DOMContentLoaded', () => {
  const typedText = document.getElementById('typed-text');
  const texts = [
    'whoami',
    'dir /s *.js',
    'npm run dev',
    'git commit -m "hello world"',
    'echo "Welcome to my portfolio"'
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

// Taskbar Navigation
document.addEventListener('DOMContentLoaded', () => {
  const taskbarBtns = document.querySelectorAll('.win95-taskbar-btn');
  const sections = document.querySelectorAll('section');
  
  taskbarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sectionId = btn.dataset.section;
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  
  // Highlight active section on scroll
  window.addEventListener('scroll', () => {
    let current = 'home';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });
    
    taskbarBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.section === current) {
        btn.classList.add('active');
      }
    });
  });
  
  // Clock
  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('current-time').textContent = time;
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
