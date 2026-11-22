'use strict';
/* ===================== ЧЕРЕПАХА 2278 — движок ===================== */
const W=960,H=540;
const cv=document.getElementById('c'), g=cv.getContext('2d');
let SCALE=1, TIME=0;
function resize(){
  const s=Math.min(innerWidth/W,innerHeight/H)||1, dpr=Math.min(window.devicePixelRatio||1,2);
  const k=Math.min(s*dpr,2.2);
  cv.width=Math.round(W*k); cv.height=Math.round(H*k);
  cv.style.width=Math.round(W*s)+'px'; cv.style.height=Math.round(H*s)+'px';
  SCALE=cv.width/W;
}
addEventListener('resize',resize); resize();

/* ---------- утилиты ---------- */
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const rndi=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1);
const ang=(x1,y1,x2,y2)=>Math.atan2(y2-y1,x2-x1);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function srand(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const ease={out:t=>1-(1-t)*(1-t),inout:t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,back:t=>1+2.70158*Math.pow(t-1,3)+1.70158*Math.pow(t-1,2)};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const mtof=m=>440*Math.pow(2,(m-69)/12);
const fmt=n=>String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');

/* ---------- ввод ---------- */
const K={},KP={};
const KEYS={left:['ArrowLeft','KeyA'],right:['ArrowRight','KeyD'],up:['ArrowUp','KeyW'],down:['ArrowDown','KeyS'],
  ok:['Enter','Space','NumpadEnter'],act:['Space','KeyJ','KeyZ'],alt:['ShiftLeft','ShiftRight','KeyK','KeyX'],back:['Escape']};
const held=a=>KEYS[a].some(c=>K[c]), hit=a=>KEYS[a].some(c=>KP[c]);
addEventListener('keydown',e=>{ if(!K[e.code])KP[e.code]=true; K[e.code]=true; AU.init();
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault(); });
addEventListener('keyup',e=>{K[e.code]=false;});
addEventListener('blur',()=>{for(const k in K)K[k]=false;M.down=M.rdown=false;});
const M={x:W/2,y:H/2,down:false,rdown:false,click:false,rclick:false,up:false,dx:0,dy:0,wheel:0};
function mpos(e){const r=cv.getBoundingClientRect();M.x=(e.clientX-r.left)/r.width*W;M.y=(e.clientY-r.top)/r.height*H;}
cv.addEventListener('mousemove',e=>{mpos(e);M.dx+=e.movementX||0;M.dy+=e.movementY||0;});
cv.addEventListener('mousedown',e=>{mpos(e);AU.init();if(e.button===0){M.down=true;M.click=true;}else if(e.button===2){M.rdown=true;M.rclick=true;}});
addEventListener('mouseup',e=>{if(e.button===0){if(M.down)M.up=true;M.down=false;}else if(e.button===2)M.rdown=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('wheel',e=>{M.wheel+=Math.sign(e.deltaY);e.preventDefault();},{passive:false});
cv.addEventListener('touchstart',e=>{mpos(e.changedTouches[0]);M.down=true;M.click=true;AU.init();e.preventDefault();},{passive:false});
cv.addEventListener('touchmove',e=>{mpos(e.changedTouches[0]);e.preventDefault();},{passive:false});
cv.addEventListener('touchend',e=>{M.down=false;M.up=true;e.preventDefault();},{passive:false});
const inRect=(x,y,w,h)=>M.x>=x&&M.x<=x+w&&M.y>=y&&M.y<=y+h;
function lockPointer(){try{if(document.pointerLockElement!==cv&&cv.requestPointerLock)cv.requestPointerLock();}catch(e){}}
function unlockPointer(){try{if(document.pointerLockElement&&document.exitPointerLock)document.exitPointerLock();}catch(e){}}

/* ---------- звук: синтезатор на WebAudio ---------- */
const AU={ctx:null,muted:false,
  init(){
    if(this.ctx){if(this.ctx.state==='suspended')this.ctx.resume();return;}
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC)return;
    try{this.ctx=new AC();}catch(e){return;}
    const c=this.ctx;
    this.master=c.createGain(); this.master.gain.value=SAVE.data.mute?0:0.8; this.muted=!!SAVE.data.mute; this.master.connect(c.destination);
    this.mus=c.createGain(); this.mus.gain.value=0.42; this.mus.connect(this.master);
    this.fx=c.createGain(); this.fx.gain.value=0.55; this.fx.connect(this.master);
    this.bass=c.createBiquadFilter(); this.bass.type='lowpass'; this.bass.frequency.value=700; this.bass.Q.value=4; this.bass.connect(this.mus);
    this.echo=c.createDelay(1); this.echo.delayTime.value=0.33; const fb=c.createGain(); fb.gain.value=0.33; const wet=c.createGain(); wet.gain.value=0.35;
    this.echo.connect(fb); fb.connect(this.echo); this.echo.connect(wet); wet.connect(this.mus);
    this.echoIn=c.createGain(); this.echoIn.connect(this.mus); this.echoIn.connect(this.echo);
    const n=c.createBuffer(1,c.sampleRate,c.sampleRate), d=n.getChannelData(0); for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1; this.noiseBuf=n;
    if(MUS.pending){const p=MUS.pending;MUS.pending=null;MUS.play(p);}
  },
  t(){return this.ctx?this.ctx.currentTime:0;},
  toggleMute(){this.muted=!this.muted;SAVE.data.mute=this.muted;SAVE.store();if(this.master)this.master.gain.value=this.muted?0:0.8;},
  tone(f,dur,type='square',vol=.2,slide=0,when=0,dest=null,att=.005){
    if(!this.ctx)return; const c=this.ctx,t=Math.max(when||0,c.currentTime);
    const o=c.createOscillator(),gn=c.createGain(); o.type=type; o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,slide),t+dur);
    gn.gain.setValueAtTime(0.0001,t); gn.gain.exponentialRampToValueAtTime(vol,t+att); gn.gain.exponentialRampToValueAtTime(0.0001,t+Math.max(dur,att+.01));
    o.connect(gn); gn.connect(dest||this.fx); o.start(t); o.stop(t+dur+.05);
  },
  noise(dur,vol=.2,freq=2000,when=0,dest=null,ftype='lowpass'){
    if(!this.ctx)return; const c=this.ctx,t=Math.max(when||0,c.currentTime);
    const s=c.createBufferSource(); s.buffer=this.noiseBuf; const f=c.createBiquadFilter(); f.type=ftype; f.frequency.value=freq;
    const gn=c.createGain(); gn.gain.setValueAtTime(vol,t); gn.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f); f.connect(gn); gn.connect(dest||this.fx); s.start(t,Math.random()*0.5); s.stop(t+dur+.05);
  }
};
function sfx(n){
  if(!AU.ctx)return; const T=AU.t();
  switch(n){
    case 'select':AU.tone(660,.06,'square',.12,990);break;
    case 'ok':AU.tone(523,.08,'square',.14);AU.tone(784,.12,'square',.14,0,T+.07);break;
    case 'back':AU.tone(500,.1,'square',.12,250);break;
    case 'jump':AU.tone(260,.16,'square',.13,620);break;
    case 'land':AU.noise(.06,.15,600);break;
    case 'like':AU.tone(988,.07,'square',.12);AU.tone(1319,.14,'square',.12,0,T+.06);break;
    case 'shoot':AU.tone(880,.1,'sawtooth',.12,180);AU.noise(.06,.12,3000);break;
    case 'laser':AU.tone(1500,.16,'sawtooth',.1,260);break;
    case 'hit':AU.noise(.1,.25,1500);AU.tone(220,.1,'square',.12,70);break;
    case 'hurt':AU.tone(420,.28,'sawtooth',.18,90);AU.noise(.15,.15,900);break;
    case 'explode':AU.noise(.6,.45,700);AU.tone(130,.5,'sine',.4,35);break;
    case 'power':[523,659,784,1047].forEach((f,i)=>AU.tone(f,.1,'square',.1,0,T+i*.06));break;
    case 'win':[523,659,784,1047,784,1047].forEach((f,i)=>AU.tone(f,.16,'square',.13,0,T+i*.11));break;
    case 'lose':[392,330,262,196].forEach((f,i)=>AU.tone(f,.22,'sawtooth',.12,0,T+i*.16));break;
    case 'step':AU.noise(.03,.05,1200);break;
    case 'alarm':for(let i=0;i<4;i++)AU.tone(i%2?660:990,.12,'square',.12,0,T+i*.13);break;
    case 'punch':AU.noise(.08,.3,1200);AU.tone(160,.12,'sine',.35,50);break;
    case 'beep':AU.tone(1000,.05,'square',.08);break;
    case 'boost':AU.tone(200,.5,'sawtooth',.12,900);AU.noise(.4,.15,2500);break;
    case 'miss':AU.tone(150,.15,'square',.1,90);break;
    case 'click':AU.tone(1800,.02,'square',.05);break;
  }
}
const SONGS={
  title:{bpm:92,root:45,prog:[0,-4,3,-2],drums:'half',bass:'long',arp:4,pad:1,hats:0},
  hub:{bpm:100,root:43,prog:[0,-4,3,-2],drums:'half',bass:'8th',arp:2,pad:1,hats:1},
  drive:{bpm:128,root:40,prog:[0,0,-4,-2],drums:'four',bass:'8th',arp:1,pad:0,hats:1,lead:[12,null,10,null,7,null,10,12,null,null,15,null,14,null,10,null, 12,null,10,null,7,null,5,7,null,null,3,null,2,null,null,null]},
  dark:{bpm:108,root:38,prog:[0,1,0,-2],drums:'break',bass:'off',arp:4,pad:1,hats:1},
  boss:{bpm:146,root:41,prog:[0,-1,-4,-2],drums:'four',bass:'8th',arp:1,pad:0,hats:1,lead:[0,null,0,12,null,0,11,null,10,null,7,null,8,null,10,null, 0,null,0,12,null,0,15,null,14,null,12,null,10,null,7,null]},
  chill:{bpm:84,root:48,prog:[0,-3,-7,-5],maj:1,drums:'half',bass:'long',arp:2,pad:1,hats:1},
  rhythm:{bpm:120,root:45,prog:[0,-4,3,-2],drums:'four',bass:'8th',arp:2,pad:1,hats:1,lead:[12,null,7,null,10,null,12,null,null,null,null,null,15,14,12,null, 12,null,7,null,10,null,12,null,null,null,17,null,15,null,12,null]},
  race:{bpm:136,root:42,prog:[0,-2,-4,-5],drums:'four',bass:'8th',arp:1,pad:0,hats:1,lead:[7,null,12,null,14,null,12,7,null,null,5,null,7,null,null,null, 7,null,12,null,15,null,14,12,null,null,10,null,12,null,null,null]},
  sad:{bpm:70,root:45,prog:[0,-4,-2,-7],drums:'none',bass:'long',arp:4,pad:1,hats:0},
};
const MUS={song:null,step:0,next:0,start:0,timer:null,pending:null,
  play(name){
    if(!AU.ctx){this.pending=name;return;}
    if(this.song&&this.song.name===name)return;
    this.stop(); const s=SONGS[name]; if(!s)return;
    this.song=Object.assign({name},s); this.step=0; this.start=AU.t()+0.12; this.next=this.start;
    this.timer=setInterval(()=>this.tick(),25);
  },
  stop(){if(this.timer)clearInterval(this.timer);this.timer=null;this.song=null;this.pending=null;},
  spStep(){return 60/this.song.bpm/4;},
  beat(){return this.song?(AU.t()-this.start)*this.song.bpm/60:TIME*2;},
  tick(){if(!this.song||!AU.ctx)return;const sp=this.spStep();while(this.next<AU.t()+0.15){this.playStep(this.step,this.next);this.step++;this.next+=sp;}},
  kick(t){AU.tone(150,.16,'sine',.55,38,t,AU.mus);},
  snare(t){AU.noise(.16,.22,1800,t,AU.mus,'bandpass');AU.tone(190,.08,'triangle',.12,0,t,AU.mus);},
  playStep(i,t){
    const s=this.song, bar=Math.floor(i/16)%s.prog.length, st=i%16, root=s.root+s.prog[bar], ch=s.maj?[0,4,7]:[0,3,7], sp=this.spStep();
    if(s.drums==='four'){if(st%4===0)this.kick(t);if(st===4||st===12)this.snare(t);}
    else if(s.drums==='half'){if(st===0||st===10)this.kick(t);if(st===8)this.snare(t);}
    else if(s.drums==='break'){if(st===0||st===7||st===10)this.kick(t);if(st===4||st===12)this.snare(t);}
    if(s.hats&&s.drums!=='none'&&st%2===1)AU.noise(.03,st%4===3?.07:.04,9000,t,AU.mus,'highpass');
    if(s.bass==='8th'&&st%2===0)AU.tone(mtof(root+(st%8===6?12:0)),sp*1.7,'sawtooth',.2,0,t,AU.bass);
    else if(s.bass==='off'&&(st%4===2))AU.tone(mtof(root),sp*2,'sawtooth',.22,0,t,AU.bass);
    else if(s.bass==='long'&&st===0)AU.tone(mtof(root),sp*15,'sawtooth',.18,0,t,AU.bass,.05);
    if(s.arp&&st%s.arp===0){const seq=[0,ch[1],ch[2],12,ch[2],ch[1]];const n=seq[Math.floor(i/s.arp)%seq.length];AU.tone(mtof(root+24+n),sp*s.arp*.9,'square',.045,0,t,AU.echoIn);}
    if(s.pad&&st===0)ch.forEach(c=>AU.tone(mtof(root+12+c),sp*16,'triangle',.05,0,t,AU.mus,.4));
    if(s.lead){const L=s.lead[i%s.lead.length];if(L!=null)AU.tone(mtof(s.root+24+L),sp*1.8,'square',.07,0,t,AU.echoIn);}
  }
};
function say(text,o={}){
  try{ if(!window.speechSynthesis||AU.muted)return; const u=new SpeechSynthesisUtterance(text); u.lang='ru-RU';
    u.rate=o.rate||0.95; u.pitch=o.pitch||1; u.volume=o.vol==null?1:o.vol;
    const v=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.toLowerCase().startsWith('ru')); if(v)u.voice=v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);}catch(e){}
}
const cherepaha=()=>say('черепаха',{pitch:rnd(0.7,1.4),rate:rnd(0.8,1.1)});

/* ---------- сохранение ---------- */
const SAVE={data:{},key:'turtle2278_v1',
  load(){try{this.data=JSON.parse(localStorage.getItem(this.key)||'{}')||{};}catch(e){this.data={};}},
  store(){try{localStorage.setItem(this.key,JSON.stringify(this.data));}catch(e){}}};
SAVE.load();

/* ---------- ассеты ---------- */
const ASSET_LIST={turtle:'assets/turtle_atlas.webp',boss:'assets/boss_spider.webp',cyber:'assets/turtle_cyber.webp',hover:'assets/turtle_hover.webp',
  paws:'assets/fps_paws.webp',admin:'assets/npc_admin.webp',shell:'assets/shell.webp',hare:'assets/en_hare.webp',snail:'assets/en_snail.webp',
  drone:'assets/en_drone.webp',clerk:'assets/en_clerk.webp',ghost:'assets/en_ghost.webp',crab:'assets/en_crab.webp',
  bg_city:'assets/bg_city.jpg',bg_space:'assets/bg_space.jpg',bg_ruins:'assets/bg_ruins.jpg',bg_dream:'assets/bg_dream.jpg'};
const IMG={},WHITE={}; let LOADED=0,TOTAL=0;
const ok=im=>!!(im&&(im.complete!==false)&&(im.naturalWidth||im.width));
function loadAssets(cb){
  const keys=Object.keys(ASSET_LIST); TOTAL=keys.length;
  const done=()=>{LOADED++; if(LOADED===TOTAL){['turtle','boss','hare','snail','drone','clerk','ghost','crab','shell','hover'].forEach(makeWhite);cb();}};
  keys.forEach(k=>{const im=new Image(); im.onload=done; im.onerror=()=>{console.warn('Не загрузился ассет',k);done();};
    im.src=(window.ASSET_DATA&&window.ASSET_DATA[k])||ASSET_LIST[k]; IMG[k]=im;});
}
function makeWhite(name){const im=IMG[name];if(!ok(im))return;try{const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;
  const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);WHITE[name]=c;}catch(e){}}

/* ---------- рисование ---------- */
const FONT='"Trebuchet MS","Segoe UI",Arial,sans-serif', FONTB='"Arial Black","Segoe UI Black",Impact,Arial,sans-serif', MONO='Consolas,"Courier New",monospace';
function txt(g,s,x,y,o={}){
  g.save(); g.font=`${o.bold===false?'':'bold '}${o.size||20}px ${o.font||FONT}`; g.textAlign=o.align||'left'; g.textBaseline=o.base||'alphabetic';
  if(o.alpha!=null)g.globalAlpha*=o.alpha;
  if(o.stroke){g.lineWidth=o.sw||4;g.strokeStyle=o.stroke;g.lineJoin='round';g.strokeText(s,x,y);}
  if(o.glow){g.shadowColor=o.glow;g.shadowBlur=o.blur||12;}
  g.fillStyle=o.color||'#fff'; g.fillText(s,x,y); g.restore();
}
function wrapText(g,s,x,y,maxW,lh,o={}){
  g.save(); g.font=`${o.bold===false?'':'bold '}${o.size||18}px ${o.font||FONT}`; const lines=[];
  for(const para of String(s).split('\n')){let line='';for(const w of para.split(' ')){const t=line?line+' '+w:w;if(g.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;}lines.push(line);}
  g.restore(); lines.forEach((l,i)=>txt(g,l,x,y+i*lh,o)); return lines.length*lh;
}
function rr(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function panel(g,x,y,w,h,o={}){g.save();g.fillStyle=o.fill||'rgba(12,4,32,0.84)';g.strokeStyle=o.stroke||'#27f3ff';g.lineWidth=o.lw||2;
  g.shadowColor=o.glow||g.strokeStyle;g.shadowBlur=o.blur==null?10:o.blur;rr(g,x,y,w,h,o.r==null?10:o.r);g.fill();if(o.lw!==0)g.stroke();g.restore();}
function button(g,x,y,w,h,label,o={}){
  const hov=inRect(x,y,w,h)&&!o.disabled, sel=o.sel||hov;
  panel(g,x,y,w,h,{fill:o.disabled?'rgba(30,30,40,.7)':sel?'rgba(255,0,170,0.38)':'rgba(12,4,32,0.84)',stroke:o.disabled?'#556':sel?'#ff3df2':(o.color||'#27f3ff'),blur:sel?20:8});
  txt(g,label,x+w/2,y+h/2+1,{align:'center',base:'middle',size:o.size||20,color:o.disabled?'#889':'#fff'});
  if(hov&&M.click){M.click=false;sfx('select');return true;} return false;
}
function bar(g,x,y,w,h,v,color,o={}){g.save();g.fillStyle=o.bg||'rgba(0,0,0,.6)';g.fillRect(x,y,w,h);g.fillStyle=color;g.shadowColor=color;g.shadowBlur=8;g.fillRect(x,y,w*clamp(v,0,1),h);g.restore();
  g.save();g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,h-1);g.restore();if(o.label)txt(g,o.label,x+4,y+h-3,{size:Math.max(10,h-4),color:'#fff',stroke:'#000',sw:3});}
function glow(g,x,y,r,color,a=1){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,color);gr.addColorStop(1,'rgba(0,0,0,0)');g.save();g.globalAlpha=a;g.globalCompositeOperation='lighter';g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);g.restore();}
function neonLine(g,x1,y1,x2,y2,color,w=3){g.save();g.strokeStyle=color;g.lineWidth=w;g.shadowColor=color;g.shadowBlur=14;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.restore();}
function drawBG(g,name,dim=0,ox=0,oy=0){const im=IMG[name];if(ok(im)){const s=Math.max((W+60)/im.width,(H+40)/im.height);const w=im.width*s,h=im.height*s;g.drawImage(im,(W-w)/2-clamp(ox,-30,30),(H-h)/2-clamp(oy,-20,20),w,h);}else{g.fillStyle='#0a0420';g.fillRect(0,0,W,H);}
  if(dim){g.fillStyle=`rgba(6,2,20,${dim})`;g.fillRect(0,0,W,H);}}
function bgTile(g,name,ox,dim=0){const im=IMG[name];if(!ok(im)){g.fillStyle='#0a0420';g.fillRect(0,0,W,H);return;}const h=H,w=Math.round(h*im.width/im.height);const st=Math.floor(ox/w);
  for(let i=st;i*w-ox<W;i++){const x=Math.round(i*w-ox);if(i&1){g.save();g.translate(x+w,0);g.scale(-1,1);g.drawImage(im,0,0,w,h);g.restore();}else g.drawImage(im,x,0,w,h);}
  if(dim){g.fillStyle=`rgba(6,2,20,${dim})`;g.fillRect(0,0,W,H);}}
function spr(g,name,x,y,o={}){
  const im=IMG[name]; if(!ok(im))return; const iw=im.naturalWidth||im.width, ih=im.naturalHeight||im.height;
  const w=o.w||iw*(o.scale||1), h=o.h||w*ih/iw, ax=o.ax==null?.5:o.ax, ay=o.ay==null?1:o.ay;
  g.save(); g.translate(x,y); if(o.rot)g.rotate(o.rot); if(o.flip)g.scale(-1,1); if(o.sx||o.sy)g.scale(o.sx||1,o.sy||1);
  if(o.alpha!=null)g.globalAlpha*=o.alpha; g.drawImage(im,-w*ax,-h*ay,w,h);
  if(o.flash&&WHITE[name]){g.globalAlpha=(o.alpha==null?1:o.alpha)*clamp(o.flash,0,1);g.drawImage(WHITE[name],-w*ax,-h*ay,w,h);}
  g.restore();
}
/* Черепаха: атлас 8 кадров x 6 анимаций, смотрит влево. dir=1 — вправо */
const TA={fw:256,fh:128,rows:{idle:0,walk:1,attack:2,hide:3,jump:4,dance:5},ax:.5,ay:.945};
function turtle(g,x,y,o={}){
  const im=IMG.turtle; const sc=o.scale||.5;
  g.save(); g.translate(x,y); if(o.rot)g.rotate(o.rot); if(o.dir===1)g.scale(-1,1); g.scale(sc*(o.sx||1),sc*(o.sy||1));
  if(o.alpha!=null)g.globalAlpha*=o.alpha;
  if(o.shadow!==false){g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(0,-4,TA.fw*.36,10,0,0,7);g.fill();}
  if(ok(im)){
    const row=TA.rows[o.anim||'idle']||0; let f=o.frame!=null?o.frame:(o.t||TIME)*(o.fps||10);
    f=o.once?clamp(Math.floor(f),0,7):((Math.floor(f)%8)+8)%8;
    g.drawImage(im,f*TA.fw,row*TA.fh,TA.fw,TA.fh,-TA.fw*TA.ax,-TA.fh*TA.ay,TA.fw,TA.fh);
    if(o.flash&&WHITE.turtle){g.globalAlpha=clamp(o.flash,0,1);g.drawImage(WHITE.turtle,f*TA.fw,row*TA.fh,TA.fw,TA.fh,-TA.fw*TA.ax,-TA.fh*TA.ay,TA.fw,TA.fh);}
    if(o.visor){g.globalAlpha=1;g.fillStyle='rgba(39,243,255,.85)';g.shadowColor='#27f3ff';g.shadowBlur=12;g.fillRect(-98,-88,34,9);}
  } else { g.fillStyle='#8a6a2a'; g.beginPath(); g.ellipse(0,-50,90,45,0,Math.PI,0); g.fill(); }
  g.restore();
}

/* ---------- частицы, тряска ---------- */
const PFX={list:[],
  add(x,y,o){this.list.push(Object.assign({x,y,vx:0,vy:0,life:1,max:o.life||1,size:4,color:'#fff',g:0,drag:0},o,{max:o.life||1}));},
  burst(x,y,n,color,spd=200,life=.6,size=4,grav=0){for(let i=0;i<n;i++){const a=rnd(6.283),s=spd*rnd(.3,1),l=life*rnd(.5,1);
    this.add(x,y,{vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:l,color:Array.isArray(color)?pick(color):color,size:size*rnd(.5,1.5),g:grav,drag:1.5});}},
  text(x,y,s,color='#fff',size=22){this.add(x,y,{vy:-70,life:1.1,text:s,color,size});},
  update(dt){for(const p of this.list){p.life-=dt;p.vy+=p.g*dt;p.vx*=Math.max(0,1-p.drag*dt);p.vy*=Math.max(0,1-p.drag*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;}
    if(this.list.length>900)this.list.splice(0,this.list.length-900); this.list=this.list.filter(p=>p.life>0);},
  draw(g,cx=0,cy=0){g.save();for(const p of this.list){const a=clamp(p.life/p.max,0,1);
    if(p.text){g.globalAlpha=Math.min(1,a*2);txt(g,p.text,p.x-cx,p.y-cy,{align:'center',size:p.size,color:p.color,stroke:'#000',sw:4});continue;}
    g.globalAlpha=a;g.globalCompositeOperation='lighter';g.fillStyle=p.color;const s=p.size*(.4+.6*a);g.fillRect(p.x-cx-s/2,p.y-cy-s/2,s,s);g.globalCompositeOperation='source-over';}g.restore();},
  clear(){this.list=[];}};
let SHAKE=0; const shake=v=>{SHAKE=Math.max(SHAKE,v);};

/* ---------- сцены ---------- */
let SCENE=null,NEXT=null,FADE=0,FADEDIR=0;
function go(scene){NEXT=scene;FADEDIR=1;}
function setScene(s){SCENE=s;PFX.clear();SHAKE=0;if(s&&s.enter)s.enter();}
function step(dt){
  TIME+=dt;
  if(FADEDIR===1){FADE+=dt*3.2;if(FADE>=1){FADE=1;FADEDIR=-1;const n=NEXT;NEXT=null;setScene(n);}}
  else if(FADEDIR===-1){FADE-=dt*2.6;if(FADE<=0){FADE=0;FADEDIR=0;}}
  if(KP.KeyM)AU.toggleMute();
  if(KP.F11||KP.KeyF&&K.ControlLeft){try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}catch(e){}}
  g.setTransform(SCALE,0,0,SCALE,0,0); g.globalAlpha=1; g.globalCompositeOperation='source-over';
  g.fillStyle='#05010d'; g.fillRect(0,0,W,H);
  if(SCENE){
    if(FADEDIR!==1&&SCENE.update)SCENE.update(dt);
    g.save(); if(SHAKE>.3)g.translate(rnd(-SHAKE,SHAKE),rnd(-SHAKE,SHAKE)); if(SCENE.draw)SCENE.draw(g); g.restore();
  }
  SHAKE*=Math.pow(.002,dt);
  if(FADE>0){g.fillStyle=`rgba(8,0,24,${FADE})`;g.fillRect(0,0,W,H);
    for(let i=0;i<6;i++){g.fillStyle=pick(['rgba(255,0,200,','rgba(0,255,255,'])+(FADE*.5)+')';g.fillRect(0,rnd(H),W,rnd(2,10));}}
  if(AU.muted){txt(g,'🔇',W-26,H-10,{size:16,alpha:.6});}
  for(const k in KP)delete KP[k]; M.click=M.rclick=M.up=false; M.dx=M.dy=0; M.wheel=0;
}
let LAST=0;
function frame(now){const dt=Math.min(.05,Math.max(0,(now-(LAST||now))/1000));LAST=now;try{step(dt);}catch(e){console.error(e);showError(e);}requestAnimationFrame(frame);}
let ERR=null; function showError(e){ if(ERR)return; ERR=e; setTimeout(()=>ERR=null,4000);}
