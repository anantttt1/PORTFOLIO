/* 3D Scroll — optional. Delete this file + scroll-3d.css link to remove. */
(function () {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) return;

  const root = document.documentElement;
  root.classList.add('s3d');

  // Progress bar
  let bar = document.querySelector('.s3d-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 's3d-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.prepend(bar);
  }

  // Mark targets
  document.querySelectorAll('.card, .project').forEach(el => el.classList.add('s3d-card'));
  document.querySelectorAll('section.reveal > h2').forEach(el => el.classList.add('s3d-title'));

  const hero = document.getElementById('home');
  const cards = Array.from(document.querySelectorAll('.s3d-card'));
  const titles = Array.from(document.querySelectorAll('.s3d-title'));
  let raf = 0;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function progressFor(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // 0 when fully below, 1 when centered/past entry
    const start = vh * 0.92;
    const end = vh * 0.35;
    const y = r.top;
    if (y >= start) return 0;
    if (y <= end) return 1;
    return 1 - (y - end) / (start - end);
  }

  function tick() {
    raf = 0;
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const p = clamp(window.scrollY / max, 0, 1);
    root.style.setProperty('--s3d-progress', p.toFixed(4));

    if (hero) {
      const hr = hero.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 at top, 1 when hero mostly scrolled away
      const h = clamp(1 - (hr.bottom / (vh * 0.9)), 0, 1);
      hero.style.setProperty('--s3d-hero', h.toFixed(4));
    }

    for (let i = 0; i < cards.length; i++) {
      const el = cards[i];
      if (el.classList.contains('active')) continue; // don't fight mouse tilt
      const v = progressFor(el);
      el.style.setProperty('--s3d-in', v.toFixed(4));
    }
    for (let i = 0; i < titles.length; i++) {
      titles[i].style.setProperty('--s3d-in', progressFor(titles[i]).toFixed(4));
    }
  }

  function onScroll() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  tick();
})();
