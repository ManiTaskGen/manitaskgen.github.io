/* Episode decision expansion — small-scale motion example after The Second Loop,
   Figure 4 (persistent time, selective detail). Canvas 2D, seeded points generated
   once, draw(time) as the single entry point, auto-advance while visible.
   Sources: the Claude and Gemini transcripts and their recorded observations. */
(function () {
  'use strict';
  document.querySelectorAll('.episode-figure[data-recording]').forEach(mount);
  function mount(host) {
  const key = host.dataset.recording, gemini = key === 'gemini';
  const transcript = document.getElementById(`${key}-episode-0`);
  const model = gemini ? 'GEMINI-2.5-PRO' : 'CLAUDE-3.7-SONNET';
  const episode = gemini ? 'GEMINI_FAILED_0' : 'CLAUDE_SUCCESS_0';
  const result = gemini ? 'Failed' : 'Success';
  const actions = [...transcript.querySelectorAll('.human-message p')].map(p => p.textContent.replace(/^VLM Response:\s*/, '').trim());
  const canvas = host.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const pauseBtn = host.querySelector('.episode-pause');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const W = 1600, H = 860, Wm = 760, Hm = 1150, DURATION = 15;
  const CELLS = actions.length; // Last action is CALL_END, with no further observation.
  let SELECTED = 0, U0 = 0, U1 = 1 / CELLS;
  const C = {bg:'#f8f6ef', ink:'#182c31', muted:'#6b7f7c', line:'#c3d2cd', orange:gemini ? '#4285f4' : '#d2622a', rust:gemini ? '#4058a6' : '#b0511f', outcome:gemini ? '#4058a6' : '#1f7a4d', tick:'#8fa39f'};

  let seed = 20261122;
  const rand = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const TAU = Math.PI * 2;
  const clamp = x => Math.max(0, Math.min(1, x));
  const mix = (a, b, p) => a + (b - a) * p;
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const phase = (t, a, b) => ease((t - a) / (b - a));
  const P = (x, y) => ({x, y});
  const lerp = (a, b, p) => P(mix(a.x, b.x, p), mix(a.y, b.y, p));

  // Pre-generated points (never regenerated per frame).
  const COARSE = [], EXTRACT = [], FINE = [], FLOW = [];
  for (let j = 0; j < CELLS; j++) for (let i = 0; i < 240; i++)
    COARSE.push({u: (j + mix(.05, .95, rand())) / CELLS, v: rand(), q: rand(), s: rand(), cell: j});
  for (let i = 0; i < 640; i++) EXTRACT.push({u: rand(), v: rand(), q: rand(), s: rand()});
  for (let i = 0; i < 6800; i++) FINE.push({u: rand(), v: rand(), q: rand(), s: rand()});
  for (let i = 0; i < 26; i++) FLOW.push({o: rand(), v: rand(), q: rand(), s: rand()});

  // Palette: 28 depth buckets per warmth, mixed toward the paper background.
  const bg = [248, 246, 239], gray = [104, 100, 92], orange = gemini ? [66, 133, 244] : [210, 98, 42];
  const PALETTE = [[], []];
  for (let k = 0; k < 2; k++) for (let j = 0; j < 28; j++) {
    const a = mix(.08, k ? .95 : .7, j / 27), c = k ? orange : gray;
    PALETTE[k][j] = 'rgb(' + c.map((v, i) => Math.round(mix(bg[i], v, a))).join(',') + ')';
  }

  function group(ctx, a, fn) { if (a < .001) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }
  function text(ctx, s, x, y, size, color, opts = {}) {
    ctx.font = `${opts.bold ? '600 ' : ''}${size}px ${opts.mono ? 'monospace' : 'Georgia,serif'}`;
    ctx.fillStyle = color; ctx.textAlign = opts.align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y, opts.mono ? L.W * .92 : L.W);
  }
  function tracked(ctx, s, x, y, size, color) {
    ctx.font = `700 ${size}px system-ui,sans-serif`; ctx.fillStyle = color; ctx.textAlign = 'left';
    for (const a of s) { ctx.fillText(a, x, y); x += ctx.measureText(a).width + size * .18; }
  }
  function line(ctx, pts, color, w, dash) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
  }
  function dot(ctx, p, r, color) { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fillStyle = color; ctx.fill(); }

  function pointCloud(ctx, points, transform, opt = {}) {
    const bins = Array.from({length: 56}, () => []);
    for (const p of points) {
      const v = transform(p), warm = opt.warm || p.warm;
      const strength = .16 + .5 * (1 - p.v) + .34 * p.q;
      const band = Math.min(27, Math.max(0, Math.floor(strength * 27)));
      const s = (opt.size || 1.15) * (.67 + .62 * p.s);
      bins[(warm ? 28 : 0) + band].push(v.x, v.y, s);
    }
    for (let k = 0; k < 56; k++) {
      const b = bins[k]; if (!b.length) continue;
      ctx.beginPath();
      for (let j = 0; j < b.length; j += 3) ctx.rect(b[j], b[j + 1], b[j + 2], b[j + 2]);
      ctx.fillStyle = PALETTE[k >= 28 ? 1 : 0][k % 28]; ctx.fill();
    }
  }

  // Layouts: landscape desktop, stacked portrait for narrow screens.
  function layout(narrow) {
    // All content pairs straddle the same center as the canvas and its frame.
    const cx = (narrow ? Wm : W) / 2;
    return narrow ? {
      W: Wm, H: Hm, headY: 42, rightY: 82, narrow: true,
      top: {a: P(cx-334, 196), b: P(cx+334, 156)}, bottom: {a: P(cx-327, 1040), b: P(cx+327, 1004)},
      thumb: [{cx, y: 260, w: 474}, {cx, y: 610, w: 474}],
      font: 1.55, pad: 34, labelDY: -26
    } : {
      W, H, headY: 94, rightY: 94,
      top: {a: P(cx-515, 258), b: P(cx+515, 204)}, bottom: {a: P(cx-515, 646), b: P(cx+515, 592)},
      thumb: [{cx: cx-246, y: 305, w: 429}, {cx: cx+246, y: 305, w: 429}],
      font: 1, pad: 84, labelDY: -24
    };
  }

  const images = [];
  for (const view of transcript.querySelectorAll('.message-image img')) {
    const match = view.src.match(/step(\d+)\.png$/);
    if (!match) continue;
    const im = new Image(); images[Number(match[1])] = im;
    im.onload = () => paint(); im.src = `assets/stories/frames/${key}-${match[1]}.webp`;
  }
  const picker = host.querySelector('.step-picker');
  const buttons = actions.slice(0,-1).map((_, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Step ' + (i+1); picker.append(b);
    b.onclick = () => { select(i); userPaused = true; elapsed = 14; sync(); paint(); }; return b;
  });
  function select(i) {
    SELECTED=i; U0=i/CELLS; U1=(i+1)/CELLS;
    buttons.forEach((b,k)=>b.setAttribute('aria-pressed', String(k===i)));
    const label=`Step ${i+1} · Observation ${i} → ${actions[i]} → Observation ${i+1}`;
    host.querySelector('.episode-action strong').textContent = `Step ${i+1} · Action`;
    host.querySelector('.episode-action code').textContent = actions[i];
    const notes=gemini ? ['At the day bed.', 'Picked up the remote.', 'Carried the remote to the dining table.', 'Inspected placement regions.', 'Remote placed rear-right of the bowl, not rear-left. CALL_END: Failed.'] : ['At the kitchen counter.','No second viewpoint is available.','Picked up the white mug.','Put the mug down.','Picked up the small bowl.','Put the bowl down.','Picked up the spice container.','Put the container down.','Picked up the towel holder.','Carried the holder to the table.','Inspected regions around the first lamp.','Inspected regions around the second lamp.','Holder placed between the lamps. CALL_END: Success.'];
    host.querySelector('figcaption').textContent=`Step ${i+1} · ${notes[i]}`; canvas.setAttribute('aria-label',label);
  }

  function onAxis(axis, u, v = 0) { const a = lerp(axis.a, axis.b, u); return P(a.x + v * 18, a.y + v * 37); }
  function rectangle(axis, u0, u1) {
    return [onAxis(axis, u0, -.5), onAxis(axis, u1, -.5), onAxis(axis, u1, .5), onAxis(axis, u0, .5), onAxis(axis, u0, -.5)];
  }
  function stepLabel(ctx, s, p, size, color, align = 'center') { text(ctx, s, p.x, p.y, size * L.font, color, {align, bold: true}); }

  let L = layout(false);
  function draw(t) {
    const ctx2 = ctx;
    ctx2.save(); ctx2.setTransform(1, 0, 0, 1, 0, 0);
    ctx2.fillStyle = C.bg; ctx2.fillRect(0, 0, canvas.width, canvas.height);
    ctx2.scale(canvas.width / L.W, canvas.height / L.H);
    const f = L.font;

    // Header facts (all from the recorded transcript).
    if (L.narrow) {
      tracked(ctx2, `EPISODE ${episode}`, L.pad, L.headY, 12 * f, C.rust);
      tracked(ctx2, model, L.pad, L.headY + 24 * f, 12 * f, C.rust);
      text(ctx2, `${result.toUpperCase()} · ${buttons.length} STEPS`, L.W - L.pad - 60 * f, L.headY, 12 * f, C.muted, {align: 'right'});
    } else {
      tracked(ctx2, `EPISODE ${episode} · ${model}`, L.pad, L.headY, 13 * f, C.rust);
      text(ctx2, `${result.toUpperCase()} · ${buttons.length} STEPS USED`, L.W - L.pad, L.rightY, 13 * f, C.muted, {align: 'right'});
    }

    // Top band: all 14 skill decisions of the episode.
    const selection = phase(t, 1.9, 2.6), pull = phase(t, 2.7, 4.9);
    pointCloud(ctx2, COARSE, p => onAxis(L.top, p.u, p.v - .5), {size: 1.2, warm: false, filter: p => p.cell !== SELECTED});
    group(ctx2, mix(1, .3, pull), () => {
      pointCloud(ctx2, COARSE, p => onAxis(L.top, p.u, p.v - .5), {size: 1.2, filter: p => p.cell === SELECTED});
      group(ctx2, selection, () => pointCloud(ctx2, EXTRACT, p => onAxis(L.top, mix(U0, U1, p.u), p.v - .5), {warm: true, size: 1.16}));
    });
    group(ctx2, .45, () => line(ctx2, [L.top.a, L.top.b], C.line, .9));
    for (let i = 0; i <= CELLS; i++) {
      const p = onAxis(L.top, i / CELLS);
      group(ctx2, .55, () => line(ctx2, [P(p.x, p.y - 7 * f), P(p.x, p.y + 7 * f)], C.muted, .8 * f));
      dot(ctx2, p, 1.8 * f, C.tick);
    }
    const flow = (t / 2.15 + .04) % 1;
    for (let k = 14; k >= 0; k--) {
      const u = flow - k * .007; if (u < 0) continue;
      group(ctx2, (1 - k / 15) * .78, () => dot(ctx2, onAxis(L.top, u), (k === 0 ? 4 : 1.5) * f, k === 0 ? C.rust : C.orange));
    }
    group(ctx2, selection, () => {
      line(ctx2, rectangle(L.top, U0, U1), C.orange, 1.1 * f);
      for (const [u, i, al, dx] of [[U0, SELECTED, 'right', -8], [U1, SELECTED+1, 'left', 8]]) {
        const p = onAxis(L.top, u, -.5);
        line(ctx2, [P(p.x, p.y - 4 * f), P(p.x, p.y - 12 * f)], C.orange, .9 * f);
        stepLabel(ctx2, 'Step ' + i, P(Math.max(84, p.x + (L.narrow ? dx * f : 0)), p.y - 20 * f), 15, C.rust, L.narrow ? al : 'center');
      }
    });

    // Extraction: the selected interval travels down; tethered at both endpoints.
    const sourceA = onAxis(L.top, U0), sourceB = onAxis(L.top, U1);
    const axis = {a: lerp(sourceA, L.bottom.a, pull), b: lerp(sourceB, L.bottom.b, pull)};
    group(ctx2, phase(t, 2.5, 3.0), () => {
      group(ctx2, .6, () => {
        for (const [u, target] of [[U0, axis.a], [U1, axis.b]]) {
          const p = onAxis(L.top, u, .5);
          line(ctx2, [p, P(target.x + 9 * f, target.y + 18.5 * f)], '#c9beb2', .8 * f, [2, 5]);
        }
      });
      group(ctx2, mix(.9, .34, pull), () => pointCloud(ctx2, EXTRACT, p => onAxis(axis, p.u, p.v - .5), {warm: true, size: 1.18}));
      group(ctx2, .68, () => line(ctx2, rectangle(axis, 0, 1), C.orange, .9 * f));
    });

    // Bottom band: the decision unfolds left to right.
    const visible = phase(t, 4.2, 5.2), progress = clamp((t - 5.2) / 5.2);
    group(ctx2, visible, () => {
      const done = [], pending = [];
      for (const p of FINE) (p.u <= progress ? done : pending).push(p);
      group(ctx2, .4, () => pointCloud(ctx2, pending, p => onAxis(L.bottom, p.u, p.v - .5), {size: 1.1}));
      group(ctx2, .82, () => pointCloud(ctx2, done, p => onAxis(L.bottom, p.u, p.v - .5), {warm: true, size: 1.14}));
      group(ctx2, .46, () => line(ctx2, [L.bottom.a, L.bottom.b], C.line, .8 * f));
      for (let i = 0; i <= 48; i++) {
        const u = i / 48, p = onAxis(L.bottom, u), major = i % 6 === 0, done2 = u <= progress;
        group(ctx2, done2 ? .8 : .36, () => line(ctx2, [P(p.x, p.y - (major ? 8 : 4) * f), P(p.x, p.y + (major ? 8 : 4) * f)], done2 ? C.orange : C.muted, (major ? .85 : .6) * f));
        if (major) dot(ctx2, p, (done2 ? 2.2 : 1.7) * f, done2 ? C.orange : '#b9c5c1');
      }
      for (const [u, i] of [[0, SELECTED], [1, SELECTED+1]]) {
        const p = onAxis(L.bottom, u, .5);
        line(ctx2, [P(p.x, p.y + 5 * f), P(p.x, p.y + 14 * f)], C.orange, .85 * f);
        stepLabel(ctx2, 'Step ' + i, P(p.x, p.y + 34 * f), 15, C.rust);
      }
      // Event markers: observation -> grounded skill -> observation.
      const events = [
        {u: .1, img: 0},
        {u: .9, img: 1}
      ];
      for (const e of events) {
        const reached = progress >= e.u - .02;
        group(ctx2, reached ? 1 : .18, () => {
            const im = images[SELECTED + e.img], geo = L.thumb[e.img];
            const p = onAxis(L.bottom, e.u, -.5);
            if (im?.complete && im.naturalWidth) {
              const iw = geo.w, ih = iw * im.naturalHeight / im.naturalWidth;
              line(ctx2, [P(p.x, p.y - 4 * f), P(geo.cx, geo.y + ih + 4 * L.font)], C.orange, .8 * f, [2, 5]);
              ctx2.save();
              ctx2.shadowColor = 'rgba(24,44,49,.18)'; ctx2.shadowBlur = 10 * L.font; ctx2.shadowOffsetY = 3 * L.font;
              ctx2.drawImage(im, geo.cx - iw / 2, geo.y, iw, ih);
              ctx2.restore();
              ctx2.strokeStyle = C.line; ctx2.lineWidth = 1;
              ctx2.strokeRect(geo.cx - iw / 2, geo.y, iw, ih);
              text(ctx2, 'Observation ' + (SELECTED + e.img), geo.cx, geo.y + ih + 20 * L.font, 13.5 * f, C.muted, {align: 'center'});
            } else if (!im) {
              text(ctx2, 'Initial view not recorded', geo.cx, geo.y + geo.w * .28, 20 * f, C.muted, {align:'center'});
            }
        });
      }
      // Episode outcome.
      const ok = SELECTED === buttons.length - 1 ? phase(t, 10.2, 10.8) : 0;
      group(ctx2, ok, () => {
        const p = onAxis(L.bottom, 1.005, -.5);
        ctx2.font = `600 ${15 * f}px system-ui,sans-serif`;
        const tw = ctx2.measureText(result).width;
        const tx = Math.min(p.x + 24 * f, L.W - L.pad);
        dot(ctx2, P(tx - tw - 14 * f, p.y - 6 * f), 4 * f, C.outcome);
        text(ctx2, result, tx, p.y, 15 * f, C.outcome, {bold: true, align: 'right'});
      });
    });
    ctx2.restore();
  }

  // Scheduling: auto-advance while visible, foreground and not user-paused.
  let elapsed = 0, last = null, raf = null, paintAcc = 0, userPaused = false, inView = false;
  const FRAME = 1000 / 30;
  function paint() { draw(elapsed); }
  function size() {
    const cssW = canvas.getBoundingClientRect().width;
    if (!cssW) return;
    L = layout(cssW < 620);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssW * dpr * L.H / L.W);
    canvas.style.height = (cssW * L.H / L.W) + 'px';
    paint();
  }
  function active() { return inView && !document.hidden && !reduced.matches && !userPaused; }
  function tick(now) {
    raf = null;
    if (!active()) return;
    if (last === null) last = now;
    const delta = now - last;
    last = now;
    elapsed += delta / 1000;
    if (elapsed >= DURATION) { elapsed %= DURATION; select((SELECTED + 1) % buttons.length); }
    paintAcc += delta;
    if (paintAcc >= FRAME) { paintAcc %= FRAME; paint(); }
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null; last = null; paintAcc = 0;
    if (active()) raf = requestAnimationFrame(tick);
    pauseBtn.hidden = reduced.matches;
    pauseBtn.textContent = userPaused ? 'Play' : 'Pause';
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
  }
  pauseBtn.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener ? reduced.addEventListener('change', sync) : reduced.addListener(sync);
  new ResizeObserver(() => { size(); sync(); }).observe(canvas);
  new IntersectionObserver(es => { inView = es[0].isIntersecting; sync(); }, {threshold: .3}).observe(canvas);
  select(0);
  if (reduced.matches) elapsed = 14.4;   // static, fully expanded
  new Promise(res => document.fonts && document.fonts.ready ? document.fonts.ready.then(res) : res()).then(() => { size(); sync(); });
  }
})();
