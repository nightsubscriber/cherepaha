'use strict';
/* СТЕЛС — «Музей черепах 4278» */
MODES.stealth={genre:'Стелс',title:'Музей черепах 4278',icon:'🥷',music:'dark',bg:'bg_city',
  goal:'В Музее черепах под стеклом лежит сорванная страница календаря. Проберись мимо роботов-охранников, камер и лазеров, забери страницу и вернись к зелёному выходу.',
  controls:['WASD / стрелки — идти · Shift — красться (тихо, медленно)','Пробел (держать) — спрятаться в панцирь, пока хватает дыхания · 🌿 кадки — укрытия'],
  create(ctx){
    const D=ctx.D,P=ctx.P,F=ctx.F,TS=40,OY=44,COLS=24,ROWS=12;
    let MAP=["########################","#......#.......#.......#","#..A...#..L....#..L....#","#.....H#...##..#.......#","#..........#.......#P..#","####.#######.###...#...#",
      "#.L..#.....#...#..H#####","#....#..A..#...#.......#","#....#.....###.#####.L.#","#......................#","#S.E...L..H#...L.......#","########################"];
    const mir=(Math.abs(ctx.page.year)+ctx.page.tries)%2===1;if(mir)MAP=MAP.map(r=>r.split('').reverse().join(''));
    const MX=x=>mir?COLS-1-x:x,MA=a=>mir?Math.PI-a:a,cc=(x,y)=>({x:x*TS+TS/2,y:OY+y*TS+TS/2});
    const wallT=(cx,cy)=>cx<0||cy<0||cx>=COLS||cy>=ROWS||MAP[cy][cx]==='#';
    const solid=(x,y)=>wallT(Math.floor(x/TS),Math.floor((y-OY)/TS));
    const find=c=>{const o=[];MAP.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch===c)o.push({cx:x,cy:y,...cc(x,y)});}));return o;};
    const S=find('S')[0],E=find('E')[0],PG=find('P')[0],HID=find('H'),ART=find('A');
    const likes=find('L').map(l=>({...l,got:0}));
    const GDEF=[{r:[[2,9],[21,9]]},{r:[[12,4],[18,4]]},{r:[[16,1],[22,1],[22,3],[16,3]]},{r:[[21,10],[21,7]],min:1.3},{r:[[6,6],[10,6],[10,8],[6,8]],min:1.7}];
    const CDEF=[{x:12,y:1,a0:.35,a1:2.8},{x:1,y:6,a0:-.6,a1:.9,min:1.45}];
    const LAS=[{c:[[12,5]],per:2.4,ph:0},{c:[[20,8],[21,8],[22,8]],per:2.8,ph:1.1}].map(l=>({...l,cells:l.c.map(([x,y])=>cc(MX(x),y))}));
    const gSpd=48*(.85+.15*D)*(F.zen?.8:1);
    let guards=[],cams=[];
    function reset(){guards=GDEF.filter(d=>!d.min||D>=d.min).map(d=>{const r=d.r.map(([x,y])=>cc(MX(x),y));return{x:r[0].x,y:r[0].y,r,wi:1,a:ang(r[0].x,r[0].y,r[1].x,r[1].y),st:'patrol',path:[],pt:0,wait:0,q:0};});
      cams=CDEF.filter(d=>!d.min||D>=d.min).map(d=>({...cc(MX(d.x),d.y),y0:OY+d.y*TS+6,a0:MA(d.a0),a1:MA(d.a1),a:0,ph:rnd(6)}));}
    reset();
    const pl={x:S.x,y:S.y,face:1,hidden:0,hT:0,breath:1,tired:0,mv:0};
    let t=0,sus=0,alarm=0,alarmT=0,alarms=0,caught=0,page=0,end=0,msg='',msgT=0,last={x:0,y:0},flash=0;
    const say2=(s,d=2.5)=>{msg=s;msgT=d;};
    function los(x1,y1,x2,y2){const n=Math.ceil(dist(x1,y1,x2,y2)/8);for(let i=1;i<n;i++){const k=i/n;if(solid(lerp(x1,x2,k),lerp(y1,y2,k)))return false;}return true;}
    const adiff=(a,b)=>((b-a+Math.PI*3)%(Math.PI*2))-Math.PI;
    function sees(o,R,half){const d=dist(o.x,o.y,pl.x,pl.y);if(d>R)return 0;if(Math.abs(adiff(o.a,ang(o.x,o.y,pl.x,pl.y)))>half)return 0;return los(o.x,o.y,pl.x,pl.y)?1-d/R*.7:0;}
    function bfs(fx,fy,tx,ty){const s=Math.floor(fx/TS)+Math.floor((fy-OY)/TS)*COLS,goal=Math.floor(tx/TS)+Math.floor((ty-OY)/TS)*COLS,prev=new Int16Array(COLS*ROWS).fill(-1),q=[s];prev[s]=s;
      while(q.length){const c=q.shift();if(c===goal)break;const x=c%COLS,y=(c/COLS)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=nx+ny*COLS;if(!wallT(nx,ny)&&prev[n]<0){prev[n]=c;q.push(n);}}}
      if(prev[goal]<0)return[];const out=[];for(let c=goal;c!==s;c=prev[c])out.unshift(cc(c%COLS,(c/COLS)|0));return out;}
    function walk(o,tx,ty,sp,dt){const d=dist(o.x,o.y,tx,ty);const ta=ang(o.x,o.y,tx,ty);o.a+=clamp(adiff(o.a,ta),-6*dt,6*dt);if(d<2){o.x=tx;o.y=ty;return true;}const s=Math.min(d,sp*dt);o.x+=Math.cos(ta)*s;o.y+=Math.sin(ta)*s;return false;}
    function caughtNow(){caught++;sfx('lose');shake(12);flash=.6;
      if(caught>=3){end=1;MUS.stop();setTimeout(()=>ctx.lose({text:'Роботы-охранники поймали черепаху и сдали в бюро находок 4278 года. Табличка: «черепаха (найдена)».'}),900);return;}
      say2(`ПОЙМАЛИ! Осталось попыток: ${3-caught}. Страница вернулась на место.`,3.5);page=0;pl.x=S.x;pl.y=S.y;sus=0;alarm=0;reset();}
    function cone(g,o,R,half,col){g.beginPath();g.moveTo(o.x,o.y);const N=22;for(let i=0;i<=N;i++){const a=o.a-half+half*2*i/N;let d=0;while(d<R&&!solid(o.x+Math.cos(a)*d,o.y+Math.sin(a)*d))d+=8;g.lineTo(o.x+Math.cos(a)*d,o.y+Math.sin(a)*d);}g.closePath();g.fillStyle=col;g.fill();}
    const lasOn=l=>((t+l.ph)%l.per)<l.per*.6;
    return{
      update(dt){t+=dt;msgT-=dt;flash=Math.max(0,flash-dt);if(end)return;
        const want=K.Space&&!pl.tired;
        if(want&&!pl.hidden){pl.hT=0;sfx('click');}pl.hidden=want;
        if(pl.hidden){pl.hT+=dt;pl.breath-=dt/3.4;if(pl.breath<=0){pl.breath=0;pl.tired=1;pl.hidden=false;say2('Воздух кончился! Черепаха высунулась подышать.');}}
        else{pl.breath=Math.min(1,pl.breath+dt/4.5);if(pl.tired&&pl.breath>.45)pl.tired=0;}
        const sneak=K.ShiftLeft||K.ShiftRight;let mx=0,my=0;
        if(!pl.hidden){mx=(held('right')?1:0)-(held('left')?1:0);my=(held('down')?1:0)-(held('up')?1:0);}
        const ml=Math.hypot(mx,my);pl.mv=ml>0;
        if(ml){const sp=(sneak?55:118)*P.spd*dt/ml;const nx=pl.x+mx*sp,ny=pl.y+my*sp,r=12;
          if(!solid(nx-r,pl.y-r)&&!solid(nx+r,pl.y-r)&&!solid(nx-r,pl.y+r)&&!solid(nx+r,pl.y+r))pl.x=nx;
          if(!solid(pl.x-r,ny-r)&&!solid(pl.x+r,ny-r)&&!solid(pl.x-r,ny+r)&&!solid(pl.x+r,ny+r))pl.y=ny;if(mx)pl.face=mx>0?1:-1;
          if(!sneak&&Math.floor(t*4)!==Math.floor((t-dt)*4))AU.tone(90,.04,'triangle',.05);}
        const inH=HID.some(h=>Math.abs(h.x-pl.x)<16&&Math.abs(h.y-pl.y)<16);
        likes.forEach(l=>{if(!l.got&&dist(l.x,l.y,pl.x,pl.y)<22){l.got=1;const n=ctx.addLikes(6);sfx('like');PFX.text(l.x,l.y-10,'+'+n+' 👍','#ffe066',16);}});
        if(!page&&dist(PG.x,PG.y,pl.x,pl.y)<24){page=1;sfx('power');PFX.burst(PG.x,PG.y,30,['#fff','#ff3df2','#0ff'],240,.7,5);say2('Страница у тебя! Теперь — к выходу. Охрана стала внимательнее.',3.5);sus=Math.max(sus,.25);}
        if(dist(E.x,E.y,pl.x,pl.y)<22){if(page){end=1;sfx('win');const st=!alarms&&!caught?3:(!caught||alarms<=1)?2:1;
            ctx.win({stars:st,text:`Страница вынесена из музея${alarms?'':' без единой тревоги'}! Тревог: ${alarms}, поимок: ${caught}. В каталоге музея теперь пустая витрина с подписью «черепаха».`});return;}
          else if(msgT<0)say2('Сначала забери страницу календаря!');}
        // лазеры
        for(const l of LAS)if(lasOn(l)&&!pl.hidden)for(const c of l.cells)if(Math.abs(pl.x-c.x)<22&&Math.abs(pl.y-c.y)<7){if(!alarm){sus=1;say2('Лазер! ТРЕВОГА!');}last={x:pl.x,y:pl.y};}
        // обнаружение
        let seen=0;const vis=!pl.hidden;
        for(const gd of guards){let s=vis?sees(gd,alarm?250:205,alarm?.75:.62):0;if(s&&inH&&dist(gd.x,gd.y,pl.x,pl.y)>34)s=0;
          if(!s&&vis&&pl.mv&&!(K.ShiftLeft||K.ShiftRight)&&dist(gd.x,gd.y,pl.x,pl.y)<75){s=.25;gd.q=1.2;}
          if(s){seen=Math.max(seen,s);gd.saw=1;}else gd.saw=0;
          if(dist(gd.x,gd.y,pl.x,pl.y)<24){caughtNow();return;}}
        for(const c of cams){c.a=lerp(c.a0,c.a1,.5+.5*Math.sin(t*.7+c.ph));const s=vis&&!inH?sees(c,240,.42):0;if(s)seen=Math.max(seen,s*.8);c.saw=!!s;}
        if(seen>0){sus=Math.min(1,sus+dt*(.7+2*seen)*(F.zen?.7:1)*(.8+.2*D)*(page?1.2:1));last={x:pl.x,y:pl.y};}else if(!alarm)sus=Math.max(0,sus-dt*.3);
        if(sus>=1&&!alarm){alarm=1;alarms++;alarmT=7;sfx('alarm');shake(6);say2('ТРЕВОГА! Беги или прячься!',3);guards.forEach(gd=>{gd.st='chase';gd.pt=0;});}
        if(alarm){if(seen>0)alarmT=7;alarmT-=dt;if(Math.floor(t*2.5)!==Math.floor((t-dt)*2.5))AU.tone(880,.12,'square',.05,660);
          if(alarmT<=0){alarm=0;sus=.55;say2('Тревога снята. Охрана возвращается к обходу.');guards.forEach(gd=>{gd.st='return';gd.pt=0;});}}
        for(const gd of guards){gd.q=Math.max(0,gd.q-dt);
          if(gd.st==='chase'){gd.pt-=dt;if(gd.pt<=0){gd.path=bfs(gd.x,gd.y,last.x,last.y);gd.pt=.35;}
            if(gd.path.length){const n=gd.path[0];if(walk(gd,n.x,n.y,gSpd*1.85,dt))gd.path.shift();}else{walk(gd,last.x,last.y,gSpd*1.85,dt);gd.a+=dt*2;}}
          else if(gd.st==='return'){if(!gd.path.length)gd.path=bfs(gd.x,gd.y,gd.r[gd.wi].x,gd.r[gd.wi].y);
            if(gd.path.length){const n=gd.path[0];if(walk(gd,n.x,n.y,gSpd,dt))gd.path.shift();}if(!gd.path.length)gd.st='patrol';}
          else if(gd.q>0){gd.a+=clamp(adiff(gd.a,ang(gd.x,gd.y,pl.x,pl.y)),-4*dt,4*dt);}
          else if(gd.wait>0){gd.wait-=dt;gd.a+=Math.sin(t*2)*dt*1.5;}
          else{const w=gd.r[gd.wi];if(walk(gd,w.x,w.y,gSpd,dt)){gd.wi=(gd.wi+1)%gd.r.length;gd.wait=gd.r.length===2?1.3:.4;}}}
      },
      draw(g){
        g.fillStyle='#06020f';g.fillRect(0,0,W,H);
        for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const X=x*TS,Y=OY+y*TS;
          if(MAP[y][x]==='#'){g.fillStyle='#1b0a36';g.fillRect(X,Y,TS,TS);g.fillStyle='#2a1258';g.fillRect(X+2,Y+2,TS-4,TS-4);
            if(!wallT(x,y+1)){g.fillStyle='rgba(255,61,242,.55)';g.fillRect(X,Y+TS-3,TS,3);}if(!wallT(x,y-1)){g.fillStyle='rgba(39,243,255,.35)';g.fillRect(X,Y,TS,2);}}
          else{g.fillStyle=(x+y)%2?'#120a24':'#160d2c';g.fillRect(X,Y,TS,TS);}}
        for(const a of ART){panel(g,a.x-15,a.y-6,30,22,{fill:'#2a1a40',stroke:'#7a5cff',blur:6,r:3});spr(g,'shell',a.x,a.y+2,{w:34});}
        if(!page){glow(g,PG.x,PG.y,40,'rgba(255,61,242,.5)');panel(g,PG.x-12,PG.y-16+Math.sin(t*3)*2,24,30,{fill:'#f4f0ff',stroke:'#ff3df2',blur:14,r:3});txt(g,'2278',PG.x,PG.y+2+Math.sin(t*3)*2,{size:8,align:'center',color:'#a0008a'});}
        glow(g,E.x,E.y,36,page?'rgba(80,255,120,.6)':'rgba(80,255,120,.25)');panel(g,E.x-16,E.y-18,32,36,{fill:'rgba(0,60,20,.8)',stroke:'#5f5',blur:page?20:6,r:4});txt(g,'ВЫХОД',E.x,E.y-22,{size:10,align:'center',color:'#5f5'});
        for(const l of likes)if(!l.got)txt(g,'👍',l.x,l.y+7+Math.sin(t*4+l.x)*2,{size:18,align:'center'});
        for(const l of LAS){const on=lasOn(l);for(const c of l.cells){if(on){neonLine(g,c.x-20,c.y,c.x+20,c.y,'#f22',2.5);}else{g.save();g.strokeStyle='rgba(255,40,40,.25)';g.setLineDash([3,5]);g.beginPath();g.moveTo(c.x-20,c.y);g.lineTo(c.x+20,c.y);g.stroke();g.restore();}}
          const c0=l.cells[0],c1=l.cells[l.cells.length-1];g.fillStyle='#f44';g.fillRect(c0.x-21,c0.y-4,3,8);g.fillRect(c1.x+18,c1.y-4,3,8);}
        const cc1=alarm?'rgba(255,40,40,.22)':sus>.4?'rgba(255,150,40,.2)':'rgba(255,235,120,.14)';
        for(const gd of guards)cone(g,gd,alarm?250:205,alarm?.75:.62,gd.saw?'rgba(255,60,60,.26)':cc1);
        for(const c of cams)cone(g,c,240,.42,c.saw?'rgba(255,60,60,.24)':'rgba(120,200,255,.12)');
        for(const h of HID){g.save();g.translate(h.x,h.y);g.fillStyle='#6b3a1e';g.fillRect(-10,4,20,14);for(let i=0;i<7;i++){const a=-Math.PI/2+(i-3)*.42+Math.sin(t*1.5+i)*.05;g.strokeStyle=i%2?'#3fd17a':'#5f9';g.lineWidth=4;g.beginPath();g.moveTo(0,4);g.quadraticCurveTo(Math.cos(a)*10,-6,Math.cos(a)*20,4+Math.sin(a)*22);g.stroke();}g.restore();}
        const inH=HID.some(h=>Math.abs(h.x-pl.x)<16&&Math.abs(h.y-pl.y)<16);
        const ents=guards.map(gd=>({y:gd.y,f:()=>{spr(g,'clerk',gd.x,gd.y+20,{w:46,flip:Math.cos(gd.a)>0});
          if(gd.st==='chase')txt(g,'!',gd.x,gd.y-26,{size:24,align:'center',color:'#f33',font:FONTB,glow:'#f00'});else if(gd.q>0||gd.saw)txt(g,'?',gd.x,gd.y-26,{size:22,align:'center',color:'#fb3',font:FONTB});}}));
        ents.push({y:pl.y,f:()=>{turtle(g,pl.x,pl.y+14,{scale:.2,dir:pl.face,anim:pl.hidden?'hide':pl.mv?'walk':'idle',once:pl.hidden,t:pl.hidden?pl.hT+.001:undefined,fps:pl.hidden?18:(K.ShiftLeft?6:11),alpha:inH&&!pl.hidden?.55:1,visor:ctx.visor});
          if(page)panel(g,pl.x-6,pl.y-26,12,14,{fill:'#fff',stroke:'#f0f',blur:8,r:2});}});
        ents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
        for(const c of cams){g.fillStyle='#333';g.fillRect(c.x-8,c.y0-4,16,9);g.fillStyle=Math.sin(t*6)>0||c.saw?'#f22':'#600';g.beginPath();g.arc(c.x+Math.cos(c.a)*6,c.y0+2+Math.sin(c.a)*3,3,0,7);g.fill();}
        PFX.draw(g);
        if(alarm){g.fillStyle=`rgba(255,0,0,${.08+.06*Math.sin(t*10)})`;g.fillRect(0,0,W,H);}
        if(flash>0){g.fillStyle=`rgba(255,255,255,${flash})`;g.fillRect(0,0,W,H);}
        // HUD
        panel(g,W/2-130,30,260,24,{fill:'rgba(0,0,0,.6)',stroke:alarm?'#f33':'#7a5cff',r:6,blur:alarm?16:4});
        txt(g,alarm?'🚨':'👁',W/2-114,48,{size:15,align:'center'});bar(g,W/2-96,37,214,10,sus,alarm?'#f22':sus>.5?'#fa0':'#ff6');
        txt(g,`💨`,16,526,{size:14});bar(g,36,516,100,9,pl.breath,pl.tired?'#f55':'#7df');
        txt(g,'Попытки: '+'🐢'.repeat(3-caught),150,527,{size:14,color:'#fff'});
        txt(g,page?'📄 Страница у тебя → к ВЫХОДУ':`📄 Найди страницу (${mir?'левое':'правое'} крыло)`,W-14,527,{size:14,align:'right',color:page?'#5f5':'#fcf'});
        if(msgT>0)txt(g,msg,W/2,84,{size:18,align:'center',color:'#fff',stroke:'#000',sw:5,alpha:Math.min(1,msgT*2)});
      }};
  }};
