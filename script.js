// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu
const menu = document.getElementById('menu');
document.getElementById('burger').addEventListener('click', () => menu.classList.toggle('open'));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));

// Reveal on scroll
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
} else {
  items.forEach(el => el.classList.add('show'));
}

// Contact form: opens the visitor's email app with the message prefilled.
// To receive messages directly instead, replace this with a Formspree/Netlify Forms endpoint.
const OWNER_EMAIL = 'anantgoyal1001@gmail.com';
const form = document.getElementById('contact-form');
const note = document.getElementById('form-note');
form.addEventListener('submit', e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  if (!d.name.trim() || !/^\S+@\S+\.\S+$/.test(d.email) || !d.message.trim()) {
    note.textContent = 'Please fill in your name, a valid email and a message.';
    return;
  }
  const subject = encodeURIComponent('Portfolio message from ' + d.name.trim());
  const body = encodeURIComponent(d.message.trim() + '\n\n- ' + d.name.trim() + ' (' + d.email.trim() + ')');
  window.location.href = 'mailto:' + OWNER_EMAIL + '?subject=' + subject + '&body=' + body;
  note.textContent = 'Opening your email app... if nothing opens, write to ' + OWNER_EMAIL;
});


// 3D touch: tilt cards, hero parallax
(function () {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) return;

  // Tilt (mouse only, so touch scrolling is never blocked)
  if (fine) {
    const targets = document.querySelectorAll('.card:not(form), .photo-frame');
    targets.forEach(el => {
      el.classList.add('tilt');
      const max = el.classList.contains('photo-frame') ? 12 : el.classList.contains('project') ? 9 : 6;
      let raf = null;
      el.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.classList.add('active');
          el.style.setProperty('--mx', (x * 100) + '%');
          el.style.setProperty('--my', (y * 100) + '%');
          el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * max) + 'deg) rotateY(' + ((x - 0.5) * max * 1.4) + 'deg) translateZ(8px)';
        });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf);
        el.classList.remove('active');
        el.style.transform = '';
      });
    });
  }

  // Hero parallax: floating shapes follow the pointer (mouse) or tilt of the phone
  const layers = document.querySelectorAll('.scene .layer');
  const base = new Map();
  layers.forEach(l => base.set(l, l.style.transform || ''));
  function move(px, py) {
    layers.forEach(l => {
      const d = Number(l.dataset.depth) || 20;
      l.style.transform = 'translate3d(' + (px * d) + 'px,' + (py * d) + 'px,0)';
    });
  }
  const hero = document.getElementById('home');
  if (fine && hero) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      move((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1);
    });
    hero.addEventListener('pointerleave', () => move(0, 0));
  }
})();
