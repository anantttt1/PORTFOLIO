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

  function run() {
    if (running) return;
    running = true;
    frame.classList.remove('pa-done');
    var old = frame.querySelector('.pa-shards'); if (old) old.remove();

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
        var from =
          'translate3d(' + (nx * w * rand(2.2, 4.2) + rand(-120, 120)) + 'px,' +
          (ny * h * rand(2.2, 4.2) + rand(-120, 120)) + 'px,' + rand(-700, 420) + 'px) ' +
          'rotateX(' + rand(-200, 200) + 'deg) rotateY(' + rand(-200, 200) + 'deg) rotateZ(' + rand(-180, 180) + 'deg) ' +
          'scale(' + rand(0.25, 1.5) + ')';
        var delay = 150 + dist * 900 + rand(0, 320);       // centre locks in first, edges last
        var dur = rand(1100, 1700);
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

  function start() { setTimeout(run, 250); }

  if (img.complete && img.naturalWidth) start();
  else {
    img.addEventListener('load', start, { once: true });
    img.addEventListener('error', function () { root.classList.remove('pa'); }, { once: true });
    setTimeout(function () { if (!running && !frame.classList.contains('pa-done')) { root.classList.remove('pa'); } }, 8000);
  }

  // replay on click / tap
  frame.addEventListener('click', function () { if (!running) run(); });
})();
