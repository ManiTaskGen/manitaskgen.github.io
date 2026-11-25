/* Generic JS-driven media walkthrough for every section.
   Each .ov-player[data-media="manifest.json"] fetches its storyboard and builds
   the player DOM. render(t) is a pure function of time; no playback history. */
(async function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const keepAlive = []; // Observers without a JS reference can be garbage-collected.
  for (const host of document.querySelectorAll('.ov-player[data-media]')) {
    try {
      const res = await fetch(host.dataset.media);
      if (!res.ok) throw new Error(res.status);
      mount(host, await res.json());
    } catch (error) {
      host.hidden = true;
      const fb = host.parentElement.querySelector('.md-fallback') ||
        host.closest('.section-container, section')?.querySelector('.md-fallback');
      if (fb) fb.open = true;
      console.warn('Static fallback for', host.dataset.media, error.message || error);
    }
  }

  function mount(host, cfg) {
    const doc = document;
    const el = (tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
    const phases = cfg.phases.map(p => ({...p}));
    const steps = cfg.steps.map(s => ({...s})).sort((a, b) => a.start - b.start);
    let lastSrc = null;
    for (const s of steps) { if (!s.src) s.src = lastSrc; else lastSrc = s.src; }
    const duration = cfg.duration || steps.at(-1).start + 4;
    const phaseAt = t => phases.findLastIndex(p => t >= p.start);
    const stepAt = t => steps.findLastIndex(s => t >= s.start);
    const fmt = s => `0:${String(Math.floor(Math.min(s, duration))).padStart(2, '0')}`;

    // Route: main phases chained with arrows, branch phases stacked, "controls" phases next to the clock.
    const route = el('div', 'ov-route');
    route.role = 'group'; route.setAttribute('aria-label', cfg.routeLabel || 'Explore this section');
    const parts = [];
    for (const [i, ph] of phases.entries()) {
      if (ph.route === 'controls') continue;
      const b = el('button'); b.type = 'button'; b.dataset.phase = i;
      if (ph.routeTag) b.append(el('small', null, ph.routeTag));
      b.append(ph.route);
      const last = parts.at(-1);
      if (ph.branch && last?.branch) last.list.push(b);
      else parts.push(ph.branch ? {branch: true, list: [b]} : {node: b});
    }
    parts.forEach((p, i) => {
      if (i && !parts[i - 1].branch) route.append(el('b', null, '→'));
      if (p.branch) { const w = el('div', 'ov-branches'); p.list.forEach(b => w.append(b)); route.append(w); }
      else route.append(p.node);
    });

    // Stage and explanation card.
    const stage = el('div', 'ov-screen'), figcap = el('figcaption');
    const fig = el('figure'); fig.append(stage, figcap);
    const kicker = el('p', 'ov-label ov-kicker'), title = el('h3'), desc = el('p', 'ov-description'), rows = el('dl');
    const card = el('article'); card.append(kicker, title, desc, rows);
    const spread = el('div', 'ov-spread'); spread.append(fig, card);

    // Controls.
    const controls = el('div', 'ov-controls');
    const play = el('button', 'ov-play', 'Play'); play.type = 'button';
    const replay = el('button', 'ov-replay', 'Replay'); replay.type = 'button';
    const seek = doc.createElement('input');
    seek.className = 'ov-seek'; seek.type = 'range'; seek.min = 0; seek.step = 0.1; seek.max = duration;
    seek.setAttribute('aria-label', cfg.seekLabel || 'Walkthrough time in seconds');
    const clock = el('span', 'ov-clock');
    controls.append(play, replay, seek, clock);
    for (const ph of phases) if (ph.route === 'controls') {
      const b = el('button', null, ph.route); b.type = 'button'; b.dataset.phase = phases.indexOf(ph);
      controls.append(b);
    }

    const player = el('div', 'ov-player-inner');
    player.append(route, spread, controls);
    host.replaceChildren(player);

    // Media state.
    let time = 0, shot = -1, frame = 0, origin = 0, vid = null, curImg = null, curZoom = null;
    const cache = {};
    const wrap = inner => wrap0(el('div', 'ov-fit'), inner);
    function wrap0(w, inner) { w.append(inner); return w; }
    function box(spec) {
      const [x, y, w, h] = spec.box; const out = [];
      const f = el('i', 'ov-box'); f.style.color = spec.color || 'var(--accent)';
      [f.style.left, f.style.top, f.style.width, f.style.height] = [x, y, w, h].map(v => v * 100 + '%');
      out.push(f);
      if (spec.label) {
        const t = el('span', 'ov-tag', spec.label); t.style.color = f.style.color;
        t.style.left = x * 100 + '%'; t.style.top = y * 100 + '%'; out.push(t);
      }
      return out;
    }
    function ensureVideo() {
      if (vid) return;
      vid = doc.createElement('video');
      vid.muted = true; vid.preload = 'metadata'; vid.playsInline = true; vid.setAttribute('playsinline', '');
      vid.addEventListener('timeupdate', () => {
        const s = steps[shot];
        if (s?.kind === 'video' && s.clip?.[1] != null && vid.currentTime >= s.clip[1]) vid.currentTime = s.clip[0] || 0;
      });
    }
    function zoom(s) {
      if (!curImg?.naturalWidth || !stage.contains(curImg)) return;
      const cw = stage.clientWidth, ch = stage.clientHeight;
      const ia = curImg.naturalWidth / curImg.naturalHeight, ca = cw / ch;
      const dw = ia > ca ? cw : ch * ia, dh = ia > ca ? cw / ia : ch;
      const ox = (cw - dw) / 2, oy = (ch - dh) / 2; // object-fit: contain offsets
      const [fx, fy, fw, fh] = s.focus;
      const cx = ox + (fx + fw / 2) * dw, cy = oy + (fy + fh / 2) * dh;
      const sc = Math.min(cw / (fw * dw), ch / (fh * dh), 4);
      curImg.style.transformOrigin = '0 0';
      curImg.style.transform = `translate(${cw / 2 - cx * sc}px, ${ch / 2 - cy * sc}px) scale(${sc})`;
    }
    function diagram(s) {
      const list = el('ol');
      for (const [i, [head, body]] of (s.items || []).entries()) {
        const li = el('li');
        li.classList.toggle('ov-highlight', s.highlight === i);
        li.append(el('small', null, String(i + 1).padStart(2, '0')), el('strong', null, head), el('span', null, body));
        list.append(li);
      }
      stage.replaceChildren(list);
    }
    function activate(s) {
      const attach = img => {
        const w = wrap(img);
        for (const a of s.annotations || []) w.append(...box(a));
        stage.replaceChildren(w);
      };
      if (s.kind === 'video') {
        ensureVideo();
        if (vid.dataset.step !== s.id) { vid.dataset.step = s.id; vid.src = s.src; vid.currentTime = s.clip?.[0] || 0; }
        stage.replaceChildren(wrap(vid));
      } else if (s.kind === 'diagram') {
        vid?.pause(); diagram(s);
      } else {
        vid?.pause();
        // One Image per src, kept alive across steps: re-creating or moving a
        // loading <img> can abort its request, so attach only once complete.
        let img = cache[s.src];
        if (!img) {
          img = new Image(); img.alt = s.alt || ''; img.decoding = 'async';
          // Inline sizing: deterministic box for the zoom math, independent of stylesheets.
          Object.assign(img.style, {width: '100%', height: '100%', objectFit: 'contain', display: 'block'});
          cache[s.src] = img;
          let tries = 0;
          const fallback = () => { if (stage.contains(img)) stage.replaceChildren(el('p', null, img.alt || s.caption || 'Asset pending.')); };
          img.onerror = () => {
            if (tries++ < 2) img.src = s.src + (s.src.includes('?') ? '&' : '?') + 'mtgr=' + tries;
            else fallback();
          };
          img.onload = () => { if (steps[shot] === s && !stage.contains(img)) { attach(img); if (curZoom === s) zoom(s); } };
          img.src = s.src;
        }
        curImg = img; curZoom = s.kind === 'zoom' ? s : null;
        if (!img.complete) stage.replaceChildren(el('p', 'ov-loading', 'Loading…'));
        else { attach(img); if (curZoom === s) zoom(s); }
      }
      figcap.textContent = s.caption || s.alt || '';
    }
    addEventListener('resize', () => { if (curZoom) zoom(curZoom); });

    // Timeline: deterministic render(t).
    function render(t) {
      time = Math.max(0, Math.min(duration, t));
      seek.value = time;
      clock.textContent = `${fmt(time)} / ${fmt(duration)}`;
      const si = Math.max(0, stepAt(time));
      if (si !== shot) { shot = si; activate(steps[si]); }
      const s = steps[shot];
      if (s.kind === 'video' && vid) {
        const cs = s.clip?.[0] || 0;
        if (frame) { if (vid.paused) vid.play().catch(() => {}); }
        else {
          vid.pause();
          const target = cs + (time - s.start);
          if (Math.abs(vid.currentTime - target) > 0.35) vid.currentTime = target;
        }
      }
      const ph = phases[Math.max(0, phaseAt(time))];
      kicker.textContent = ph.kicker || '';
      title.textContent = ph.title || '';
      desc.textContent = ph.description || '';
      rows.replaceChildren(...(s.rows || ph.rows || []).flatMap(([k, v]) => [el('dt', null, k), el('dd', null, v)]));
      for (const b of host.querySelectorAll('button[data-phase]')) b.setAttribute('aria-pressed', String(+b.dataset.phase === Math.max(0, phaseAt(time))));
    }
    function pause() { cancelAnimationFrame(frame); frame = 0; play.textContent = 'Play'; vid?.pause(); }
    function tick(now) {
      render((now - origin) / 1000);
      if (time >= duration) pause(); else frame = requestAnimationFrame(tick);
    }
    function start(t) { pause(); render(t); origin = performance.now() - time * 1000; play.textContent = 'Pause'; frame = requestAnimationFrame(tick); }
    let userTouched = false, startedOnce = false;
    const touch = fn => () => { userTouched = true; fn(); };
    play.onclick = touch(() => frame ? pause() : start(time >= duration ? 0 : time));
    replay.onclick = touch(() => start(0));
    seek.oninput = touch(() => { pause(); render(+seek.value); });
    for (const b of host.querySelectorAll('button[data-phase]')) b.onclick = touch(() => { pause(); render(phases[+b.dataset.phase].start); });
    reduce.addEventListener('change', () => { if (reduce.matches) { pause(); render(cfg.staticAt ?? duration); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) { pause(); return; }
      // Autoplay sections run on their own; manual sections wait for Play.
      if (cfg.autoplay && !userTouched && !reduce.matches && !frame &&
          (cfg.autoplay === 'loop' || !startedOnce)) {
        startedOnce = true;
        start(time >= duration ? 0 : time);
      }
    }, {threshold: .45});
    keepAlive.push(io); io.observe(host);
    render(reduce.matches ? (cfg.staticAt ?? duration) : 0);
    host.hidden = false;
  }

  // [data-autoloop]: muted video walls that loop only while visible.
  // (Scroll polling instead of IntersectionObserver: more predictable here.)
  for (const grid of document.querySelectorAll('[data-autoloop]')) {
    const vids = [...grid.querySelectorAll('video')];
    if (!vids.length) continue;
    for (const v of vids) {
      v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', '');
      v.removeAttribute('controls'); v.preload = 'metadata';
    }
    let showing = null;
    const sync = () => {
      const r = grid.getBoundingClientRect();
      const vis = !reduce.matches && r.width > 0 && r.height > 0 &&
        r.top < innerHeight * .92 && r.bottom > innerHeight * .08;
      if (vis === showing) return;
      showing = vis;
      vids.forEach(v => {
        if (reduce.matches) { v.pause(); v.controls = true; }
        else if (vis) v.play().catch(() => {});
        else { v.pause(); v.controls = false; }
      });
    };
    sync();
    addEventListener('scroll', sync, {passive: true});
    addEventListener('resize', sync);
    setInterval(sync, 900);
    reduce.addEventListener('change', () => { showing = null; sync(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) vids.forEach(v => v.pause()); else { showing = null; sync(); } });
  }

  // [data-clickplay]: poster-like overlay for long recordings; native controls appear after the click.
  for (const v of [...document.querySelectorAll('video[data-clickplay]')]) {
    v.removeAttribute('controls'); v.preload = 'metadata';
    const holder = document.createElement('div'); holder.className = 'video-clickplay';
    v.before(holder); holder.append(v);
    const overlay = document.createElement('button'); overlay.type = 'button'; overlay.className = 'clickplay-overlay';
    overlay.setAttribute('aria-label', 'Play video');
    overlay.append(document.createElement('span'));
    holder.append(overlay);
    overlay.onclick = () => { overlay.remove(); v.controls = true; v.play().catch(() => {}); };
  }
})();
