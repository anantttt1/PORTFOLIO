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


// LeetCode live stats
// LeetCode has no official public API, so a few community APIs are tried at the same time and the
// first valid answer wins. The last good result is cached in the browser as a backup.
(function () {
  const USER = 'Anant_goyal2907';
  const CACHE_KEY = 'lc-stats-' + USER;
  const SOURCES = [
    'https://alfa-leetcode-api.onrender.com/' + USER + '/solved',
    'https://leetcode-api-faisalshohag.vercel.app/' + USER,
    'https://leetcode-stats-api.herokuapp.com/' + USER
  ];
  const $ = id => document.getElementById(id);
  if (!$('lc-card')) return;

  function normalize(d) {
    if (!d || d.status === 'error') return null;
    const easy = Number(d.easySolved), medium = Number(d.mediumSolved), hard = Number(d.hardSolved);
    if (![easy, medium, hard].every(Number.isFinite)) return null;
    const total = Number(d.totalSolved ?? d.solvedProblem ?? (easy + medium + hard));
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
  }

  function get(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    return fetch(url, { signal: ctrl.signal })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { const n = normalize(d); if (!n) throw new Error('bad data'); return n; })
      .finally(() => clearTimeout(t));
  }

  Promise.any(SOURCES.map(get)).then(stats => {
    render(stats, 'Live from LeetCode');
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ stats, ts: Date.now() })); } catch (e) {}
  }).catch(() => {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) {}
    if (cached && cached.stats) {
      render(cached.stats, 'Live data is unavailable right now. Showing saved stats from ' + new Date(cached.ts).toLocaleDateString());
    } else {
      $('lc-note').textContent = 'Live stats are unavailable right now. Open my LeetCode profile to see the latest.';
    }
  });
})();
