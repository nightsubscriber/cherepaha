'use strict';
/* TOWER DEFENSE — «Оборона календаря» */
MODES.td={genre:'Tower Defense',title:'Оборона календаря',icon:'🗼',music:'drive',bg:'bg_ruins',
  goal:'Улитки, зайцы, крабы и дроны ползут к последней странице календаря, чтобы вырвать её. Строй черепашьи башни вдоль дороги и продержись 10 волн. В конце придёт Краб-архивариус.',
  controls:['1-4 — выбрать башню, клик по клетке — построить · ПКМ — отмена','Клик по башне: U — улучшить, S — продать · Пробел — волна раньше (бонус) · F — x2'],
  create(ctx){
    const D=ctx.D,P=ctx.P,F=ctx.F,CS=40,COLS=20,ROWS=12,OY=34,WAVES=10;
    const PATHS=[[[-1,2],[4,2],[4,8],[9,8],[9,3],[14,3],[14,9],[18,9],[18,5],[19,5]],
      [[-1,9],[3,9],[3,2],[8,2],[8,10],[13,10],[13,4],[17,4],[17,8],[19,8]],
      [[-1,5],[5,5],[5,1],[11,1],[11,6],[7,6],[7,10],[16,10],[16,3],[19,3]]];
    const wp=PATHS[(Math.abs(ctx.page.year)+ctx.page.tries)%3];
    const grid=[];for(let y=0;y<ROWS;y++)grid.push(new Array(COLS).fill(0));
    for(let i=0;i<wp.length-1;i++){let [x,y]=wp[i];const [x2,y2]=wp[i+1],sx=Math.sign(x2-x),sy=Math.sign(y2-y);
      for(;;){if(x>=0&&x<COLS&&y>=0&&y<ROWS)grid[y][x]=1;if(x===x2&&y===y2)break;x+=sx;y+=sy;}}
    const pts=wp.map(([x,y])=>({x:x*CS+CS/2,y:OY+y*CS+CS/2})),segL=[],end=pts[pts.length-1];let LEN=0;
    for(let i=0;i<pts.length-1;i++){const l=dist(pts[i].x,pts[i].y,pts[i+1].x,pts[i+1].y);segL.push(l);LEN+=l;}
    const R=srand(Math.abs(ctx.page.year)+3);const rocks=[];
    for(let k=0;k<14;k++){const x=Math.floor(R()*COLS),y=Math.floor(R()*ROWS);if(grid[y][x]===0){grid[y][x]=2;rocks.push({x,y,s:R()});}}
    const TT={archer:{n:'Черепаха-лучник',ic:'🐢',cost:60,col:'#ffe066',range:125,rate:.75,dmg:15,air:1},
      laser:{n:'Лазерный салат',ic:'🥬',cost:90,col:'#5f5',range:105,dps:20,air:1},
      frost:{n:'Морозильник',ic:'❄️',cost:75,col:'#7df',range:95,rate:1.2,dmg:5,air:1},
      cannon:{n:'Панцирная пушка',ic:'💣',cost:120,col:'#fa0',range:140,rate:1.9,dmg:42,splash:60,air:0}};
    const ORDER=['archer','laser','frost','cannon'];
    const ET={snail:{hp:70,spd:30,rew:6,w:44},hare:{hp:34,spd:80,rew:5,w:40},crab:{hp:120,spd:38,rew:9,w:46,armor:.45},
      drone:{hp:50,spd:56,rew:7,w:42,air:1},ghost:{hp:55,spd:62,rew:8,w:42,phase:1},boss:{hp:900,spd:21,rew:150,w:96,armor:.3,boss:1,img:'crab'}};
    function makeWave(w){const list=[],k=.75+.25*D,N=n=>Math.max(1,Math.round(n*k)),add=(t,n,gap)=>{for(let i=0;i<n;i++)list.push({t,gap});};
      switch(w){case 1:add('snail',N(8),1.3);break;case 2:add('hare',N(8),.8);add('snail',N(4),1.1);break;
        case 3:add('crab',N(5),1.4);add('snail',N(6),.9);break;case 4:add('drone',N(8),.9);add('hare',N(6),.6);break;
        case 5:add('ghost',N(7),1);add('crab',N(5),1.2);break;case 6:add('hare',N(10),.45);add('drone',N(6),.8);add('crab',N(4),1);break;
        case 7:add('crab',N(8),1);add('drone',N(10),.6);break;case 8:add('ghost',N(10),.6);add('hare',N(12),.4);break;
        case 9:['snail','hare','crab','drone','ghost'].forEach(t=>add(t,N(6),.55));break;
        default:add('hare',N(8),.4);add('boss',1,2.5);add('crab',N(6),.8);add('drone',N(6),.6);}
      return list;}
    let cab=Math.round(220*(F.rich?1.4:1)),lives=20,wave=0,state='wait',cd=22,queue=[],qt=0,t=0,fast=false,build=null,sel=null,banner=0,calT=0,over=0,kills=0;
    const towers=[],en=[],shots=[],rings=[];
    const posAt=d=>{for(let i=0;i<segL.length;i++){if(d<=segL[i]){const k=d/segL[i];return{x:lerp(pts[i].x,pts[i+1].x,k),y:lerp(pts[i].y,pts[i+1].y,k),dx:pts[i+1].x-pts[i].x};}d-=segL[i];}return{x:end.x,y:end.y,dx:1};};
    const tStat=tw=>{const b=TT[tw.k],l=tw.lvl-1;return{range:b.range+15*l,rate:(b.rate||1)*(1-.12*l),dmg:(b.dmg||0)*(1+.6*l)*P.atk,dps:(b.dps||0)*(1+.6*l)*P.atk,slow:.55-.1*l,splash:(b.splash||0)+8*l};};
    const upCost=tw=>tw.lvl>=3?0:Math.round(TT[tw.k].cost*(tw.lvl===1?.8:1.2));
    function spawn(type){const b=ET[type],hm=(1+(wave-1)*.45)*(.85+.22*D);const p=posAt(0);
      en.push({t:type,img:b.img||type,hp:b.hp*hm,max:b.hp*hm,spd:b.spd*(1+(wave-1)*.02),rew:Math.max(2,Math.round(b.rew*.85*(1+wave*.04))),armor:b.armor||0,air:b.air,phase:b.phase,boss:b.boss,w:b.w,d:0,x:p.x,y:p.y,slow:0,slowK:1,ph:rnd(3),flash:0,face:1,bob:rnd(6)});}
    const visible=e=>!(e.phase&&(e.ph%3.2)>2.2);
    function damage(e,a,pierce){if(e.hp<=0)return;if(!pierce)a*=1-e.armor;e.hp-=a;e.flash=.1;
      if(e.hp<=0){cab+=e.rew;kills++;PFX.text(e.x,e.y-20,'+'+e.rew+'🥬','#9f9',15);PFX.burst(e.x,e.y,e.boss?60:14,e.boss?['#fa0','#ff0','#f33','#fff']:['#f0f','#0ff','#fff'],e.boss?400:200,.6,e.boss?8:4);
        sfx(e.boss?'explode':'hit');if(e.boss){shake(16);ctx.addLikes(40);PFX.text(e.x,e.y-60,'КРАБ-АРХИВАРИУС ПОВЕРЖЕН!','#ff0',26);}}}
    function target(tw,st,air){let best=null;for(const e of en){if(e.hp<=0||!visible(e)||(e.air&&!air))continue;if(dist(tw.x,tw.y,e.x,e.y)<=st.range&&(!best||e.d>best.d))best=e;}return best;}
    function place(cx,cy){const b=TT[build];if(cab<b.cost||grid[cy][cx]!==0){sfx('miss');return;}cab-=b.cost;grid[cy][cx]=3;
      const tw={k:build,cx,cy,x:cx*CS+CS/2,y:OY+cy*CS+CS/2,lvl:1,cd:0,spent:b.cost,face:1,fire:0,heat:0,beam:null,pulse:0,ang:0};towers.push(tw);sel=tw;sfx('ok');
      PFX.burst(tw.x,tw.y,16,[b.col,'#fff'],160,.4,4);if(cab<b.cost)build=null;}
    function upgrade(){if(!sel)return;const c=upCost(sel);if(!c||cab<c){sfx('miss');return;}cab-=c;sel.spent+=c;sel.lvl++;sfx('power');PFX.burst(sel.x,sel.y,24,['#ff0','#fff',TT[sel.k].col],220,.5,5);PFX.text(sel.x,sel.y-24,'УР. '+sel.lvl,'#ff0',18);}
    function sell(){if(!sel)return;const v=Math.round(sel.spent*.6);cab+=v;grid[sel.cy][sel.cx]=0;towers.splice(towers.indexOf(sel),1);PFX.text(sel.x,sel.y-10,'+'+v+'🥬','#9f9',16);sfx('like');sel=null;}
    function startWave(){if(state!=='wait'||wave>=WAVES)return;const bonus=Math.floor(cd)*2;if(wave>0&&bonus>0){cab+=bonus;PFX.text(400,260,'Досрочно: +'+bonus+'🥬','#9f9',20);}
      wave++;state='active';queue=makeWave(wave);qt=.5;banner=2;sfx('alarm');if(wave===WAVES)say('краб архивариус',{pitch:.5});}
    function sim(dt){
      t+=dt;calT=Math.max(0,calT-dt);banner=Math.max(0,banner-dt);
      if(state==='wait'){cd-=dt;if(cd<=0)startWave();}
      else if(queue.length){qt-=dt;if(qt<=0){const q=queue.shift();spawn(q.t);qt=q.gap;}}
      else if(!en.length){if(wave>=WAVES){if(!over){over=1;sfx('win');cherepaha();setTimeout(()=>ctx.win({stars:lives>=18?3:lives>=10?2:1,text:`Календарь отбит! Волн: ${WAVES}, врагов уничтожено: ${kills}, страниц цело: ${lives}/20. Черепахи-лучники салютуют панцирями.`}),1500);}return;}
        state='wait';cd=12;const b=25+4*wave;cab+=b;PFX.text(400,240,`Волна ${wave} отбита! +${b}🥬`,'#ff0',24);ctx.addLikes(3+wave);sfx('power');}
      for(const e of en){e.ph+=dt;e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,e.slow-dt);const sp=e.spd*(e.slow>0?e.slowK:1);e.d+=sp*dt;
        const p=posAt(e.d);e.x=p.x;e.y=p.y;if(p.dx)e.face=p.dx>0?1:-1;
        if(e.d>=LEN){e.hp=0;e.gone=1;lives=Math.max(0,lives-(e.boss?10:1));calT=.4;shake(e.boss?14:5);sfx('hurt');PFX.burst(end.x,end.y,20,['#fff','#f33'],220,.5,5);
          if(lives<=0&&!over){over=1;lives=0;MUS.stop();sfx('lose');setTimeout(()=>ctx.lose({text:'Последнюю страницу календаря утащили. Теперь у 2278 года нет декабря.'}),1200);}}}
      for(let i=en.length-1;i>=0;i--)if(en[i].hp<=0)en.splice(i,1);
      for(const tw of towers){const st=tStat(tw),b=TT[tw.k];tw.cd-=dt;tw.fire=Math.max(0,tw.fire-dt);tw.pulse=Math.max(0,tw.pulse-dt*1.5);
        if(tw.k==='laser'){const tg=tw.beam&&tw.beam.hp>0&&visible(tw.beam)&&dist(tw.x,tw.y,tw.beam.x,tw.beam.y)<=st.range?tw.beam:target(tw,st,1);
          if(tg!==tw.beam)tw.heat=0;tw.beam=tg;if(tg){tw.heat=Math.min(2,tw.heat+dt);damage(tg,st.dps*(1+tw.heat)*dt,true);tw.face=tg.x>tw.x?1:-1;if(Math.random()<dt*20)PFX.add(tg.x+rnd(-8,8),tg.y+rnd(-8,8),{vy:-60,life:.3,color:'#5f5',size:4});}continue;}
        if(tw.cd>0)continue;
        if(tw.k==='frost'){if(en.some(e=>e.hp>0&&dist(tw.x,tw.y,e.x,e.y)<=st.range)){tw.cd=st.rate;tw.pulse=1;AU.tone(1400,.12,'sine',.05,700);
            for(const e of en)if(e.hp>0&&dist(tw.x,tw.y,e.x,e.y)<=st.range){e.slow=1.6;e.slowK=Math.min(e.slow>0?e.slowK:1,st.slow);damage(e,st.dmg,true);}}continue;}
        const tg=target(tw,st,b.air);if(!tg)continue;tw.cd=st.rate;tw.fire=.3;tw.face=tg.x>tw.x?1:-1;tw.ang=ang(tw.x,tw.y,tg.x,tg.y);
        if(tw.k==='archer'){shots.push({k:'shell',x:tw.x,y:tw.y-10,tg,dmg:st.dmg});AU.tone(700,.05,'square',.04,400);}
        else{const lead=posAt(tg.d+tg.spd*.6);shots.push({k:'bomb',x0:tw.x,y0:tw.y,tx:lead.x,ty:lead.y,f:0,dmg:st.dmg,splash:st.splash});AU.tone(120,.15,'sine',.25,60);}}
      for(const s of shots){if(s.k==='shell'){if(s.tg.hp<=0&&!s.tg.gone){s.done=1;continue;}const a=ang(s.x,s.y,s.tg.x,s.tg.y-8);s.x+=Math.cos(a)*460*dt;s.y+=Math.sin(a)*460*dt;
          if(dist(s.x,s.y,s.tg.x,s.tg.y-8)<12){s.done=1;damage(s.tg,s.dmg,false);PFX.burst(s.x,s.y,5,['#ffe066','#fff'],120,.25,3);}}
        else{s.f+=dt/.65;if(s.f>=1){s.done=1;rings.push({x:s.tx,y:s.ty,r:s.splash,l:.35});sfx('explode');shake(3);
          for(const e of en)if(!e.air&&e.hp>0&&dist(e.x,e.y,s.tx,s.ty)<=s.splash)damage(e,s.dmg,false);PFX.burst(s.tx,s.ty,22,['#fa0','#ff0','#f50'],240,.5,6);}}}
      for(let i=shots.length-1;i>=0;i--)if(shots[i].done)shots.splice(i,1);
      for(let i=rings.length-1;i>=0;i--){rings[i].l-=dt;if(rings[i].l<=0)rings.splice(i,1);}
    }
    const hover=()=>{if(M.x>=800||M.y<OY||M.y>=OY+ROWS*CS)return null;return{cx:Math.floor(M.x/CS),cy:Math.floor((M.y-OY)/CS)};};
    return{get dbg(){return{cab,lives,wave,state,grid,towers,en,kills};},
      update(dt){
        ['Digit1','Digit2','Digit3','Digit4'].forEach((k,i)=>{if(KP[k]){build=build===ORDER[i]?null:ORDER[i];sel=null;sfx('select');}});
        if(M.rclick){build=null;sel=null;}
        if(KP.KeyU)upgrade();if(KP.KeyS)sell();if(KP.Space)startWave();if(KP.KeyF){fast=!fast;sfx('select');}
        const h=hover();if(h&&M.click){M.click=false;const tw=towers.find(o=>o.cx===h.cx&&o.cy===h.cy);
          if(tw){sel=tw;build=null;sfx('select');}else if(build)place(h.cx,h.cy);else sel=null;}
        if(over&&!en.length&&lives>0){t+=dt;return;}
        sim(dt);if(fast)sim(dt);
      },
      draw(g){
        drawBG(g,'bg_ruins',.86);
        g.save();g.strokeStyle='rgba(122,92,255,.12)';g.lineWidth=1;g.beginPath();for(let x=0;x<=COLS;x++){g.moveTo(x*CS+.5,OY);g.lineTo(x*CS+.5,OY+ROWS*CS);}for(let y=0;y<=ROWS;y++){g.moveTo(0,OY+y*CS+.5);g.lineTo(800,OY+y*CS+.5);}g.stroke();g.restore();
        g.save();g.lineJoin='round';g.lineCap='round';g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));
        g.strokeStyle='#ff3df2';g.shadowColor='#ff3df2';g.shadowBlur=18;g.lineWidth=36;g.stroke();g.shadowBlur=0;g.strokeStyle='#170a2c';g.lineWidth=31;g.stroke();
        g.setLineDash([10,14]);g.lineDashOffset=-t*40;g.strokeStyle='rgba(39,243,255,.45)';g.lineWidth=2;g.stroke();g.restore();
        for(const r of rocks){const x=r.x*CS+CS/2,y=OY+r.y*CS+CS/2;g.fillStyle='#241640';g.beginPath();g.moveTo(x-14,y+10);g.lineTo(x-8,y-12);g.lineTo(x+6,y-14);g.lineTo(x+15,y+2);g.lineTo(x+8,y+12);g.closePath();g.fill();
          g.strokeStyle=r.s>.5?'rgba(255,61,242,.5)':'rgba(39,243,255,.5)';g.lineWidth=1.5;g.stroke();}
        // календарь
        {const s=calT>0?rnd(-4,4):0;g.save();g.translate(end.x+s,end.y);panel(g,-22,-28,44,52,{fill:'#f4f0ff',stroke:'#ff3df2',blur:16,r:4});
          for(let i=0;i<3;i++){g.fillStyle='#222';g.beginPath();g.arc(-12+i*12,-26,3,0,7);g.fill();}
          txt(g,ctx.page.month.slice(0,3),0,-8,{size:10,align:'center',color:'#a0008a'});txt(g,String(lives),0,16,{size:20,font:FONTB,align:'center',color:lives<8?'#d00':'#1a0a3a'});g.restore();}
        const hv=hover();
        if(sel){const st=tStat(sel);g.save();g.fillStyle='rgba(39,243,255,.07)';g.strokeStyle='rgba(39,243,255,.5)';g.beginPath();g.arc(sel.x,sel.y,st.range,0,7);g.fill();g.stroke();g.restore();}
        for(const tw of towers){const b=TT[tw.k];panel(g,tw.x-17,tw.y-17,34,34,{fill:'rgba(10,4,30,.9)',stroke:b.col,blur:sel===tw?20:8,r:7});
          for(let i=0;i<tw.lvl;i++){g.fillStyle=b.col;g.fillRect(tw.x-12+i*9,tw.y+12,6,3);}
          if(tw.k==='archer')turtle(g,tw.x,tw.y+9,{scale:.16,dir:tw.face,anim:tw.fire>0?'attack':'idle',shadow:false});
          else if(tw.k==='laser'){const p=1+Math.sin(t*6)*.08;g.save();g.translate(tw.x,tw.y);g.scale(p,p);for(let i=0;i<6;i++){g.fillStyle=i%2?'#3c3':'#6f6';g.beginPath();g.ellipse(Math.cos(i)*5,Math.sin(i)*5-2,9,6,i,0,7);g.fill();}g.fillStyle='#bfb';g.beginPath();g.arc(0,-2,4,0,7);g.fill();g.restore();}
          else if(tw.k==='frost'){g.save();g.translate(tw.x,tw.y);g.rotate(t*.8);g.fillStyle='#aef';g.shadowColor='#7df';g.shadowBlur=12;g.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;g.lineTo(Math.cos(a)*11,Math.sin(a)*11);}g.fill();g.restore();
            if(tw.pulse>0){const st=tStat(tw);g.save();g.strokeStyle=`rgba(125,221,255,${tw.pulse})`;g.lineWidth=3;g.beginPath();g.arc(tw.x,tw.y,st.range*(1-tw.pulse*.9),0,7);g.stroke();g.restore();}}
          else{g.save();g.translate(tw.x,tw.y);g.rotate(tw.ang);g.fillStyle='#555';g.fillRect(0,-4,20-tw.fire*20,8);g.fillStyle='#fa0';g.fillRect(16-tw.fire*20,-4,4,8);g.restore();spr(g,'shell',tw.x,tw.y+9,{w:28});}}
        for(const tw of towers)if(tw.beam&&tw.beam.hp>0){neonLine(g,tw.x,tw.y-4,tw.beam.x,tw.beam.y-8,'#5f5',2+tw.heat*2.5);neonLine(g,tw.x,tw.y-4,tw.beam.x,tw.beam.y-8,'#efe',1);}
        en.slice().sort((a,b)=>a.y-b.y).forEach(e=>{const vis=visible(e);if(e.slow>0){g.save();g.fillStyle='rgba(125,221,255,.25)';g.beginPath();g.ellipse(e.x,e.y+10,e.w*.5,8,0,0,7);g.fill();g.restore();}
          spr(g,e.img,e.x,e.y+14-(e.air?10+Math.sin(t*5+e.bob)*4:Math.abs(Math.sin(t*8+e.bob))*2),{w:e.w,flip:e.face>0,alpha:vis?1:.3,flash:e.flash*8});
          if(e.hp<e.max&&!e.boss)bar(g,e.x-16,e.y-e.w*.55,32,4,e.hp/e.max,'#f44');});
        for(const s of shots){if(s.k==='shell')spr(g,'shell',s.x,s.y,{w:14,ay:.5,rot:t*20});
          else{const x=lerp(s.x0,s.tx,s.f),y=lerp(s.y0,s.ty,s.f)-Math.sin(s.f*Math.PI)*70;g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(lerp(s.x0,s.tx,s.f),lerp(s.y0,s.ty,s.f),6,3,0,0,7);g.fill();glow(g,x,y,16,'rgba(255,150,0,.8)');g.fillStyle='#331';g.beginPath();g.arc(x,y,6,0,7);g.fill();}}
        for(const r of rings){g.save();g.strokeStyle=`rgba(255,170,0,${r.l*2.5})`;g.lineWidth=4;g.beginPath();g.arc(r.x,r.y,r.r*(1.2-r.l*1.5),0,7);g.stroke();g.restore();}
        if(build&&hv){const b=TT[build],okc=grid[hv.cy][hv.cx]===0&&cab>=b.cost,x=hv.cx*CS+CS/2,y=OY+hv.cy*CS+CS/2;g.save();g.fillStyle=okc?'rgba(80,255,120,.12)':'rgba(255,60,60,.15)';g.strokeStyle=okc?'#5f5':'#f44';
          g.beginPath();g.arc(x,y,b.range,0,7);g.fill();g.stroke();g.strokeRect(hv.cx*CS+2,OY+hv.cy*CS+2,CS-4,CS-4);g.restore();txt(g,b.ic,x,y+8,{size:22,align:'center',alpha:.7});}
        PFX.draw(g);
        const boss=en.find(e=>e.boss);if(boss){txt(g,'КРАБ-АРХИВАРИУС',400,52,{size:15,align:'center',color:'#fa0',stroke:'#000',sw:4});bar(g,200,58,400,10,boss.hp/boss.max,'#f50');}
        if(banner>0)glitchTitle(g,wave===WAVES?'ФИНАЛЬНАЯ ВОЛНА':'ВОЛНА '+wave,400,250,54,wave===WAVES?'#f50':'#f0f');
        // панель
        panel(g,806,32,150,504,{fill:'rgba(8,2,24,.92)',r:8});
        txt(g,'🥬 '+fmt(cab),818,64,{size:24,font:FONTB,color:'#9f9'});txt(g,'❤ '+lives+'/20',818,90,{size:17,color:lives<8?'#f66':'#fcf'});
        txt(g,`Волна ${wave}/${WAVES}`,818,112,{size:16,color:'#9ff'});
        ORDER.forEach((k,i)=>{const b=TT[k],y=124+i*56,can=cab>=b.cost;
          if(button(g,812,y,138,50,'',{sel:build===k,disabled:!can&&build!==k})){build=build===k?null:k;sel=null;}
          txt(g,b.ic,830,y+33,{size:22,align:'center'});txt(g,b.n,848,y+21,{size:11,color:can?'#fff':'#889'});txt(g,`${b.cost}🥬  [${i+1}]`,848,y+39,{size:12,color:can?'#ffe066':'#866'});});
        if(sel){const b=TT[sel.k],st=tStat(sel),uc=upCost(sel);panel(g,812,352,138,104,{fill:'rgba(30,10,60,.9)',stroke:b.col,blur:6,r:6});
          txt(g,`${b.ic} ${b.n.split(' ')[0]} ур.${sel.lvl}`,818,370,{size:12,color:'#fff'});
          txt(g,sel.k==='laser'?`${Math.round(st.dps)}-${Math.round(st.dps*3)} урона/с`:sel.k==='frost'?`замедл. ${Math.round((1-st.slow)*100)}%`:`урон ${Math.round(st.dmg)}`,818,386,{size:11,color:'#bdf'});
          if(button(g,816,394,130,26,uc?`⬆ U: ${uc}🥬`:'макс. уровень',{size:12,disabled:!uc||cab<uc}))upgrade();
          if(button(g,816,424,130,26,`💰 S: +${Math.round(sel.spent*.6)}🥬`,{size:12}))sell();}
        else{const nx=state==='wait'&&wave<WAVES?[...new Set(makeWave(wave+1).map(q=>q.t))]:[];if(nx.length){txt(g,'Следующая волна:',818,372,{size:12,color:'#ccc'});nx.forEach((ty,i)=>spr(g,ET[ty].img||ty,830+i*28,412,{w:ty==='boss'?34:26}));}}
        if(state==='wait'&&wave<WAVES){if(button(g,812,462,138,36,`▶ Волна ${wave+1} (${Math.ceil(cd)}с)`,{size:13}))startWave();}
        else txt(g,`врагов: ${en.length+queue.length}`,881,486,{size:14,align:'center',color:'#f9f'});
        if(button(g,812,502,138,28,fast?'⏩ скорость x2':'▶ скорость x1',{size:12,sel:fast}))fast=!fast;
      }};
  }};
