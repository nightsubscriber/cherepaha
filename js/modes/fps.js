'use strict';
/* ШУТЕР ОТ ПЕРВОГО ЛИЦА — «Лабиринт Панциря» (рейкастер) */
MODES.fps={genre:'Шутер от 1-го лица',title:'Лабиринт Панциря',icon:'🔫',music:'dark',bg:'bg_ruins',
  goal:'Найди в неоновом лабиринте страницу календаря 📅. Хроно-дроны и призраки будут мешать. Стреляй лазером из лап.',
  controls:['W S — вперёд/назад · A D — шаг вбок · ← → или мышь — поворот (клик — захват мыши)','Пробел / ЛКМ / J — лазер · карта в углу показывает, где ты уже был'],
  create(ctx){
    const D=ctx.D,P=ctx.P,RW=320,RH=180,TX=64;
    const N=21+2*Math.min(3,Math.floor((D-1)*3));
    const map=[];for(let y=0;y<N;y++){map.push(new Uint8Array(N).fill(1));}
    const seen=[];for(let y=0;y<N;y++)seen.push(new Uint8Array(N));
    // лабиринт
    const st=[[1,1]];map[1][1]=0;
    while(st.length){const [cx,cy]=st[st.length-1];const nb=shuffle([[2,0],[-2,0],[0,2],[0,-2]]).filter(([dx,dy])=>{const nx=cx+dx,ny=cy+dy;return nx>0&&ny>0&&nx<N-1&&ny<N-1&&map[ny][nx]===1;});
      if(!nb.length){st.pop();continue;}const [dx,dy]=nb[0];map[cy+dy/2][cx+dx/2]=0;map[cy+dy][cx+dx]=0;st.push([cx+dx,cy+dy]);}
    for(let i=0;i<N*N*.06;i++){const x=rndi(1,N-2),y=rndi(1,N-2);if(map[y][x]&&((map[y][x-1]===0&&map[y][x+1]===0)||(map[y-1][x]===0&&map[y+1][x]===0)))map[y][x]=0;}
    for(let r=0;r<3;r++){const rx=rndi(2,N-6),ry=rndi(2,N-6);for(let y=ry;y<ry+3;y++)for(let x=rx;x<rx+3;x++)map[y][x]=0;}
    for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(map[y][x]){const edge=x===0||y===0||x===N-1||y===N-1;map[y][x]=edge?2:(((x*7+y*13)>>2)%9===0?4:1+((Math.floor(x/5)+Math.floor(y/5))%3));}
    const free=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&map[y|0][x|0]===0;
    function bfs(sx,sy){const d=[];for(let y=0;y<N;y++)d.push(new Int16Array(N).fill(-1));const q=[[sx,sy]];d[sy][sx]=0;
      while(q.length){const [x,y]=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(free(nx,ny)&&d[ny][nx]<0){d[ny][nx]=d[y][x]+1;q.push([nx,ny]);}}}return d;}
    let far=[1,1,0];const d0=bfs(1,1);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(d0[y][x]>far[2])far=[x,y,d0[y][x]];
    // текстуры
    const TEX=[];const pk=(r,g2,b)=>(255<<24)|(b<<16)|(g2<<8)|r;
    function mk(fn){const a=new Uint32Array(TX*TX);for(let y=0;y<TX;y++)for(let x=0;x<TX;x++){const [r,g2,b]=fn(x,y);a[y*TX+x]=pk(r|0,g2|0,b|0);}return a;}
    TEX[1]=mk((x,y)=>{const row=y>>3,bx=(x+(row%2)*8)%16;const m=(y%8===0)||(bx===0);return m?[255,61,242]:[42+((x*y)%7)*3,16,69+(row%3)*8];});
    TEX[2]=mk((x,y)=>{const e=x%32<2||y%32<2;const l=(x%32===16&&y%8<4);return e?[39,243,255]:l?[255,230,120]:[16,30,48+((x^y)&7)];});
    const pts=[];for(let i=0;i<7;i++)pts.push([rnd(64),rnd(64)]);
    TEX[3]=mk((x,y)=>{let d1=1e9,d2=1e9;for(const [px,py] of pts)for(const ox of[-64,0,64])for(const oy of[-64,0,64]){const d=Math.hypot(x-px-ox,y-py-oy);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}
      const e=d2-d1<3;const dark=((x*3+y*5)%23)<4;return e?[60,35,12]:dark?[90,58,20]:[201,162,74];});
    TEX[4]=mk((x,y)=>{const b=x<3||y<3||x>60||y>60;return b?[255,61,242]:[235,230,240];});
    try{const c=document.createElement('canvas');c.width=c.height=TX;const x=c.getContext('2d');x.fillStyle='#ece6f0';x.fillRect(0,0,64,64);x.strokeStyle='#ff3df2';x.lineWidth=3;x.strokeRect(1,1,62,62);
      if(ok(IMG.turtle))x.drawImage(IMG.turtle,0,0,256,128,2,8,60,30);x.fillStyle='#000';x.font='bold 10px Arial';x.textAlign='center';x.fillText('черепаха',32,54);
      const id=x.getImageData(0,0,64,64);const u=new Uint32Array(id.data.buffer.slice(0));if(u[64*32+32]!==0)TEX[4]=u;}catch(e){}
    const SH=16,TEXS={};for(const k of [1,2,3,4]){const arr=new Uint32Array(TX*TX*SH);const src=TEX[k];for(let s=0;s<SH;s++){const f=(s+1)/SH;for(let i=0;i<TX*TX;i++){const c=src[i];
      arr[s*TX*TX+i]=pk((c&255)*f+8*(1-f),((c>>8)&255)*f,((c>>16)&255)*f+20*(1-f));}}TEXS[k]=arr;}
    const off=document.createElement('canvas');off.width=RW;off.height=RH;const og=off.getContext('2d');
    const img=og.createImageData(RW,RH);const buf=new Uint32Array(img.data.buffer);const zb=new Float32Array(RW);
    // сущности
    const pl={x:1.5,y:1.5,a:0,hp:100+25*P.hp,max:100+25*P.hp,cd:0,bob:0,kick:0,flash:0,hurt:0};
    for(const [dx,dy,a] of [[1,0,0],[0,1,Math.PI/2]])if(free(1+dx,1+dy)){pl.a=a;break;}
    const ents=[];const nE=Math.round(6+3*D);
    for(let i=0;i<nE*20&&ents.length<nE;i++){const x=rndi(1,N-2),y=rndi(1,N-2);if(free(x,y)&&d0[y][x]>6){const t=D>1.35&&Math.random()<.25?'crab':pick(['drone','ghost','drone']);
      ents.push({t,x:x+.5,y:y+.5,hp:t==='crab'?6:t==='drone'?3:2,cd:rnd(1,2),fl:0,dead:0,s:t==='ghost'?2.1:t==='crab'?.9:1.2});}}
    const items=[{t:'page',x:far[0]+.5,y:far[1]+.5}];
    for(let i=0;i<40&&items.length<6;i++){const x=rndi(1,N-2),y=rndi(1,N-2);if(free(x,y)&&d0[y][x]>3)items.push({t:pick(['heart','like','like']),x:x+.5,y:y+.5});}
    const shots=[];let dist=bfs(1,1),dt0=0,t=0,kills=0,end=0,beam=0,msg='',mt=0;
    function los(x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d*8);for(let i=1;i<n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;if(!free(x,y))return false;}return true;}
    function hurt(dm){if(end)return;dm/=P.def;pl.hp-=dm;pl.hurt=1;sfx('hurt');shake(7);if(pl.hp<=0){pl.hp=0;end=1;setTimeout(()=>ctx.lose({text:'Черепаха заблудилась в лабиринте и стала его частью. Теперь она — стена.'}),900);}}
    function tryMove(nx,ny){const r=.22;if(free(nx+Math.sign(nx-pl.x)*r,pl.y))pl.x=nx;if(free(pl.x,ny+Math.sign(ny-pl.y)*r))pl.y=ny;}
    return{
      update(dt){if(end){t+=dt;return;}t+=dt;mt-=dt;
        if(M.click&&document.pointerLockElement!==cv)lockPointer();
        const locked=document.pointerLockElement===cv;
        if(locked)pl.a+=M.dx*.0026;
        pl.a+=((held('right')&&!K.KeyD?1:0)-(held('left')&&!K.KeyA?1:0)+(K.KeyE?1:0)-(K.KeyQ?1:0))*2.6*dt;
        const fw=((K.KeyW||K.ArrowUp)?1:0)-((K.KeyS||K.ArrowDown)?1:0),sd=(K.KeyD?1:0)-(K.KeyA?1:0),sp=3.1*P.spd*dt;
        const ca=Math.cos(pl.a),sa=Math.sin(pl.a);
        if(fw||sd){tryMove(pl.x+(ca*fw-sa*sd)*sp,pl.y+(sa*fw+ca*sd)*sp);pl.bob+=dt*10;if(Math.floor(pl.bob/Math.PI)!==Math.floor((pl.bob-dt*10)/Math.PI))sfx('step');}
        pl.cd-=dt;pl.kick=Math.max(0,pl.kick-dt*6);pl.flash=Math.max(0,pl.flash-dt*8);pl.hurt=Math.max(0,pl.hurt-dt*2);beam=Math.max(0,beam-dt*10);
        if((K.Space||K.KeyJ||(M.down&&locked))&&pl.cd<=0){pl.cd=.28;pl.kick=1;pl.flash=1;beam=1;sfx('laser');
          let best=null,bd=1e9;for(const e of ents){if(e.dead)continue;const dx=e.x-pl.x,dy=e.y-pl.y,d=Math.hypot(dx,dy);let da=Math.atan2(dy,dx)-pl.a;da=Math.atan2(Math.sin(da),Math.cos(da));
            if(Math.abs(da)<Math.max(.05,.35/d)&&d<bd&&los(pl.x,pl.y,e.x,e.y)){bd=d;best=e;}}
          if(best){best.hp-=P.atk;best.fl=1;sfx('hit');if(best.hp<=0){best.dead=1;kills++;sfx('explode');PFX.text(W/2,H/2-40,'+'+ctx.addLikes(4)+' ❤','#ff7',26);}}}
        dt0+=dt;if(dt0>.4){dt0=0;dist=bfs(pl.x|0,pl.y|0);}
        for(const e of ents){if(e.dead)continue;e.fl=Math.max(0,e.fl-dt*5);e.cd-=dt;const d=Math.hypot(pl.x-e.x,pl.y-e.y);const cx=e.x|0,cy=e.y|0,my=dist[cy]&&dist[cy][cx];
          const see=d<9&&los(e.x,e.y,pl.x,pl.y);
          if(my>=0&&my<14&&!(e.t==='drone'&&see&&d<3.5)){let tx=e.x,ty=e.y,bv=my;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const v=dist[cy+dy]&&dist[cy+dy][cx+dx];if(v>=0&&v<bv){bv=v;tx=cx+dx+.5;ty=cy+dy+.5;}}
            if(see&&d<2){tx=pl.x;ty=pl.y;}const a=Math.atan2(ty-e.y,tx-e.x),s=e.s*(1+.15*(D-1))*dt;const nx=e.x+Math.cos(a)*s,ny=e.y+Math.sin(a)*s;if(free(nx,ny)){e.x=nx;e.y=ny;}}
          if(e.t==='drone'&&see&&e.cd<=0){e.cd=rnd(1.4,2.2)/D;const a=Math.atan2(pl.y-e.y,pl.x-e.x);shots.push({x:e.x,y:e.y,vx:Math.cos(a)*4.2,vy:Math.sin(a)*4.2,life:4});sfx('shoot');}
          if(e.t!=='drone'&&d<.65&&e.cd<=0){e.cd=.9;hurt(e.t==='crab'?18:10);}}
        for(const s of shots){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(!free(s.x,s.y))s.life=0;if(Math.hypot(s.x-pl.x,s.y-pl.y)<.3){s.life=0;hurt(9);}}
        for(let i=shots.length-1;i>=0;i--)if(shots[i].life<=0)shots.splice(i,1);
        for(const it of items){if(it.got)continue;if(Math.hypot(it.x-pl.x,it.y-pl.y)<.5){it.got=1;
          if(it.t==='page'){end=1;sfx('win');const st=1+(kills>=ents.length*.5?1:0)+(pl.hp>pl.max*.5?1:0);ctx.win({stars:st,text:`Страница найдена! Уничтожено врагов: ${kills}/${ents.length}. Здоровье: ${Math.round(pl.hp)}.`});}
          else if(it.t==='heart'){pl.hp=Math.min(pl.max,pl.hp+35);sfx('power');msg='+35 здоровья';mt=1.5;}else{ctx.addLikes(5);sfx('like');msg='+5 ❤';mt=1.5;}}}
      },
      draw(g){
        const ca=Math.cos(pl.a),sa=Math.sin(pl.a),pX=-sa*.7,pY=ca*.7,hz=RH/2+(Math.sin(pl.bob)*1.5|0);
        // пол и потолок
        for(let y=0;y<RH;y++){const fl=y>hz;const p=fl?y-hz:hz-y;if(p===0){for(let x=0;x<RW;x++)buf[y*RW+x]=pk(10,0,20);continue;}
          const rd=(.5*RH)/p,fog=clamp(1-rd/9,0,1);const lx=ca-pX,ly=sa-pY,stx=rd*(2*pX)/RW,sty=rd*(2*pY)/RW;let fx=pl.x+rd*lx,fy=pl.y+rd*ly;
          const base=fl?pk(18*fog+6,6*fog,40*fog+10):pk(6,4*fog,20*fog+6),line=fl?pk(249*fog+6,61*fog,242*fog+10):pk(20*fog,120*fog,160*fog+6);
          for(let x=0;x<RW;x++){const ux=fx-Math.floor(fx),uy=fy-Math.floor(fy);buf[y*RW+x]=(ux<.04||uy<.04)?line:base;fx+=stx;fy+=sty;}}
        // стены
        for(let x=0;x<RW;x++){const cam=2*x/RW-1,rx=ca+pX*cam,ry=sa+pY*cam;let mx=pl.x|0,my=pl.y|0;const ddx=Math.abs(1/rx),ddy=Math.abs(1/ry);
          let sx,sy,sdx,sdy,side=0,hitv=0;if(rx<0){sx=-1;sdx=(pl.x-mx)*ddx;}else{sx=1;sdx=(mx+1-pl.x)*ddx;}if(ry<0){sy=-1;sdy=(pl.y-my)*ddy;}else{sy=1;sdy=(my+1-pl.y)*ddy;}
          for(let k=0;k<64;k++){if(sdx<sdy){sdx+=ddx;mx+=sx;side=0;}else{sdy+=ddy;my+=sy;side=1;}if(mx<0||my<0||mx>=N||my>=N){hitv=2;break;}seen[my][mx]=1;if(map[my][mx]){hitv=map[my][mx];break;}}
          const pd=Math.max(.05,side===0?sdx-ddx:sdy-ddy);zb[x]=pd;const lh=RH/pd;let ds=Math.floor(-lh/2+hz),de=Math.floor(lh/2+hz);
          let wx=side===0?pl.y+pd*ry:pl.x+pd*rx;wx-=Math.floor(wx);let tx=Math.floor(wx*TX);if((side===0&&rx>0)||(side===1&&ry<0))tx=TX-tx-1;
          const sh=clamp(Math.floor((1-pd/10)*SH)-(side?3:0),0,SH-1),T=TEXS[hitv]||TEXS[1],off0=sh*TX*TX;const step=TX/lh;let tp=(Math.max(0,ds)-hz+lh/2)*step;
          for(let y=Math.max(0,ds);y<Math.min(RH,de);y++){buf[y*RW+x]=T[off0+((tp|0)&63)*TX+tx];tp+=step;}}
        og.putImageData(img,0,0);
        // спрайты
        const sprites=[];for(const e of ents)if(!e.dead)sprites.push({x:e.x,y:e.y,im:e.t,sc:e.t==='crab'?.8:.7,fl:e.fl,fly:e.t!=='crab'});
        for(const it of items)if(!it.got)sprites.push({x:it.x,y:it.y,txt:it.t==='page'?'📅':it.t==='heart'?'💚':'❤',sc:it.t==='page'?.6:.35,bob:1});
        for(const s of shots)sprites.push({x:s.x,y:s.y,orb:1,sc:.25});
        const inv=1/(pX*sa-ca*pY);
        sprites.forEach(s=>{const dx=s.x-pl.x,dy=s.y-pl.y;s.tx=inv*(sa*dx-ca*dy);s.ty=inv*(-pY*dx+pX*dy);});
        sprites.sort((a,b)=>b.ty-a.ty);
        for(const s of sprites){if(s.ty<=.15)continue;const scx=(RW/2)*(1+s.tx/s.ty),sz=Math.abs(RH/s.ty)*s.sc,yOff=(s.fly?-.12:s.bob?Math.sin(t*3)*.08:.18)*RH/s.ty;
          const x0=Math.floor(scx-sz/2),y0=hz-sz/2+yOff;
          if(s.orb){const cx=scx|0;if(cx>=0&&cx<RW&&s.ty<zb[cx]){const gr=og.createRadialGradient(scx,y0+sz/2,0,scx,y0+sz/2,sz/2);gr.addColorStop(0,'#fff');gr.addColorStop(.4,'#ff3df2');gr.addColorStop(1,'rgba(255,0,200,0)');og.fillStyle=gr;og.fillRect(scx-sz/2,y0,sz,sz);}continue;}
          if(s.txt){const cx=scx|0;if(cx>=0&&cx<RW&&s.ty<zb[cx]){og.font=`${Math.max(4,sz|0)}px serif`;og.textAlign='center';og.textBaseline='middle';og.fillText(s.txt,scx,y0+sz/2);}continue;}
          const im=IMG[s.im];if(!ok(im))continue;const iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,h2=sz*ih/iw;
          for(let x=Math.max(0,x0);x<Math.min(RW,x0+sz);x++){if(s.ty>=zb[x])continue;const tx=Math.floor((x-x0)/sz*iw);og.drawImage(im,tx,0,1,ih,x,y0+(sz-h2),1,h2);
            if(s.fl&&WHITE[s.im]){og.globalAlpha=s.fl;og.drawImage(WHITE[s.im],tx,0,1,ih,x,y0+(sz-h2),1,h2);og.globalAlpha=1;}}}
        g.save();g.imageSmoothingEnabled=false;g.drawImage(off,0,0,W,H);g.restore();
        // оружие
        const bx=Math.sin(pl.bob)*14,by=Math.abs(Math.cos(pl.bob))*10+pl.kick*30;
        if(beam>0){g.save();g.globalAlpha=beam;neonLine(g,W/2+120+bx,H-150+by,W/2,H/2,'#27f3ff',6*beam);g.restore();}
        if(pl.flash>0)glow(g,W/2+110+bx,H-170+by,90,'rgba(120,255,255,.9)',pl.flash);
        spr(g,'paws',W/2+bx+60,H+by+10,{w:640});
        // прицел, HUD
        g.save();g.strokeStyle='#fff';g.lineWidth=2;g.shadowColor='#0ff';g.shadowBlur=8;g.beginPath();g.moveTo(W/2-12,H/2);g.lineTo(W/2-4,H/2);g.moveTo(W/2+4,H/2);g.lineTo(W/2+12,H/2);g.moveTo(W/2,H/2-12);g.lineTo(W/2,H/2-4);g.moveTo(W/2,H/2+4);g.lineTo(W/2,H/2+12);g.stroke();g.restore();
        if(pl.hurt>0){g.fillStyle=`rgba(255,0,40,${pl.hurt*.35})`;g.fillRect(0,0,W,H);}
        bar(g,20,H-40,260,20,pl.hp/pl.max,'#3dff8a',{label:'ПАНЦИРЬ '+Math.round(pl.hp)});
        txt(g,`💀 ${kills}/${ents.length}`,20,H-52,{size:18,color:'#fff',stroke:'#000',sw:3});
        if(mt>0)txt(g,msg,W/2,H/2+60,{size:22,align:'center',color:'#ff7',stroke:'#000',sw:4});
        const ms=Math.floor(150/N),ox=W-N*ms-12,oy=34;g.save();g.globalAlpha=.85;g.fillStyle='rgba(0,0,0,.6)';g.fillRect(ox-4,oy-4,N*ms+8,N*ms+8);
        for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(seen[y][x]||Math.hypot(x-pl.x,y-pl.y)<2){g.fillStyle=map[y][x]?'#5a2a8a':'#1a1030';g.fillRect(ox+x*ms,oy+y*ms,ms,ms);}
        g.fillStyle='#0ff';g.beginPath();g.arc(ox+pl.x*ms,oy+pl.y*ms,ms*.7,0,7);g.fill();g.strokeStyle='#0ff';g.beginPath();g.moveTo(ox+pl.x*ms,oy+pl.y*ms);g.lineTo(ox+(pl.x+ca*1.5)*ms,oy+(pl.y+sa*1.5)*ms);g.stroke();
        if(seen[far[1]][far[0]]||items[0].seen){items[0].seen=1;txt(g,'📅',ox+far[0]*ms+ms/2,oy+far[1]*ms+ms,{size:12,align:'center'});}g.restore();
        if(document.pointerLockElement!==cv&&t<8)txt(g,'Кликни по экрану, чтобы управлять мышью',W/2,H-80,{size:15,align:'center',color:'#ff0',stroke:'#000',sw:3});
        PFX.draw(g);
      }};
  }};
