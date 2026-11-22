'use strict';
/* RPG — «Хроники Панциря»: деревня, партия, пошаговые бои, босс */
SONGS.battle={bpm:150,root:40,prog:[0,-4,-2,-7],drums:'break',bass:'8th',arp:2,pad:0,hats:1,lead:[12,null,10,null,7,null,10,null,12,null,15,null,14,null,10,null,7,null,5,null,7,null,10,null,3,null,5,null,7,null,null,null]};
MODES.rpg={genre:'RPG',title:'Хроники Панциря',icon:'🗡',music:'chill',bg:'bg_dream',
  goal:'Улитка Времени листает календарь как попало: то +100 лет, то +1000. Собери 3 печати, побеждая монстров у деревни Календарёво, открой Врата Времени и одолей Улитку. С тобой Кибер-черепаха.',
  controls:['WASD — ходить · E / Пробел — говорить · касание монстра — бой','В бою: 1-4 — команда, ←/→ — цель, Enter — подтвердить, ПКМ/Backspace — назад'],
  create(ctx){
    const D=ctx.D,P=ctx.P,ES=.85+.15*D;
    const party=[{n:'Черепаха',hp:70+12*P.hp,mp:20,atk:11*P.atk,def:4,sk:['ram','shout','salad'],x:720,y:330},{n:'Кибер-черепаха',hp:58,mp:24,atk:10,def:3,sk:['fan','repair'],x:830,y:420,cyber:1}];
    party.forEach(u=>{u.max=u.hp;u.mmax=u.mp;u.lvl=1;u.flash=0;u.lunge=0;u.defd=0;u.stun=0;});
    let xp=0,lvl=1,cab=3+(ctx.F.rich?2:0),seals=0,mode='world',t=0,talk=null,inv=0,end=0;
    const pl={x:480,y:440,face:1,mv:0};
    const HOUSES=[[70,70,170,110,'#ff3df2'],[300,60,150,100,'#27f3ff'],[690,80,180,110,'#ffe066'],[60,280,120,90,'#7f7']];
    const FOUNT={x:480,y:290,r:42},GATE={x:480,y:40},
      NPC=[{x:600,y:250,img:'admin',n:'Админ',lines:[['черепаха.','Улитка Времени сломала календарь. Поэтому страницы прыгают то на 100, то на 1000 лет.','*тревожно листает ленту*'],['черепаха!','Победи монстров у деревни: у каждого отряда печать. Три печати откроют Врата.','*показывает три пальца*'],['черепаха...','Фонтан с капустным соком лечит. Да, такое бывает.','*кивает на фонтан*']]},
        {x:250,y:400,img:'snail',n:'Местная улитка',lines:[['Улитка','Я не та улитка! Я просто улитка. Хожу по 2 метра в год.'],['Улитка','Говорят, Улитку Времени можно оглушить криком «ЧЕРЕПАХА!». Она этого слова боится.']]}];
    const GROUPS=[{n:'Заячий патруль',x:180,y:200,f:['hare','hare']},{n:'Канцелярия 2278',x:820,y:300,f:['clerk','crab']},{n:'Призрачный рой',x:700,y:450,f:['ghost','drone','ghost']}];
    GROUPS.forEach(g=>{g.ox=g.x;g.oy=g.y;g.alive=1;g.ph=rnd(6);});
    const ET={hare:{n:'Кибер-заяц',hp:48,atk:10,def:2,xp:14,w:90},crab:{n:'Краб-охранник',hp:80,atk:11,def:7,xp:18,w:110},clerk:{n:'Клерк Времени',hp:60,atk:9,def:3,xp:18,w:95},
      ghost:{n:'Призрак',hp:40,atk:9,def:1,xp:14,w:90,ev:.25},drone:{n:'Дрон-надзиратель',hp:55,atk:8,def:3,xp:16,w:95},boss:{n:'УЛИТКА ВРЕМЕНИ',hp:480,atk:16,def:5,xp:0,w:330,img:'snail'}};
    // ---------- бой ----------
    let B=null;
    function startBattle(gr){const boss=gr==='boss';MUS.play(boss?'boss':'battle');sfx('alarm');flashT=.6;
      const L=boss?['boss']:gr.f;const pos=[[230,300],[330,400],[150,440]];
      B={gr,boss,foes:L.map((k,i)=>{const b=ET[k];return{k,b,n:b.n,hp:Math.round(b.hp*ES),max:Math.round(b.hp*ES),atk:b.atk*ES,def:b.def,x:boss?250:pos[i][0],y:boss?380:pos[i][1],flash:0,lunge:0,stun:0,charge:0};}),
        st:'cmd',ci:0,menu:'main',tg:0,busy:0,q:[],log:boss?'Улитка Времени: «Я ПЕРЕЛИСТНУ ТЕБЯ НА 1000 ЛЕТ ВПЕРЁД!»':`Нападение: ${gr.n}!`,res:0,resT:0,turn:0};
      party.forEach(u=>{u.defd=0;u.stun=0;});nextMember(0);mode='battle';}
    let flashT=0;
    const aliveF=()=>B.foes.filter(f=>f.hp>0),aliveP=()=>party.filter(u=>u.hp>0);
    function dmgCalc(a,mult,def){return Math.max(1,Math.round(a*mult*rnd(.9,1.1)-def*.6));}
    function hitFoe(u,f,mult){if(f.hp<=0)return;if(f.b.ev&&Math.random()<f.b.ev){pop(f,'мимо!','#aaa');return;}let v=dmgCalc(u.atk,mult,f.def);const cr=Math.random()<.1;if(cr)v=Math.round(v*1.6);
      f.hp-=v;f.flash=.25;pop(f,(cr?'КРИТ! ':'')+v,cr?'#ff0':'#fff');sfx('hit');shake(cr?8:4);if(f.hp<=0){PFX.burst(f.x,f.y-50,30,['#f55','#ff0','#fff'],240,.7,5);sfx('explode');}}
    function hitP(f,u,mult){if(u.hp<=0)return;let v=dmgCalc(f.atk,mult,u.def);if(u.defd)v=Math.round(v*.45);v=Math.max(1,Math.round(v/P.def));u.hp=Math.max(0,u.hp-v);u.flash=.25;pop(u,'-'+v,'#f55');sfx('hurt');shake(5);
      if(u.hp<=0){B.log=u.n+' без сознания!';}}
    function heal(u,v){if(u.hp<=0)return;u.hp=Math.min(u.max,u.hp+v);pop(u,'+'+v,'#7f7');}
    const pop=(o,s,c)=>PFX.text(o.x,o.y-(o.k==='boss'?190:o.cyber?90:110),s,c,22);
    const SK={ram:{n:'Панцирный таран',mp:4,tg:'one',d:'урон ×1.9',f:(u,f)=>{hitFoe(u,f,1.9);B.log=`${u.n}: Панцирный таран!`;}},
      shout:{n:'Крик «ЧЕРЕПАХА!»',mp:8,tg:'all',d:'оглушает всех',f:u=>{cherepaha();aliveF().forEach(f=>{f.stun=1;f.charge=0;pop(f,'ОГЛУШЁН','#ff0');hitFoe(u,f,.5);});B.log='«ЧЕРЕПАХА!!!» — враги в оцепенении!';}},
      salad:{n:'Капустный салат',mp:6,tg:'none',d:'лечит всех на 30',f:u=>{party.forEach(p=>heal(p,30));sfx('power');B.log='Капустный салат на всю партию!';}},
      fan:{n:'Лазер-веер',mp:6,tg:'all',d:'бьёт всех ×0.9',f:u=>{aliveF().forEach(f=>hitFoe(u,f,.9));B.log='Кибер-черепаха: ЛАЗЕР-ВЕЕР!';}},
      repair:{n:'Ремонт',mp:5,tg:'none',d:'лечит слабого на 45',f:u=>{const a=aliveP().sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];heal(a,45);sfx('power');B.log=`Ремонт: ${a.n} +45`;}}};
    function nextMember(from){for(let i=from;i<party.length;i++){const u=party[i];if(u.hp<=0)continue;if(u.stun){u.stun=0;B.log=u.n+' пропускает ход (оглушена)';continue;}B.ci=i;B.st='cmd';B.menu='main';u.defd=0;return;}B.st='enemy';B.busy=.6;B.q=aliveF().slice();}
    function doAct(fn){fn();const u=party[B.ci];u.lunge=.35;B.busy=.8;B.after=()=>{if(!checkEnd())nextMember(B.ci+1);};}
    function command(k){if(B.busy>0||B.st!=='cmd')return;const u=party[B.ci];
      if(B.menu==='main'){
        if(k===0){B.menu='target';B.pend=f=>doAct(()=>{hitFoe(u,f,1);B.log=`${u.n} атакует: ${f.n}`;});fixTg();}
        else if(k===1)B.menu='skill';
        else if(k===2){u.defd=1;u.mp=Math.min(u.mmax,u.mp+4);B.log=`${u.n} прячется в панцирь (+4 ПП)`;sfx('select');doAct(()=>{});}
        else if(k===3){if(cab<=0){sfx('miss');return;}cab--;doAct(()=>{const a=aliveP().sort((a,b)=>a.hp/a.max-b.hp/b.max)[0];heal(a,40);B.log=`Капуста! ${a.n} +40`;sfx('power');});}
        else if(k===4&&!B.boss){if(Math.random()<.6){B.res=3;B.resT=0;B.log='Сбежали! Черепахи умеют бегать. Иногда.';sfx('boost');}else{B.log='Не удалось сбежать!';doAct(()=>{});}}}
      else if(B.menu==='skill'){const s=SK[u.sk[k]];if(!s)return;if(u.mp<s.mp){sfx('miss');B.log='Не хватает ПП!';return;}
        if(s.tg==='one'){B.menu='target';B.pend=f=>{u.mp-=s.mp;doAct(()=>s.f(u,f));};fixTg();}else{u.mp-=s.mp;doAct(()=>s.f(u));}}}
    function fixTg(){const a=aliveF();if(!a.includes(B.foes[B.tg]))B.tg=B.foes.indexOf(a[0]);}
    function cycleTg(d){const a=aliveF();let i=a.indexOf(B.foes[B.tg]);i=(i+d+a.length)%a.length;B.tg=B.foes.indexOf(a[i]);sfx('click');}
    function foeAct(f){if(f.hp<=0)return;if(f.stun){f.stun=0;B.log=f.n+' в оцепенении';return;}const tg=pick(aliveP());if(!tg)return;f.lunge=.35;
      if(f.k==='boss'){const ph=f.hp<f.max*.4;
        if(f.charge){f.charge=0;const v=aliveP().sort((a,b)=>b.hp-a.hp)[0];hitP(f,v,2.4);B.log=`«+1000 ЛЕТ!» — ${v.n} стареет на тысячелетие!`;shake(14);return;}
        const r=Math.random();
        if(r<.25){f.charge=1;B.log='Улитка заряжает «+1000 ЛЕТ»... (спрячься в панцирь!)';sfx('alarm');}
        else if(r<.45){aliveP().forEach(u=>hitP(f,u,ph?.95:.75));B.log='Волна слизи времени!';}
        else if(r<.58&&f.hp<f.max*.7){const v=Math.round(f.max*.08);f.hp+=v;pop(f,'+'+v,'#7f7');B.log='«Перемотка!» Улитка отматывает свои раны назад';}
        else if(r<.68){tg.stun=1;pop(tg,'ЗАМЕДЛЕН','#c9f');B.log=`Замедление времени: ${tg.n} пропустит ход`;}
        else{hitP(f,tg,ph?1.3:1.1);B.log=`Улитка бьёт раковиной: ${tg.n}`;}return;}
      if(f.k==='hare'&&Math.random()<.35){hitP(f,tg,.65);hitP(f,tg,.65);B.log='Кибер-заяц: двойной пинок!';return;}
      if(f.k==='ghost'&&Math.random()<.3){tg.mp=Math.max(0,tg.mp-6);pop(tg,'-6 ПП','#9cf');B.log=`Призрак высасывает ПП у: ${tg.n}`;return;}
      if(f.k==='drone'&&Math.random()<.4){aliveP().forEach(u=>hitP(f,u,.6));B.log='Дрон: лазерный дождь!';return;}
      if(f.k==='clerk'&&Math.random()<.3){tg.stun=1;pop(tg,'СПРАВКА!','#ff0');B.log=`Клерк выдал справку №2278. ${tg.n} заполняет её весь ход`;return;}
      hitP(f,tg,1);B.log=`${f.n} атакует: ${tg.n}`;}
    function checkEnd(){if(!aliveF().length){B.res=1;B.resT=0;const g=B.boss?0:B.foes.reduce((s,f)=>s+f.b.xp,0);gainXp(g);sfx('win');ctx.addLikes(B.boss?30:10);if(Math.random()<.5&&!B.boss){cab++;}return 1;}
      if(!aliveP().length){B.res=2;B.resT=0;sfx('lose');return 1;}return 0;}
    let lvMsg='';
    function gainXp(v){xp+=v;lvMsg='';while(xp>=lvl*30){xp-=lvl*30;lvl++;party.forEach(u=>{u.max+=12;u.mmax+=4;u.atk+=2;u.def+=1;u.hp=Math.min(u.max,u.hp+20);u.mp=u.mmax;});lvMsg=`УРОВЕНЬ ${lvl}! Здоровье +12, ПП +4, атака +2, защита +1`;sfx('power');}}
    function endBattle(){const r=B.res;if(r===1){if(B.boss){end=1;MUS.stop();cherepaha();const hpR=aliveP().reduce((s,u)=>s+u.hp/u.max,0)/2;
          setTimeout(()=>ctx.win({stars:hpR>.5?3:hpR>.2?2:1,xp:50,text:`Улитка Времени повержена! Календарь больше не прыгает... почти. Уровень партии: ${lvl}. Кибер-черепаха сказала: «черепаха».`}),1200);return;}
        B.gr.alive=0;seals++;inv=2;}
      else if(r===2){end=1;MUS.stop();setTimeout(()=>ctx.lose({text:'Партия черепах пала. Улитка Времени перелистнула вас на 1000 лет назад. Попробуй снова!'}),900);return;}
      else{inv=2.5;}
      party.forEach(u=>{if(u.hp<=0)u.hp=1;u.defd=0;u.stun=0;});B=null;mode='world';MUS.play('chill');}
    // ---------- мир ----------
    function blocked(x,y){if(x<20||x>W-20||y<70||y>H-60)return 1;for(const h of HOUSES)if(x>h[0]-10&&x<h[0]+h[2]+10&&y>h[1]&&y<h[1]+h[3]+18)return 1;if(dist(x,y,FOUNT.x,FOUNT.y)<FOUNT.r+12)return 1;if(seals<3&&y<110&&Math.abs(x-GATE.x)<70)return 1;return 0;}
    function interactWorld(){if(dist(pl.x,pl.y,FOUNT.x,FOUNT.y)<FOUNT.r+50){party.forEach(u=>{u.hp=u.max;u.mp=u.mmax;});sfx('power');PFX.burst(FOUNT.x,FOUNT.y-20,30,['#5f5','#fff'],200,.6,4);talk={who:'Фонтан',lines:[['Капустный фонтан','Ты выпила капустного сока. Партия полностью здорова! (+ПП)']],i:0};return;}
      for(const n of NPC)if(dist(pl.x,pl.y,n.x,n.y)<80){talk={who:n.n,lines:n.lines,i:0,npc:n};sfx('click');return;}}
    return{get dbg(){return{mode,seals,lvl,xp,cab,party:party.map(u=>Math.round(u.hp)+'/'+u.max+' mp'+u.mp).join(' | '),B:B?{st:B.st,ci:B.ci,menu:B.menu,busy:B.busy,res:B.res,foes:B.foes.map(f=>f.k+':'+f.hp).join(',')}:null,pl,end};},
      api:{startBattle,command,GROUPS,get B(){return B;},party,pl},
      update(dt){t+=dt;flashT=Math.max(0,flashT-dt);party.forEach(u=>{u.flash=Math.max(0,u.flash-dt);u.lunge=Math.max(0,u.lunge-dt);});if(end)return;
        if(mode==='world'){inv-=dt;
          if(talk){if(KP.Space||KP.KeyE||KP.Enter||M.click){M.click=false;talk.i++;sfx('click');if(talk.i>=talk.lines.length)talk=null;}return;}
          let vx=(held('right')?1:0)-(held('left')?1:0),vy=(held('down')?1:0)-(held('up')?1:0);const l=Math.hypot(vx,vy)||1,sp=170*ctx.P.spd;pl.mv=vx||vy?1:0;if(vx)pl.face=vx;
          const nx=pl.x+vx/l*sp*dt,ny=pl.y+vy/l*sp*dt;if(!blocked(nx,pl.y))pl.x=nx;if(!blocked(pl.x,ny))pl.y=ny;
          if(KP.Space||KP.KeyE||KP.Enter)interactWorld();
          for(const g of GROUPS){if(!g.alive)continue;g.ph+=dt;const d=dist(g.x,g.y,pl.x,pl.y);
            if(d<170&&inv<=0){const a=ang(g.x,g.y,pl.x,pl.y);g.x+=Math.cos(a)*55*dt;g.y+=Math.sin(a)*55*dt;}else{g.x=g.ox+Math.sin(g.ph*.7)*40;g.y=g.oy+Math.cos(g.ph*.9)*25;}
            if(d<46&&inv<=0){startBattle(g);return;}}
          if(seals>=3&&dist(pl.x,pl.y,GATE.x,GATE.y+50)<50)startBattle('boss');
          return;}
        // бой
        const b=B;for(const f of b.foes){f.flash=Math.max(0,f.flash-dt);f.lunge=Math.max(0,f.lunge-dt);}
        if(b.res){b.resT+=dt;if(b.resT>(b.res===1?2.2:1.2)&&(b.res!==1||b.resT>3.2||M.click||KP.Space||KP.Enter)){M.click=false;endBattle();}return;}
        if(b.busy>0){b.busy-=dt;if(b.busy<=0&&b.after){const f=b.after;b.after=null;f();}return;}
        if(b.st==='enemy'){if(b.q.length){const f=b.q.shift();foeAct(f);b.busy=.75;b.after=()=>{checkEnd();};}else{b.turn++;nextMember(0);}return;}
        if(b.menu==='target'){if(KP.ArrowLeft||KP.KeyA||KP.ArrowUp||KP.KeyW)cycleTg(-1);if(KP.ArrowRight||KP.KeyD||KP.ArrowDown||KP.KeyS)cycleTg(1);
          if(KP.Enter||KP.Space){const f=b.pend;b.menu='main';f(b.foes[b.tg]);}
          for(const f of aliveF())if(M.click&&dist(M.x,M.y,f.x,f.y-50)<70){M.click=false;b.tg=b.foes.indexOf(f);const fn=b.pend;b.menu='main';fn(f);break;}}
        else for(let k=0;k<5;k++)if(KP['Digit'+(k+1)])command(k);
        if((M.rclick||KP.Backspace)&&b.menu!=='main'){M.rclick=false;b.menu='main';sfx('click');}},
      draw(g){
        if(mode==='world'){drawBG(g,'bg_dream',.6);g.fillStyle='rgba(10,30,20,.55)';g.fillRect(0,26,W,H);
          g.strokeStyle='rgba(255,230,150,.18)';g.lineWidth=36;g.beginPath();g.moveTo(480,H);g.lineTo(480,330);g.moveTo(140,200);g.lineTo(820,300);g.moveTo(480,250);g.lineTo(480,90);g.stroke();
          const gateOpen=seals>=3;glow(g,GATE.x,GATE.y+40,gateOpen?140:80,gateOpen?'rgba(200,80,255,.55)':'rgba(120,120,160,.25)');
          g.strokeStyle=gateOpen?'#d6f':'#667';g.lineWidth=6;g.beginPath();g.arc(GATE.x,GATE.y+70,58,Math.PI,0);g.stroke();
          if(gateOpen){g.fillStyle=`rgba(180,80,255,${.3+.2*Math.sin(t*4)})`;g.beginPath();g.arc(GATE.x,GATE.y+70,52,Math.PI,0);g.fill();}
          txt(g,gateOpen?'ВРАТА ВРЕМЕНИ ОТКРЫТЫ':'ВРАТА ВРЕМЕНИ · печати '+'●'.repeat(seals)+'○'.repeat(3-seals),GATE.x,GATE.y+92,{size:13,align:'center',color:gateOpen?'#e9f':'#99a'});
          for(const h of HOUSES){g.fillStyle='#1d1430';g.fillRect(h[0],h[1]+30,h[2],h[3]-30);g.fillStyle=h[4];g.globalAlpha=.85;g.beginPath();g.moveTo(h[0]-10,h[1]+34);g.lineTo(h[0]+h[2]/2,h[1]);g.lineTo(h[0]+h[2]+10,h[1]+34);g.fill();g.globalAlpha=1;
            for(let k=0;k<2;k++){g.fillStyle=Math.sin(t+k+h[0])>0?'#ffe066':'#553';g.fillRect(h[0]+20+k*(h[2]-56),h[1]+50,16,14);}}
          glow(g,FOUNT.x,FOUNT.y,90,'rgba(80,255,120,.25)');g.fillStyle='#2a4a3a';g.beginPath();g.ellipse(FOUNT.x,FOUNT.y,FOUNT.r,FOUNT.r*.55,0,0,7);g.fill();g.fillStyle='#5f5';g.globalAlpha=.6;g.beginPath();g.ellipse(FOUNT.x,FOUNT.y,FOUNT.r-8,FOUNT.r*.4,0,0,7);g.fill();g.globalAlpha=1;
          txt(g,'🥬',FOUNT.x,FOUNT.y-18+Math.sin(t*3)*4,{size:26,align:'center'});
          const ents=[...NPC.map(n=>({y:n.y,d:()=>{spr(g,n.img,n.x,n.y,{w:n.img==='admin'?90:70});if(dist(pl.x,pl.y,n.x,n.y)<80)txt(g,'E — говорить',n.x,n.y-(n.img==='admin'?118:70),{size:13,align:'center',color:'#ff0',stroke:'#000',sw:3});}})),
            ...GROUPS.filter(q=>q.alive).map(q=>({y:q.y,d:()=>{glow(g,q.x,q.y-20,50,'rgba(255,50,80,.3)');spr(g,q.f[0],q.x,q.y+Math.sin(q.ph*5)*2,{w:60,flip:pl.x>q.x});txt(g,q.n,q.x,q.y-72,{size:12,align:'center',color:'#f8a',stroke:'#000',sw:3});}})),
            {y:pl.y,d:()=>{if(inv>0&&Math.floor(t*10)%2)return;turtle(g,pl.x,pl.y,{scale:.3,dir:pl.face,anim:pl.mv?'walk':'idle',fps:pl.mv?12:8,visor:ctx.visor});spr(g,'cyber',pl.x-pl.face*56,pl.y+2,{w:66,flip:pl.face>0});}}];
          ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
          if(dist(pl.x,pl.y,FOUNT.x,FOUNT.y)<FOUNT.r+50)txt(g,'E — выпить капустного сока (лечение)',FOUNT.x,FOUNT.y+48,{size:13,align:'center',color:'#ff0',stroke:'#000',sw:3});
          panel(g,0,H-50,W,50,{fill:'rgba(6,2,22,.88)',r:0,blur:4});
          party.forEach((u,i)=>{const x=14+i*300;txt(g,`${u.n} ур.${lvl}`,x,H-30,{size:13,color:'#cff'});bar(g,x,H-22,130,7,u.hp/u.max,'#f36');bar(g,x+140,H-22,90,7,u.mp/u.mmax,'#39f');txt(g,`${Math.round(u.hp)}/${u.max}`,x+130,H-30,{size:11,align:'right',color:'#f8a'});});
          txt(g,`🥬×${cab}  ·  XP ${xp}/${lvl*30}  ·  Печати ${seals}/3`,W-14,H-20,{size:14,align:'right',color:'#ffe066'});
          if(talk){const ln=talk.lines[talk.i];panel(g,60,H-210,W-120,150,{fill:'rgba(5,0,20,.95)',stroke:'#ffe066'});txt(g,talk.who,84,H-180,{size:17,color:'#ffe066'});
            if(talk.npc&&talk.npc.img==='admin'){wrapText(g,ln[0],84,H-150,W-170,24,{size:20});txt(g,ln[2],84,H-118,{size:14,color:'#c9b8ff',bold:false});wrapText(g,G.run.translator?'(перевод: '+ln[1]+')':'(без переводчика непонятно, но жесты говорят сами за себя)',84,H-96,W-170,17,{size:13,color:'#9ff',bold:false});}
            else wrapText(g,ln[1]||ln[0],84,H-150,W-170,24,{size:18});txt(g,'▼ E / пробел',W-80,H-74,{size:12,align:'right',color:'#9cf'});}
          if(flashT>0){g.fillStyle=`rgba(255,255,255,${flashT})`;g.fillRect(0,0,W,H);}
          return;}
        // бой
        const b=B;drawBG(g,b.boss?'bg_space':'bg_dream',.55);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,0,W,H);
        g.strokeStyle='rgba(39,243,255,.12)';for(let k=0;k<12;k++){const y=360+k*k*2.4;g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
        for(const f of b.foes){if(f.hp<=0)continue;const lx=f.lunge>0?Math.sin(f.lunge/.35*Math.PI)*40:0,sel=b.menu==='target'&&b.foes[b.tg]===f;
          if(f.k==='boss'){glow(g,f.x+lx,f.y-120,200+Math.sin(t*3)*20,f.charge?'rgba(255,60,60,.5)':'rgba(170,60,255,.4)');for(let k=0;k<3;k++){g.strokeStyle=`rgba(200,120,255,${.3-k*.08})`;g.lineWidth=3;g.beginPath();g.arc(f.x,f.y-120,140+k*30+Math.sin(t*2+k)*10,t+k,t+k+4);g.stroke();}}
          if(sel){g.strokeStyle='#ff0';g.lineWidth=3;g.beginPath();g.ellipse(f.x,f.y,f.b.w*.45,f.b.w*.12,0,0,7);g.stroke();txt(g,'▼',f.x,f.y-(f.k==='boss'?260:f.b.w+10),{size:22,align:'center',color:'#ff0'});}
          spr(g,f.b.img||f.k,f.x+lx,f.y+(f.k==='ghost'||f.k==='drone'?Math.sin(t*3)*6-10:0),{w:f.b.w,flip:true,flash:f.flash*4,sy:1+Math.sin(t*2+f.x)*.02});
          if(f.stun)txt(g,'💫',f.x,f.y-f.b.w*.9,{size:22,align:'center'});
          txt(g,f.n,f.x,f.y+22,{size:13,align:'center',color:'#f8a',stroke:'#000',sw:3});bar(g,f.x-50,f.y+28,100,6,f.hp/f.max,'#f36');}
        party.forEach((u,i)=>{const lx=u.lunge>0?-Math.sin(u.lunge/.35*Math.PI)*50:0,cur=b.st==='cmd'&&b.ci===i&&!b.res;if(cur)glow(g,u.x,u.y-30,90,'rgba(255,255,120,.3)');
          if(u.cyber)spr(g,'cyber',u.x+lx,u.y+4,{w:170,flash:u.flash*4,alpha:u.hp>0?1:.35});else turtle(g,u.x+lx,u.y,{scale:.5,dir:-1,anim:u.hp<=0||u.defd?'hide':u.lunge>0?'attack':'idle',flash:u.flash*4,visor:ctx.visor});
          if(u.defd&&u.hp>0)glow(g,u.x,u.y-30,70,'rgba(80,180,255,.4)');if(u.stun)txt(g,'💫',u.x,u.y-110,{size:22,align:'center'});});
        PFX.draw(g);
        panel(g,W/2-330,34,660,40,{fill:'rgba(5,0,20,.85)',r:8,blur:4});txt(g,b.log,W/2,60,{size:16,align:'center',color:'#fff'});
        panel(g,0,H-130,W,130,{fill:'rgba(6,2,22,.94)',r:0,blur:4});
        party.forEach((u,i)=>{const y=H-112+i*54;txt(g,(b.ci===i&&b.st==='cmd'?'▶ ':'')+u.n,16,y+14,{size:15,color:u.hp>0?'#fff':'#777'});bar(g,16,y+22,180,8,u.hp/u.max,'#f36');bar(g,16,y+34,180,6,u.mp/u.mmax,'#39f');
          txt(g,`${Math.round(u.hp)}/${u.max} ❤  ${u.mp}/${u.mmax} ПП`,204,y+32,{size:12,color:'#cff'});});
        if(b.st==='cmd'&&!b.res&&b.busy<=0){const u=party[b.ci],x0=380;
          if(b.menu==='main'){const C=['⚔ Атака','✨ Навыки','🛡 Панцирь','🥬 Капуста ×'+cab,b.boss?'':'🏃 Бежать'];C.forEach((c,k)=>{if(!c)return;if(button(g,x0+(k%3)*192,H-118+Math.floor(k/3)*56,184,48,`${k+1} ${c}`,{size:15,disabled:k===3&&cab<=0}))command(k);});}
          else if(b.menu==='skill'){u.sk.forEach((s,k)=>{const S=SK[s];if(button(g,x0+(k%2)*288,H-118+Math.floor(k/2)*56,280,48,'',{disabled:u.mp<S.mp}))command(k);
              txt(g,`${k+1} ${S.n}`,x0+(k%2)*288+12,H-98+Math.floor(k/2)*56,{size:14,color:'#fff'});txt(g,`${S.mp} ПП · ${S.d}`,x0+(k%2)*288+12,H-80+Math.floor(k/2)*56,{size:12,color:'#9cf'});});
            txt(g,'ПКМ / Backspace — назад',W-14,H-10,{size:11,align:'right',color:'#789'});}
          else{txt(g,'Выбери цель: ←/→ и Enter или щёлкни по врагу',x0+10,H-80,{size:16,color:'#ff0'});txt(g,'ПКМ / Backspace — назад',x0+10,H-54,{size:12,color:'#789'});}}
        if(b.res){const s=b.res===1?(b.boss?'УЛИТКА ВРЕМЕНИ ПОВЕРЖЕНА!':'ПОБЕДА!'):b.res===2?'ПОРАЖЕНИЕ':'СБЕЖАЛИ!';
          txt(g,s,W/2,200,{size:52,align:'center',color:b.res===2?'#f55':'#ffe066',glow:'#f0f',font:FONTB});if(b.res===1&&!b.boss){txt(g,`+${b.foes.reduce((s,f)=>s+f.b.xp,0)} опыта · печать получена!`,W/2,240,{size:18,align:'center',color:'#fff'});if(lvMsg)txt(g,lvMsg,W/2,270,{size:16,align:'center',color:'#7f7'});}}
        if(flashT>0){g.fillStyle=`rgba(255,255,255,${flashT})`;g.fillRect(0,0,W,H);}
      }};
  }};
