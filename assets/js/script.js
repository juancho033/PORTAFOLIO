const root = document.documentElement;
const toggle = document.getElementById('themeToggle');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-links a');
const saved = localStorage.getItem('theme-mode');
if (saved === 'minimal') {
  root.setAttribute('data-theme', 'minimal');
  toggle.textContent = 'Minimalista';
} else {
  root.setAttribute('data-theme', 'brutal');
  toggle.textContent = 'Neobrutalista';
}
toggle.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  if (current === 'brutal') {
    root.setAttribute('data-theme', 'minimal');
    localStorage.setItem('theme-mode', 'minimal');
    toggle.textContent = 'Minimalista';
  } else {
    root.setAttribute('data-theme', 'brutal');
    localStorage.setItem('theme-mode', 'brutal');
    toggle.textContent = 'Neobrutalista';
  }
});

const setMenu = (open) => {
  navToggle.setAttribute('aria-expanded', String(open));
  navMenu.classList.toggle('is-open', open);
};

const menuController = new AbortController();
const menuSignal = menuController.signal;

navToggle.addEventListener('click', () => {
  setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
}, { signal: menuSignal });

navMenu.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false);
}, { signal: menuSignal });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    navToggle.focus();
  }
}, { signal: menuSignal });

document.addEventListener('click', (e) => {
  if (navToggle.getAttribute('aria-expanded') !== 'true') return;
  if (!e.target.closest('nav')) setMenu(false);
}, { signal: menuSignal });

const mobileQuery = window.matchMedia('(max-width: 720px)');
mobileQuery.addEventListener('change', () => setMenu(false), { signal: menuSignal });

const sections = [...navLinks]
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const setActive = (id) => {
  navLinks.forEach(link => {
    const on = link.getAttribute('href') === '#' + id;
    link.classList.toggle('active', on);
    if (on) {
      link.setAttribute('aria-current', 'true');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

const spyController = new AbortController();
let spyFrame = 0;
let probeOffset = 120;

const measureProbe = () => {
  probeOffset = Math.max(120, (parseFloat(getComputedStyle(root).scrollPaddingTop) || 0) + 2);
};

const syncActiveLink = () => {
  spyFrame = 0;
  if (!sections.length) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const fromTop = window.scrollY + probeOffset;
  let current;
  if (window.scrollY >= maxScroll - 2) {
    current = sections[sections.length - 1];
  } else {
    current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top + window.scrollY > fromTop) break;
      current = section;
    }
  }
  setActive(current.id);
};

window.addEventListener('scroll', () => {
  if (spyFrame) return;
  spyFrame = requestAnimationFrame(syncActiveLink);
}, { passive: true, signal: spyController.signal });

window.addEventListener('resize', () => {
  measureProbe();
measureProbe();
syncActiveLink();
}, { signal: spyController.signal });

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    setActive(link.getAttribute('href').slice(1));
  }, { signal: spyController.signal });
});

syncActiveLink();

const contactController = new AbortController();
const copyButtons = document.querySelectorAll('[data-copy]');
const contactStatus = document.getElementById('contactStatus');

copyButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const value = btn.dataset.copy;
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      try {
        ta.select();
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      } finally {
        document.body.removeChild(ta);
      }
    }
    btn.classList.toggle('is-copied', ok);
    if (contactStatus) {
      contactStatus.textContent = ok
        ? value + ' copiado al portapapeles.'
        : 'No se pudo copiar. El ID es ' + value;
    }
    if (ok) {
      setTimeout(() => btn.classList.remove('is-copied'), 1600);
    }
  }, { signal: contactController.signal });
});
