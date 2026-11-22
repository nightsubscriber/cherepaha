'use strict';
/* ГОНКИ — «Реванш Зайца» (псевдо-3D) */
MODES.racing={genre:'Гонки',title:'Реванш Зайца',icon:'🏁',music:'race',bg:'bg_city',
  goal:'Басня устарела: в 2278 году черепаха и заяц гоняют на ховербордах. Приди ПЕРВОЙ. Заяц иногда засыпает прямо на трассе.',
  controls:['↑/W — газ · ↓/S — тормоз · ←→ / A D — руль','Пробел / Shift — панцирный турбо (шкала внизу) · не вылетай с трассы'],
  create(ctx){
    const D=ctx.D,P=ctx.P,F=ctx.F,SEG=200,RUMB=3,RW=2000,CAMH=1000,DRAW=180,depth=1/Math.tan(50*Math.PI/180),pZ=CAMH*depth;
    const segs=[];const lastY=()=>segs.length?segs[segs.length-1].p2.w.y:0;
    function add(curve,y){const n=segs.length;segs.push({i:n,p1:{w:{y:lastY(),z:n*SEG},c:{},s:{}},p2:{w:{y,z:(n+1)*SEG},c:{},s:{}},curve,spr:[],col:Math.floor(n/RUMB)%2});}
    const eIn=(a,b,p)=>a+(b-a)*p*p,eIO=(a,b,p)=>a+(b-a)*((-Math.cos(p*Math.PI)/2)+.5);
    function road(en,ho,le,cu,hi){const sy=lastY(),ey=sy+hi*SEG,tot=en+ho+le;for(let n=0;n<en;n++)add(eIn(0,cu,n/en),eIO(sy,ey,n/tot));for(let n=0;n<ho;n++)add(cu,eIO(sy,ey,(en+n)/tot));for(let n=0;n<le;n++)add(eIO(cu,0,n/le),eIO(sy,ey,(en+ho+n)/tot));}
    road(40,40,40,0,0);
    while(segs.length<1700){const r=Math.random(),c=pick([-1,1])*pick([2,4,6]),h=pick([-40,-20,0,20,40,60]);
      if(r<.25)road(25,50,25,0,h);else if(r<.6)road(30,rndi(30,70),30,c,h*.5);else if(r<.8){road(20,30,20,c,0);road(20,30,20,-c,h);}else road(15,25,15,0,pick([-60,60]));}
    const FIN=segs.length;road(30,40,30,0,-lastY()/SEG);road(100,100,100,0,0);
    const LEN=segs.length*SEG,finZ=FIN*SEG;
    const BB=['ЧЕРЕПАХА','КУПИ ПАНЦИРЬ','2278','ЗАЯЦ — ЛОХ','ЧЕРЕПАХА','МЕДЛЕННО = НАДЁЖНО'];
    for(let i=20;i<segs.length;i+=rndi(4,9)){const side=pick([-1,1]);const r=Math.random();segs[i].spr.push({k:r<.55?'pillar':r<.8?'bb':'holo',off:side*rnd(1.25,2.2),h:rnd(.7,1.3),txt:pick(BB),hue:rndi(0,360)});}
    segs[FIN].spr.push({k:'fin',off:-1.15},{k:'fin',off:1.15});
    const maxS=SEG*45*(1+.05*(P.spd-1));
    const cars=[];const ty=['hare','hare','snail','crab','hare','snail'];
    ty.forEach((t,i)=>cars.push({t,z:pZ+300+i*420,off:pick([-.55,0,.55]),sp:maxS*(t==='hare'?rnd(.8,.88)+(i===0?.07+.05*(D-1):0):t==='crab'?.68:.5),boss:i===0,nap:0,naps:i===0?[rnd(.3,.45),rnd(.62,.8)]:[rnd(.2,.9)],done:0,fin:0}));
    let pos=0,speed=0,px=0,t=-3.2,sky=0,boost=.5,bt=0,place=7,end=0,hits=0,finT=0,said=0,steer=0;
    const seg=z=>segs[Math.floor(z/SEG)%segs.length];
    function proj(p,cx,cy,cz){p.c.x=(p.w.x||0)-cx;p.c.y=p.w.y-cy;p.c.z=p.w.z-cz;p.s.k=depth/p.c.z;p.s.x=Math.round(W/2+p.s.k*p.c.x*W/2);p.s.y=Math.round(H/2-p.s.k*p.c.y*H/2);p.s.w=Math.round(p.s.k*RW*W/2);}
    function poly(g,x1,y1,x2,y2,x3,y3,x4,y4,c){g.fillStyle=c;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.lineTo(x3,y3);g.lineTo(x4,y4);g.closePath();g.fill();}
    return{
      update(dt){t+=dt;if(t<0){if(Math.ceil(t)!==Math.ceil(t-dt))sfx('beep');return;}if(!said){said=1;cherepaha();sfx('ok');}
        const ps=seg(pos+pZ),pct=speed/maxS;
        if(!end){
          const s=(held('right')?1:0)-(held('left')?1:0);steer=lerp(steer,s,Math.min(1,dt*8));px+=dt*2.2*pct*s;px-=dt*2.2*pct*pct*ps.curve*.32;
          const top=bt>0?maxS*1.38:maxS;
          if(held('up')||bt>0)speed+=(bt>0?maxS:maxS/4.5)*dt;else if(held('down'))speed-=maxS*1.1*dt;else speed-=maxS/6*dt;
          if((hit('act')||hit('alt'))&&boost>=.35&&bt<=0){bt=F.turbo?2.1:1.5;boost-=.35;sfx('boost');shake(6);}
          if(Math.abs(px)>1.05&&speed>maxS/4){speed-=maxS*.9*dt;shake(2);if(Math.random()<.2)PFX.add(rnd(W/2-80,W/2+80),H-30,{vy:-100,vx:rnd(-80,80),life:.5,color:'#a6f',size:6});}
          speed=clamp(speed,0,bt>0?top:Math.max(top,speed-maxS*dt));px=clamp(px,-2.4,2.4);
        }else speed=Math.max(0,speed-maxS*.6*dt);
        bt=Math.max(0,bt-dt);boost=Math.min(1,boost+dt*(F.turbo?.09:.06));
        pos+=speed*dt;sky+=ps.curve*pct*dt*.6;
        for(const c of cars){if(c.fin)continue;const prog=c.z/finZ;let s=c.sp*(1+.04*Math.sin(t+c.z*.001));
          for(const n of c.naps)if(!c.done&&prog>n&&prog<n+.02){c.nap=c.boss?Math.max(2,4.2-D):2.5;c.done=1;c.naps=c.naps.filter(q=>q!==n);setTimeout(()=>c.done=0,100);}
          if(c.nap>0){c.nap-=dt;s=0;}c.z+=s*dt;if(c.z>=finZ){c.fin=1;c.ft=t;}
          const dz=c.z-(pos+pZ);if(!end&&dz>-60&&dz<SEG*.9&&Math.abs(c.off-px)<.32&&speed>c.sp*.7){speed=c.sp*.55;hits++;sfx('hit');shake(10);px+=px<c.off?-.15:.15;PFX.burst(W/2,H-80,16,['#fff','#f0f'],250,.4,5);}}
        place=1+cars.filter(c=>c.fin||c.z>pos+pZ).length;
        if(!end&&pos+pZ>=finZ){end=1;finT=t;const win=place===1;sfx(win?'win':'lose');
          setTimeout(()=>win?ctx.win({stars:hits===0?3:hits<4?2:1,text:`Первое место! Время ${finT.toFixed(1)} с. Столкновений: ${hits}. Мораль: медленно, но на турбо-панцире.`}):ctx.lose({text:`Место: ${place}. Заяц опять победил. Басня Эзопа в шоке.`}),1600);}
      },
      draw(g){
        const ps=seg(pos+pZ),pp=((pos+pZ)%SEG)/SEG,pY=lerp(ps.p1.w.y,ps.p2.w.y,pp);
        const im=IMG.bg_city;if(ok(im)){const h=H*.62,w=h*im.width/im.height,ox=((sky*400)%w+w)%w;for(let x=-ox;x<W;x+=w)g.drawImage(im,x,0,w,h);}
        const base=seg(pos),bp=(pos%SEG)/SEG;let maxy=H,x=0,dx=-(base.curve*bp);
        const camX=px*RW,camY=pY+CAMH;
        for(let n=0;n<DRAW;n++){const s=segs[(base.i+n)%segs.length];const lo=s.i<base.i?LEN:0;s.clip=maxy;
          proj(s.p1,camX-x,camY,pos-lo);proj(s.p2,camX-x-dx,camY,pos-lo);x+=dx;dx+=s.curve;
          if(s.p1.c.z<=depth||s.p2.s.y>=s.p1.s.y||s.p2.s.y>=maxy)continue;
          const a=s.p1.s,b=s.p2.s,fog=clamp(n/DRAW,0,1);
          g.fillStyle=s.col?'#12052a':'#1a0838';g.fillRect(0,b.y,W,a.y-b.y+1);
          if(s.i%8===0){g.fillStyle='rgba(255,61,242,.35)';g.fillRect(0,b.y,W,Math.max(1,(a.y-b.y)*.25));}
          const r1=a.w/6,r2=b.w/6;poly(g,a.x-a.w-r1,a.y,a.x-a.w,a.y,b.x-b.w,b.y,b.x-b.w-r2,b.y,s.col?'#ff3df2':'#27f3ff');poly(g,a.x+a.w+r1,a.y,a.x+a.w,a.y,b.x+b.w,b.y,b.x+b.w+r2,b.y,s.col?'#ff3df2':'#27f3ff');
          poly(g,a.x-a.w,a.y,a.x+a.w,a.y,b.x+b.w,b.y,b.x-b.w,b.y,s.i>=FIN&&s.i<FIN+3?(Math.floor(s.i)%2?'#fff':'#111'):s.col?'#2b2340':'#302848');
          if(s.col){const l1=a.w/32,l2=b.w/32;for(const k of[-1/3,1/3])poly(g,a.x+a.w*2*k-l1,a.y,a.x+a.w*2*k+l1,a.y,b.x+b.w*2*k+l2,b.y,b.x+b.w*2*k-l2,b.y,'#ffe9a8');}
          if(fog>.5){g.fillStyle=`rgba(20,5,40,${(fog-.5)*1.6})`;g.fillRect(0,b.y,W,a.y-b.y+1);}
          maxy=b.y;}
        // спрайты сзади вперёд
        for(let n=DRAW-1;n>0;n--){const s=segs[(base.i+n)%segs.length];if(s.p1.c.z<=depth)continue;const k=s.p1.s.k,sx=s.p1.s.x,sy=s.p1.s.y;
          const items=s.spr.map(o=>({o,x:sx+k*o.off*RW*W/2,y:sy}));
          for(const c of cars){if(Math.floor(c.z/SEG)%segs.length===s.i){const f=(c.z%SEG)/SEG;items.push({car:c,x:lerp(s.p1.s.x,s.p2.s.x,f)+lerp(s.p1.s.k,s.p2.s.k,f)*c.off*RW*W/2,y:lerp(s.p1.s.y,s.p2.s.y,f),k:lerp(s.p1.s.k,s.p2.s.k,f)});}}
          for(const it of items){const kk=it.k||k,u=kk*W/2;g.save();g.beginPath();g.rect(0,0,W,s.clip);g.clip();
            if(it.car){const c=it.car,w=u*(c.t==='snail'?520:620);spr(g,c.t,it.x,it.y,{w,flip:true});if(c.boss)txt(g,'ЗАЯЦ-2278',it.x,it.y-w*.95,{size:Math.max(8,u*160),align:'center',color:'#ff7',stroke:'#000',sw:3});
              if(c.nap>0)txt(g,'Zzz',it.x+w*.3,it.y-w*.8-Math.sin(t*3)*u*80,{size:Math.max(8,u*240),color:'#9cf',stroke:'#000',sw:2});}
            else{const o=it.o;if(o.k==='pillar'){const h=u*2600*o.h,w=u*120;g.fillStyle=`hsl(${o.hue},100%,60%)`;g.shadowColor=g.fillStyle;g.shadowBlur=15;g.fillRect(it.x-w/2,it.y-h,w,h);g.fillRect(it.x-w*3,it.y-h,w*6,w*.8);}
              else if(o.k==='bb'){const w=u*1800,h=u*700;panel(g,it.x-w/2,it.y-h-u*900,w,h,{fill:'rgba(20,0,40,.9)',stroke:`hsl(${o.hue},100%,60%)`,r:3,blur:12});g.fillStyle='#555';g.fillRect(it.x-u*40,it.y-u*900,u*80,u*900);
                txt(g,o.txt,it.x,it.y-u*900-h*.35,{size:Math.max(4,h*.4),align:'center',color:'#fff',glow:`hsl(${o.hue},100%,60%)`});}
              else if(o.k==='holo'){g.globalAlpha=.7+.2*Math.sin(t*5);turtle(g,it.x,it.y,{scale:u*6,anim:'dance',fps:8,shadow:false});}
              else if(o.k==='fin'){const h=u*2200;g.fillStyle='#fff';g.fillRect(it.x-u*60,it.y-h,u*120,h);}}
            g.restore();}}
        if(segs[FIN].p1.c.z>depth&&segs[FIN].p1.s.y<H){const a=segs[FIN].p1.s;txt(g,'ФИНИШ',a.x,a.y-a.k*2300*W/2,{size:Math.max(8,a.k*500*W/2),align:'center',color:'#fff',font:FONTB,stroke:'#f0f',sw:4});}
        // игрок
        const pct=speed/maxS,bob=Math.sin(t*28)*pct*2.5;
        if(bt>0){g.save();g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=2;for(let i=0;i<24;i++){const a=rnd(6.28),r1=rnd(150,250);g.beginPath();g.moveTo(W/2+Math.cos(a)*r1,H/2+Math.sin(a)*r1*.6);g.lineTo(W/2+Math.cos(a)*(r1+200),H/2+Math.sin(a)*(r1+200)*.6);g.stroke();}g.restore();
          glow(g,W/2,H-40,120,'rgba(255,61,242,.7)');}
        spr(g,'hover',W/2,H-14+bob,{w:210,rot:steer*.14});
        // HUD
        txt(g,`${place}/${cars.length+1}`,24,78,{size:48,font:FONTB,color:place===1?'#5f5':'#fff',stroke:'#000',sw:5});txt(g,'МЕСТО',26,98,{size:14,color:'#ccc'});
        txt(g,`${Math.round(pct*287)} км/ч`,W-24,78,{size:36,font:FONTB,align:'right',color:'#ffe066',stroke:'#000',sw:5});
        bar(g,W/2-200,40,400,10,Math.min(1,(pos+pZ)/finZ),'#27f3ff');
        const bz=cars[0].z/finZ;txt(g,'🐇',W/2-200+400*clamp(bz,0,1),38,{size:16,align:'center'});txt(g,'🐢',W/2-200+400*clamp((pos+pZ)/finZ,0,1),62,{size:16,align:'center'});
        bar(g,W/2-120,H-26,240,12,boost,boost>=.35?'#ff3df2':'#744',{label:'ТУРБО'});
        txt(g,`⏱ ${Math.max(0,end?finT:t).toFixed(1)}`,24,124,{size:18,color:'#fff',stroke:'#000',sw:3});
        if(t<0.6){const n=Math.ceil(-t);txt(g,t<0?String(n):'ЧЕРЕПАХА!',W/2,H/2,{size:t<0?110:80,font:FONTB,align:'center',color:'#fff',stroke:'#f0f',sw:8,glow:'#0ff'});}
        if(end)txt(g,place===1?'ПОБЕДА!':`${place}-е место...`,W/2,H/2-40,{size:70,font:FONTB,align:'center',color:place===1?'#5f5':'#f55',stroke:'#000',sw:8});
        PFX.draw(g);
      }};
  }};
