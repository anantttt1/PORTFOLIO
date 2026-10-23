/* Intro splash — only name on black, auto-enter ~1.8s */
(function () {
  const splash = document.getElementById('intro-splash');
  if (!splash) return;

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  root.classList.add('intro-lock');

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    splash.classList.add('is-done');
    root.classList.remove('intro-lock');
    setTimeout(() => { try { splash.remove(); } catch (e) {} }, 700);
  }

  if (calm) {
    finish();
    return;
  }

  const t = setTimeout(finish, 1800);
  splash.addEventListener('click', () => { clearTimeout(t); finish(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      clearTimeout(t);
      finish();
    }
  }, { once: true });
})();
