// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu — full-screen
(function () {
  const menu = document.getElementById('menu');
  const burger = document.getElementById('burger');
  if (!menu || !burger) return;
  const OPEN_ICON = '\u2715';
  const CLOSE_ICON = '\u2630';
  function setOpen(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.innerHTML = open ? OPEN_ICON : CLOSE_ICON;
    document.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', () => setOpen(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) setOpen(false);
  });
})();

// Reveal on scroll — fire early so sections don't feel delayed
const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
  }, { threshold: 0.01, rootMargin: '80px 0px 80px 0px' });
  items.forEach(el => io.observe(el));
} else { items.forEach(el => el.classList.add('show')); }

// Pause heavy hero animations while scrolled away (saves GPU during project scroll)
(function () {
  const hero = document.getElementById('home');
  if (!hero || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) hero.classList.remove('is-away');
      else hero.classList.add('is-away');
    });
  }, { threshold: 0.08 });
  io.observe(hero);
})();

// Contact form — length limits + safe mailto only
(function () {
  const OWNER_EMAIL = 'anantgoyal1001@gmail.com';
  const form = document.getElementById('contact-form');
  const note = document.getElementById('form-note');
  if (!form || !note) return;
  const MAX = { name: 80, email: 120, message: 2000 };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(form));
    const name = String(raw.name || '').trim().slice(0, MAX.name);
    const email = String(raw.email || '').trim().slice(0, MAX.email);
    const message = String(raw.message || '').trim().slice(0, MAX.message);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
      note.textContent = 'Please fill in your name, a valid email and a message.';
      return;
    }
    if (message.length < 3) {
      note.textContent = 'Message is too short.';
      return;
    }
    const subject = encodeURIComponent('Portfolio message from ' + name);
    const body = encodeURIComponent(message + '\n\n- ' + name + ' (' + email + ')');
    window.location.href = 'mailto:' + OWNER_EMAIL + '?subject=' + subject + '&body=' + body;
    note.textContent = 'Opening your email app... if nothing opens, write to ' + OWNER_EMAIL;
  });
})();

// 3D tilt + parallax
(function () {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) return;
  if (fine) {
    document.querySelectorAll('.card:not(form), .photo-frame').forEach(el => {
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
  const layers = document.querySelectorAll('.scene .layer');
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

// NASA photo orbit particles
(function () {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = document.getElementById('orbit-particles');
  if (!host || calm) return;
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('span');
    const angle = (i / 18) * Math.PI * 2;
    const dist = 35 + (i % 5) * 8;
    s.style.left = (48 + Math.cos(angle + 1) * 12) + '%';
    s.style.top = (48 + Math.sin(angle + 1) * 12) + '%';
    s.style.setProperty('--tx', (Math.cos(angle) * dist) + 'px');
    s.style.setProperty('--ty', (Math.sin(angle) * dist) + 'px');
    s.style.animationDuration = (6 + (i % 7)) + 's';
    s.style.animationDelay = (i * 0.35) + 's';
    if (i % 3 === 1) s.style.background = 'rgba(96,165,250,.85)';
    if (i % 3 === 2) s.style.background = 'rgba(167,139,250,.8)';
    host.appendChild(s);
  }
})();

// LeetCode stats — same-origin API + stats.json only (no third-party APIs)
(function () {
  const USER = 'Anant_goyal2907';
  const CACHE_KEY = 'lc-stats-' + USER;
  const REFRESH_MS = 60000;
  const $ = id => document.getElementById(id);
  if (!$('lc-card')) return;
  let shown = false;

  function hideSkeleton() {
    const sk = $('lc-skeleton'); const content = $('lc-content');
    if (sk) sk.hidden = true; if (content) content.hidden = false;
  }

  function normalize(d) {
    if (!d || d.status === 'error' || d.error) return null;
    const easy = Number(d.easySolved ?? d.easy);
    const medium = Number(d.mediumSolved ?? d.medium);
    const hard = Number(d.hardSolved ?? d.hard);
    if (![easy, medium, hard].every(Number.isFinite)) return null;
    const total = Number(d.totalSolved ?? d.solvedProblem ?? d.total ?? (easy + medium + hard));
    if (!Number.isFinite(total) || total <= 0) return null;
    let calendar = d.submissionCalendar || {};
    if (typeof calendar === 'string') { try { calendar = JSON.parse(calendar); } catch (e) { calendar = {}; } }
    if (!calendar || typeof calendar !== 'object' || Array.isArray(calendar)) calendar = {};
    const clean = {};
    for (const k of Object.keys(calendar)) {
      if (!/^\d+$/.test(k)) continue;
      const n = Number(calendar[k]);
      if (Number.isFinite(n) && n >= 0 && n < 10000) clean[k] = Math.floor(n);
    }
    const streak = Number(d.streak ?? d.maxStreak ?? 0) || 0;
    const totalActiveDays = Number(d.totalActiveDays ?? Object.keys(clean).length) || 0;
    let submissions = Object.values(clean).reduce((s, n) => s + n, 0);
    return { total, easy, medium, hard, streak, totalActiveDays, submissionCalendar: clean, submissions };
  }

  function level(count) {
    if (!count) return 0; if (count <= 2) return 1; if (count <= 5) return 2; if (count <= 10) return 3; return 4;
  }

  function renderHeatmap(calendar, streak, activeDays, submissions) {
    const wrap = $('lc-heatmap-wrap'); const grid = $('lc-heatmap');
    if (!wrap || !grid) return;

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today); start.setDate(start.getDate() - 364 - start.getDay());
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const totalDays = Math.round((today - start) / 86400000) + 1;
    const weeks = Math.ceil(totalDays / 7);

    const cells = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      if (d > today) { cells.push(null); continue; }
      const ts = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 1000);
      const count = Number(calendar[String(ts)] || calendar[ts] || 0) || 0;
      cells.push({ date: d, count });
    }

    grid.replaceChildren();
    const monthRow = document.createElement('div');
    monthRow.className = 'lc-heatmap-months';
    let lastMonth = -1;
    for (let w = 0; w < weeks; w++) {
      const cell = cells[w * 7 + 3] || cells[w * 7];
      const span = document.createElement('span');
      span.style.display = 'inline-block';
      span.style.width = '14px';
      if (cell) {
        const m = cell.date.getMonth();
        if (m !== lastMonth) { span.textContent = months[m]; lastMonth = m; }
      }
      monthRow.appendChild(span);
    }
    grid.appendChild(monthRow);

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const div = document.createElement('div');
      div.className = 'cell';
      if (!cell) {
        div.style.visibility = 'hidden';
      } else {
        const lv = level(cell.count);
        if (lv) div.classList.add('lv' + lv);
        const label = cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          + (cell.count ? ': ' + cell.count + ' submission' + (cell.count > 1 ? 's' : '') : ': no submissions');
        div.title = label;
        div.setAttribute('data-count', String(cell.count));
      }
      grid.appendChild(div);
    }

    if ($('lc-submissions')) $('lc-submissions').textContent = String(submissions || 0);
    if ($('lc-active-days')) $('lc-active-days').textContent = String(activeDays || 0);
    if ($('lc-streak')) $('lc-streak').textContent = String(streak || 0);
    wrap.hidden = false;
    const scroll = wrap.querySelector('.lc-heatmap-scroll');
    if (scroll) requestAnimationFrame(() => { scroll.scrollLeft = scroll.scrollWidth; });
  }

  function render(s, noteText) {
    hideSkeleton();
    $('lc-total').textContent = String(s.total);
    ['easy', 'medium', 'hard'].forEach(k => {
      $('lc-' + k).textContent = String(s[k]);
      $('lc-' + k + '-bar').style.width = Math.round((s[k] / s.total) * 100) + '%';
    });
    $('lc-note').textContent = noteText;
    shown = true;
    if (s.submissionCalendar && Object.keys(s.submissionCalendar).length) {
      renderHeatmap(s.submissionCalendar, s.streak, s.totalActiveDays, s.submissions);
    }
  }

  function get(url, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal, cache: 'no-store', credentials: 'same-origin' })
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(d => { const n = normalize(d); if (!n) throw new Error('bad data'); return n; })
      .finally(() => clearTimeout(t));
  }

  function save(stats) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ stats, ts: Date.now() })); } catch (e) {}
  }

  function load() {
    return get('/api/leetcode', 9000)
      .then(s => ({ s, note: 'Live from LeetCode, refreshes every minute' }))
      .catch(() => get('stats.json', 8000).then(s => ({ s, note: 'Auto-updated from LeetCode every few hours' })))
      .then(r => { render(r.s, r.note); save(r.s); })
      .catch(() => {
        if (shown) return;
        let cached = null;
        try { cached = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) {}
        if (cached && cached.stats) render(cached.stats, 'Live data is unavailable right now. Showing saved stats from ' + new Date(cached.ts).toLocaleDateString());
        else { hideSkeleton(); $('lc-note').textContent = 'Live stats are unavailable right now. Open my LeetCode profile to see the latest.'; }
      });
  }

  load();
  setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
})();
