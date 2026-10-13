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

// LeetCode stats + submission heatmap
// Order: (1) /api/leetcode, (2) community live APIs, (3) stats.json, (4) browser cache
(function () {
  const USER = 'Anant_goyal2907';
  const CACHE_KEY = 'lc-stats-' + USER;
  const REFRESH_MS = 60000;
  const COMMUNITY = [
    'https://alfa-leetcode-api.onrender.com/' + USER + '/calendar',
    'https://leetcode-api-faisalshohag.vercel.app/' + USER,
    'https://alfa-leetcode-api.onrender.com/' + USER + '/solved',
    'https://leetcode-stats-api.herokuapp.com/' + USER
  ];
  const $ = id => document.getElementById(id);
  if (!$('lc-card')) return;
  let shown = false;

  function normalize(d) {
    if (!d || d.status === 'error' || d.error) return null;
    const easy = Number(d.easySolved ?? d.easy);
    const medium = Number(d.mediumSolved ?? d.medium);
    const hard = Number(d.hardSolved ?? d.hard);
    if (![easy, medium, hard].every(Number.isFinite)) return null;
    const total = Number(d.totalSolved ?? d.solvedProblem ?? d.total ?? (easy + medium + hard));
    if (!Number.isFinite(total) || total <= 0) return null;

    let calendar = d.submissionCalendar || {};
    if (typeof calendar === 'string') {
      try { calendar = JSON.parse(calendar); } catch (e) { calendar = {}; }
    }
    // faisalshohag API returns calendar as object already
    const streak = Number(d.streak ?? d.maxStreak ?? 0) || 0;
    const totalActiveDays = Number(d.totalActiveDays ?? Object.keys(calendar).length) || 0;

    // total submissions from calendar or from totalSubmissions array
    let submissions = 0;
    if (d.totalSubmissions && Array.isArray(d.totalSubmissions)) {
      const all = d.totalSubmissions.find(x => x.difficulty === 'All');
      if (all) submissions = Number(all.submissions) || 0;
    }
    if (!submissions) {
      submissions = Object.values(calendar).reduce((s, n) => s + (Number(n) || 0), 0);
    }

    return { total, easy, medium, hard, streak, totalActiveDays, submissionCalendar: calendar, submissions };
  }

  function level(count) {
    if (!count) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  }

  function renderHeatmap(calendar, streak, activeDays, submissions) {
    const wrap = $('lc-heatmap-wrap');
    const grid = $('lc-heatmap');
    if (!wrap || !grid) return;

    // Build past ~53 weeks ending today (GitHub-style)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Start from the Sunday of the week 52 weeks ago
    const start = new Date(today);
    start.setDate(start.getDate() - 364 - start.getDay());

    // Month labels
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let monthHtml = '<div class="lc-heatmap-months">';
    let lastMonth = -1;
    const totalDays = Math.round((today - start) / 86400000) + 1;
    const weeks = Math.ceil(totalDays / 7);

    // Precompute cell data
    const cells = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d > today) {
        cells.push(null);
        continue;
      }
      // LeetCode timestamps are UTC midnight unix seconds
      const ts = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 1000);
      const count = Number(calendar[String(ts)] || calendar[ts] || 0) || 0;
      cells.push({ date: d, count, ts });
    }

    // Month labels aligned to weeks
    for (let w = 0; w < weeks; w++) {
      const cell = cells[w * 7];
      if (!cell) { monthHtml += '<span style="width:11px"></span>'; continue; }
      const m = cell.date.getMonth();
      if (m !== lastMonth) {
        monthHtml += '<span style="width:' + (11 + 3) * Math.min(4, weeks - w) + 'px">' + months[m] + '</span>';
        lastMonth = m;
        // skip next few week slots for this label width (approximate)
        // simpler: just place label every time month changes with fixed min width
      }
    }
    // Simpler month row: rebuild cleanly
    monthHtml = '<div class="lc-heatmap-months">';
    lastMonth = -1;
    for (let w = 0; w < weeks; w++) {
      const cell = cells[w * 7 + 3] || cells[w * 7]; // mid-week for stability
      if (!cell) { monthHtml += '<span style="display:inline-block;width:14px"></span>'; continue; }
      const m = cell.date.getMonth();
      if (m !== lastMonth) {
        monthHtml += '<span style="display:inline-block;width:14px;margin-right:0">' + months[m] + '</span>';
        lastMonth = m;
      } else {
        monthHtml += '<span style="display:inline-block;width:14px"></span>';
      }
    }
    monthHtml += '</div>';

    let html = monthHtml;
    // Actual cells as CSS grid (column-major: 7 rows)
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell) {
        html += '<div class="cell" style="visibility:hidden"></div>';
        continue;
      }
      const lv = level(cell.count);
      const label = cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        + (cell.count ? ': ' + cell.count + ' submission' + (cell.count > 1 ? 's' : '') : ': no submissions');
      html += '<div class="cell lv' + lv + '" title="' + label + '" data-count="' + cell.count + '"></div>';
    }
    grid.innerHTML = html;

    // Meta numbers
    const subEl = $('lc-submissions');
    const activeEl = $('lc-active-days');
    const streakEl = $('lc-streak');
    if (subEl) subEl.textContent = submissions || Object.values(calendar).reduce((s, n) => s + (Number(n) || 0), 0);
    if (activeEl) activeEl.textContent = activeDays || Object.keys(calendar).length;
    if (streakEl) streakEl.textContent = streak || 0;

    wrap.hidden = false;

    // Scroll to the right (most recent) on mobile
    const scroll = wrap.querySelector('.lc-heatmap-scroll');
    if (scroll) {
      requestAnimationFrame(() => { scroll.scrollLeft = scroll.scrollWidth; });
    }
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

    if (s.submissionCalendar && Object.keys(s.submissionCalendar).length) {
      renderHeatmap(s.submissionCalendar, s.streak, s.totalActiveDays, s.submissions);
    }
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
        if (shown) return;
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
