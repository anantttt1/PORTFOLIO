/* Photo shatter -> fly in -> assemble intro. Click / tap the photo to replay. */
(function () {
  var root = document.documentElement;
  var frame = document.querySelector('.photo-frame');
  var img = frame && frame.querySelector('img');
  if (!frame || !img) { root.classList.remove('pa'); return; }

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !frame.animate) { root.classList.remove('pa'); return; }

  var COLS = 7, ROWS = 9, RADIUS = 18, running = false;
  var rand = function (a, b) { return a + Math.random() * (b - a); };

  function done() {
    frame.classList.add('pa-done');
    var old = frame.querySelector('.pa-shards');
    requestAnimationFrame(function () { if (old) old.remove(); });
  }

  var COLORS = ['#6ee7b7', '#60a5fa', '#a78bfa', '#f472b6'];

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
    var o = frame.querySelector('.pa-shards'); if (o) o.remove();
    orbPhase(build);
  }

  function build() {
    var cs = getComputedStyle(frame);
    var imgRect = img.getBoundingClientRect();
    var frameRect = frame.getBoundingClientRect();
    // use layout size (unaffected by the 3D transform): frame width minus padding
    var pad = parseFloat(cs.paddingLeft) || 10;
    var w = frame.offsetWidth - pad * 2;
    var h = w * 5 / 4; // image is 4/5
    if (!w || !h) { running = false; done(); return; }

    var nw = img.naturalWidth || 4, nh = img.naturalHeight || 5;
    var scale = Math.max(w / nw, h / nh);           // object-fit: cover
    var dw = nw * scale, dh = nh * scale;
    var offX = (w - dw) / 2, offY = 0;               // object-position: center top

    var box = document.createElement('div');
    box.className = 'pa-shards';
    var tw = w / COLS, th = h / ROWS, tiles = [], maxEnd = 0;

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var t = document.createElement('div');
        t.className = 'pa-tile' +
          (r === 0 && c === 0 ? ' tl' : '') + (r === 0 && c === COLS - 1 ? ' tr' : '') +
          (r === ROWS - 1 && c === 0 ? ' bl' : '') + (r === ROWS - 1 && c === COLS - 1 ? ' br' : '');
        var left = c * tw, top = r * th;
        t.style.cssText =
          'left:' + left + 'px;top:' + top + 'px;width:' + (tw + 0.7) + 'px;height:' + (th + 0.7) + 'px;' +
          'background-image:url("' + img.currentSrc + '");' +
          'background-size:' + dw + 'px ' + dh + 'px;' +
          'background-position:' + (offX - left) + 'px ' + (offY - top) + 'px;';
        box.appendChild(t);

        // explode direction: away from centre, plus chaos
        var nx = (c + 0.5) / COLS - 0.5, ny = (r + 0.5) / ROWS - 0.5;
        var dist = Math.sqrt(nx * nx + ny * ny);           // 0 .. ~0.64
        // start collapsed at the collision point (frame centre), then fly out to the slot
        var from =
          'translate3d(' + (-nx * w + rand(-25, 25)) + 'px,' + (-ny * h + rand(-25, 25)) + 'px,' + rand(-250, 450) + 'px) ' +
          'rotateX(' + rand(-220, 220) + 'deg) rotateY(' + rand(-220, 220) + 'deg) rotateZ(' + rand(-200, 200) + 'deg) ' +
          'scale(' + rand(0.1, 0.35) + ')';
        var delay = dist * 450 + rand(0, 180);              // centre first, edges last
        var dur = rand(950, 1500);
        maxEnd = Math.max(maxEnd, delay + dur);
        tiles.push({ el: t, from: from, delay: delay, dur: dur });
      }
    }
    frame.appendChild(box);

    var finished = 0;
    tiles.forEach(function (o) {
      var a = o.el.animate([
        { transform: o.from, opacity: 0, filter: 'blur(8px) brightness(2.2)', offset: 0 },
        { opacity: 1, filter: 'blur(0px) brightness(1.5)', offset: 0.55 },
        { transform: 'translate3d(0,0,0) rotateX(0) rotateY(0) rotateZ(0) scale(1)', opacity: 1, filter: 'blur(0px) brightness(1)', offset: 1 }
      ], { duration: o.dur, delay: o.delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
      a.onfinish = function () {
        // lock tile: fade its glowing seam so it blends into the photo
        o.el.style.boxShadow = 'none';
        if (++finished === tiles.length) land();
      };
    });

    // safety net in case an animation never fires finish
    setTimeout(function () { if (running) land(); }, maxEnd + 1500);
  }

  function land() {
    if (!running) return;
    running = false;
    done();
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
