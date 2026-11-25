/* Short, silent studies drawn by the full film's unmodified scene renderer. */
(async () => {
  const clips=[[17,29],[72,85.5],[101,113]], motion=matchMedia('(prefers-reduced-motion:reduce)');
  const play=document.querySelector('#play'), buttons=[...document.querySelectorAll('[data-clip]')];
  let index=0,t=motion.matches?26:17,paused=motion.matches,visible=false,frame=0,last=null;
  await Promise.all([room.decode(),timber.decode(),...['FilmSans','FilmSerif','FilmMono'].map(f=>document.fonts.load('20px '+f))]);
  function paint(){draw(t);buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));canvas.setAttribute('aria-label',buttons[index].textContent);play.textContent=paused?'Play':'Pause'}
  function tick(now){
    if(last===null)last=now;
    if(now-last>=40){t+=(now-last)/1000;last=now;if(t>=clips[index][1]){index=(index+1)%clips.length;t=clips[index][0]}paint()}
    frame=requestAnimationFrame(tick);
  }
  function sync(){cancelAnimationFrame(frame);last=null;paint();if(visible&&!paused&&!document.hidden)frame=requestAnimationFrame(tick)}
  play.onclick=()=>{paused=!paused;sync()};
  buttons.forEach((b,i)=>b.onclick=()=>{index=i;t=paused?clips[i][1]-.5:clips[i][0];sync()});
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',()=>{if(motion.matches){paused=true;t=clips[index][1]-.5;sync()}});
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()}).observe(canvas);sync();
})().catch(e=>{document.querySelector('nav').textContent='Film excerpt unavailable.';console.error(e)});
