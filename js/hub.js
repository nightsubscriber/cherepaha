'use strict';
/* ===================== ЧЕРЕПАХА 2278 — календарь, сюжет, RPG-прогресс ===================== */
const MONTHS=['ЯНВАРЬ','ФЕВРАЛЬ','МАРТ','АПРЕЛЬ','МАЙ','ИЮНЬ','ИЮЛЬ','АВГУСТ','СЕНТЯБРЬ','ОКТЯБРЬ','НОЯБРЬ','ДЕКАБРЬ','ЧЕРЕПАХАБРЬ'];
const GENRES=['platformer','fps','puzzle','rts','rhythm','survival','stealth','racing','td','quest','sandbox','roguelike','rpg'];
const MODES={};
const COVER_NEED=7;
const G={run:null};
const PERKS=[
  {id:'def',name:'Титановый панцирь',icon:'🛡️',desc:'+25% к защите во всех жанрах',apply:r=>r.stats.def+=.25},
  {id:'atk',name:'Острый клюв',icon:'⚔️',desc:'+25% к урону',apply:r=>r.stats.atk+=.25},
  {id:'spd',name:'Реактивные лапки',icon:'💨',desc:'+12% к скорости',apply:r=>r.stats.spd+=.12},
  {id:'luck',name:'Удачливая черепаха',icon:'🍀',desc:'+30% лайков',apply:r=>r.stats.luck+=.3},
  {id:'life',name:'Запасной панцирь',icon:'❤️',desc:'+1 жизнь в забеге',apply:r=>r.lives++},
  {id:'hp',name:'Толстокожесть',icon:'🧱',desc:'+1 к здоровью в экшен-жанрах',apply:r=>r.stats.hp++},
  {id:'dj',name:'Двойной прыжок',icon:'🦘',desc:'Второй прыжок в воздухе (платформер, файтинг)',once:1,apply:r=>r.flags.dj=1},
  {id:'magnet',name:'Магнит для лайков',icon:'🧲',desc:'Лайки и кристаллы летят к тебе сами',once:1,apply:r=>r.flags.magnet=1},
  {id:'zen',name:'Черепаший дзен',icon:'🧘',desc:'Окно попадания в ритм +40%, время в стелсе течёт медленнее',once:1,apply:r=>r.flags.zen=1},
  {id:'turbo',name:'Турбо-панцирь',icon:'🚀',desc:'Ускорение в гонке сильнее, рывки чаще',once:1,apply:r=>r.flags.turbo=1},
  {id:'subs',name:'Подписчики',icon:'👥',desc:'+150 лайков прямо сейчас',apply:r=>r.likes+=150},
  {id:'rich',name:'Капустный магнат',icon:'🥬',desc:'+40% стартовых ресурсов в стратегии и TD',once:1,apply:r=>r.flags.rich=1},
];
const ADMIN_LINES=[
  ['черепаха.','Страницы календаря можно проходить в любом порядке.'],
  ['черепаха?','Обложка откроется, когда пройдёшь '+COVER_NEED+' страниц. Там он. Согнутый.'],
  ['черепаха!!!','Лайки тратятся в паблике. Купи запасную жизнь, не жмоться.'],
  ['черепаха...','Я админю этот паблик с 2278 года. Или с 12278. Время сломалось.'],
  ['черепаха.','Esc — пауза, M — звук. Я — черепаха.'],
  ['черепаха','Если страшно — прячься в панцирь. Это работает почти в каждом жанре.'],
  ['черепаха!','Каждый пройденный уровень — новый пост. Пост — это картинка и подпись «черепаха». Всё.'],
  ['черепаха?!','Годы на страницах прыгают: +100, +1000... Чем дальше — тем сложнее.'],
  ['ч е р е п а х а','Проиграешь все жизни — календарь перемешается. Это рогалик, детка.'],
];

/* ---------- забег ---------- */
function newRun(ng=0){
  const order=shuffle(GENRES.slice()); let year=2278+ng*100000; const pages=[];
  for(let i=0;i<13;i++){ if(i>0){let j=pick([100,1000]); if(Math.random()<.12)j*=10; if(Math.random()<.06)j=-pick([900,2000]); year+=j;}
    pages.push({i,month:MONTHS[i],year,mode:order[i],done:false,stars:0,tries:0}); }
  G.run={ng,lives:3,lvl:1,xp:0,likes:0,stats:{atk:1,def:1,spd:1,luck:1,hp:0},flags:{},perks:[],pages,
    cover:{i:13,month:'ОБЛОЖКА',year:2278+ng*100000,mode:'fighting',done:false,stars:0,tries:0},posts:[],done:0,pendingPerks:0,translator:false,visor:false,seed:rndi(1,1e9)};
  SAVE.data.meta=SAVE.data.meta||{runs:0,wins:0,bestLikes:0}; SAVE.data.meta.runs++; saveRun();
}
function saveRun(){SAVE.data.run=G.run;SAVE.store();}
const xpNeed=l=>100+60*(l-1);
function difficulty(p){const r=G.run;return 1+0.07*r.done+Math.min(.6,Math.max(0,Math.log10(Math.max(1,Math.abs(p.year)/2278)))*0.35)+0.35*r.ng;}
function yearStr(y){return (y<0?'−':'')+String(Math.abs(y));}

function startPage(p){
  const def=MODES[p.mode]; if(!def){sfx('miss');return;}
  p.tries++; const ctx=makeCtx(p,def); go(playScene(def,ctx));
}
function makeCtx(p,def){
  const r=G.run; const ctx={page:p,def,D:difficulty(p),P:r.stats,F:r.flags,likes:0,done:false,visor:r.visor,
    addLikes(n){n=Math.max(1,Math.round(n*r.stats.luck));ctx.likes+=n;return n;},
    win(info={}){finish(true,info,ctx);}, lose(info={}){finish(false,info,ctx);} };
  return ctx;
}
function finish(win,info,ctx){
  if(ctx.done)return; ctx.done=true; unlockPointer();
  const r=G.run,p=ctx.page; let xp=0,likes=0;
  if(win){ xp=Math.round(60+45*ctx.D)+(info.xp||0); likes=ctx.likes+Math.round((40+30*ctx.D)*r.stats.luck);
    if(!p.done){p.done=true;r.done++;} p.stars=Math.max(p.stars,info.stars||1);
    r.posts.unshift({bg:ctx.def.bg||'bg_city',anim:pick(['idle','walk','dance','attack','jump']),frame:rndi(0,7),likes:likes*rndi(7,31),views:likes*rndi(90,400),year:p.year,month:p.month,dir:pick([-1,1])});
    if(r.posts.length>30)r.posts.pop(); sfx('win'); setTimeout(cherepaha,400);
  } else { xp=20; likes=Math.floor(ctx.likes/2); r.lives--; sfx('lose'); }
  r.likes+=likes; r.xp+=xp; let lv=0; while(r.xp>=xpNeed(r.lvl)){r.xp-=xpNeed(r.lvl);r.lvl++;r.pendingPerks++;lv++;}
  const meta=SAVE.data.meta||(SAVE.data.meta={runs:1,wins:0,bestLikes:0}); meta.bestLikes=Math.max(meta.bestLikes||0,r.likes);
  saveRun();
  go(resultScene(win,{xp,likes,lv,text:info.text||'',stars:info.stars||1},ctx));
}
function afterResult(ctx,win){
  const r=G.run;
  if(r.lives<=0){go(gameOverScene());return;}
  if(win&&ctx.page.mode==='fighting'){go(victoryScene());return;}
  if(r.pendingPerks>0){go(perkScene());return;}
  go(calendarScene());
}

/* ---------- общие элементы ---------- */
function glitchTitle(g,s,x,y,size,col='#ff3df2'){
  const j=Math.random()<.08?rnd(-6,6):0;
  txt(g,s,x-3+j,y,{size,font:FONTB,align:'center',color:'rgba(0,255,255,.7)'});
  txt(g,s,x+3-j,y,{size,font:FONTB,align:'center',color:'rgba(255,0,170,.7)'});
  txt(g,s,x,y,{size,font:FONTB,align:'center',color:'#fff',glow:col,blur:22});
}
function topBar(g,ctx,def){
  const r=G.run; g.save(); g.fillStyle='rgba(5,0,18,.62)'; g.fillRect(0,0,W,26); g.restore();
  txt(g,`📅 ${ctx.page.month} ${yearStr(ctx.page.year)}  ·  ${def.genre.toUpperCase()}  ·  ${def.title}`,10,18,{size:14,color:'#bff'});
  txt(g,`❤ ${r.lives}   👍 ${fmt(r.likes)}${ctx.likes?' +'+ctx.likes:''}   Ур.${r.lvl}`,W-10,18,{size:14,align:'right',color:'#ffd6f8'});
}
function drawPost(g,x,y,w,post,o={}){
  const ih=Math.round(w*.56), h=ih+118;
  g.save(); g.shadowColor='rgba(0,0,0,.6)'; g.shadowBlur=20; g.fillStyle='#fff'; rr(g,x,y,w,h,12); g.fill(); g.restore();
  g.save(); g.fillStyle='#4a76a8'; g.beginPath(); g.arc(x+28,y+28,18,0,7); g.fill(); g.restore();
  spr(g,'shell',x+28,y+38,{w:30});
  txt(g,'черепаха',x+54,y+25,{size:16,color:'#2a5885'}); txt(g,o.time||'только что',x+54,y+43,{size:12,color:'#828282',bold:false});
  txt(g,'···',x+w-30,y+28,{size:16,color:'#aaa'});
  g.save(); rr(g,x+10,y+56,w-20,ih,6); g.clip();
  const im=IMG[post.bg]; if(ok(im)){const s=Math.max((w-20)/im.width,ih/im.height);g.drawImage(im,x+10+(w-20-im.width*s)/2,y+56+(ih-im.height*s)/2,im.width*s,im.height*s);} 
  turtle(g,x+w/2,y+56+ih-8,{anim:post.anim,frame:post.frame,scale:(w-20)/256*.8,dir:post.dir});
  g.restore();
  txt(g,'черепаха',x+14,y+56+ih+24,{size:17,color:'#000',bold:false});
  txt(g,`❤ ${fmt(post.likes)}    💬 0    ↗ ${fmt(post.likes/9)}`,x+14,y+h-16,{size:14,color:'#e64646'});
  txt(g,`👁 ${post.views>999?(post.views/1000).toFixed(1)+'K':post.views}`,x+w-14,y+h-16,{size:13,color:'#828282',align:'right',bold:false});
  return h;
}
function stars(g,n,x,y,size=22){for(let i=0;i<3;i++)txt(g,'★',x+i*size,y,{size,color:i<n?'#ffd84a':'rgba(255,255,255,.2)',glow:i<n?'#fa0':null,align:'center'});}
function floatingDigits(g,seed=1){g.save();for(let i=0;i<26;i++){const x=(i*137.5+TIME*(8+i%5*4))%(W+100)-50,y=(i*73.3+Math.sin(TIME*.5+i)*30)%H;g.globalAlpha=.12+.1*Math.sin(TIME+i);
  txt(g,String((2278+i*100*(i%3?1:10))),x,y,{size:12+i%4*6,font:MONO,color:i%2?'#0ff':'#f0f'});}g.restore();}

/* ---------- загрузка / титульник ---------- */
function loadingScene(){return{update(){},draw(g){g.fillStyle='#05010d';g.fillRect(0,0,W,H);glitchTitle(g,'ЧЕРЕПАХА',W/2,H/2-20,64);
  bar(g,W/2-200,H/2+30,400,12,TOTAL?LOADED/TOTAL:0,'#ff3df2');txt(g,'загрузка календаря...',W/2,H/2+70,{align:'center',size:16,color:'#9cf'});}};}
function titleScene(){
  let sel=0,t=0,said=false; const hasRun=()=>!!(SAVE.data.run&&SAVE.data.run.lives>0);
  const items=()=>hasRun()?['ПРОДОЛЖИТЬ ЗАБЕГ','НОВЫЙ ЗАБЕГ','КАК ИГРАТЬ']:['НОВЫЙ ЗАБЕГ','КАК ИГРАТЬ'];
  let help=false;
  const act=(name)=>{sfx('ok'); if(!said){said=true;}
    if(name==='ПРОДОЛЖИТЬ ЗАБЕГ'){G.run=SAVE.data.run;go(calendarScene());}
    else if(name==='НОВЫЙ ЗАБЕГ'){newRun(0);go(introScene());}
    else help=true;};
  return{enter(){MUS.play('title');},
    update(dt){t+=dt;const it=items();
      if(help){if(hit('ok')||hit('back')||M.click){help=false;sfx('back');}return;}
      if(hit('up')){sel=(sel+it.length-1)%it.length;sfx('select');} if(hit('down')){sel=(sel+1)%it.length;sfx('select');}
      if(KP.Enter||KP.Space){if(!said){said=true;cherepaha();} act(it[sel]);} },
    draw(g){
      drawBG(g,'bg_city',.25,(M.x-W/2)*.04,(M.y-H/2)*.03);
      const gr=g.createLinearGradient(0,H*.55,0,H);gr.addColorStop(0,'rgba(5,0,20,0)');gr.addColorStop(1,'rgba(5,0,20,.95)');g.fillStyle=gr;g.fillRect(0,0,W,H);
      // walking turtle
      const tx=((t*70)%(W+300))-150; turtle(g,tx,H-22,{anim:'walk',scale:.55,dir:1,fps:11,visor:G.run&&G.run.visor});
      spr(g,'cyber',W-170,250,{w:300,rot:Math.sin(t*1.3)*.05,alpha:.95});
      glow(g,W-170,180,160,'rgba(0,255,255,.25)');
      const bounce=Math.sin(t*2)*4;
      glitchTitle(g,'ЧЕРЕПАХА',W/2-120,130+bounce,96);
      txt(g,'2278',W/2-120,200+bounce,{size:58,font:FONTB,align:'center',color:'#ffe9a8',glow:'#ff9d00',blur:20});
      txt(g,'RPG · FPS · ПЛАТФОРМЕР · ГОЛОВОЛОМКА · RTS · РИТМ · ВЫЖИВАНИЕ · СТЕЛС',W/2-120,232,{size:12,align:'center',color:'#9ff'});
      txt(g,'ГОНКИ · ФАЙТИНГ · TOWER DEFENSE · КВЕСТ · ПЕСОЧНИЦА · РОГАЛИК',W/2-120,250,{size:12,align:'center',color:'#f9f'});
      const it=items();
      it.forEach((s,i)=>{if(button(g,W/2-270,290+i*58,300,46,s,{sel:i===sel})){sel=i;if(!said){said=true;cherepaha();}act(s);} if(inRect(W/2-270,290+i*58,300,46))sel=i;});
      txt(g,'↑↓ + Enter  ·  мышь  ·  M — звук  ·  Esc — пауза',W/2-120,H-60,{size:13,align:'center',color:'rgba(255,255,255,.6)'});
      const meta=SAVE.data.meta; if(meta)txt(g,`Забегов: ${meta.runs||0}  ·  Побед: ${meta.wins||0}  ·  Рекорд лайков: ${fmt(meta.bestLikes||0)}`,10,H-8,{size:12,color:'rgba(255,255,255,.45)'});
      if(help){panel(g,90,60,780,420,{});txt(g,'КАК ИГРАТЬ',W/2,105,{size:30,font:FONTB,align:'center',color:'#fff',glow:'#f0f'});
        wrapText(g,'Тебе снится календарь «ЧЕРЕПАХА» на 2278 год. Каждая страница — отдельный год и отдельный ЖАНР. Проходи страницы в любом порядке, получай опыт (RPG), выбирай перки при повышении уровня, копи лайки и трать их в паблике.\n\nУ тебя 3 жизни на весь забег. Проиграл страницу — минус жизнь. Кончились жизни — календарь перемешивается, годы и жанры меняются (рогалик).\n\nПосле '+COVER_NEED+' страниц откроется ОБЛОЖКА — финальный файтинг с человеком-пауком, согнутым в форму черепахи.\n\nПодсказки по управлению показываются в начале каждой страницы. Esc — пауза, M — звук.\n\nЧерепаха.',120,150,720,24,{size:17,color:'#e8f'});
        txt(g,'[ клик / Enter ]',W/2,460,{size:15,align:'center',color:'#9ff'});}
    }};
}
/* ---------- сюжетный сон ---------- */
function introScene(){
  const L=['Мне снился календарь «ЧЕРЕПАХА» на 2278 год.','Но он был какой-то рандомный: одна страница — плюс сто лет, вторая — плюс тыща.',
    'А на обложке сначала вообще был человек-паук, согнутый в форму черепахи.','Он смотрел прямо на меня. Хотя у него не было глаз. Только линзы.',
    'Время в календаре сломалось. Каждая страница стала отдельным миром. И отдельным жанром.','Кто-то должен пройти их все и вернуть календарю нормальную черепаху на обложку.',
    'Этим кто-то будешь ты.','Ты — черепаха.','Просто черепаха.'];
  let i=0,ch=0,t=0;
  return{enter(){MUS.play('title');},
    update(dt){t+=dt;ch+=dt*38;if(KP.Escape){go(calendarScene());return;}
      if(hit('ok')||M.click){if(ch<L[i].length){ch=999;}else{i++;ch=0;sfx('click');if(i===L.length-1)cherepaha();if(i>=L.length)go(calendarScene());}}},
    draw(g){drawBG(g,'bg_dream',.15,Math.sin(t*.2)*20,0);floatingDigits(g);
      if(i>=2&&i<=3){const a=clamp((i===2?ch/40:1),0,1);spr(g,'boss',W/2,330,{w:360,alpha:a*.95,sy:1+Math.sin(t*3)*.02});glow(g,W/2,260,220,'rgba(80,255,120,.15)');}
      if(i>=6){turtle(g,W/2,360,{anim:i>=8?'idle':'walk',scale:.9,dir:1});}
      panel(g,60,390,840,110,{fill:'rgba(5,0,20,.85)'});
      const s=L[Math.min(i,L.length-1)].slice(0,Math.floor(ch)); wrapText(g,s,85,430,790,30,{size:22,color:'#fff'});
      txt(g,'Пробел/клик — дальше · Esc — пропустить',W-75,490,{size:12,align:'right',color:'#9cf'});}};
}
/* ---------- календарь (хаб) ---------- */
function calendarScene(){
  let sel=0, t=0, line=rndi(0,ADMIN_LINES.length-1), lt=0;
  const cards=()=>G.run.pages.concat([G.run.cover]);
  const cardPos=i=>({x:30+(i%7)*130,y:62+Math.floor(i/7)*170,w:120,h:158});
  const coverOpen=()=>G.run.done>=COVER_NEED;
  const open=i=>{const c=cards()[i]; if(c.mode==='fighting'&&!coverOpen()){sfx('miss');PFX.text(cardPos(i).x+60,cardPos(i).y+80,'🔒 закрыто','#f66');return;}
    if(!MODES[c.mode]){sfx('miss');PFX.text(cardPos(i).x+60,cardPos(i).y+80,'скоро...','#ff0');return;} sfx('ok'); go(pageIntroScene(c));};
  return{enter(){MUS.play('hub');saveRun();},
    update(dt){t+=dt;lt+=dt;if(lt>7){lt=0;line=(line+1)%ADMIN_LINES.length;}
      const n=14; if(hit('right'))sel=(sel+1)%n; if(hit('left'))sel=(sel+n-1)%n; if(hit('down')||hit('up'))sel=(sel+7)%n;
      if(KP.Enter)open(sel); if(KP.Escape)go(titleScene()); PFX.update(dt);},
    draw(g){
      drawBG(g,'bg_dream',.55,Math.sin(t*.1)*20,0); floatingDigits(g);
      glitchTitle(g,`КАЛЕНДАРЬ «ЧЕРЕПАХА» · ${yearStr(G.run.cover.year)}`,W/2,44,30);
      cards().forEach((c,i)=>{const p=cardPos(i),hov=inRect(p.x,p.y,p.w,p.h); if(hov&&(M.dx||M.dy))sel=i; const s=sel===i;
        const isCover=c.mode==='fighting', locked=isCover&&!coverOpen(), def=MODES[c.mode];
        const lift=s?-6+Math.sin(t*6)*1.5:0;
        g.save(); g.translate(p.x,p.y+lift);
        panel(g,0,0,p.w,p.h,{fill:isCover?'rgba(40,0,30,.92)':c.done?'rgba(10,40,30,.9)':'rgba(240,235,250,.95)',stroke:s?'#ff3df2':isCover?'#5f5':'#27f3ff',blur:s?24:6,r:6});
        for(let k=0;k<4;k++){g.fillStyle='#222';g.beginPath();g.arc(18+k*28,4,4,0,7);g.fill();g.strokeStyle='#bbb';g.lineWidth=2;g.beginPath();g.arc(18+k*28,-2,5,Math.PI,0);g.stroke();}
        const dark=isCover||c.done; const tc=dark?'#fff':'#1a0a3a';
        txt(g,c.month,p.w/2,26,{size:c.month.length>9?11:14,align:'center',color:dark?'#9ff':'#a0008a'});
        txt(g,yearStr(c.year),p.w/2,56,{size:String(c.year).length>5?20:26,font:FONTB,align:'center',color:tc});
        if(isCover){spr(g,'boss',p.w/2,118,{w:108,alpha:locked?.35:1,flash:locked?.5:0});txt(g,locked?`🔒 ${G.run.done}/${COVER_NEED}`:'ФИНАЛ',p.w/2,146,{size:14,align:'center',color:locked?'#f88':'#5f5'});}
        else{txt(g,def?def.icon:'❔',p.w/2,100,{size:34,align:'center'});
          txt(g,def?def.genre.toUpperCase():'СКОРО',p.w/2,126,{size:def&&def.genre.length>11?10:12,align:'center',color:dark?'#ffd':'#334'});
          if(c.done)stars(g,c.stars,p.w/2-22,149,18); else txt(g,s?'▶ ИГРАТЬ':'',p.w/2,148,{size:12,align:'center',color:'#e0a'});}
        g.restore();
        if(hov&&M.click){sel=i;open(i);} });
      // нижняя панель
      const r=G.run; panel(g,20,402,430,128,{});
      turtle(g,80,505,{anim:'idle',scale:.42,visor:r.visor});
      txt(g,`Черепаха · Ур. ${r.lvl}`,140,428,{size:18,color:'#fff'}); bar(g,140,436,290,10,r.xp/xpNeed(r.lvl),'#ff3df2'); txt(g,`${r.xp}/${xpNeed(r.lvl)} XP`,430,428,{size:12,align:'right',color:'#f9f'});
      txt(g,`❤ ${r.lives}   👍 ${fmt(r.likes)}   📅 ${r.done}/13`,140,468,{size:17,color:'#ffe'});
      txt(g,`⚔ ${r.stats.atk.toFixed(2)}  🛡 ${r.stats.def.toFixed(2)}  💨 ${r.stats.spd.toFixed(2)}  🍀 ${r.stats.luck.toFixed(2)}  🧱 +${r.stats.hp}`,140,492,{size:13,color:'#9ef'});
      txt(g,r.perks.map(id=>(PERKS.find(p=>p.id===id)||{}).icon).join(' ')||'перков пока нет',140,516,{size:14,color:'#ccc'});
      if(button(g,462,404,150,38,'🛒 Паблик',{size:17}))go(shopScene());
      if(button(g,462,448,150,38,'📰 Лента',{size:17}))go(feedScene());
      if(button(g,462,492,150,38,'⏏ Меню',{size:17}))go(titleScene());
      // админ
      spr(g,'admin',W-80,H,{w:150});
      const [a,b]=ADMIN_LINES[line]; panel(g,622,404,250,92,{fill:'rgba(255,255,255,.93)',stroke:'#4a76a8',blur:4});
      txt(g,a,636,428,{size:18,color:'#2a5885'});
      if(r.translator)wrapText(g,'(перевод: '+b+')',636,448,226,15,{size:12,color:'#444',bold:false});
      else wrapText(g,'(чтобы понимать админа, купи «Переводчик с черепашьего» в паблике)',636,448,226,15,{size:11,color:'#888',bold:false});
      txt(g,'←→↑↓ + Enter или мышь',W/2,H-4,{size:11,align:'center',color:'rgba(255,255,255,.4)'});
      PFX.draw(g);
    }};
}
function pageIntroScene(c){
  const def=MODES[c.mode]; let t=0; const D=difficulty(c);
  return{enter(){MUS.play(c.mode==='fighting'?'boss':'hub');if(c.mode==='fighting')say('человек паук... черепаха',{pitch:.6});},
    update(dt){t+=dt;if(t>.4&&(KP.Enter||KP.Space)){sfx('ok');startPage(c);} if(KP.Escape){sfx('back');go(calendarScene());}},
    draw(g){drawBG(g,def.bg||'bg_city',.45,Math.sin(t*.3)*15,0);
      const k=ease.back(clamp(t*2.2,0,1));
      g.save();g.translate(W/2,H/2);g.scale(k,k);g.rotate((1-k)*.3);g.translate(-W/2,-H/2);
      panel(g,150,40,660,460,{fill:'rgba(245,240,255,.97)',stroke:'#ff3df2',blur:30,r:8});
      for(let i=0;i<10;i++){g.fillStyle='#222';g.beginPath();g.arc(190+i*64,46,6,0,7);g.fill();}
      txt(g,c.month,W/2,96,{size:28,align:'center',color:'#a0008a',font:FONTB});
      txt(g,yearStr(c.year),W/2,170,{size:72,align:'center',color:'#1a0a3a',font:FONTB});
      txt(g,`${def.icon}  ${def.genre.toUpperCase()}  ${def.icon}`,W/2,214,{size:26,align:'center',color:'#e01a8a'});
      txt(g,`«${def.title}»`,W/2,248,{size:22,align:'center',color:'#333'});
      wrapText(g,'🎯 '+def.goal,190,290,580,22,{size:17,color:'#222'});
      (def.controls||[]).forEach((s,i)=>txt(g,'⌨ '+s,190,350+i*22,{size:15,color:'#3a3a6a',bold:false}));
      txt(g,`Сложность: ${'🔥'.repeat(clamp(Math.round((D-.8)*3),1,6))}   ${c.tries?'Попыток: '+c.tries:''}`,190,470,{size:15,color:'#a33'});
      txt(g,'Enter — начать · Esc — назад',770,470,{size:15,align:'right',color:'#0a6'});
      g.restore();}};
}
function playScene(def,ctx){
  let inst=null,paused=false,t=0;
  return{enter(){MUS.play(def.music||'drive');inst=def.create(ctx);},
    update(dt){t+=dt;if(ctx.done)return;
      if(KP.Escape||KP.KeyP){paused=!paused;sfx(paused?'back':'ok');if(paused)unlockPointer();}
      if(paused){if(hit('ok')&&!M.click&&KP.Enter){paused=false;}return;}
      inst.update(dt);PFX.update(dt);},
    draw(g){inst.draw(g);topBar(g,ctx,def);
      if(t<6&&!paused){const a=clamp(6-t,0,1);g.save();g.globalAlpha=a;panel(g,W/2-330,H-34-22*(def.controls||[]).length,660,24+22*(def.controls||[]).length,{fill:'rgba(5,0,20,.75)'});
        (def.controls||[]).forEach((s,i)=>txt(g,s,W/2,H-16-22*((def.controls||[]).length-1-i)-4,{size:14,align:'center',color:'#cff'}));g.restore();}
      if(paused){g.fillStyle='rgba(5,0,20,.7)';g.fillRect(0,0,W,H);glitchTitle(g,'ПАУЗА',W/2,150,56);
        txt(g,def.goal,W/2,190,{size:15,align:'center',color:'#ccf'});
        (def.controls||[]).forEach((s,i)=>txt(g,s,W/2,222+i*20,{size:14,align:'center',color:'#9ff'}));
        if(button(g,W/2-150,330,300,46,'▶ Продолжить'))paused=false;
        if(button(g,W/2-150,386,300,46,(AU.muted?'🔇':'🔊')+' Звук (M)'))AU.toggleMute();
        if(button(g,W/2-150,442,300,46,'🏳 Сдаться (−1 ❤)',{color:'#f55'}))ctx.lose({text:'Черепаха сдалась. Бывает.'});}}};
}
function resultScene(win,res,ctx){
  let t=0; const r=G.run; const post=win?r.posts[0]:null;
  return{enter(){MUS.play(win?'hub':'sad');},
    update(dt){t+=dt;if(t>.8&&(KP.Enter||KP.Space))afterResult(ctx,win);},
    draw(g){drawBG(g,ctx.def.bg||'bg_city',.6);
      glitchTitle(g,win?'СТРАНИЦА ПРОЙДЕНА':'ПРОВАЛ',W/2-(win?160:0),70,win?40:56,win?'#5f5':'#f33');
      const x0=win?60:W/2-260;
      panel(g,x0,100,520,330,{});
      txt(g,`${ctx.page.month} ${yearStr(ctx.page.year)} · ${ctx.def.genre}`,x0+20,135,{size:18,color:'#9ff'});
      if(res.text)wrapText(g,res.text,x0+20,165,480,22,{size:16,color:'#fff'});
      if(win)stars(g,res.stars,x0+40,232,30);
      txt(g,`+${res.xp} XP`,x0+20,280,{size:24,color:'#f9f',font:FONTB});
      txt(g,`+${fmt(res.likes)} 👍`,x0+20,315,{size:24,color:'#ffe066',font:FONTB});
      if(res.lv)txt(g,`НОВЫЙ УРОВЕНЬ! (${r.lvl})`,x0+20,352,{size:22,color:'#5ff',glow:'#0ff'});
      txt(g,`❤ жизней: ${r.lives}`,x0+20,392,{size:20,color:r.lives>0?'#fff':'#f55'});
      if(!win&&r.lives<=0)txt(g,'Жизни кончились...',x0+250,392,{size:18,color:'#f55'});
      if(post){const k=ease.back(clamp((t-.3)*2,0,1));g.save();g.translate(780,260);g.scale(k,k);g.rotate((1-k)*.4+Math.sin(t)*.01);drawPost(g,-170,-190,340,post);g.restore();
        txt(g,'Опубликован новый пост в паблике!',780,470,{size:14,align:'center',color:'#bdf'});}
      if(t>.8)txt(g,'Enter — дальше',W/2,H-24,{size:18,align:'center',color:'#fff',alpha:.6+.4*Math.sin(t*5)});
      if(M.click&&t>.8)afterResult(ctx,win);}};
}
function perkScene(){
  const r=G.run; let opts=shuffle(PERKS.filter(p=>!(p.once&&r.perks.includes(p.id)))).slice(0,3); let t=0;
  const choose=p=>{p.apply(r);r.perks.push(p.id);r.pendingPerks--;sfx('power');saveRun();go(r.pendingPerks>0?perkScene():calendarScene());};
  return{enter(){MUS.play('hub');},update(dt){t+=dt;['Digit1','Digit2','Digit3'].forEach((k,i)=>{if(KP[k]&&opts[i])choose(opts[i]);});},
    draw(g){drawBG(g,'bg_space',.5);glitchTitle(g,'НОВЫЙ УРОВЕНЬ!',W/2,80,48,'#0ff');txt(g,'Выбери перк (1/2/3 или клик). Это рогалик — второго шанса не будет.',W/2,115,{size:16,align:'center',color:'#cff'});
      opts.forEach((p,i)=>{const x=110+i*260,y=150+Math.sin(t*2+i)*5,hov=inRect(x,y,220,300);
        panel(g,x,y,220,300,{stroke:hov?'#ff3df2':'#27f3ff',blur:hov?30:10,fill:hov?'rgba(60,0,60,.9)':'rgba(12,4,32,.88)'});
        txt(g,p.icon,x+110,y+90,{size:64,align:'center'});txt(g,`${i+1}`,x+16,y+28,{size:18,color:'#888'});
        wrapText(g,p.name,x+110,y+150,200,24,{size:20,align:'center',color:'#fff'});wrapText(g,p.desc,x+110,y+210,190,20,{size:15,align:'center',color:'#bdf',bold:false});
        if(hov&&M.click)choose(p);});}};
}
function shopScene(){
  const r=G.run; let msg='',mt=0;
  const items=[
    {n:'❤ Запасная жизнь',c:220,f:()=>r.lives++},{n:'⚔ Заточить клюв (+15% урон)',c:140,f:()=>r.stats.atk+=.15},
    {n:'🛡 Полировка панциря (+15% защита)',c:140,f:()=>r.stats.def+=.15},{n:'💨 Смазать лапки (+8% скорость)',c:140,f:()=>r.stats.spd+=.08},
    {n:'🗣 Переводчик с черепашьего',c:60,once:'translator',f:()=>r.translator=true},{n:'🕶 Кибер-визор (косметика)',c:90,once:'visor',f:()=>r.visor=true},
  ];
  return{enter(){MUS.play('chill');},update(dt){mt-=dt;if(KP.Escape)go(calendarScene());},
    draw(g){drawBG(g,'bg_city',.7);glitchTitle(g,'ПАБЛИК «ЧЕРЕПАХА» · МАГАЗИН',W/2,60,32);
      txt(g,`У тебя: 👍 ${fmt(r.likes)} лайков`,W/2,96,{size:20,align:'center',color:'#ffe066'});
      items.forEach((it,i)=>{const y=120+i*58,bought=it.once&&r[it.once];
        if(button(g,120,y,520,48,`${it.n}${bought?'  ✓':''}`,{disabled:bought||r.likes<it.c,size:18})){r.likes-=it.c;it.f();sfx('like');msg='черепаха. (спасибо за покупку)';mt=2;saveRun();}
        txt(g,bought?'куплено':`${it.c} 👍`,660,y+31,{size:18,color:r.likes>=it.c?'#ffe066':'#866'});});
      spr(g,'admin',830,H,{w:220});
      if(mt>0)txt(g,msg,W/2,H-60,{size:18,align:'center',color:'#fff',glow:'#0ff'});
      if(button(g,W/2-100,H-50,200,40,'← Назад'))go(calendarScene());}};
}
function feedScene(){
  let sc=0; const r=G.run;
  return{enter(){MUS.play('chill');},update(dt){if(KP.Escape)go(calendarScene());sc=clamp(sc+M.wheel*60+(held('down')?400*dt:0)-(held('up')?400*dt:0),0,Math.max(0,Math.ceil(r.posts.length/2)*370-380));},
    draw(g){drawBG(g,'bg_dream',.8);txt(g,'ЛЕНТА ПАБЛИКА «черепаха»',W/2,40,{size:26,align:'center',font:FONTB,color:'#fff',glow:'#4a76a8'});
      g.save();g.beginPath();g.rect(0,55,W,H-110);g.clip();
      if(!r.posts.length)txt(g,'Постов пока нет. Пройди страницу — появится черепаха.',W/2,200,{size:18,align:'center',color:'#ccc'});
      r.posts.forEach((p,i)=>drawPost(g,150+(i%2)*340,70+Math.floor(i/2)*370-sc,320,p,{time:`${p.month.toLowerCase()} ${yearStr(p.year)}`}));g.restore();
      if(button(g,W/2-100,H-48,200,40,'← Назад'))go(calendarScene());}};
}
function gameOverScene(){
  const r=G.run;let t=0;
  return{enter(){MUS.play('sad');SAVE.data.run=null;SAVE.store();say('черепаха',{rate:.6,pitch:.5});},update(dt){t+=dt;},
    draw(g){drawBG(g,'bg_ruins',.55);glitchTitle(g,'КАЛЕНДАРЬ ЗАКРЫЛСЯ',W/2,110,52,'#f33');
      turtle(g,W/2,300,{anim:'hide',frame:7,scale:.9});
      txt(g,`Страниц пройдено: ${r.done}/13 · Уровень: ${r.lvl} · Лайков: ${fmt(r.likes)}`,W/2,350,{size:20,align:'center',color:'#fff'});
      txt(g,'Черепаха спряталась в панцирь. Но сон повторится — с другими годами и жанрами.',W/2,385,{size:16,align:'center',color:'#ccc'});
      if(t>1&&button(g,W/2-140,420,280,50,'🔁 Новый забег')){newRun(0);go(calendarScene());}
      if(t>1&&button(g,W/2-140,480,280,40,'Меню',{size:16}))go(titleScene());}};
}
function victoryScene(){
  const r=G.run;let t=0,i=0;
  const L=['Человек-паук разогнулся с громким хрустом.','«Я просто хотел быть черепахой», — сказал он и уполз в 2278 год.',
    'Годы на страницах календаря встали на свои места.','Ты проснулся. На стене висит календарь «ЧЕРЕПАХА».','На обложке — черепаха.','Просто черепаха.'];
  return{enter(){MUS.play('title');const m=SAVE.data.meta||(SAVE.data.meta={});m.wins=(m.wins||0)+1;SAVE.data.run=null;SAVE.store();setTimeout(()=>say('черепаха'),600);},
    update(dt){t+=dt;if((hit('ok')||M.click)&&i<L.length){i++;sfx('click');if(i===L.length)cherepaha();}},
    draw(g){drawBG(g,'bg_space',.2,Math.sin(t*.2)*20,0);floatingDigits(g);
      glitchTitle(g,'ПОБЕДА',W/2,90,72,'#5f5');
      turtle(g,W/2,330,{anim:'dance',scale:1,fps:9,visor:r.visor});
      panel(g,120,360,720,70,{});txt(g,L[Math.min(i,L.length-1)],W/2,402,{size:21,align:'center',color:'#fff'});
      if(i>=L.length){txt(g,`Уровень ${r.lvl} · Лайков ${fmt(r.likes)} · Страниц ${r.done}/13 · Постов ${r.posts.length}`,W/2,455,{size:16,align:'center',color:'#ffe066'});
        if(button(g,W/2-300,475,280,46,'♾ НОВЫЙ КАЛЕНДАРЬ+')){const ng=r.ng+1;newRun(ng);G.run.likes=Math.floor(r.likes/2);go(calendarScene());}
        if(button(g,W/2+20,475,280,46,'Меню'))go(titleScene());}
      else txt(g,'клик / Enter',W/2,470,{size:14,align:'center',color:'#9cf'});}};
}
/* ---------- запуск ---------- */
function boot(){setScene(loadingScene());requestAnimationFrame(frame);loadAssets(()=>go(titleScene()));}
