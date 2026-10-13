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

// LeetCode stats
// Order: (1) /api/leetcode (a Vercel function that asks LeetCode directly, cached for 60 seconds),
// (2) community live APIs, (3) stats.json kept fresh by a GitHub Action, (4) last result saved in this browser.
// While the page is open the numbers are re-checked every minute.
(function () {
  const USER = 'Anant_goyal2907';
  const CACHE_KEY = 'lc-stats-' + USER;
  const REFRESH_MS = 60000;
  const COMMUNITY = [
    'https://alfa-leetcode-api.onrender.com/' + USER + '/solved',
    'https://leetcode-api-faisalshohag.vercel.app/' + USER,
    'https://leetcode-stats-api.herokuapp.com/' + USER
  ];
  const $ = id => document.getElementById(id);
  if (!$('lc-card')) return;
  let shown = false;

  function normalize(d) {
    if (!d || d.status === 'error' || d.error) return null;
    const easy = Number(d.easySolved ?? d.easy), medium = Number(d.mediumSolved ?? d.medium), hard = Number(d.hardSolved ?? d.hard);
    if (![easy, medium, hard].every(Number.isFinite)) return null;
    const total = Number(d.totalSolved ?? d.solvedProblem ?? d.total ?? (easy + medium + hard));
    return Number.isFinite(total) && total > 0 ? { total, easy, medium, hard } : null;
  }

  function render(s, note) {
    $('lc-total').textContent = s.total;
    ['easy', 'medium', 'hard'].forEach(k => {
      $('lc-' + k).textContent = s[k];
      $('lc-' + k + '-bar').style.width = Math.round((s[k] / s.total) * 100) + '%';
    });
    $('lc-bars').hidden = false;
    $('lc-note').textContent = note;
    shown = true;
  }

  function get(url, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal, cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { const n = normalize(d); if (!n) throw new Error('bad data'); return n; })
      .finally(() => clearTimeout(t));
  }

  function save(stats) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ stats, ts: Date.now() })); } catch (e) {}
  }

  function load() {
    return get('/api/leetcode', 9000)
      .then(s => ({ s, note: 'Live from LeetCode, refreshes every minute' }))
      .catch(() => Promise.any(COMMUNITY.map(u => get(u, 12000))).then(s => ({ s, note: 'Live from LeetCode' })))
      .catch(() => get('stats.json', 8000).then(s => ({ s, note: 'Auto-updated from LeetCode every few hours' })))
      .then(r => { render(r.s, r.note); save(r.s); })
      .catch(() => {
        if (shown) return;            // keep what is on screen if a refresh fails
        let cached = null;
        try { cached = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) {}
        if (cached && cached.stats) {
          render(cached.stats, 'Live data is unavailable right now. Showing saved stats from ' + new Date(cached.ts).toLocaleDateString());
        } else {
          $('lc-note').textContent = 'Live stats are unavailable right now. Open my LeetCode profile to see the latest.';
        }
      });
  }

  load();
  setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
})();
