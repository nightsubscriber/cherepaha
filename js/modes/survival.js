'use strict';
/* ВЫЖИВАНИЕ — «Ледниковый 12278» (survivors-like) */
SONGS.ice={bpm:96,root:42,prog:[0,-2,-5,-4],drums:'break',bass:'long',arp:2,pad:1,hats:1,lead:[19,null,null,17,null,null,15,null,14,null,null,null,12,null,null,null,19,null,null,17,null,null,15,null,17,null,null,null,null,null,null,null]};
MODES.survival={genre:'Выживание',title:'Ледниковый 12278',icon:'❄️',music:'ice',bg:'bg_space',
  goal:'12278 год, ледниковый период. Продержись до рассвета! Черепаха сама стреляет панцирями, а ты следи за голодом и холодом: грейся у костров, ешь капусту, собирай кристаллы опыта.',
  controls:['WASD / стрелки — ходить (стрельба автоматическая, по ближайшему)','1/2/3 или клик — выбрать улучшение · 🔥 костры греют · 🥬 капуста кормит'],
  create(ctx){
    const D=ctx.D,P=ctx.P,F=ctx.F,WW=2400,WH=1600,DUR=150;
    const tex=document.createElement('canvas');tex.width=tex.height=512;const tg=tex.getContext('2d');
    {tg.fillStyle='#0c2742';tg.fillRect(0,0,512,512);const R=srand(77);
      for(let i=0;i<70;i++){tg.fillStyle=`rgba(${150+R()*80|0},${200+R()*55|0},255,${.03+R()*.06})`;tg.beginPath();tg.ellipse(R()*512,R()*512,20+R()*70,10+R()*30,R()*3,0,7);tg.fill();}
      tg.strokeStyle='rgba(180,230,255,.13)';tg.lineWidth=1.5;for(let i=0;i<40;i++){let x=R()*512,y=R()*512;tg.beginPath();tg.moveTo(x,y);for(let k=0;k<4;k++){x+=(R()-.5)*90;y+=(R()-.5)*90;tg.lineTo(x,y);}tg.stroke();}
      tg.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<220;i++)tg.fillRect(R()*512,R()*512,1.6,1.6);}
    const FIRES=[[400,400],[2000,420],[1200,800],[420,1220],[1980,1200]].map(([x,y])=>({x,y}));
    const ET={ghost:{hp:16,spd:96,dmg:5,w:46},snail:{hp:50,spd:38,dmg:7,w:50},hare:{hp:14,spd:140,dmg:4,w:46,zig:1},crab:{hp:55,spd:60,dmg:9,w:52}};
    const UPG=[{id:'rate',ic:'⚡',n:'Скорострельность',d:'Стреляет на 18% чаще',f:()=>S.fi*=.82},{id:'dmg',ic:'💪',n:'Тяжёлые панцири',d:'Урон +30%',f:()=>S.dmg*=1.3},
      {id:'multi',ic:'🔱',n:'Ещё панцирь',d:'+1 снаряд веером',f:()=>S.shots++},{id:'orb',ic:'🌀',n:'Орбитальная черепашка',d:'Кружит вокруг и бьёт врагов',f:()=>S.orb++},
      {id:'warm',ic:'🧣',n:'Вязаный шарф',d:'Холод на 35% медленнее',f:()=>S.cold*=.65},{id:'spd',ic:'💨',n:'Коньки',d:'Скорость +15%',f:()=>S.spd*=1.15},
      {id:'pierce',ic:'🗡',n:'Острый край',d:'Панцири пробивают +1 врага',f:()=>S.pierce++},{id:'heal',ic:'🥗',n:'Салат «Цезарь»',d:'+30 к макс. здоровью и лечение',f:()=>{p.max+=30;p.hp=p.max;}},
      {id:'mag',ic:'🧲',n:'Магнит',d:'Кристаллы летят издалека',f:()=>S.mag*=1.6}];
    const S={fi:.45,dmg:13*P.atk,shots:1,pierce:0,orb:0,cold:1,spd:175*P.spd,mag:F.magnet?190:110};
    const p={x:1200,y:880,face:1,hp:120+20*P.hp,max:120+20*P.hp,hunger:100,cold:100,inv:0,mv:0};
    const en=[],bul=[],gems=[],food=[],flakes=[];for(let i=0;i<110;i++)flakes.push({x:rnd(W),y:rnd(H),s:rnd(1,3),v:rnd(30,90)});
    let t=0,fcd=0,spawnAcc=0,lvl=1,xp=0,kills=0,choice=null,end=0,bliz=0,nextBliz=35,foodT=2,elites=[45,90,135],hurtS=0,cam={x:0,y:0},orbA=0,warmMsg=0;
    const need=()=>4+lvl*3;
    for(let i=0;i<5;i++)food.push({x:p.x+rnd(-450,450),y:p.y+rnd(-350,350),ph:rnd(6)});
    function spawn(type,elite){const a=rnd(Math.PI*2),r=rnd(560,680);const b=ET[type],hm=(1+t/130)*(.85+.17*D);
      const e={t:type,x:clamp(p.x+Math.cos(a)*r,20,WW-20),y:clamp(p.y+Math.sin(a)*r,20,WH-20),hp:b.hp*hm*(elite?14:1),spd:b.spd*(elite?.8:1)*(.9+.1*D),dmg:b.dmg*(elite?2.2:1),w:b.w*(elite?2:1),zig:b.zig,hcd:0,ocd:0,flash:0,elite,ph:rnd(6),face:1};
      e.max=e.hp;en.push(e);}
    function pickType(){const w=t<30?{ghost:3,snail:2}:t<70?{ghost:3,snail:1,hare:2,crab:1}:{ghost:3,snail:1,hare:3,crab:3};let s=0;for(const k in w)s+=w[k];let r=rnd(s);for(const k in w){r-=w[k];if(r<=0)return k;}return 'ghost';}
    function kill(e){kills++;PFX.burst(e.x,e.y,e.elite?40:10,e.t==='ghost'?['#cff','#fff']:['#f0f','#0ff','#fff'],e.elite?320:180,.5,e.elite?7:4);sfx(e.elite?'explode':'hit');
      gems.push({x:e.x,y:e.y,v:e.elite?15:1,fly:0});if(e.elite){for(let i=0;i<3;i++)food.push({x:e.x+rnd(-40,40),y:e.y+rnd(-40,40),ph:rnd(6)});ctx.addLikes(15);shake(10);}
      else if(Math.random()<.035)food.push({x:e.x,y:e.y,ph:0});}
    function dmgE(e,a){e.hp-=a;e.flash=.08;if(e.hp<=0&&!e.dead){e.dead=1;kill(e);}}
    function levelUp(){lvl++;xp=0;sfx('power');choice=shuffle(UPG.slice()).slice(0,3);PFX.burst(p.x,p.y,30,['#5ff','#fff','#ff0'],260,.6,5);}
    const nearFire=()=>FIRES.some(f=>dist(f.x,f.y,p.x,p.y)<125);
    return{get dbg(){return{t,hp:p.hp,hunger:p.hunger,cold:p.cold,lvl,kills,p,en,food,gems,FIRES,choice:!!choice};},
      update(dt){
        if(end){t+=dt;return;}
        if(choice){['Digit1','Digit2','Digit3'].forEach((k,i)=>{if(KP[k]&&choice){choice[i].f();PFX.text(p.x,p.y-50,choice[i].n,'#5ff',20);choice=null;sfx('ok');}});return;}
        t+=dt;if(t>=DUR){end=1;sfx('win');const r=p.hp/p.max;MUS.stop();
          setTimeout(()=>ctx.win({stars:r>.6?3:r>.25?2:1,text:`Рассвет! Ледник тает, а черепаха жива. Врагов: ${kills}, уровень ${lvl}. Из-подо льда вытаял календарь со страницей «черепаха».`}),1200);return;}
        // движение
        const mx=(held('right')?1:0)-(held('left')?1:0),my=(held('down')?1:0)-(held('up')?1:0),ml=Math.hypot(mx,my);p.mv=ml>0;
        if(ml){p.x=clamp(p.x+mx/ml*S.spd*dt,20,WW-20);p.y=clamp(p.y+my/ml*S.spd*dt,20,WH-20);if(mx)p.face=mx>0?1:-1;}
        p.inv=Math.max(0,p.inv-dt);hurtS-=dt;
        // метель
        if(t>nextBliz){bliz=9;nextBliz+=40;sfx('alarm');}bliz=Math.max(0,bliz-dt);
        // голод/холод
        const warm=nearFire();p.hunger=Math.max(0,p.hunger-dt*1.3);
        p.cold=warm?Math.min(100,p.cold+dt*28):Math.max(0,p.cold-dt*2.4*S.cold*(bliz>0?1.8:1));
        if(p.hunger<=0)p.hp-=6*dt;if(p.cold<=0)p.hp-=8*dt;
        // спавн
        spawnAcc+=dt*(.6+t/70)*(.8+.2*D);while(spawnAcc>1&&en.length<120){spawnAcc--;spawn(pickType());}
        if(elites.length&&t>elites[0]){elites.shift();spawn('crab',1);PFX.text(p.x,p.y-70,'ЛЕДЯНОЙ КРАБ!','#f55',24);sfx('alarm');}
        foodT-=dt;if(foodT<=0&&food.length<7){foodT=6;food.push({x:clamp(p.x+rnd(-500,500),40,WW-40),y:clamp(p.y+rnd(-400,400),40,WH-40),ph:0});}
        // стрельба
        fcd-=dt;if(fcd<=0){let best=null,bd=430;for(const e of en){const d=dist(e.x,e.y,p.x,p.y);if(d<bd){bd=d;best=e;}}
          if(best){fcd=S.fi;const a0=ang(p.x,p.y-8,best.x,best.y);for(let i=0;i<S.shots;i++){const a=a0+(i-(S.shots-1)/2)*.16;bul.push({x:p.x,y:p.y-8,vx:Math.cos(a)*540,vy:Math.sin(a)*540,life:.9,pierce:S.pierce,hit:[]});}
            p.face=best.x>p.x?1:-1;AU.tone(520,.05,'square',.035,300);}}
        for(const b of bul){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;for(const e of en){if(e.dead||b.hit.includes(e))continue;if(dist(b.x,b.y,e.x,e.y)<e.w*.4+6){dmgE(e,S.dmg);b.hit.push(e);if(b.pierce--<=0){b.life=0;break;}}}}
        for(let i=bul.length-1;i>=0;i--)if(bul[i].life<=0)bul.splice(i,1);
        orbA+=dt*3.2;
        // враги
        for(const e of en){if(e.dead)continue;e.hcd-=dt;e.ocd-=dt;e.flash=Math.max(0,e.flash-dt);e.ph+=dt;
          let a=ang(e.x,e.y,p.x,p.y);if(e.zig)a+=Math.sin(e.ph*5)*.8;if(e.t==='ghost')a+=Math.sin(e.ph*2)*.3;
          e.x+=Math.cos(a)*e.spd*dt;e.y+=Math.sin(a)*e.spd*dt;e.face=Math.cos(a)>0?1:-1;
          const d=dist(e.x,e.y,p.x,p.y);
          if(d<e.w*.35+14&&e.hcd<=0){e.hcd=.7;p.hp-=e.dmg/P.def;p.inv=.15;if(hurtS<=0){sfx('hurt');hurtS=.25;}shake(3);}
          for(let k=0;k<S.orb;k++){const oa=orbA+k*Math.PI*2/S.orb;if(e.ocd<=0&&dist(e.x,e.y,p.x+Math.cos(oa)*78,p.y+Math.sin(oa)*78)<e.w*.4+12){dmgE(e,8*P.atk);e.ocd=.4;}}}
        for(let i=0;i<en.length;i++){const a=en[i];for(let j=i+1;j<en.length;j++){const b=en[j],dx=b.x-a.x,dy=b.y-a.y,m=(a.w+b.w)*.3;if(Math.abs(dx)<m&&Math.abs(dy)<m){const d=Math.hypot(dx,dy)||1;if(d<m){const k=(m-d)/d*.5;a.x-=dx*k;a.y-=dy*k;b.x+=dx*k;b.y+=dy*k;}}}}
        for(let i=en.length-1;i>=0;i--)if(en[i].dead||dist(en[i].x,en[i].y,p.x,p.y)>1100)en.splice(i,1);
        // кристаллы и еда
        for(const gm of gems){const d=dist(gm.x,gm.y,p.x,p.y);if(d<S.mag)gm.fly=1;if(gm.fly){const a=ang(gm.x,gm.y,p.x,p.y);gm.x+=Math.cos(a)*520*dt;gm.y+=Math.sin(a)*520*dt;}
          if(d<18){gm.got=1;xp+=gm.v;AU.tone(1200+xp*20,.04,'sine',.04);if(xp>=need())levelUp();}}
        for(let i=gems.length-1;i>=0;i--)if(gems[i].got)gems.splice(i,1);
        for(let i=food.length-1;i>=0;i--){const f=food[i];f.ph+=dt;if(dist(f.x,f.y,p.x,p.y)<26){p.hunger=Math.min(100,p.hunger+40);p.hp=Math.min(p.max,p.hp+8);sfx('like');PFX.text(f.x,f.y-20,'ням! 🥬','#9f9',16);food.splice(i,1);}}
        for(const f of flakes){f.y+=f.v*dt*(bliz?3:1);f.x+=(bliz?-160:-15)*dt*f.s/2;if(f.y>H)f.y=-5;if(f.x<0)f.x=W;}
        if(p.cold<35&&!warm){warmMsg-=dt;if(warmMsg<=0){warmMsg=6;PFX.text(p.x,p.y-60,'Холодно! К костру!','#9df',18);}}
        if(p.hp<=0){end=1;p.hp=0;MUS.stop();sfx('lose');const why=p.cold<=0?'замёрзла':p.hunger<=0?'проголодалась':'не выдержала натиска';
          setTimeout(()=>ctx.lose({text:`Черепаха ${why} и вмёрзла в лёд 12278 года. Через 10 000 лет её найдут и скажут: «черепаха».`}),1100);}
        cam.x=clamp(p.x-W/2,0,WW-W);cam.y=clamp(p.y-H/2,0,WH-H);
      },
      draw(g){
        const cx=cam.x,cy=cam.y;const ox=-(cx%512),oy=-(cy%512);
        for(let y=oy;y<H;y+=512)for(let x=ox;x<W;x+=512)g.drawImage(tex,x,y);
        g.save();g.translate(-cx,-cy);
        g.strokeStyle='rgba(120,200,255,.5)';g.lineWidth=4;g.strokeRect(0,0,WW,WH);
        for(const f of FIRES){if(f.x<cx-200||f.x>cx+W+200||f.y<cy-200||f.y>cy+H+200)continue;glow(g,f.x,f.y,150,'rgba(255,140,40,.28)');
          g.strokeStyle='rgba(255,170,80,.25)';g.setLineDash([6,8]);g.beginPath();g.arc(f.x,f.y,125,0,7);g.stroke();g.setLineDash([]);
          g.fillStyle='#4a2a14';g.fillRect(f.x-18,f.y+4,36,7);g.fillRect(f.x-14,f.y-2,28,6);
          for(let i=0;i<5;i++){const h=18+Math.sin(t*9+i*2)*6;g.fillStyle=i%2?'#ffb02e':'#ff5a1f';g.beginPath();g.ellipse(f.x-10+i*5,f.y-h*.4,5,h*.6,0,0,7);g.fill();}
          if(Math.random()<.3)PFX.add(f.x+rnd(-8,8),f.y-14,{vy:-60,vx:rnd(-10,10),life:.6,color:'#fa0',size:3});}
        for(const f of food)txt(g,'🥬',f.x,f.y+8+Math.sin(f.ph*3)*3,{size:24,align:'center'});
        for(const gm of gems){g.fillStyle=gm.v>1?'#ff3df2':'#5ff';g.save();g.translate(gm.x,gm.y);g.rotate(t*3);g.fillRect(-4,-4,8,8);g.restore();}
        const ents=en.map(e=>({y:e.y,f:()=>{spr(g,e.t,e.x,e.y+e.w*.35+(e.t==='ghost'?Math.sin(e.ph*3)*4:0),{w:e.w,flip:e.face>0,flash:e.flash*10,alpha:e.t==='ghost'?.85:1});
          if(e.elite)bar(g,e.x-40,e.y-e.w*.55,80,6,e.hp/e.max,'#f55');}}));
        ents.push({y:p.y,f:()=>{turtle(g,p.x,p.y+16,{scale:.24,dir:p.face,anim:p.mv?'walk':'idle',fps:p.mv?12:8,flash:p.inv>0?.6:0,visor:ctx.visor});
          g.fillStyle='#e33';g.fillRect(p.x-(p.face>0?-14:22),p.y-12,10,4);}});
        ents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
        for(let k=0;k<S.orb;k++){const oa=orbA+k*Math.PI*2/S.orb;spr(g,'shell',p.x+Math.cos(oa)*78,p.y+Math.sin(oa)*78,{w:26,ay:.5,rot:oa*2});}
        for(const b of bul)spr(g,'shell',b.x,b.y,{w:16,ay:.5,rot:t*25});
        PFX.draw(g);g.restore();
        if(p.cold<45){const f=FIRES.reduce((a,b)=>dist(a.x,a.y,p.x,p.y)<dist(b.x,b.y,p.x,p.y)?a:b);const a=ang(p.x,p.y,f.x,f.y),sx=p.x-cx+Math.cos(a)*90,sy=p.y-cy+Math.sin(a)*90;
          if(dist(f.x,f.y,p.x,p.y)>140){g.save();g.translate(sx,sy);g.rotate(a);g.fillStyle=`rgba(255,160,60,${.6+.4*Math.sin(t*8)})`;g.beginPath();g.moveTo(14,0);g.lineTo(-8,-9);g.lineTo(-8,9);g.fill();g.restore();}}
        g.fillStyle='rgba(255,255,255,.8)';for(const f of flakes)g.fillRect(f.x,f.y,f.s,f.s*(bliz?3:1));
        if(bliz>0){g.fillStyle=`rgba(220,240,255,${.22*Math.min(1,bliz,9-bliz)})`;g.fillRect(0,0,W,H);txt(g,'❄ МЕТЕЛЬ ❄',W/2,90,{size:26,align:'center',color:'#fff',glow:'#9df',alpha:.6+.4*Math.sin(t*4)});}
        const vg=g.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*.95);vg.addColorStop(0,'rgba(0,10,30,0)');vg.addColorStop(1,`rgba(0,10,30,${.35+(1-p.cold/100)*.4})`);g.fillStyle=vg;g.fillRect(0,0,W,H);
        // HUD
        panel(g,10,32,228,74,{fill:'rgba(0,10,30,.7)',stroke:'#5af',r:8,blur:4});
        txt(g,'❤',22,52,{size:15,color:'#f66'});bar(g,40,42,188,11,p.hp/p.max,'#f44',{label:Math.ceil(p.hp)+'/'+p.max});
        txt(g,'🥬',20,74,{size:14});bar(g,40,64,188,10,p.hunger/100,p.hunger<25?'#f80':'#9f5');
        txt(g,'❄',22,96,{size:15,color:'#9df'});bar(g,40,86,188,10,p.cold/100,p.cold<25?'#88f':'#5cf');
        const left=Math.max(0,DUR-t);txt(g,`🌅 до рассвета ${Math.floor(left/60)}:${String(Math.floor(left%60)).padStart(2,'0')}`,W-16,54,{size:20,align:'right',color:'#ffd27a',font:FONTB});
        txt(g,`💀 ${kills}   ⭐ ур. ${lvl}`,W-16,78,{size:15,align:'right',color:'#fff'});
        bar(g,0,H-8,W,8,xp/need(),'#5ff',{bg:'rgba(0,0,0,.6)'});
        if(choice){g.fillStyle='rgba(0,5,20,.75)';g.fillRect(0,0,W,H);glitchTitle(g,'НОВЫЙ УРОВЕНЬ!',W/2,110,40,'#5ff');txt(g,'Выбери улучшение: 1 / 2 / 3 или клик',W/2,145,{size:16,align:'center',color:'#cff'});
          choice.forEach((u,i)=>{const x=140+i*240,y=180,hov=inRect(x,y,200,230);panel(g,x,y,200,230,{stroke:hov?'#ff3df2':'#27f3ff',blur:hov?26:10,fill:hov?'rgba(60,0,60,.92)':'rgba(10,6,34,.92)'});
            txt(g,u.ic,x+100,y+80,{size:54,align:'center'});wrapText(g,u.n,x+100,y+135,180,22,{size:18,align:'center',color:'#fff'});wrapText(g,u.d,x+100,y+180,170,18,{size:14,align:'center',color:'#bdf',bold:false});
            txt(g,String(i+1),x+14,y+24,{size:16,color:'#888'});if(hov&&M.click&&choice){M.click=false;u.f();PFX.text(p.x,p.y-50,u.n,'#5ff',20);choice=null;sfx('ok');}});}
      }};
  }};
