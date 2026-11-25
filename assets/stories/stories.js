/* Progressive enhancement: until a story mounts, its original media stay in place. */
(async () => {
  if (location.protocol === 'file:') return;
  const dir = 'assets/stories/';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let stopActive = null;
  const stop = () => stopActive?.();
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  motion.addEventListener('change', stop);
  const json = async name => {
    const r = await fetch(dir + name);
    if (!r.ok) throw Error(`${name}: ${r.status}`);
    return r.json();
  };
  const element = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text != null) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  };
  function options(select, labels) {
    select.replaceChildren(...labels.map((label, i) => new Option(label, String(i))));
  }
  function mount(key, story, groups) {
    const sources = [...document.querySelectorAll(`[data-story-source="${key}"]`)];
    if (!sources.length || !groups?.every(g => g.frames?.length)) return;
    const player = element('section', null, 'story-player');
    player.id = 'story-' + key;
    player.setAttribute('aria-label', story.title);
    // Only fixed UI markup here. Manifest text is always inserted as textContent.
    player.innerHTML = `<header><div><small class="st-eyebrow">Guided figure</small><h3></h3></div><label class="st-group"></label></header>
      <div class="st-spread"><figure><div class="st-screen"></div><figcaption></figcaption></figure>
      <article><small class="st-eyebrow st-index"></small><h4></h4><p class="st-caption"></p><p class="st-prompt"></p></article></div>
      <div class="st-controls"><button type="button" class="st-play">Play</button><button type="button" class="st-replay">Replay</button>
      <input type="range" class="st-seek" min="0" step="1" aria-label="Seek to frame"><select class="st-chapter" aria-label="Select frame"></select></div>`;
    const $ = s => player.querySelector(s);
    $('h3').textContent = story.title;
    const archive = element('details', null, 'story-archive');
    archive.append(element('summary',story.source));
    const viewport = $('.st-screen'), slider = $('.st-seek'), select = $('.st-chapter'), play = $('.st-play');
    let group = groups[0], index = 0, timer = null, ended = false;
    function pause() {
      clearTimeout(timer); timer = null;
      if (stopActive === pause) stopActive = null;
      play.textContent = 'Play';
    }
    const path = src => src.startsWith('frames/') ? dir + src : src;
    function image(src, alt, overlay) {
      const img = new Image(); img.alt = alt; img.loading = 'lazy'; img.decoding = 'async';
      img.onerror = () => {
        if (!viewport.contains(img)) return;
        if (overlay) img.remove(); else viewport.replaceChildren(element('p', 'Image unavailable. See the original material below.'));
      };
      img.src = path(src); viewport.append(img);
    }
    function bars(frame) {
      const plot = element('dl', null, 'st-bars');
      for (const [label, value] of frame.bars) {
        const row = element('div'), count = element('dd',value + (story.unit || '%'));
        const track = element('span', null, 'st-track'), fill = element('i');
        fill.style.width = `${100*value/(story.scale || 100)}%`; track.setAttribute('aria-hidden','true');
        track.append(fill); row.append(element('dt',label),count,track); plot.append(row);
      }
      viewport.append(plot);
    }
    function diagram(frame) {
      const list = element('ol',null,frame.fork ? 'st-flow st-fork' : 'st-flow');
      frame.flow.forEach((name, i) => {
        const li = element('li'); li.append(element('small',frame.fork ? ['Input','Output A','Output B'][i] : `0${i+1}`),element('strong',name));
        if (frame.focus === i) li.className = 'st-current'; list.append(li);
      }); viewport.append(list);
    }
    function render(i) {
      index = i; ended = false;
      const f = group.frames[i];
      slider.value = select.value = String(i);
      slider.setAttribute('aria-valuetext', `${i+1} of ${group.frames.length}: ${f.label}`);
      $('.st-index').textContent = `${String(i+1).padStart(2,'0')} / ${String(group.frames.length).padStart(2,'0')}   ·   ${group.name || 'Walkthrough'}`;
      $('h4').textContent = f.title || f.label; $('.st-caption').textContent = f.caption;
      $('.st-prompt').textContent = group.prompt ? `Task: ${group.prompt}` : '';
      $('figcaption').textContent = [story.note,f.note].filter(Boolean).join(' · ') || story.title;
      viewport.replaceChildren();
      if (f.image) {
        image(f.image, f.alt || f.caption, false);
        if (f.overlay) image(f.overlay,'',true);
      } else if (f.bars) bars(f); else diagram(f);
    }
    function changeGroup(n) {
      pause(); group = groups[n]; slider.max = group.frames.length - 1;
      options(select,group.frames.map((f,i)=>`${i+1}. ${f.label}`)); render(0);
    }
    function schedule() {
      timer = setTimeout(() => {
        if (index === group.frames.length-1) { pause(); ended = true; return; }
        render(index+1); schedule();
      }, group.frames[index].ms || 3300);
    }
    function start(replay) {
      stop(); if (replay || ended || index === group.frames.length-1) render(0);
      stopActive = pause; play.textContent = 'Pause'; schedule();
    }
    if (groups.length > 1) {
      const variant = element('select');
      options(variant,groups.map(g=>g.name));
      $('.st-group').append(key === 'skills' ? 'Skill ' : 'Episode ',variant);
      variant.onchange = () => changeGroup(+variant.value);
    } else $('.st-group').hidden = true;
    play.onclick = () => timer === null ? start(false) : pause();
    $('.st-replay').onclick = () => start(true);
    slider.oninput = select.onchange = e => { pause(); render(+e.target.value); };
    changeGroup(0);
    // Keep the action cards directly beneath their introduction.
    if (key === 'skills') sources[0].after(player);
    else sources[0].before(player);
    const archived = sources.filter(source => !source.hasAttribute('data-keep-visible'));
    if (archived.length) { player.after(archive); archive.append(...archived); }
    const videos = [...archive.querySelectorAll('video')];
    archive.ontoggle = () => { if (!archive.open) videos.forEach(v=>v.pause()); };
    for (const v of videos) v.addEventListener('play',()=>{ stop(); for(const other of videos) if(other!==v) other.pause(); });
    new IntersectionObserver(([entry])=>{ if(!entry.isIntersecting) pause(); }).observe(player);
    const mediaVisibility = new IntersectionObserver(entries=>{for (const e of entries) if (!e.isIntersecting) e.target.pause();});
    videos.forEach(v=>mediaVisibility.observe(v));
  }
  try {
    const [stories, recorded] = await Promise.all([json('stories.json'),json('recordings.json').catch(()=>({}))]);
    for (const [key, story] of Object.entries(stories)) {
      try { mount(key,story,story.recording ? recorded[story.recording] : [{frames:story.frames}]); }
      catch (e) { console.warn('Original material retained for',key,e); }
    }
    // The browser may have resolved the initial fragment before these IDs existed.
    if (location.hash.startsWith('#story-')) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch(e) { console.warn('Showing the original research figures.',e); }
})();
