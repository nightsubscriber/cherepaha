'use strict';
/* РОГАЛИК — «Подземелье 9278»: пошаговый данжен с перманентной смертью */
SONGS.dungeon={bpm:84,root:33,prog:[0,1,0,-2],drums:'half',bass:'long',arp:4,pad:1,hats:0,lead:[0,null,null,1,null,null,3,null,null,null,1,null,0,null,null,null,7,null,null,6,null,null,3,null,null,null,1,null,0,null,null,null]};
MODES.roguelike={genre:'Roguelike',title:'Подземелье 9278',icon:'💀',music:'dungeon',bg:'bg_ruins',
  goal:'Под календарём — бесконечное подземелье. Три этажа, каждый генерируется заново. Найди лестницу ▼, на 3-м этаже победи Краба-Императора. Смерть — навсегда (ну, до следующей попытки).',
  controls:['Стрелки / WASD — шаг (в монстра — атака) · Пробел — ждать (лечит) · 1-6 — предмет','Ход делаешь ты, потом монстры. Зелья не опознаны: пей на свой страх и риск'],
  create(ctx){
    const D=ctx.D,P=ctx.P,F=ctx.F,MW=46,MH=30,TS=32,VY=26,VH=H-26-92;
    const PCOL=['Мутное','Бурлящее','Светящееся','Липкое','Пахнущее капустой','Мерцающее'];
    const PEFF=shuffle(['heal','str','tele','poison','shell','sight']),PN={heal:'Зелье лечения',str:'Зелье силы',tele:'Зелье телепорта',poison:'Ядовитое зелье',shell:'Зелье панциря',sight:'Зелье ясновидения'};
    const known={};const ET={snail:{n:'Улитка',hp:14,atk:3,xp:4,slow:1},hare:{n:'Заяц',hp:8,atk:2,xp:4,fast:1},ghost:{n:'Призрак',hp:7,atk:2,xp:5,wall:1},
      crab:{n:'Краб',hp:20,atk:4,def:1,xp:8},drone:{n:'Дрон',hp:10,atk:3,xp:7,shoot:1},boss:{n:'Краб-Император',hp:55,atk:6,def:2,xp:60,img:'crab',w:62,boss:1}};
    const p={x:0,y:0,rx:0,ry:0,hp:40+6*P.hp,atk:5,def:0,lvl:1,xp:0,face:1,bump:0,shell:0,flash:0};p.max=p.hp;
    let map,seen,vis,mons,items,floor=1,turn=0,log=[],inv=[],t=0,end=0,kills=0,rep=0,portal=null,deathBy='';
    const A=(x,y)=>y*MW+x,wall=(x,y)=>x<0||y<0||x>=MW||y>=MH||map[A(x,y)]===0;
    const msg=(s,c='#fff')=>{log.unshift({s,c,t:0});if(log.length>4)log.pop();};
    function gen(){map=new Uint8Array(MW*MH);seen=new Uint8Array(MW*MH);vis=new Uint8Array(MW*MH);mons=[];items=[];portal=null;const rooms=[];
      for(let k=0;k<300&&rooms.length<11;k++){const w=rndi(5,10),h=rndi(4,7),x=rndi(1,MW-w-2),y=rndi(1,MH-h-2);
        if(rooms.some(r=>x<r.x+r.w+2&&x+w+2>r.x&&y<r.y+r.h+2&&y+h+2>r.y))continue;rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)});for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)map[A(xx,yy)]=1;}
      rooms.sort((a,b)=>a.cx-b.cx);
      const carve=(a,b)=>{let x=a.cx,y=a.cy;const hf=Math.random()<.5;while(hf?x!==b.cx:y!==b.cy){map[A(x,y)]=1;hf?x+=Math.sign(b.cx-x):y+=Math.sign(b.cy-y);}while(x!==b.cx||y!==b.cy){map[A(x,y)]=1;x!==b.cx?x+=Math.sign(b.cx-x):y+=Math.sign(b.cy-y);}map[A(x,y)]=1;};
      for(let i=1;i<rooms.length;i++)carve(rooms[i-1],rooms[i]);for(let k=0;k<3;k++)carve(pick(rooms),pick(rooms));
      const r0=rooms[0],rl=rooms[rooms.length-1];p.x=p.rx=r0.cx;p.y=p.ry=r0.cy;
      const free=(r)=>{for(let k=0;k<30;k++){const x=rndi(r.x,r.x+r.w-1),y=rndi(r.y,r.y+r.h-1);if(map[A(x,y)]===1&&!mons.some(m=>m.x===x&&m.y===y)&&!items.some(i=>i.x===x&&i.y===y)&&!(x===p.x&&y===p.y))return[x,y];}return null;};
      if(floor<3)map[A(rl.cx,rl.cy)]=2;else addMon('boss',rl.cx,rl.cy);
      const pool=floor===1?['snail','hare','ghost','snail']:floor===2?['snail','hare','ghost','crab','drone']:['hare','crab','drone','ghost','snail'];
      const nm=Math.round((4+floor*2)*(.8+.2*D));for(let k=0;k<nm;k++){const r=rooms[rndi(1,rooms.length-1)],c=free(r);if(c)addMon(pick(pool),c[0],c[1]);}
      const ip=['cab','cab','pot','pot','pot','scroll','weapon','armor','likes'];const ni=6+(F.rich?2:0);for(let k=0;k<ni;k++){const r=pick(rooms),c=free(r);if(c)items.push({x:c[0],y:c[1],k:pick(ip),pc:rndi(0,5)});}
      fov();msg(`Этаж ${floor}. ${floor===3?'Где-то здесь Краб-Император...':'Найди лестницу ▼'}`,'#ffe066');}
    function addMon(type,x,y){const b=ET[type],s=(1+(floor-1)*.25)*(.85+.15*D);mons.push({type,b,x,y,rx:x,ry:y,hp:Math.round(b.hp*s),max:Math.round(b.hp*s),atk:b.atk*(1+(floor-1)*.1)*(.85+.15*D),def:b.def||0,awake:b.boss?0:0,face:-1,flash:0,bump:0,ph:rnd(6),cd:0});}
    function los(x0,y0,x1,y1){let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy;for(;;){if(x0===x1&&y0===y1)return true;if(map[A(x0,y0)]===0)return false;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}}
    function fov(){vis.fill(0);const R=floor===3?6:7;for(let y=p.y-R;y<=p.y+R;y++)for(let x=p.x-R;x<=p.x+R;x++){if(x<0||y<0||x>=MW||y>=MH||(x-p.x)**2+(y-p.y)**2>R*R+1)continue;
      if(los(p.x,p.y,x,y)||(map[A(x,y)]===0&&[[0,1],[1,0],[0,-1],[-1,0]].some(([a,b])=>!wall(x+a,y+b)&&los(p.x,p.y,x+a,y+b)))){vis[A(x,y)]=1;seen[A(x,y)]=1;}}}
    const monAt=(x,y)=>mons.find(m=>m.x===x&&m.y===y&&m.hp>0);
    function dmg(a,d){let v=Math.max(1,Math.round(a+rnd(-1,1.5)-d));const crit=Math.random()<.1;if(crit)v*=2;return[v,crit];}
    function attackMon(m){const[v,c]=dmg(p.atk*P.atk,m.def);m.hp-=v;m.flash=.15;p.bump=.12;p.face=m.x>p.x?1:m.x<p.x?-1:p.face;m.awake=1;sfx('hit');
      PFX.text(m.rx*TS+16,m.ry*TS-8,(c?'КРИТ! ':'')+'-'+v,c?'#ff0':'#fff',c?18:15);
      if(m.hp<=0){kills++;msg(`${m.b.n} повержен${m.b.boss?'!!!':''} (+${m.b.xp} опыта)`,'#9f9');PFX.burst(m.rx*TS+16,m.ry*TS+10,16,['#f55','#ff0','#fff'],160,.5,4);gainXp(m.b.xp);if(Math.random()<.35)ctx.addLikes(3);
        if(m.b.boss){portal={x:m.x,y:m.y};shake(14);sfx('explode');msg('Открылся ПОРТАЛ ДОМОЙ! Встань на него.','#0ff');cherepaha();}else if(Math.random()<.25)items.push({x:m.x,y:m.y,k:Math.random()<.5?'cab':'pot',pc:rndi(0,5)});}
      else msg(`Ты бьёшь: ${m.b.n} −${v}`);}
    function gainXp(v){p.xp+=v;while(p.xp>=p.lvl*10){p.xp-=p.lvl*10;p.lvl++;p.max+=6;p.hp=Math.min(p.max,p.hp+12);p.atk+=1;sfx('power');msg(`УРОВЕНЬ ${p.lvl}! +6 здоровья, +1 атака`,'#ff0');PFX.text(p.rx*TS+16,p.ry*TS-20,'LEVEL UP!','#ff0',20);}}
    function hurtP(v,who){if(p.shell>0)v=Math.max(0,v-3);v=Math.max(v>0?1:0,Math.round(v/P.def-p.def*.5));p.hp-=v;p.flash=.2;shake(4);sfx('hurt');PFX.text(p.rx*TS+16,p.ry*TS-10,'-'+v,'#f55',16);
      if(p.hp<=0&&!end){end=1;deathBy=who;MUS.stop();sfx('lose');msg(`R.I.P. Черепаха. ${who} на этаже ${floor}.`,'#f55');
        setTimeout(()=>ctx.lose({text:`R.I.P. Здесь покоится черепаха. ${who}, этаж ${floor}, ход ${turn}. Убито монстров: ${kills}. Подземелье сгенерируется заново.`}),1800);}}
    function pickup(){const it=items.find(i=>i.x===p.x&&i.y===p.y);if(!it)return;
      if(it.k==='weapon'){p.atk+=2;msg('Нашла 🗡 Острый коготь! Атака +2','#ffe066');}
      else if(it.k==='armor'){p.def+=1;msg('Нашла 🛡 Титановую пластину! Защита +1','#ffe066');}
      else if(it.k==='likes'){ctx.addLikes(15);msg('Нашла 👍 мешок лайков! +15','#ffe066');}
      else{if(inv.length>=6){msg('Рюкзак полон (6 предметов)','#f88');return;}inv.push({k:it.k,pc:it.pc});msg('Подобрала: '+iname(it),'#cff');}
      items.splice(items.indexOf(it),1);sfx('coin');}
    const iname=i=>i.k==='cab'?'🥬 Капуста':i.k==='scroll'?'📜 Свиток':'🧪 '+(known[PEFF[i.pc]]?PN[PEFF[i.pc]]:PCOL[i.pc]+' зелье');
    function use(n){const i=inv[n];if(!i||end)return;inv.splice(n,1);
      if(i.k==='cab'){p.hp=Math.min(p.max,p.hp+12);msg('Хрум! +12 здоровья','#9f9');sfx('power');}
      else if(i.k==='scroll'){if(Math.random()<.5){seen.fill(1);msg('📜 Свиток карты: этаж открыт!','#0ff');}else{let n2=0;for(const m of mons)if(m.hp>0&&vis[A(m.x,m.y)]){m.hp-=12;m.flash=.3;n2++;if(m.hp<=0)attackMon(Object.assign(m,{hp:1}));}msg(`📜 Свиток «ЧЕРЕПАХА!»: крик оглушил ${n2} врагов (−12)`,'#ff0');cherepaha();shake(8);}}
      else{const e=PEFF[i.pc],first=!known[e];known[e]=1;
        if(e==='heal'){p.hp=p.max;msg('Полностью вылечилась!','#9f9');}else if(e==='str'){p.atk+=2;msg('Сила! Атака +2','#ff0');}
        else if(e==='tele'){for(let k=0;k<200;k++){const x=rndi(1,MW-2),y=rndi(1,MH-2);if(map[A(x,y)]&&!monAt(x,y)){p.x=p.rx=x;p.y=p.ry=y;break;}}msg('Пуф! Телепорт','#c9f');}
        else if(e==='poison'){hurtP(6,'Отравилась зельем');msg('Фу! Это был яд','#f88');}
        else if(e==='shell'){p.shell=25;msg('Панцирь затвердел на 25 ходов','#9cf');}
        else{seen.fill(1);msg('Ясновидение: видно весь этаж','#0ff');}
        if(first)msg('Опознано: '+PN[e],'#aaa');sfx('power');}
      endTurn();}
    function stepMon(m,mo){if(m.hp<=0)return;const d=Math.abs(m.x-p.x)+Math.abs(m.y-p.y);const see=vis[A(m.x,m.y)];if(see)m.awake=1;if(!m.awake){if(Math.random()<.25)tryMove(m,rndi(-1,1),0)||tryMove(m,0,rndi(-1,1));return;}
      if(m.b.slow&&turn%2)return;
      if(d===1){if(mo)return;m.bump=.12;m.face=p.x>m.x?1:-1;const[v]=dmg(m.atk,0);hurtP(v,'Убита: '+m.b.n);if(!end)msg(`${m.b.n} кусает: −${v}`,'#f88');return;}
      if(m.b.shoot&&see&&d<=6&&(m.x===p.x||m.y===p.y)&&m.cd<=0){m.cd=2;const[v]=dmg(m.atk,0);PFX.burst(p.rx*TS+16,p.ry*TS+8,8,'#f36',120,.3,3);hurtP(v,'Подстрелена дроном');if(!end)msg(`${m.b.n} стреляет лазером: −${v}`,'#f88');return;}m.cd--;
      if(m.b.boss&&turn%8===0&&mons.filter(z=>z.hp>0).length<14){for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1]])if(!wall(m.x+a,m.y+b)&&!monAt(m.x+a,m.y+b)&&!(m.x+a===p.x&&m.y+b===p.y)){addMon('hare',m.x+a,m.y+b);mons[mons.length-1].awake=1;msg('Краб-Император призывает зайца!','#f8a');break;}}
      const opts=[[Math.sign(p.x-m.x),0],[0,Math.sign(p.y-m.y)]].filter(([a,b])=>a||b).sort(()=>Math.random()-.5);if(Math.abs(p.x-m.x)<Math.abs(p.y-m.y))opts.reverse();
      for(const[a,b]of opts)if(tryMove(m,a,b))return;}
    function tryMove(m,a,b){const x=m.x+a,y=m.y+b;if((a||b)&&(!wall(x,y)||m.b.wall&&x>0&&y>0&&x<MW-1&&y<MH-1)&&!monAt(x,y)&&!(x===p.x&&y===p.y)){m.x=x;m.y=y;if(a)m.face=a;return true;}return false;}
    function endTurn(){turn++;if(p.shell>0)p.shell--;if(turn%4===0&&p.hp<p.max&&p.hp>0)p.hp++;for(const m of mons){stepMon(m);if(m.hp>0&&m.b.fast&&m.awake)stepMon(m,1);}mons=mons.filter(m=>m.hp>0);fov();}
    function act(dx,dy){if(end)return;if(dx)p.face=dx;const x=p.x+dx,y=p.y+dy,m=monAt(x,y);
      if(m){attackMon(m);endTurn();return;}if(wall(x,y)){p.bump=.08;return;}
      p.x=x;p.y=y;sfx('step');pickup();
      if(map[A(x,y)]===2){floor++;sfx('win');ctx.addLikes(10);p.hp=Math.min(p.max,p.hp+15);gen();return;}
      if(portal&&x===portal.x&&y===portal.y){end=1;sfx('win');MUS.stop();const r=p.hp/p.max;
        setTimeout(()=>ctx.win({stars:r>.5&&turn<900?3:r>.25?2:1,xp:40,text:`Краб-Император повержен, черепаха вышла из подземелья! Ходов: ${turn}, убито: ${kills}, уровень: ${p.lvl}.`}),900);return;}
      endTurn();}
    gen();
    return{get dbg(){return{floor,turn,hp:p.hp,max:p.max,lvl:p.lvl,atk:p.atk,kills,monsN:mons.length,inv:inv.length,p:{x:p.x,y:p.y},end,portal:!!portal};},
      api:{act,use,get map(){return map;},get mons(){return mons;},get items(){return items;},p,MW,MH,get portal(){return portal;},get inv(){return inv;}},
      update(dt){t+=dt;rep-=dt;p.bump=Math.max(0,p.bump-dt);p.flash=Math.max(0,p.flash-dt);for(const l of log)l.t+=dt;
        const ls=Math.min(1,dt*18);p.rx+=(p.x-p.rx)*ls;p.ry+=(p.y-p.ry)*ls;for(const m of mons){m.rx+=(m.x-m.rx)*ls;m.ry+=(m.y-m.ry)*ls;m.flash=Math.max(0,m.flash-dt);m.bump=Math.max(0,m.bump-dt);}
        if(end)return;
        const dirs=[['left',-1,0],['right',1,0],['up',0,-1],['down',0,1]];
        for(const[k,a,b]of dirs){if(hit(k)){act(a,b);rep=.24;break;}if(held(k)&&rep<=0){act(a,b);rep=.12;break;}}
        if(KP.Space){msg('Ты ждёшь. Черепахи умеют ждать.','#aaa');endTurn();}
        for(let k=0;k<6;k++)if(KP['Digit'+(k+1)])use(k);},
      draw(g){g.fillStyle='#05020c';g.fillRect(0,0,W,H);
        const cx=clamp(p.rx*TS+16-W/2,0,MW*TS-W),cy=clamp(p.ry*TS+16-VY-VH/2,-VY,MH*TS-VH-VY+20);
        g.save();g.beginPath();g.rect(0,VY,W,VH);g.clip();g.translate(-Math.round(cx),-Math.round(cy));
        const x0=Math.max(0,Math.floor(cx/TS)),x1=Math.min(MW-1,Math.ceil((cx+W)/TS)),y0=Math.max(0,Math.floor(cy/TS)),y1=Math.min(MH-1,Math.ceil((cy+H)/TS));
        for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=A(x,y);if(!seen[i])continue;const v=vis[i],X=x*TS,Y=y*TS;
          if(map[i]){g.fillStyle=v?((x+y)%2?'#1c1430':'#21183a'):'#0e0a18';g.fillRect(X,Y,TS,TS);if(map[i]===2){glow(g,X+16,Y+16,30,'rgba(255,230,80,.5)');txt(g,'▼',X+16,Y+24,{size:22,align:'center',color:'#ffe066'});}}
          else{g.fillStyle=v?'#3a2457':'#1a1028';g.fillRect(X,Y,TS,TS);g.fillStyle=v?'#4d3270':'#22152f';g.fillRect(X,Y,TS,6);
            if(v){g.strokeStyle='rgba(39,243,255,.45)';g.lineWidth=2;if(!wall(x,y+1)){g.beginPath();g.moveTo(X,Y+TS);g.lineTo(X+TS,Y+TS);g.stroke();}if(!wall(x+1,y)){g.beginPath();g.moveTo(X+TS,Y);g.lineTo(X+TS,Y+TS);g.stroke();}if(!wall(x-1,y)){g.beginPath();g.moveTo(X,Y);g.lineTo(X,Y+TS);g.stroke();}}}}
        if(portal){const X=portal.x*TS+16,Y=portal.y*TS+16;glow(g,X,Y,50+Math.sin(t*5)*8,'rgba(40,240,255,.7)');g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.arc(X,Y,12+Math.sin(t*6)*3,0,7);g.stroke();}
        for(const it of items){if(!vis[A(it.x,it.y)])continue;const ic={cab:'🥬',pot:'🧪',scroll:'📜',weapon:'🗡',armor:'🛡',likes:'👍'}[it.k];txt(g,ic,it.x*TS+16,it.y*TS+24+Math.sin(t*3+it.x)*2,{size:18,align:'center'});}
        for(const m of mons){if(!vis[A(m.x,m.y)])continue;const X=m.rx*TS+16+(m.bump>0?Math.sign(p.x-m.x)*6:0),Y=m.ry*TS+TS-2+(m.bump>0?Math.sign(p.y-m.y)*6:0);
          if(m.b.boss)glow(g,X,Y-20,60,'rgba(255,60,90,.35)');spr(g,m.b.img||m.type,X,Y+(m.type==='ghost'||m.type==='drone'?-4+Math.sin(t*4+m.ph)*3:0),{w:m.b.w||30,flip:m.face>0,flash:m.flash*6,alpha:m.type==='ghost'?.8:1});
          if(m.hp<m.max)bar(g,X-14,Y-(m.b.boss?58:34),28,4,m.hp/m.max,'#f55');if(!m.awake)txt(g,'z',X+12,Y-26,{size:12,color:'#9cf',alpha:.5+.5*Math.sin(t*3)});}
        const PX=p.rx*TS+16+(p.bump>0?p.face*5:0),PY=p.ry*TS+TS-3;if(p.shell>0)glow(g,PX,PY-8,30,'rgba(80,180,255,.45)');
        turtle(g,PX,PY,{scale:.14,dir:p.face,anim:p.bump>0?'attack':Math.abs(p.x-p.rx)+Math.abs(p.y-p.ry)>.05?'walk':'idle',fps:12,flash:p.flash*5,visor:ctx.visor,shadow:false});
        PFX.draw(g);g.restore();
        const gr=g.createRadialGradient(W/2,VY+VH/2,VH*.4,W/2,VY+VH/2,W*.62);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.6)');g.fillStyle=gr;g.fillRect(0,VY,W,VH);
        panel(g,0,H-92,W,92,{fill:'rgba(6,2,22,.95)',r:0,blur:4});
        txt(g,`❤ ${Math.max(0,p.hp)}/${p.max}`,14,H-66,{size:16,color:'#f8a'});bar(g,14,H-58,170,8,p.hp/p.max,'#f36');
        txt(g,`⚔ ${Math.round(p.atk*P.atk)}  🛡 ${p.def}${p.shell>0?' (+панцирь '+p.shell+')':''}`,14,H-30,{size:14,color:'#cff'});txt(g,`Ур.${p.lvl}  ${p.xp}/${p.lvl*10}  · Этаж ${floor}/3 · Ход ${turn}`,14,H-10,{size:12,color:'#9cf'});
        for(let k=0;k<6;k++){const x=230+k*58,y=H-84;panel(g,x,y,52,40,{fill:'rgba(20,10,50,.9)',stroke:inv[k]?'#27f3ff':'#334',r:6,blur:2});txt(g,String(k+1),x+5,y+13,{size:10,color:'#789'});
          if(inv[k]){txt(g,iname(inv[k]).split(' ')[0],x+26,y+30,{size:20,align:'center'});if(inRect(x,y,52,40)){txt(g,iname(inv[k]),x,y-6,{size:13,color:'#fff',stroke:'#000',sw:3});if(M.click){M.click=false;use(k);}}}}
        log.forEach((l,k)=>txt(g,l.s,580,H-70+k*19,{size:k?12:14,color:l.c,alpha:Math.max(.25,1-k*.25)}));
        txt(g,'1-6 — предметы · Пробел — ждать',230,H-14,{size:11,color:'#678'});
      }};
  }};
