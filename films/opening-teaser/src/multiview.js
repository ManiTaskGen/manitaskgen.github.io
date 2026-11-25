/* All times are seconds. All composition coordinates use a 1600 × 900 design surface. */
const views = [
  {id:'sofa', name:'Sofa', object:'Cushions', case:'Clearing', area:'Seat surface', accent:'#8d626b'},
  {id:'wood', name:'Wooden table', object:'Dish, cup, basket', case:'Ordering', area:'Beside the cup', accent:'#a06635'},
  {id:'white', name:'White table', object:'Books and blocks', case:'Cityscape', area:'Tabletop', accent:'#447a79'},
  {id:'counter', name:'Counter + TV stand', object:'Basket and vessels', case:'Cross-platform transfer', area:'TV stand center', accent:'#626e8a'}
];
const pins = [
  {id:'sofa',label:'Sofa',u: .225,v:.902,dx:-.02,dy:-.097},
  {id:'wood',label:'Wooden table',u:.748,v:.420,dx:.025,dy:.079},
  {id:'white',label:'White table',u:.241,v:.625,dx:.105,dy:.034},
  {id:'counter',label:'Kitchen counter',u:.612,v:.162,dx:.02,dy:.110},
  {id:'stand',label:'TV stand',u:.055,v:.778,dx:.055,dy:-.060}
];
const intents = [
 ['Ordering / alignment',36,'#326a60'],['Display / presentation / curation',31,'#668873'],
 ['Functional workspace / workflow setup',24,'#88a58e'],['Artistic / geometric arrangement',24,'#89aaa7'],
 ['Thematic scene / structural construction',24,'#5b8293'],['Grouping / categorization',21,'#7e859b'],
 ['Storage / relocation / redistribution',20,'#9b7b81'],['General organization / tidying',8,'#ac805f'],
 ['Accessibility / ergonomic optimization',7,'#bf9d71'],['Clearing / decluttering',4,'#d2b98c'],['Others',1,'#dcdacb']
];
const tags = [
 ['Thematic / aesthetic composition',99],['Semantic categorization',61],['Symmetry / geometric reasoning',60],
 ['Attribute comparison / ordering',54],['Accessibility / ergonomics / workflow',53],['Directional / spatial relation',50],
 ['Alignment / spacing / proportion',49],['Stacking / containment / physical structure',32],['Cross-platform / layer transfer',31],
 ['Selection / decluttering / cleaning',23],['Others',5]
];
const gold='#e7ae68';
const colorOf=id=>(views.find(v=>v.id===id)||views[3]).accent;
const columnX=i=>72+370*i;
function heroText(s,x,y,sz,col=c.ink){ ink(s,x,y,sz,'s',col); }
function eyebrow(s,x,y,col=c.teal){ink(s,x,y,19,'m',col)}
function footer(left,right){
 line(72,793,1528,793);ink(left,73,839,24,'s',c.ink);if(right)ink(right,1527,839,19,'i',c.muted,'right');
}
function picture(id,x,y,w,h,focus=.5,vy=.5){
 const im=imgs[id];let sw=im.width,sh=im.height;
 const ar=w/h;
 if(sw/sh>ar)sw=sh*ar;else sh=sw/ar;
 g.drawImage(im,(im.width-sw)*focus,(im.height-sh)*vy,sw,sh,x,y,w,h);
}
function whole(id,x,y,w,h){g.drawImage(imgs[id],x,y,w,h)}
function labelPill(s,x,y){
 const w=width(s,17,'u')+24;rect(x,y-21,w,30,'rgba(255,253,244,0.95)');ink(s,x+12,y,17,'u',c.ink);
}
function overview(t){
 mast('Opening question');
 const x=72,y=160,w=935,h=526;
 picture('overview',x,y,w,h,.5,.5);
 const z=ease(1,7.2,t);
 const reveal=ease(5.0,8.2,t);
 function loc(p){
  const im=imgs.overview, ratio=w/h,sw=im.height*ratio,adjust=(im.width-sw)/2;
  return [x+(p.u*im.width-adjust)/sw*w,y+p.v*h];
 }
 pins.forEach((p,i)=>alpha(ease(4.0+i*.42,4.9+i*.42,t),()=>{
  const [px,py]=loc(p);circle(px,py,12+2*z,null,'#fffaf1',3);
  circle(px,py,6,colorOf(p.id),'#fffaf0',1.5);
  const ax=px+p.dx*w,ay=py+p.dy*h;
  path2([[px,py],[ax,ay],[ax+13,ay]],'#fff8ec',2);
  labelPill(p.label,ax+8,ay+4);
 }));
 rect(x,y,w,h,null,c.rule);
 eyebrow('THE BENCHMARK QUESTION',1061,222);
 heroText('Given a room',1058,312,55);heroText('and a VLM agent,',1058,376,55);
 alpha(ease(.3,1.6,t),()=>{
  heroText('what fraction of its',1059,482,43);
  heroText('manipulation tasks',1059,534,43);
  ink('can it complete?',1058,593,48,'i',c.copper);
 });
 alpha(reveal,()=>{line(1061,645,1504,645);ink('ManiTaskGen',1060,706,49,'s',c.teal)});
 footer('A furnished room in ReplicaCAD.', 'Room overview');
}
function initialAtlas(t){
 mast('From room to surfaces');title('Follow the task surfaces across the room.');
 const q=ease(10.5,14.3,t);
 const base=[72,160,935,526];
 alpha(1-q,()=>{picture('overview',...base,.5,.5)});
 views.forEach((v,i)=>{
  const p=pins[i],cx=base[0]+p.u*base[2],cy=base[1]+p.v*base[3];
  const xx=mix(cx-35,columnX(i),q),yy=mix(cy-22,287,q),ww=mix(70,344,q),hh=mix(44,267,q);
  if(q<.99){circle(cx,cy,16,colorOf(v.id),c.white,3)}
  alpha(q,()=>{if(i<3)picture(v.id+'-initial',xx,yy,ww,hh);else{
   picture('counter-initial',xx,yy,ww,hh*.50,.55,.54);picture('stand-initial',xx,yy+hh*.50+2,ww,hh*.50-2,.45,.54);
  }rect(xx,yy,ww,hh,null,c.rule)});
  alpha(ease(13.2,14.8,t),()=>{
   rect(columnX(i),264,344,4,v.accent);ink(v.name,columnX(i),612,32);ink(v.case,columnX(i),655,24,'i',v.accent);
  });
 });
 footer('Four task cards connect five support surfaces.', 'Close-ups show task-specific starting states');
}
function layerImage(id,t,x,y,w,h){
 let previous='initial';
 const blend=(a,b,k)=>{picture(id+'-'+a,x,y,w,h);if(k>0)alpha(k,()=>picture(id+'-'+b,x,y,w,h))};
 const up=[20.2,23.15,26.10];
 if(t<20.2){blend('initial','cloud',ease(17.5,19.65,t));return}
 previous='cloud';
 for(let i=0;i<3;i++){
  if(t<up[i]){picture(id+'-'+previous,x,y,w,h);return}
  if(t<up[i]+.40){blend(previous,'hi'+i,ease(up[i],up[i]+.4,t));return}
  if(t<up[i]+1.35){blend('hi'+i,'dep'+i,ease(up[i]+.48,up[i]+1.35,t));return}
  previous='dep'+i;
 }
 picture(id+'-'+previous,x,y,w,h);
}
function parallelGraph(t){
 mast('Support relations');title('Read four views from the floor up.');
 const starts=[20.2,23.15,26.1];
 views.forEach((v,i)=>{
  const x=columnX(i),y=275,w=344,h=228;
  ink(v.name,x,244,30);rect(x,y-8,w,4,v.accent);
  if(i===3){
   layerImage('counter',t,x,y,w,h/2-1);layerImage('stand',t,x,y+h/2+1,w,h/2-1);
  }else layerImage(v.id,t,x,y,w,h);
  const root=[x+14,550],plane=[x+32,603],joins=[['Cushion 1','Cushion 2','Cushion 3'],['Dish','Cup','Basket'],['Books','Red pieces','Brown pieces']][i];
  function node(point,name,col,size=23){
   circle(...point,6,col);ink(name,point[0]+14,point[1]+7,size,'s',c.ink);
  }
  alpha(ease(starts[0]+.15,starts[0]+.9,t),()=>node(root,'Floor',c.teal));
  alpha(ease(starts[1]+.15,starts[1]+.9,t),()=>{
   const splitX=x+172;
   path2([[root[0],root[1]+8],[root[0],plane[1]],[plane[0],plane[1]]],c.faint,2);
   node(plane,i===3?'Counter':v.name,c.teal);
   if(i===3){
    path2([[root[0],root[1]+11],[root[0],root[1]+25],[splitX,root[1]+25],[splitX,plane[1]-7]],c.faint,2);
    node([splitX,plane[1]],'TV stand',c.teal);
   }
  });
  alpha(ease(starts[2]+.15,starts[2]+1,t),()=>{
   const endpoints=i===3?['Basket','Vessels']:joins;
   endpoints.forEach((name,j)=>{
    const xx=x+15+j*109,yy=670;
    path2([[plane[0],plane[1]+9],[plane[0],632],[xx,632],[xx,yy-7]],c.faint,1.8);
    circle(xx,yy,5,v.accent);ink(name,xx,yy+32,19,'s',c.ink);
   });
   if(i===3)ink('TV stand starts empty',x+158,740,18,'i',c.muted);
  });
  if(i===1)alpha(ease(29.0,29.8,t),()=>{
   g.strokeStyle=c.copper;g.lineWidth=3;g.strokeRect(x-4,y-4,w+8,h+8);
   ink('Look closer at the dish',x,753,20,'i',c.copper);
  });
 });
 const phase=t<20.2?'RGB views → illustrative point clouds':t<23.15?'Depth 0  /  Shared floor':t<26.1?'Depth 1  /  The floor supports the furniture':'Depth 2  /  The surfaces support objects';
 footer(phase,'Highlights follow graph depth');
}
function focusWood(t){
 const move=ease(30.55,31.62,t),blend=ease(31.4,32.22,t);
 const detail=21.55+Math.min(7.5,Math.max(0,t-30.5))*.97;
 if(blend>=1){extraction(detail);return}
 parallelGraph(30.55);
 alpha(move,()=>rect(0,0,W,H,c.paper));
 const x=mix(columnX(1),72,move),y=mix(275,234,move),w=mix(344,911,move),h=mix(228,513,move);
 picture('wood-dep2',x,y,w,h);rect(x,y,w,h,null,c.copper);
 alpha(blend,()=>{rect(0,0,W,H,c.paper);extraction(detail)});
}
function drawObjectIcon(v,x,y){
 if(v.id==='wood'){sketch('dish',x,y,75);return}
 const im=imgs[v.id+'-sketch'];
 const r=Math.min(85/im.width,60/im.height);g.drawImage(im,x-im.width*r/2,y-im.height*r/2,im.width*r,im.height*r);
}
function region(x,y,variant){
 g.save();g.translate(x,y);g.scale(.9,.9);
 path2([[-62,14],[-36,-16],[57,-16],[36,14]],c.ink,1.8,[],null,true);
 const xx=variant===1?23:variant===2?-18:0;
 path2([[xx-15,7],[xx-6,-6],[xx+18,-6],[xx+10,7]],c.teal,2,[4,3],'#e1eee4',true);
 g.restore();
}
function inventoryAtlas(t){
 mast('Scene graph → inventories');title('Collect the objects and candidate destinations.');
 views.forEach((v,i)=>{
  const x=columnX(i);
  ink(v.name,x,247,29);rect(x,267,344,3,v.accent);
  const imid=i===3?'counter-initial':v.id+'-initial';
  picture(imid,x,283,344,127,.5,.48);
  const q=ease(40.2+i*.18,41.9+i*.18,t);
  alpha(q,()=>{
   drawObjectIcon(v,x+58,482);
   ink(i===0?'Cushion':i===1?'Shallow dish':i===2?'Books':'Countertop object',x+112,490,24);
   line(x,537,x+344,537);
   region(x+59,608,i);
   ink(v.area,x+112,616,24);
  });
 });
 eyebrow('OBJECTS   /   GRAPH DEPTH ≥ 2',73,723);ink('Receptacles   /   indexed placement regions',785,723,23,'m',c.teal);
 footer('Select an object and an address to generate a move.', 'Receptacle indexing is shown in the next video');
}
function processTable(t){processShot(41.15+(t-46.4)*1.35)}
function crossMove(t){
 mast('Task generation  /  process-based');title('A move can cross two support surfaces.');
 const phase=ease(58.0,61.35,t);
 eyebrow('SOURCE  /  KITCHEN COUNTER',73,253,c.copper);eyebrow('DESTINATION  /  TV STAND',836,253,c.teal);
 const w=693,h=w*9/16,x1=72,x2=835,yy=278;
 whole('counter-clean',x1,yy,w,h);whole('stand-initial',x2,yy,w,h);
 const im=imgs['basket-cut'];
 const sx=x1+.678*w,sy=yy+.565*h,tx=x2+.401*w,ty=yy+.38*h-37*im.height/im.width;
 const ring=1-ease(61.4,62.5,t);
 alpha(.66*ring,()=>{ellipse(tx,yy+.38*h,46,10,'rgba(80,152,118,.24)',c.teal,2)});
 const bw=mix(.188*w,74,phase),bh=bw*im.height/im.width;
 const lift=95*Math.sin(Math.PI*phase);
 const bx=mix(sx,tx,phase),by=mix(sy,ty,phase)-lift;
 g.drawImage(im,bx-bw/2,by-bh/2,bw,bh);
 line(72,703,1528,703);typed(['Move the basket from the kitchen counter to the center of the TV stand.'],t,54.65,31,73,759,29,40,'m');
 footer(phase>=.999?'The basket reaches the indexed region.':'One object, two surfaces, one specified destination.', 'Illustrated process · second example');
}
function typeLine(s,t,start,x,y,sz=24,col=c.ink){
 typed([s],t,start,39,x,y,sz,sz+8,'m',col);
}
function templatesShot(t){
 mast('Task generation  /  outcome-based');title('ManiTaskOT-200');
 ink('200 human-derived templates for desired scene states',74,221,28,'u',c.muted);
 const examples=[
  [1,'Order by height and type.'],[9,'Align items symmetrically.'],
  [22,'Compose a jigsaw puzzle.'],[38,'Make chosen objects accessible.'],
  [46,'Build a miniature cityscape.'],[98,'Set up an efficient workspace.'],
  [114,'Tidy the selected surface.'],[140,'Transfer and group related items.']
 ];
 const x=76,y=306;
 for(let k=0;k<200;k++){
  const tx=x+(k%20)*25,ty=y+Math.floor(k/20)*27;
  const j=examples.findIndex(row=>row[0]===k+1);
  const col=j>=0?c.copper:'#7d9b8f';
  alpha(.14+.86*ease(64.35+k*.009,64.85+k*.009,t),()=>rect(tx,ty,18,19,col));
 }
 ink('One tile per template',75,622,26,'i',c.muted);
 rect(76,662,17,17,c.copper);ink('Eight examples from the catalog',105,678,22,'u',c.muted);
 line(621,266,621,742);eyebrow('SELECTED TEMPLATE PATTERNS',675,285);
 examples.forEach(([id,s],i)=>{
  const y=333+i*48;
  ink(String(id).padStart(3,'0'),677,y,20,'m',c.copper);
  typeLine(s,t,64.45+i*.44,752,y,23);
 });
 footer('Fill template slots with scene entities, then filter candidate goals by VLM voting.', 'Patterns abbreviated · catalog line numbers');
}
const outcomePairs=[
 [{id:'sofa',case:'Clearing',goal:['Tidy up the sofa.'],badge:'General organization / tidying'},
  {id:'wood',case:'Ordering',goal:['Arrange objects on the wooden table','by height and type.'],badge:'Ordering / alignment'}],
 [{id:'white',case:'Cityscape',goal:['Arrange objects on the white table','to resemble buildings and roads.'],badge:'Thematic scene / structural construction'},
  {id:'dual',case:'Cross-platform transfer',goal:['Clear the counter. Group related','items together on the TV stand.'],badge:'Storage / relocation / redistribution'}]
];
function states(id,stage,x,y,w,h){
 if(id!=='dual'){picture(id+'-'+stage,x,y,w,h);return}
 const gap=3,hw=(w-gap)/2;
 picture('counter-'+stage,x,y,hw,h,.63,.49);picture('stand-'+stage,x+hw+gap,y,hw,h,.4,.5);
}
function outcomes(t,which){
 const start=which?80.35:72.35,local=t-start;
 mast('Task generation  /  outcome-based');title(which?'One goal can involve two surfaces.':'A goal describes the desired arrangement.');
 outcomePairs[which].forEach((v,i)=>{
  const x=i?821:72,y=362,w=707,h=290;
  ink(v.case,x,239,34,'s',c.ink);typeLine(v.goal[0],local,.42+i*.17,x,291,24);
  if(v.goal[1])typeLine(v.goal[1],local,1.10+i*.17,x,335,24);
  const q=ease(2.85+i*.32,4.95+i*.32,local);
  states(v.id,'initial',x,y,w,h);
  clip(x,y,w*q,h,()=>states(v.id,'outcome',x,y,w,h));
  if(q>0&&q<1){rect(x+w*q-2,y,4,h,'#fff9db')}
  labelPill(q>=.999?'One valid outcome':q>.001?'Revealing outcome':'Initial state',x+14,y+32);
  if(v.id==='dual'){labelPill('Counter',x+10,y+h-13);labelPill('TV stand',x+w/2+10,y+h-13)}
  rect(x,y,w,h,null,c.rule);eyebrow('TEMPLATE '+(which?(i?'140':'046'):(i?'001':'114'))+'  /  PRIMARY INTENT',x,709,c.muted);ink(v.badge,x,754,26,'i',c.teal);
 });
 footer(which?'The counter empties as the TV stand fills with related objects.':'The starting views and the valid outcomes are from the project task cards.',which?'Outcome examples 3–4 of 4':'Outcome examples 1–2 of 4');
}
function donut(t){
 const cx=328,cy=470,rr=194,rr2=126;let a=-Math.PI/2;
 const q=ease(88.85,90.45,t);
 intents.forEach(([name,n,col])=>{
  const b=a+Math.PI*2*n/200,visible=Math.min(b,-Math.PI/2+Math.PI*2*q);
  if(visible>a){
   g.beginPath();g.arc(cx,cy,rr,a+.002,Math.max(a+.002,visible-.002));g.arc(cx,cy,rr2,Math.max(a+.002,visible-.002),a+.002,true);g.closePath();g.fillStyle=col;g.fill();
  }a=b;
 });
 ink('200',cx,cy+1,80,'s',c.ink,'center');ink('templates',cx,cy+39,25,'i',c.muted,'center');
}
function intentShot(t){
 mast('ManiTaskOT-200  /  template distributions');title('What do the templates ask for?');
 ink('Each template has one primary intent.',74,220,26,'u',c.muted);donut(t);
 const x=595;
 intents.forEach(([lab,n,col],i)=>{
  const y=274+i*41;rect(x,y-13,14,14,col);ink(lab,x+32,y,24,'s',c.ink);
  ink(n+'  /  '+(n/2).toFixed(1)+'%',1518,y,21,'m',c.muted,'right');
 });
 ink('Ordering and alignment is the largest group.',76,734,24,'i',c.teal);
 footer('The four task cards illustrate four different primary intents.', 'Full set · n = 200');
}
function tagShot(t){
 mast('ManiTaskOT-200  /  template distributions');title('What reasoning do the templates require?');
 ink('A template can carry several tags. Each bar uses all 200 templates as its denominator.',74,218,25,'u',c.muted);
 const x=555,w=395, y0=286;
 tags.forEach(([lab,n],i)=>{
  const y=y0+i*41,p=ease(98.8+i*.065,100.1+i*.065,t);
  const col=[0,2,7].includes(i)?'#477b73':i===8?'#9c6e52':'#84958a';
  ink(lab,74,y+5,22,'s',c.ink);rect(x,y-12,w,12,'#e5e7dd');rect(x,y-12,w*(n/100)*p,12,col);
  ink(n+'  /  '+(n/2).toFixed(1)+'%',x+w+17,y+4,19,'m',c.muted);
 });
 const rx=1110,rw=418;line(rx-26,253,rx-26,738);
 picture('white-outcome',rx,270,rw,194,.5,.44);ink('Cityscape',rx,507,33);
 ink('Composition · symmetry · stacking',rx,552,21,'u',c.teal);
 line(rx,586,1528,586);ink('Cross-platform transfer',rx,639,30);
 ink('31 of 200 templates (15.5%)',rx,685,21,'m',c.copper);
 footer('The cityscape alone combines three reasoning tags.', 'Percentages may sum to more than 100%');
}
function pool(t){
 mast('Evaluation');title('A task set grounded in this scene.');
 const labs=['Action sequences','Desired arrangements'];
 for(let i=0;i<2;i++){
  const x=72+743*i;eyebrow(i?'OUTCOME-BASED  /  LEVEL 4':'PROCESS-BASED  /  LEVELS 1–3',x,292,i?c.teal:c.copper);
  ink(labs[i],x,355,44);const f=i?['sofa-outcome','wood-outcome','white-outcome','stand-outcome']:['wood-initial','counter-initial','stand-initial'];
  const w=686/f.length;f.forEach((id,j)=>picture(id,x+j*w,396,w-4,168));
 }
 line(72,616,1528,616);ink('Evaluate each agent on the generated tasks.',73,708,46,'i',c.teal);
 footer('Together, the two families span four levels of task difficulty.', 'ManiTaskGen');
}
function benchmark(t){results(71.75+(t-111.25)*1.49)}
const timeline=[
 [0,overview],[10.15,initialAtlas],[17.45,parallelGraph],[30.55,focusWood],[39.3,inventoryAtlas],
 [46.4,processTable],[54.3,crossMove],[64.15,templatesShot],[72.35,t=>outcomes(t,0)],
 [80.35,t=>outcomes(t,1)],[88.65,intentShot],[98.65,tagShot],[107.95,pool],[111.25,benchmark]
];
function draw(t){
 g.setTransform(C.width/W,0,0,C.height/H,0,0);rect(0,0,W,H,c.paper);
 let i=timeline.length-1;while(i>0&&timeline[i][0]>t)i--;
 const [start,shot]=timeline[i];
 if(i===0){shot(t);return}
 /* Fade the old shot out to the paper first, hold one beat, then fade the new
    shot in. Never on screen at the same time, so titles never land on the
    previous shot's images (transition totals ~0.9s). */
 const OUT=.32,HOLD=.12,IN=.46,u=t-start;
 if(u<OUT)alpha(1-ease(start,start+OUT,t),()=>timeline[i-1][1](t));
 else if(u<OUT+HOLD){/* paper breath between shots */}
 else alpha(ease(start+OUT+HOLD,start+OUT+HOLD+IN,t),()=>shot(t));
}
function artFiles(){
 const files={'overview':'overview.jpg','input':'wood-initial.jpg','basket-cut':'basket-cut.png','counter-clean':'counter-clean.jpg'};
 for(const v of [...views.map(v=>v.id),'stand']){
  for(const s of ['initial','outcome','cloud','hi0','dep0','hi1','dep1','hi2','dep2']) files[v+'-'+s]=v+'-'+s+'.jpg';
  if(v!=='stand')files[v+'-sketch']=v+'-sketch.png';
 }
 for(const id of keys.filter(id=>id!=='room'))for(const m of ['solid','active'])files[id+'-'+m]=id+'-'+m+'.png';
 return files;
}
async function loadSceneAssets(){
 await Promise.all(Object.entries(artFiles()).map(async([id,file])=>{
  const im=new Image();im.src=window.inlineAssets?.[file]||('assets/'+file);await im.decode();imgs[id]=im;
 }));
}
