'use strict';
/* СТРАТЕГИЯ В РЕАЛЬНОМ ВРЕМЕНИ — «Капустные войны» */
SONGS.war={bpm:112,root:38,prog:[0,0,-2,-4],drums:'four',bass:'off',arp:2,pad:1,hats:1,lead:[0,null,3,null,7,null,3,null,10,null,7,null,5,null,3,null,0,null,3,null,7,null,12,null,10,null,7,null,3,null,null,null]};
MODES.rts={genre:'Стратегия в реальном времени',title:'Капустные войны',icon:'⚔️',music:'war',bg:'bg_ruins',
  goal:'Корпорация «Заяц» захватила капустные поля. Рабочие черепашки собирают капусту, на неё нанимай армию и снеси Заячью Башню. Береги своё Гнездо!',
  controls:['ЛКМ / рамка — выбрать · ПКМ (или ЛКМ по земле) — идти / атаковать / собирать','1-4 — нанять · 5 — улучшение · Q — вся армия · Пробел — армия в атаку'],
  create(ctx){
    const D=ctx.D,P=ctx.P,F=ctx.F,TOP=34,BOT=466,ED=.85+.15*D;
    const UT={worker:{n:'Рабочий',ic:'🧺',cost:50,hp:45,dmg:4,rng:24,rate:1,spd:74,sz:.13,bt:2.5},
      warrior:{n:'Боец',ic:'🛡',cost:75,hp:150,dmg:14,rng:28,rate:.8,spd:62,sz:.17,bt:3.5},
      archer:{n:'Стрелок',ic:'🏹',cost:100,hp:70,dmg:12,rng:150,rate:1.1,spd:60,sz:.15,bt:4.5,proj:1},
      cyber:{n:'Кибер',ic:'🤖',cost:220,hp:340,dmg:28,rng:115,rate:1.5,spd:50,w:58,bt:7,proj:1,splash:48},
      hare:{hp:60,dmg:8,rng:24,rate:.6,spd:105,w:36},crab:{hp:190,dmg:15,rng:28,rate:1,spd:55,w:46},
      snail:{hp:110,dmg:10,rng:130,rate:1.6,spd:40,w:44,proj:1},drone:{hp:70,dmg:7,rng:120,rate:.9,spd:85,w:40,proj:1,fly:1}};
    const ORD=['worker','warrior','archer','cyber'];
    const bonus={hp:1,dmg:1,spd:1};
    const UPG=[{n:'Титановые панцири',ic:'🛡',cost:150,f:()=>{bonus.hp*=1.35;for(const u of units)if(u.side===0){u.max*=1.35;u.hp*=1.35;}}},
      {n:'Острые клювы',ic:'⚔',cost:180,f:()=>bonus.dmg*=1.3},{n:'Реактивные лапки',ic:'💨',cost:150,f:()=>bonus.spd*=1.25}];
    const nest={x:82,y:250,hp:1100+150*P.hp,side:0,r:46,cd:0,bld:1,flash:0},tower={x:880,y:250,hp:1400*(.7+.3*D),side:1,r:44,cd:0,bld:1,flash:0};
    nest.max=nest.hp;tower.max=tower.hp;
    const fields=[[230,110],[230,400],[480,92],[480,412],[470,250],[720,110],[720,400]].map(([x,y],i)=>({x,y,left:i===4?600:350,max:i===4?600:350}));
    const rocks=[[360,175,26],[360,330,30],[600,175,28],[600,330,24],[150,165,18],[810,350,20]].map(([x,y,r])=>({x,y,r}));
    const units=[],shots=[],pings=[];
    let cab=Math.round(200*(F.rich?1.4:1)),t=0,queue=[],bt=0,sel=[],drag=null,end=0,spT=9,wave=0,waveT=80,msg='',msgT=0,kills=0,lost=0,upl=0;
    const alive=u=>u&&u.hp>0;
    function add(type,side,x,y){const b=UT[type];const u={type,side,x,y,b,hp:b.hp*(side?ED:bonus.hp*(1+.1*P.hp)),st:'idle',tx:x,ty:y,tg:null,cd:0,face:side?-1:1,mv:0,atk:0,carry:0,hv:0,field:null,flash:0,ph:rnd(6)};u.max=u.hp;units.push(u);return u;}
    for(let i=0;i<3;i++)add('worker',0,nest.x+46,nest.y-30+i*30).st='gather';
    add('warrior',0,nest.x+80,nest.y-20);add('warrior',0,nest.x+80,nest.y+20);add('hare',1,tower.x-70,tower.y-20);add('hare',1,tower.x-70,tower.y+20);
    const note=s=>{msg=s;msgT=3;};
    const mine=()=>units.filter(u=>u.side===0&&alive(u));
    const canHire=k=>cab>=UT[k].cost&&queue.length<5&&mine().length+queue.length<36;
    function hire(k){if(!canHire(k)){sfx('miss');return;}cab-=UT[k].cost;queue.push(k);sfx('click');}
    function upgrade(){const u=UPG[upl];if(!u||cab<u.cost){sfx('miss');return;}cab-=u.cost;u.f();upl++;sfx('power');note('Улучшение: '+u.n+'!');}
    function nearestField(x,y){let best=null,bd=1e9;for(const f of fields){if(f.left<=0)continue;const d=dist(x,y,f.x,f.y);if(d<bd){bd=d;best=f;}}return best;}
    function enemyAt(x,y){for(const u of units)if(u.side===1&&alive(u)&&dist(x,y,u.x,u.y-12)<24)return u;return dist(x,y,tower.x,tower.y-20)<tower.r+14?tower:null;}
    function findTarget(u,r){let best=null,bd=r;for(const o of units){if(o.side===u.side||!alive(o))continue;const d=dist(u.x,u.y,o.x,o.y);if(d<bd){bd=d;best=o;}}
      const b=u.side?nest:tower;if(!best&&dist(u.x,u.y,b.x,b.y)-b.r<r)best=b;return best;}
    function hurt(o,a){if(o.hp<=0||end)return;if(o.side===0)a/=P.def;o.hp-=a;o.flash=.12;
      if(o.hp>0)return;
      if(o.bld){end=1;o===tower?winG():loseG();return;}
      PFX.burst(o.x,o.y-10,12,o.side?['#f55','#fa0','#fff']:['#5f5','#ff0','#fff'],180,.5,4);
      if(o.side===1){kills++;cab+=5;if(Math.random()<.3)ctx.addLikes(2);sfx('hit');}else{lost++;sfx('hurt');}}
    const dmgOf=u=>u.b.dmg*(u.side?ED:bonus.dmg*P.atk);
    function fire(u,tg){if(u.b.proj){shots.push({x:u.x,y:u.y-14,tg,side:u.side,dmg:dmgOf(u),spd:420,splash:u.b.splash||0,kind:u.side?(u.type==='drone'?'laser':'slime'):u.type});AU.tone(u.side?300:700,.04,'square',.03,u.side?200:900);}
      else{hurt(tg,dmgOf(u));AU.noise(.03,.05,1500);PFX.burst(tg.x,tg.y-12,3,'#fff',90,.2,3);}}
    function moveTo(u,x,y,spd,dt){const a=ang(u.x,u.y,x,y);u.x+=Math.cos(a)*spd*dt;u.y+=Math.sin(a)*spd*dt;u.face=Math.cos(a)>0?1:-1;u.mv=1;}
    function order(x,y){sel=sel.filter(alive);if(!sel.length)return;const e=enemyAt(x,y),fld=fields.find(f=>f.left>0&&dist(x,y,f.x,f.y)<44);const cols=Math.ceil(Math.sqrt(sel.length));
      sel.forEach((u,i)=>{u.tg=null;if(e){u.st='attack';u.tg=e;}else if(fld&&u.type==='worker'){u.st='gather';u.field=fld;}
        else{u.st='move';u.tx=clamp(x+((i%cols)-(cols-1)/2)*26,16,W-16);u.ty=clamp(y+(Math.floor(i/cols)-(cols-1)/2)*24,TOP+10,BOT-6);}});
      pings.push({x,y,t:.5,c:e?'#f44':fld?'#ff0':'#5f5'});sfx('click');}
    function winG(){sfx('explode');shake(18);PFX.burst(tower.x,tower.y-40,90,['#f0f','#0ff','#ff0','#fff'],420,1.2,7);MUS.stop();const r=nest.hp/nest.max;
      setTimeout(()=>ctx.win({stars:r>.6&&t<330?3:r>.3?2:1,text:`Заячья Башня пала за ${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}! Зайцев повержено: ${kills}, черепах потеряно: ${lost}. Капустные поля снова наши. Черепаха.`}),1500);}
    function loseG(){sfx('explode');shake(18);PFX.burst(nest.x,nest.y,70,['#5f5','#ff0','#fff'],380,1.1,6);MUS.stop();
      setTimeout(()=>ctx.lose({text:'Гнездо разрушено. Зайцы открыли на его месте коворкинг «Морковь 3000». Черепахи в шоке.'}),1300);}
    function drawNest(g){const b=nest;glow(g,b.x,b.y,110,'rgba(60,255,120,.25)');g.save();g.strokeStyle='#5f5';g.shadowColor='#5f5';g.shadowBlur=16;g.lineWidth=3;g.fillStyle='rgba(10,60,30,.85)';
      g.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;g.lineTo(b.x+Math.cos(a)*50,b.y+12+Math.sin(a)*28);}g.closePath();g.fill();g.stroke();g.restore();
      spr(g,'shell',b.x,b.y+14,{w:96,flash:b.flash*6});turtle(g,b.x+4,b.y-22,{scale:.2,anim:'idle',dir:1,shadow:false});
      txt(g,'ГНЕЗДО',b.x,b.y+56,{size:12,align:'center',color:'#9f9'});bar(g,b.x-45,b.y-62,90,7,b.hp/b.max,'#5f5');}
    function drawTower(g){const b=tower;glow(g,b.x,b.y-30,120,'rgba(255,60,90,.25)');g.save();g.shadowColor='#f36';g.shadowBlur=18;g.fillStyle=b.flash>0?'#fff':'#2a0a1e';g.strokeStyle='#f36';g.lineWidth=3;
      g.fillRect(b.x-30,b.y-90,60,120);g.strokeRect(b.x-30,b.y-90,60,120);g.restore();
      for(let i=0;i<4;i++)for(let j=0;j<2;j++){g.fillStyle=(Math.floor(t*2+i+j)%3)?'#ff5fa8':'#5a1440';g.fillRect(b.x-20+j*24,b.y-78+i*24,16,12);}
      spr(g,'hare',b.x,b.y-86,{w:56,flash:b.flash*6});txt(g,'ЗАЯЦ CORP',b.x,b.y+48,{size:12,align:'center',color:'#f8a'});bar(g,b.x-45,b.y-160,90,7,b.hp/b.max,'#f36');}
    return{get dbg(){return{t,cab,units,upl,nest:nest.hp,tower:tower.hp,wave,kills,lost};},
      update(dt){
        msgT-=dt;for(const p of pings)p.t-=dt;for(let i=pings.length-1;i>=0;i--)if(pings[i].t<=0)pings.splice(i,1);
        if(end){t+=dt;return;}t+=dt;
        for(let i=0;i<4;i++)if(KP['Digit'+(i+1)])hire(ORD[i]);if(KP.Digit5)upgrade();
        if(KP.KeyQ){sel=mine().filter(u=>u.type!=='worker');sfx('select');}
        if(KP.Space){const army=mine().filter(u=>u.type!=='worker');army.forEach(u=>{u.st='amove';u.tg=null;u.tx=tower.x-40+rnd(-20,20);u.ty=tower.y+rnd(-50,50);});if(army.length){note('ЧЕРЕПАХИ, В АТАКУ!');sfx('alarm');}}
        // мышь
        if(M.click&&M.y<BOT&&M.y>TOP-8){drag={x:M.x,y:M.y,x2:M.x,y2:M.y};M.click=false;}
        if(drag){drag.x2=M.x;drag.y2=M.y;if(!M.down){const x0=Math.min(drag.x,drag.x2),x1=Math.max(drag.x,drag.x2),y0=Math.min(drag.y,drag.y2),y1=Math.max(drag.y,drag.y2);
          if(x1-x0<10&&y1-y0<10){const u=mine().find(u=>dist(M.x,M.y,u.x,u.y-10)<20);if(u){sel=[u];sfx('select');}else if(sel.length)order(M.x,M.y);}
          else{sel=mine().filter(u=>u.x>=x0&&u.x<=x1&&u.y-8>=y0&&u.y-8<=y1);if(sel.length)sfx('select');}drag=null;}}
        if(M.rclick&&M.y<BOT){M.rclick=false;order(M.x,M.y);}
        // производство
        if(queue.length){bt+=dt;const k=queue[0];if(bt>=UT[k].bt){bt=0;queue.shift();const u=add(k,0,nest.x+52,nest.y+rnd(-30,30));
          if(k==='worker')u.st='gather';else{u.st='move';u.tx=nest.x+115+rnd(-25,25);u.ty=nest.y+rnd(-80,80);}sfx('ok');PFX.burst(u.x,u.y-10,10,'#5f5',120,.4,3);}}else bt=0;
        // ИИ зайцев
        spT-=dt;if(spT<=0){spT=Math.max(3.6,12-t/30)/ED;const pool=t<60?['hare','hare','crab']:t<160?['hare','crab','snail','drone']:['hare','crab','snail','drone','crab'];
          if(units.filter(u=>u.side===1).length<34)add(pick(pool),1,tower.x-56,tower.y+rnd(-55,55));}
        waveT-=dt;if(waveT<=0){wave++;waveT=Math.max(32,60-wave*3);const idle=units.filter(u=>u.side===1&&alive(u)&&u.st==='idle');
          const n=Math.ceil(idle.length*.75);idle.slice(0,n).forEach(u=>{u.st='amove';u.tx=nest.x+30;u.ty=nest.y+rnd(-40,40);u.tg=null;});
          if(n){note(`⚠ ВОЛНА ЗАЙЦЕВ #${wave}: ${n} шт.!`);sfx('alarm');}}
        // юниты
        for(const u of units){if(!alive(u))continue;const b=u.b;u.cd-=dt;u.flash=Math.max(0,u.flash-dt);u.atk=Math.max(0,u.atk-dt);u.ph+=dt;u.mv=0;
          const spd=b.spd*(u.side?(.9+.1*D):bonus.spd*P.spd);
          if(u.st==='gather'){
            if(u.carry>0){if(dist(u.x,u.y,nest.x,nest.y)>nest.r+6)moveTo(u,nest.x,nest.y,spd,dt);else{cab+=u.carry;PFX.text(nest.x+rnd(-20,20),nest.y-40,'+'+u.carry+'🥬','#9f5',13);u.carry=0;}}
            else{if(!u.field||u.field.left<=0)u.field=nearestField(u.x,u.y);if(!u.field)u.st='idle';
              else if(dist(u.x,u.y,u.field.x,u.field.y)>24)moveTo(u,u.field.x,u.field.y,spd,dt);else{u.hv+=dt;u.atk=.2;if(u.hv>=1.2){u.hv=0;const a=Math.min(12,u.field.left);u.field.left-=a;u.carry=a;}}}
            continue;}
          if(u.tg&&!alive(u.tg)){u.tg=null;if(u.st==='attack')u.st='idle';}
          if((u.st==='idle'&&u.type!=='worker'||u.st==='amove')&&!u.tg)u.tg=findTarget(u,b.rng+(u.side?150:110));
          if(u.tg&&u.st!=='move'){const tg=u.tg,d=dist(u.x,u.y,tg.x,tg.y)-(tg.bld?tg.r:6);
            if(d>b.rng)moveTo(u,tg.x,tg.y,spd,dt);else{u.face=tg.x>u.x?1:-1;if(u.cd<=0){u.cd=b.rate;u.atk=.3;fire(u,tg);}}}
          else if(u.st==='move'||u.st==='amove'){if(dist(u.x,u.y,u.tx,u.ty)>6)moveTo(u,u.tx,u.ty,spd,dt);else u.st='idle';}}
        // столкновения
        for(let i=0;i<units.length;i++){const a=units[i];if(!alive(a))continue;
          for(let j=i+1;j<units.length;j++){const c=units[j];if(!alive(c)||a.b.fly!==c.b.fly)continue;const dx=c.x-a.x,dy=c.y-a.y;if(Math.abs(dx)>24||Math.abs(dy)>24)continue;const d=Math.hypot(dx,dy)||.1;if(d<22){const k=(22-d)/d*.5;a.x-=dx*k;a.y-=dy*k;c.x+=dx*k;c.y+=dy*k;}}
          if(!a.b.fly){for(const r of rocks){const d=dist(a.x,a.y,r.x,r.y);if(d<r.r+8){const k=(r.r+8)/(d||.1);a.x=r.x+(a.x-r.x)*k;a.y=r.y+(a.y-r.y)*k;}}
            for(const bd of [nest,tower]){const d=dist(a.x,a.y,bd.x,bd.y);if(d<bd.r-6){const k=(bd.r-6)/(d||.1);a.x=bd.x+(a.x-bd.x)*k;a.y=bd.y+(a.y-bd.y)*k;}}}
          a.x=clamp(a.x,12,W-12);a.y=clamp(a.y,TOP+12,BOT-4);}
        for(let i=units.length-1;i>=0;i--)if(!alive(units[i]))units.splice(i,1);sel=sel.filter(alive);
        // здания стреляют
        for(const bd of [nest,tower]){bd.cd-=dt;bd.flash=Math.max(0,bd.flash-dt);if(bd.cd>0)continue;const tg=findTarget({x:bd.x,y:bd.y,side:bd.side},bd===nest?175:175);
          if(tg&&!tg.bld){bd.cd=bd===nest?.8:1;shots.push({x:bd.x,y:bd.y-(bd===nest?30:80),tg,side:bd.side,dmg:bd===nest?24:15*ED,spd:400,splash:0,kind:bd===nest?'archer':'laser'});}}
        for(const s of shots){if(!alive(s.tg)){s.dead=1;continue;}const tx=s.tg.x,ty=s.tg.y-(s.tg.bld?20:12),d=dist(s.x,s.y,tx,ty);
          if(d<12){s.dead=1;hurt(s.tg,s.dmg);if(s.splash){PFX.burst(tx,ty,18,['#0ff','#fff','#f0f'],200,.4,5);for(const o of units)if(o.side!==s.side&&o!==s.tg&&alive(o)&&dist(o.x,o.y,tx,ty)<s.splash)hurt(o,s.dmg*.5);}}
          else{const a=ang(s.x,s.y,tx,ty);s.x+=Math.cos(a)*s.spd*dt;s.y+=Math.sin(a)*s.spd*dt;s.a=a;}}
        for(let i=shots.length-1;i>=0;i--)if(shots[i].dead)shots.splice(i,1);
      },
      draw(g){
        drawBG(g,'bg_ruins',.74);
        g.strokeStyle='rgba(39,243,255,.07)';g.lineWidth=1;for(let x=0;x<=W;x+=40){g.beginPath();g.moveTo(x,TOP);g.lineTo(x,BOT);g.stroke();}for(let y=TOP;y<=BOT;y+=40){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
        for(const f of fields){const k=f.left/f.max;g.save();g.fillStyle=`rgba(60,200,80,${.1+.22*k})`;g.strokeStyle=`rgba(120,255,140,${.2+.4*k})`;g.beginPath();g.ellipse(f.x,f.y,50,30,0,0,7);g.fill();g.stroke();g.restore();
          const n=Math.ceil(k*7);for(let i=0;i<n;i++)txt(g,'🥬',f.x-30+(i*23)%62,f.y-6+(i*13)%26,{size:16,align:'center'});if(f.left<=0)txt(g,'пусто',f.x,f.y+4,{size:12,align:'center',color:'#888'});}
        for(const r of rocks){g.fillStyle='#2b2738';g.strokeStyle='#5a5470';g.lineWidth=2;g.beginPath();g.arc(r.x,r.y,r.r,0,7);g.fill();g.stroke();g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.arc(r.x-r.r*.3,r.y-r.r*.3,r.r*.4,0,7);g.fill();}
        drawNest(g);drawTower(g);
        for(const u of units){if(u.b.fly)continue;g.strokeStyle=u.side?'rgba(255,70,90,.5)':sel.includes(u)?'#7f7':'rgba(80,255,120,.3)';g.lineWidth=sel.includes(u)?2.5:1.5;g.beginPath();g.ellipse(u.x,u.y,u.type==='cyber'?24:15,u.type==='cyber'?9:6,0,0,7);g.stroke();}
        units.slice().sort((a,b)=>a.y-b.y).forEach(u=>{const b=u.b;
          if(u.side===0){if(u.type==='cyber')spr(g,'cyber',u.x,u.y+3,{w:58,flip:u.face>0,flash:u.flash*8});
            else turtle(g,u.x,u.y+2,{scale:b.sz,dir:u.face,anim:u.atk>0?'attack':u.mv?'walk':'idle',fps:u.mv?13:8,t:TIME+u.ph,flash:u.flash*8,shadow:false,visor:ctx.visor});
            if(u.type!=='worker')txt(g,b.ic,u.x,u.y-24,{size:11,align:'center'});if(u.carry)txt(g,'🥬',u.x,u.y-22,{size:12,align:'center'});}
          else{const fy=b.fly?-16+Math.sin(u.ph*4)*3:0;if(b.fly){g.fillStyle='rgba(0,0,0,.3)';g.beginPath();g.ellipse(u.x,u.y,12,4,0,0,7);g.fill();if(sel.includes(u)){} }
            spr(g,u.type,u.x,u.y+2+fy,{w:b.w,flip:u.face>0,flash:u.flash*8});}
          if(u.hp<u.max)bar(g,u.x-14,u.y-(u.type==='cyber'?44:34),28,4,u.hp/u.max,u.side?'#f55':'#5f5');});
        for(const s of shots){if(s.kind==='slime'){g.fillStyle='#b5ff3a';g.beginPath();g.arc(s.x,s.y,4,0,7);g.fill();}
          else if(s.kind==='laser'){neonLine(g,s.x,s.y,s.x-Math.cos(s.a||0)*14,s.y-Math.sin(s.a||0)*14,'#ff3d6e',3);}
          else if(s.kind==='cyber'){glow(g,s.x,s.y,16,'rgba(40,240,255,.9)');}
          else spr(g,'shell',s.x,s.y,{w:14,ay:.5,rot:TIME*20});}
        for(const p of pings){g.strokeStyle=p.c;g.lineWidth=2;g.globalAlpha=p.t*2;g.beginPath();g.arc(p.x,p.y,(0.5-p.t)*40+6,0,7);g.stroke();g.globalAlpha=1;}
        if(drag&&(Math.abs(drag.x2-drag.x)>9||Math.abs(drag.y2-drag.y)>9)){g.save();g.strokeStyle='#7f7';g.setLineDash([5,4]);g.fillStyle='rgba(80,255,120,.08)';g.fillRect(drag.x,drag.y,drag.x2-drag.x,drag.y2-drag.y);g.strokeRect(drag.x,drag.y,drag.x2-drag.x,drag.y2-drag.y);g.restore();}
        PFX.draw(g);
        if(msgT>0)txt(g,msg,W/2,62,{size:22,align:'center',color:'#ffe066',stroke:'#000',sw:5,alpha:Math.min(1,msgT)});
        if(t<12&&!sel.length)txt(g,'Выдели черепах рамкой и щёлкни по зайцу или Башне →',W/2,BOT-14,{size:15,align:'center',color:'#cff',stroke:'#000',sw:4,alpha:.6+.4*Math.sin(t*4)});
        // HUD
        panel(g,0,BOT+2,W,H-BOT-2,{fill:'rgba(6,2,22,.92)',stroke:'#27f3ff',r:0,blur:6});
        txt(g,'🥬 '+Math.floor(cab),16,BOT+32,{size:24,color:'#9f5',font:FONTB});txt(g,`👥 ${mine().length}/36`,16,BOT+58,{size:14,color:'#cff'});
        ORD.forEach((k,i)=>{const b=UT[k],x=150+i*134,y=BOT+8;if(button(g,x,y,126,58,'',{disabled:!canHire(k)}))hire(k);
          txt(g,`${i+1}  ${b.ic} ${b.n}`,x+8,y+22,{size:14,color:'#fff'});txt(g,`${b.cost} 🥬`,x+8,y+44,{size:14,color:cab>=b.cost?'#9f5':'#a66'});
          const q=queue.filter(z=>z===k).length;if(q)txt(g,'×'+q,x+118,y+44,{size:14,align:'right',color:'#ff0'});if(queue[0]===k)bar(g,x+4,y+50,118,4,bt/b.bt,'#ff0');});
        const u=UPG[upl],ux=150+4*134;if(u){if(button(g,ux,BOT+8,150,58,'',{disabled:cab<u.cost}))upgrade();txt(g,`5  ${u.ic} ${u.n}`,ux+8,BOT+30,{size:13,color:'#fff'});txt(g,`${u.cost} 🥬`,ux+8,BOT+52,{size:14,color:cab>=u.cost?'#9f5':'#a66'});}
        else txt(g,'⭐ Все улучшения',ux+10,BOT+42,{size:14,color:'#ff0'});
        txt(g,`Волна через ${Math.ceil(waveT)}с`,W-12,BOT+28,{size:14,align:'right',color:'#f8a'});txt(g,sel.length?`Выбрано: ${sel.length}`:'Q — вся армия',W-12,BOT+52,{size:13,align:'right',color:'#9f9'});
      }};
  }};
