/* Local playback and optional same-origin controls for the embedding page. */
const stage = document.querySelector('.film'),
  controls = document.querySelector('.controls');
const audio = document.querySelector('audio'),
  playButton = document.querySelector('.play');
const soundButton = document.querySelector('.sound'),
  seek = document.querySelector('.seek');
const timeText = document.querySelector('.time'),
  fsButton = document.querySelector('.fs');
const query = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let autoplay = query.get('autoplay') !== '0',
  loop = query.get('loop') !== '0';
let manualPause = !autoplay || reduced.matches,
  intersecting = false,
  inside = window.parent === window,
  dragging = false,
  running = false;
let current = reduced.matches ? 26 : 0,
  base = current,
  started = 0,
  raf = 0,
  ready = false,
  wantsSound = false,
  ended = false;
const showTime = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const shouldRun = () => ready && !manualPause && !dragging && intersecting && inside && !document.hidden;

function updateUi() {
  seek.value = current;
  timeText.textContent = showTime(current) + ' / ' + showTime(DURATION);
  playButton.textContent = running ? 'Pause' : 'Play';
  playButton.setAttribute('aria-label', running ? 'Pause animation' : 'Play animation');
  soundButton.textContent = wantsSound ? 'Sound on' : 'Sound off';
  soundButton.setAttribute('aria-pressed', String(wantsSound));
  stage.classList.toggle('paused', !running);
}

function setSoundClock() {
  if (!wantsSound || !running) {
    audio.pause();
    return;
  }
  if (audio.readyState >= 1 && Math.abs(audio.currentTime - current) > .15) audio.currentTime = current;
  audio.play().catch(() => {
    wantsSound = false;
    updateUi();
  });
}

function paint() {
  draw(current);
  updateUi();
}

function tick(now) {
  if (!running) return;
  current = base + (now - started) / 1000;
  if (current >= DURATION) {
    if (!loop) {
      current = DURATION;
      running = false;
      manualPause = true;
      ended = true;
      audio.pause();
      paint();
      return;
    }
    current %= DURATION;
    base = current;
    started = now;
    setSoundClock();
  }
  if (wantsSound && audio.readyState >= 2 && !audio.paused && Math.abs(audio.currentTime - current) > .35) audio.currentTime = current;
  paint();
  raf = requestAnimationFrame(tick);
}

function reconcile() {
  if (!ready) return;
  const wanted = shouldRun();
  if (wanted && !running) {
    running = true;
    base = current;
    started = performance.now();
    setSoundClock();
    raf = requestAnimationFrame(tick);
  }
  if (!wanted && running) {
    current = Math.min(DURATION, base + (performance.now() - started) / 1000);
    running = false;
    cancelAnimationFrame(raf);
    audio.pause();
  }
  paint();
}

function go(t) {
  if (!Number.isFinite(+t)) return;
  current = Math.max(0, Math.min(DURATION, +t));
  ended = current === DURATION;
  base = current;
  started = performance.now();
  if (audio.readyState >= 1) audio.currentTime = current;
  if (ready) paint();
}

function play() {
  if (ended || current >= DURATION) go(0);
  manualPause = false;
  reconcile();
}

function pause() {
  manualPause = true;
  reconcile();
}

function toggle() {
  if (running) pause();
  else play();
}
playButton.onclick = toggle;
document.querySelector('.replay').onclick = () => {
  go(0);
  play();
};
soundButton.onclick = () => {
  wantsSound = !wantsSound;
  if (wantsSound && !running) play();
  setSoundClock();
  updateUi();
};
seek.addEventListener('pointerdown', () => {
  dragging = true;
  reconcile();
});
window.addEventListener('pointerup', () => {
  if (dragging) {
    dragging = false;
    reconcile();
  }
});
seek.addEventListener('pointercancel', () => {
  dragging = false;
  reconcile();
});
seek.addEventListener('input', () => go(+seek.value));
fsButton.onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else stage.requestFullscreen?.();
};
stage.addEventListener('keydown', e => {
  if (e.target !== stage && e.target !== canvas) return;
  if (e.key === ' ' || e.key === 'k') {
    e.preventDefault();
    toggle();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    go(current + 5);
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    go(current - 5);
  }
});
document.addEventListener('visibilitychange', reconcile);
new IntersectionObserver(entries => {
  intersecting = entries[0].isIntersecting;
  reconcile();
}, {
  threshold: [0, .1]
}).observe(stage);
// Parent observation handles an iframe embedded far below the fold on the same-origin project page.
// Cross-origin hosts can send the visibility message themselves or let the in-frame observer handle it.
if (!inside) {
  try {
    const holder = window.frameElement;
    if (holder) {
      new parent.IntersectionObserver(es => {
        inside = es[0].isIntersecting;
        reconcile();
      }, {
        threshold: [0, .1]
      }).observe(holder);
    } else inside = true;
  } catch {
    inside = true;
  }
}
window.addEventListener('message', e => {
  if (e.source !== window.parent || !e.data || e.data.type !== 'manitaskgen-visibility') return;
  inside = Boolean(e.data.visible);
  reconcile();
});
reduced.addEventListener?.('change', () => {
  if (reduced.matches) pause();
});

function resizeCanvas() {
  const w = Math.min(2400, Math.max(640, Math.round(stage.clientWidth * (window.devicePixelRatio || 1))));
  if (canvas.width !== w) {
    canvas.width = w;
    canvas.height = Math.round(w * 9 / 16);
  }
  if (ready) paint();
}
new ResizeObserver(resizeCanvas).observe(stage);
window.ManiTaskGenFilm = {
  duration: DURATION,
  play,
  pause,
  seek: go,
  get time() {
    return current;
  },
  renderAt(t) {
    pause();
    go(t);
  },
  get ready() {
    return ready;
  }
};
Promise.all([room.decode(), timber.decode(), document.fonts.load('24px FilmSans'), document.fonts.load('32px FilmSerif'), document.fonts.load('italic 20px FilmSerif'), document.fonts.load('18px FilmMono'), document.fonts.load('16px FilmLabelSC', 'Expected Result')]).then(() => {
  ready = true;
  resizeCanvas();
  paint();
  reconcile();
  document.documentElement.dataset.ready = 'true';
}).catch(error => {
  const notice = document.createElement('p');
  notice.setAttribute('role', 'alert');
  notice.textContent = 'Unable to load animation assets. ' + error.message;
  document.querySelector('main').append(notice);
  console.error(error);
});
