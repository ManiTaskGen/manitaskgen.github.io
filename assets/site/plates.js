/* Small editorial plates. Coordinates are shared across the overview and the
   detail figures; surrounding HTML carries the labels and reading order. */
(() => {
  const ink='#36453e', pine='#386d60', copper='#a1613e', paper='#f8f6ef', wash='#dbe5d8';
  const path=(d,color=ink,fill='none',extra='')=>`<path d="${d}" stroke="${color}" fill="${fill}" ${extra}/>`;
  const dot=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
  const rect=(x,y,w,h,color=ink,fill=paper)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" stroke="${color}" fill="${fill}"/>`;
  const route=d=>path(d,copper,'none','stroke-dasharray="3 4"');
  const box=(x,y)=>`<g transform="translate(${x} ${y})">${path('M0 0l10 -4 10 4v10l-10 5 -10 -5z',ink,wash)}${path('M0 0l10 5 10 -5 M10 5v10')}</g>`;
  const desk=path('M19 59l65 -24 57 19 -63 28z',pine,'#eee8d8')+path('M19 59v18m59 5v12m63 -40v21',pine);
  // Deterministic stippling along the two room planes (no raster thumbnails).
  const cloud=Array.from({length:135},(_,i)=>{const u=((i*71)%137)/137,v=((i*31)%139)/139;return dot(17+60*u,18+41*v+20*u,.65,'#8d9886')}).join('');
  const tile=rect(20,18,120,67,pine,'#eeeadd');
  const region=(x,y,w,h)=>rect(x,y,w,h,pine,wash);
  const anchor=(x,y)=>dot(x,y,8,ink)+dot(x-2,y-2,2.5,paper);
  const graph=path('M80 18v15M39 46V33h81v13M39 49v15M23 78V64h38v14M119 50v24',pine)+[[80,16],[39,47],[119,47],[23,79],[61,79],[119,79]].map(([x,y],i)=>dot(x,y,i<3?6:4,i===5?copper:pine)).join('');
  const cards=[0,1,2].map(i=>rect(43-i*6,18+i*6,81,47)).join('')+path('M42 43h47m-47 9h58m-58 9h32',pine);
  const figs={
    room:cloud+path('M13 10v54l62 24 70 -30V9M13 64l65 -25 67 19M78 39V7','#839584')+desk+box(70,46),
    graph:`<g transform="translate(0 13) scale(.71)">${desk}${path('M42 50l58 20m-37 -27 58 18M37 65l66 -24M56 72l66 -25',pine)}${box(59,41)}</g>${route('M85 47h15')}<g transform="translate(87 24) scale(.48)">${graph}</g>`, cards,
    move:desk+box(39,47)+route('M61 48q31 -32 43 1')+path('M98 46l7 5 2 -9',copper),
    align:desk+[49,69,89].map((x,i)=>box(x,53-i*7)).join(''),
    bench:path('M28 17v60h109',ink)+[33,50,39,57].map((h,i)=>rect(41+i*22,76-h,12,h,i===3?copper:pine,i===3?'#e5cbb7':wash)).join(''),
    memory:cards+route('M109 67q32 -4 23 -36')+path('M127 36l5 -7 6 6',copper),
    recall:rect(15,34,44,33)+path('M22 45h28m-28 7h17',pine)+route('M63 51h31')+path('M88 46l8 5 -8 5',copper)+anchor(114,51),
    surface:tile+box(63,42),
    around:tile+region(50,26,60,51)+anchor(80,52)+box(90,31),
    direction:tile+region(23,38,50,28)+anchor(80,52)+box(40,44),
    between:tile+region(52,37,54,29)+anchor(43,52)+anchor(115,52)+box(69,45),
    vote:[30,75,120].map(x=>dot(x,27,6,pine)+path(`M${x} 36v10l${80-x} 14`,pine)).join('')+rect(69,60,22,22)+path('M73 71l5 5 9 -12',copper)
  };
  document.querySelectorAll('[data-sketch]').forEach(el=>{
    el.insertAdjacentHTML('afterbegin',`<svg class="ink-sketch" viewBox="0 0 160 100" aria-hidden="true" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">${figs[el.dataset.sketch]}</svg>`);
  });
  const plot=document.querySelector('.trial-chart');
  if(plot){
    const x=n=>42+n*12.8,y=n=>134-(n-30)*3.4, samples=[[0,36],[1,51],[5,56],[10,58],[20,60]];
    const label=(x,y,s)=>`<text x="${x}" y="${y}" text-anchor="middle">${s}</text>`;
    const grid=[30,40,50,60].map(n=>path(`M38 ${y(n)}h268`,'#d3ccbd')+label(19,y(n)+4,n+'%')).join('');
    const marks=samples.map(([n,v],i)=>dot(x(n),y(v),3.8,copper)+label(x(n)+(i===0?-3:i===1?2:0),153,n)).join('');
    plot.insertAdjacentHTML('beforeend',`<svg viewBox="0 0 320 166" role="img" aria-label="Gemini success rates for 0, 1, 5, 10 and 20 trial episodes: 36, 51, 56, 58 and 60 percent.">${grid}${path('M'+samples.map(([n,v])=>`${x(n)} ${y(v)}`).join(' L'),pine)}${marks}</svg>`);
  }
})();
