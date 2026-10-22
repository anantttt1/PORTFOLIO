/* Photo shatter -> fly in -> assemble intro. Click / tap the photo to replay. */
(function () {
  var root = document.documentElement;
  var frame = document.querySelector('.photo-frame');
  var img = frame && frame.querySelector('img');
  if (!frame || !img) { root.classList.remove('pa'); return; }

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !frame.animate) { root.classList.remove('pa'); return; }

  var running = false;
  var rand = function (a, b) { return a + Math.random() * (b - a); };

  var COLORS = ['#9a9a9a', '#ffffff', '#f2f2f2', '#cfcfcf'];

  function orbPhase(cb) {
    var fr = frame.getBoundingClientRect();
    var px = fr.left + fr.width / 2, py = fr.top + fr.height / 2;
    var W = window.innerWidth, H = window.innerHeight, m = 40;
    var starts = [[-m, -m], [W + m, -m], [W + m, H + m], [-m, H + m]];
    var layer = document.createElement('div');
    layer.className = 'pa-orbs';
    document.body.appendChild(layer);
    var DUR = 1250, left = starts.length;

    starts.forEach(function (s, i) {
      var dx = px - s[0], dy = py - s[1], len = Math.sqrt(dx * dx + dy * dy);
      var nx = -dy / len, ny = dx / len, curl = (i % 2 ? 1 : -1) * rand(70, 130);
      var orb = document.createElement('div');
      orb.className = 'pa-orb';
      orb.style.setProperty('--c', COLORS[i]);
      orb.style.setProperty('--a', Math.atan2(dy, dx) + 'rad');
      layer.appendChild(orb);
      var mid = [s[0] + dx * 0.5 + nx * curl, s[1] + dy * 0.5 + ny * curl];
      var a = orb.animate([
        { transform: 'translate(' + s[0] + 'px,' + s[1] + 'px) scale(.6)', opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.12 },
        { transform: 'translate(' + mid[0] + 'px,' + mid[1] + 'px) scale(1)', offset: 0.55 },
        { transform: 'translate(' + px + 'px,' + py + 'px) scale(1.25)', opacity: 1, offset: 1 }
      ], { duration: DUR, easing: 'cubic-bezier(.45,0,.75,.55)', fill: 'forwards' });
      a.onfinish = function () { if (--left === 0) { layer.remove(); impact(px, py); cb(); } };
    });
  }

  function impact(px, py) {
    var box = document.createElement('div');
    box.className = 'pa-impact';
    box.style.left = px + 'px'; box.style.top = py + 'px';
    var core = document.createElement('div'); core.className = 'pa-core'; box.appendChild(core);
    for (var i = 0; i < 3; i++) {
      var r = document.createElement('div'); r.className = 'pa-shock'; r.style.animationDelay = (i * 0.12) + 's'; box.appendChild(r);
    }
    for (var j = 0; j < 36; j++) {
      var sp = document.createElement('span'); sp.className = 'pa-spark';
      sp.style.background = COLORS[j % 4]; sp.style.boxShadow = '0 0 8px ' + COLORS[j % 4];
      box.appendChild(sp);
      var ang = rand(0, Math.PI * 2), d = rand(90, 340);
      sp.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: 'translate(' + Math.cos(ang) * d + 'px,' + Math.sin(ang) * d + 'px) scale(.2)', opacity: 0 }
      ], { duration: rand(600, 1100), easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards' });
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 1500);
  }

  function run() {
    if (running) return;
    running = true;
    frame.classList.remove('pa-done');
    orbPhase(build);
  }

  function build() {
    // no tiles: after the collision the photo itself materialises from the blast point
    frame.classList.add('pa-done');
    var anim = img.animate([
      { opacity: 0, transform: 'translateZ(24px) scale(.25)', filter: 'blur(16px) brightness(3)', offset: 0 },
      { opacity: 1, transform: 'translateZ(24px) scale(1.05)', filter: 'blur(2px) brightness(1.4)', offset: 0.6 },
      { opacity: 1, transform: 'translateZ(24px) scale(1)', filter: 'blur(0) brightness(1)', offset: 1 }
    ], { duration: 950, easing: 'cubic-bezier(.16,1,.3,1)' });
    anim.onfinish = land;
    setTimeout(land, 2500); // safety net
  }

  function land() {
    if (!running) return;
    running = false;
    var f = document.createElement('div'); f.className = 'pa-flash';
    var rg = document.createElement('div'); rg.className = 'pa-ring';
    frame.appendChild(f); frame.appendChild(rg);
    setTimeout(function () { f.remove(); rg.remove(); }, 1100);
  }

  function start() {
    // play the intro once the photo is actually on screen (matters on mobile, where it sits below the text)
    if (!('IntersectionObserver' in window)) { setTimeout(run, 250); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); setTimeout(run, 250); }
    }, { threshold: 0.5 });
    io.observe(frame);
  }

  if (img.complete && img.naturalWidth) start();
  else {
    img.addEventListener('load', start, { once: true });
    img.addEventListener('error', function () { root.classList.remove('pa'); }, { once: true });
    setTimeout(function () { if (!running && !frame.classList.contains('pa-done')) { root.classList.remove('pa'); } }, 8000);
  }

  // replay on click / tap
  frame.addEventListener('click', function () { if (!running) run(); });
})();
