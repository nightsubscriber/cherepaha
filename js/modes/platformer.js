'use strict';
/* ПЛАТФОРМЕР — «Неоновые крыши» */
MODES.platformer={genre:'Платформер',title:'Неоновые крыши',icon:'🏃',music:'drive',bg:'bg_city',
  goal:'Добеги по крышам неонового мегаполиса до сорванной страницы календаря. Собирай ❤-лайки, прыгай врагам на головы.',
  controls:['←→ / A D — бег · ↑ / W / Пробел — прыжок (держи — выше)','Shift / K — панцирь-рывок: неуязвимость и снос врагов'],
  create(ctx){
    const TS=36,ROWS=15,D=ctx.D,P=ctx.P,F=ctx.F;
    const COLS=Math.round(140+30*D);
    const map=[];for(let x=0;x<COLS;x++)map.push(new Uint8Array(ROWS));
    const cell=(cx,cy)=>(cx<0||cx>=COLS)?1:(cy<0||cy>=ROWS)?0:map[cx][cy];
    const solid=(cx,cy)=>cell(cx,cy)===1;
    const ents=[],likes=[],cps=[];
    const fill=(cx,hh)=>{for(let y=ROWS-hh;y<ROWS;y++)map[cx][y]=1;};
    const types=D>1.25?['drone','hare','snail','crab','drone']:['drone','snail','crab'];
    function enemy(cx,row){const t=pick(types);const e={t,x:cx*TS,y:row*TS-32,w:40,h:32,vx:t==='snail'?-35:t==='crab'?-70:-80,vy:0,dead:0,tt:rnd(6),x0:cx*TS};
      if(t==='drone'){e.y-=TS*rnd(1.2,2.2);e.y0=e.y;} ents.push(e);}
    let h=3,x=0;for(;x<10;x++)fill(x,h);
    while(x<COLS-14){
      if(Math.random()<.3){const gw=rndi(2,Math.min(4,2+Math.floor(D)));
        if(gw>=3&&Math.random()<.6){const py=ROWS-h-rndi(2,3);for(let i=1;i<gw-1;i++)map[x+i][py]=1;likes.push({x:(x+gw/2)*TS,y:(py-1)*TS+10});}
        x+=gw;h=clamp(h+rndi(-1,1),2,6);
      }else{const len=rndi(4,9);h=clamp(h+rndi(-2,2),2,7);const sx=x;
        for(let i=0;i<len&&x<COLS-14;i++,x++){fill(x,h);if(i>1&&i<len-2&&Math.random()<.07*D)map[x][ROWS-h-1]=3;}
        if(Math.random()<.5+.1*D&&x-sx>3)enemy(sx+rndi(2,x-sx-1),ROWS-h);
        if(Math.random()<.7)for(let i=0;i<3;i++)likes.push({x:(sx+1+i*1.3)*TS,y:(ROWS-h-2-(i===1?1:0))*TS});
        if(Math.random()<.35&&x-sx>4){const py=ROWS-h-rndi(3,4),px=sx+rndi(1,x-sx-3);for(let i=0;i<3;i++)map[px+i][py]=1;likes.push({x:(px+1.5)*TS,y:(py-1)*TS});}
        if(sx>cps.length*45+40)cps.push({x:(sx+1)*TS,y:(ROWS-h)*TS,on:0});
      }
    }
    for(;x<COLS;x++)fill(x,h);
    const goal={x:(COLS-6)*TS,y:(ROWS-h)*TS};
    likes.forEach(l=>{l.got=0;l.ph=rnd(6);});
    const maxHp=3+P.hp;
    const p={x:3*TS,y:(ROWS-3)*TS-30,w:42,h:28,vx:0,vy:0,gr:0,dir:1,hp:maxHp,inv:0,dash:0,dcd:0,coy:0,buf:0,jumps:0,anim:'idle',at:0,dmg:0};
    let spawn={x:p.x,y:p.y},t=0,cam=0,got=0,end=0,hitstop=0;
    function moveX(o,dx){o.x+=dx;const t0=Math.floor(o.y/TS),b=Math.floor((o.y+o.h-1)/TS);
      if(dx>0){const c=Math.floor((o.x+o.w)/TS);for(let r=t0;r<=b;r++)if(solid(c,r)){o.x=c*TS-o.w-.01;o.vx=0;return 1;}}
      else if(dx<0){const c=Math.floor(o.x/TS);for(let r=t0;r<=b;r++)if(solid(c,r)){o.x=(c+1)*TS+.01;o.vx=0;return 1;}}return 0;}
    function moveY(o,dy){o.y+=dy;const l=Math.floor(o.x/TS),r=Math.floor((o.x+o.w-1)/TS);
      if(dy>0){const c=Math.floor((o.y+o.h)/TS);for(let q=l;q<=r;q++)if(solid(q,c)){o.y=c*TS-o.h;o.vy=0;return 1;}}
      else if(dy<0){const c=Math.floor(o.y/TS);for(let q=l;q<=r;q++)if(solid(q,c)){o.y=(c+1)*TS;o.vy=0;return -1;}}return 0;}
    function phys(o,dt){const n=Math.max(1,Math.ceil(Math.max(Math.abs(o.vx),Math.abs(o.vy))*dt/14));const wasG=o.gr;o.gr=0;
      for(let i=0;i<n;i++){moveX(o,o.vx*dt/n);if(moveY(o,o.vy*dt/n)===1)o.gr=1;}
      if(!o.gr){const l=Math.floor(o.x/TS),r=Math.floor((o.x+o.w-1)/TS),c=Math.floor((o.y+o.h+1)/TS);for(let q=l;q<=r;q++)if(solid(q,c)&&o.vy>=0)o.gr=1;}
      return wasG;}
    function hurt(src){if(p.inv>0||p.dash>0||end)return;
      if(Math.random()<1-1/P.def){PFX.text(p.x+20,p.y-10,'Панцирь выдержал!','#9ff',16);p.inv=.6;sfx('hit');return;}
      p.hp--;p.dmg++;p.inv=1.3;p.vy=-380;p.vx=(src&&src.x>p.x?-1:1)*260;sfx('hurt');shake(8);PFX.burst(p.x+20,p.y+14,18,['#f33','#fa0'],260,.5,5);
      if(p.hp<=0){end=1;setTimeout(()=>ctx.lose({text:'Черепаха упала с крыши мегаполиса. Неоновые зайцы смеются.'}),900);}}
    return{
      update(dt){
        if(hitstop>0){hitstop-=dt;return;}
        t+=dt; if(end)return;
        const sp=255*P.spd, L=held('left'),R=held('right');
        p.inv=Math.max(0,p.inv-dt);p.dcd=Math.max(0,p.dcd-dt);
        if(hit('alt')&&p.dcd<=0&&p.dash<=0){p.dash=.26;p.dcd=F.turbo?.5:.9;sfx('boost');p.vy=0;shake(3);}
        if(p.dash>0){p.dash-=dt;p.vx=p.dir*640;p.vy=Math.min(p.vy,0);PFX.add(p.x+20,p.y+18,{vx:-p.dir*60,life:.3,color:'#0ff',size:8});}
        else{const tgt=(R-L)*sp;p.vx=lerp(p.vx,tgt,Math.min(1,dt*(p.gr?14:6)));if(L&&!R)p.dir=-1;if(R&&!L)p.dir=1;p.vy=Math.min(p.vy+1850*dt,760);}
        p.coy=p.gr?.1:p.coy-dt; p.buf=hit('up')||hit('act')?.13:p.buf-dt;
        if(p.gr)p.jumps=0;
        if(p.buf>0&&(p.coy>0||(F.dj&&p.jumps<2&&!p.gr))){p.vy=-660;p.buf=0;p.coy=0;p.jumps=p.jumps?2:1;if(p.jumps===2)PFX.burst(p.x+20,p.y+28,10,'#ff3df2',150,.4,4);sfx('jump');}
        if(!(held('up')||held('act'))&&p.vy<-250)p.vy=-250;
        const was=phys(p,dt); if(p.gr&&!was&&p.vy>=0)sfx('land');
        // шипы
        const cx0=Math.floor((p.x+6)/TS),cx1=Math.floor((p.x+p.w-6)/TS),cy=Math.floor((p.y+p.h-4)/TS);
        for(let q=cx0;q<=cx1;q++)if(cell(q,cy)===3)hurt({x:q*TS+18});
        if(p.y>ROWS*TS+60){if(!end){p.hp--;p.dmg++;sfx('hurt');shake(6);if(p.hp<=0){end=1;setTimeout(()=>ctx.lose({text:'Черепаха выпала из 2278 года. В пропасть.'}),600);}else{p.x=spawn.x;p.y=spawn.y-20;p.vx=p.vy=0;p.inv=1.5;}}}
        cps.forEach(c=>{if(!c.on&&p.x>c.x){c.on=1;spawn={x:c.x,y:c.y-40};sfx('power');PFX.text(c.x,c.y-60,'ЧЕКПОИНТ','#5f5');}});
        // враги
        for(const e of ents){if(e.dead){e.dead+=dt;continue;}if(Math.abs(e.x-p.x)>W*1.2)continue;e.tt+=dt;
          if(e.t==='drone'){e.x+=e.vx*dt;if(Math.abs(e.x-e.x0)>140)e.vx*=-1,e.x+=e.vx*dt;e.y=e.y0+Math.sin(e.tt*2.5)*28;}
          else{e.vy=Math.min(e.vy+1600*dt,700);
            if(e.t==='hare'){if(e.gr&&e.tt>1.3){e.tt=0;e.vy=-520;e.vx=Math.sign(p.x-e.x)*150;}if(e.gr&&e.tt>.1)e.vx=0;}
            else if(e.gr){const fx=Math.floor((e.vx>0?e.x+e.w+2:e.x-2)/TS),fy=Math.floor((e.y+e.h+4)/TS);if(!solid(fx,fy)||solid(fx,fy-1))e.vx*=-1;}
            phys(e,dt);if(e.vx===0&&e.t!=='hare')e.vx=(e.t==='snail'?35:70)*(Math.random()<.5?1:-1);if(e.y>ROWS*TS+100)e.dead=1;}
          if(overlap(p,e)){
            if(p.dash>0||(p.vy>60&&p.y+p.h-e.y<18)){e.dead=.01;p.vy=p.dash>0?p.vy:-430;sfx('punch');hitstop=.05;shake(4);PFX.burst(e.x+20,e.y+16,22,['#ff3df2','#0ff','#fff'],300,.6,5);PFX.text(e.x+20,e.y-10,'+'+ctx.addLikes(3)+' ❤','#ff7');}
            else hurt(e);}}
        // лайки
        for(const l of likes){if(l.got)continue;const dx=p.x+20-l.x,dy=p.y+14-l.y,d=Math.hypot(dx,dy);
          if(F.magnet&&d<170){l.x+=dx/d*420*dt;l.y+=dy/d*420*dt;}
          if(d<30){l.got=1;got++;ctx.addLikes(1);sfx('like');PFX.burst(l.x,l.y,8,'#ff4d8d',140,.4,4);}}
        if(p.x>goal.x-10&&!end){end=1;sfx('win');const st=1+(got>=likes.length*.6?1:0)+(p.dmg===0?1:0);
          ctx.win({stars:st,text:`Время: ${t.toFixed(1)} с · Лайков собрано: ${got}/${likes.length} · Урон: ${p.dmg}`});}
        p.anim=p.dash>0?'hide':!p.gr?'jump':Math.abs(p.vx)>30?'walk':'idle';
        cam=lerp(cam,clamp(p.x-W*.38,0,COLS*TS-W),Math.min(1,dt*8));
      },
      draw(g){
        bgTile(g,'bg_city',cam*.12,.2);
        // дальние небоскрёбы
        g.save();for(let i=Math.floor(cam*.45/90)-1;i<(cam*.45+W)/90+1;i++){const hh=120+((i*7919)%5)*45,x=i*90-cam*.45;
          g.fillStyle='rgba(18,6,40,.88)';g.fillRect(x,H-hh-90,78,hh+90);g.fillStyle=i%3?'rgba(255,61,242,.35)':'rgba(39,243,255,.35)';
          for(let wy=H-hh-80;wy<H-100;wy+=18)for(let wx=6;wx<70;wx+=14)if(((i*31+wy*7+wx)%5)<2)g.fillRect(x+wx,wy,7,8);}g.restore();
        g.save();g.translate(-Math.round(cam),0);
        const c0=Math.max(0,Math.floor(cam/TS)),c1=Math.min(COLS-1,Math.ceil((cam+W)/TS));
        for(let cx=c0;cx<=c1;cx++)for(let cy=0;cy<ROWS;cy++){const v=map[cx][cy];if(!v)continue;const X=cx*TS,Y=cy*TS;
          if(v===1){g.fillStyle=(cx+cy)%2?'#1c0b3e':'#21104a';g.fillRect(X,Y,TS,TS);
            if(!solid(cx,cy-1)){const col=`hsl(${(cx*9+t*40)%360},100%,60%)`;g.save();g.fillStyle=col;g.shadowColor=col;g.shadowBlur=12;g.fillRect(X,Y,TS,4);g.restore();}
            else if((cx*7+cy*13)%6===0){g.fillStyle='rgba(255,220,120,.5)';g.fillRect(X+10,Y+10,8,10);} }
          else if(v===3){g.save();g.fillStyle='#ff2a6d';g.shadowColor='#ff2a6d';g.shadowBlur=14;g.beginPath();
            for(let k=0;k<3;k++){g.moveTo(X+k*12,Y+TS);g.lineTo(X+k*12+6,Y+TS-16-Math.sin(t*10+k)*3);g.lineTo(X+k*12+12,Y+TS);}g.fill();g.restore();}}
        cps.forEach(c=>{g.save();g.strokeStyle=c.on?'#5f5':'#888';g.lineWidth=3;g.beginPath();g.moveTo(c.x,c.y);g.lineTo(c.x,c.y-60);g.stroke();
          g.fillStyle=c.on?'#5f5':'#666';g.beginPath();g.moveTo(c.x,c.y-60);g.lineTo(c.x+30,c.y-50);g.lineTo(c.x,c.y-40);g.fill();g.restore();});
        // цель
        glow(g,goal.x+30,goal.y-60,110,'rgba(255,255,150,.5)',.6+.3*Math.sin(t*4));
        g.save();g.translate(goal.x+30,goal.y-60+Math.sin(t*2)*6);g.rotate(Math.sin(t*1.5)*.1);panel(g,-34,-44,68,88,{fill:'#fff',stroke:'#ff0',blur:25,r:4});
        txt(g,'📅',0,8,{size:34,align:'center'});txt(g,'2278',0,34,{size:12,align:'center',color:'#000'});g.restore();
        for(const l of likes){if(l.got)continue;txt(g,'❤',l.x,l.y+Math.sin(t*4+l.ph)*4+8,{size:24,align:'center',color:'#ff4d8d',glow:'#ff0066'});}
        for(const e of ents){if(e.dead>.6||(Math.abs(e.x-cam-W/2)>W))continue;const a=e.dead?1-e.dead/.6:1;
          spr(g,e.t,e.x+20,e.y+e.h+(e.t==='drone'?6:2),{w:e.t==='drone'?50:56,flip:e.vx>0,alpha:a,sy:e.dead?1-e.dead:1,rot:e.dead?e.dead*8:0});}
        if(!(p.inv>0&&Math.floor(t*20)%2)){
          if(p.dash>0)turtle(g,p.x+21,p.y+p.h+4,{anim:'hide',frame:7,scale:.3,rot:t*p.dir*25,shadow:false});
          else turtle(g,p.x+21,p.y+p.h+3,{anim:p.anim,scale:.3,dir:p.dir,fps:p.anim==='walk'?14:10,frame:p.anim==='jump'?(p.vy<0?2:4):undefined,visor:ctx.visor});}
        PFX.draw(g);g.restore();
        // HUD
        for(let i=0;i<maxHp;i++)txt(g,'❤',16+i*26,58,{size:24,color:i<p.hp?'#ff3d6e':'rgba(255,255,255,.2)',glow:i<p.hp?'#f06':null});
        txt(g,`❤ ${got}/${likes.length}   ⏱ ${t.toFixed(1)}`,16,86,{size:16,color:'#fff',stroke:'#000',sw:3});
        bar(g,W-250,40,230,10,p.x/goal.x,'#27f3ff');txt(g,'до страницы',W-250,66,{size:12,color:'#9ff'});
        if(p.dcd>0)bar(g,W-250,72,230,6,1-p.dcd/(F.turbo?.5:.9),'#ff3df2');
      }};
  }};
