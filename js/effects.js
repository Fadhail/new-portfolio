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
