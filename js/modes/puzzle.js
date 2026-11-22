'use strict';
/* ГОЛОВОЛОМКА — «Инкубатор времени» (сокобан). Все уровни проверены BFS-решателем, par = оптимум ходов */
MODES.puzzle={genre:'Головоломка',title:'Инкубатор времени',icon:'🥚',music:'chill',bg:'bg_dream',
  goal:'Инкубатор сломался: время скачет, яйца остывают. Затолкай черепашьи яйца в тёплые гнёзда, пока не кончилось тепло. Три зала, три загадки.',
  controls:['←↑→↓ / WASD — ходить и толкать яйца (тянуть нельзя!)','Z / Backspace — отменить ход · R — заново (таймер не сбрасывается)'],
  create(ctx){
    const D=ctx.D;
    const POOL=[
      [{m:["#######","#     #","# $#$ #","# .@. #","#  #  #","#######"],par:10},
       {m:["#######","# .   #","# $#$ #","#  .  #","## @ ##"," ##### "],par:14},
       {m:[" #######","##  #  #","#  $ $ #","# .#.  #","##  @ ##"," ###### "],par:16}],
      [{m:[" ########"," #  #   #"," # $  $ #","## .##. #","#  $  # #","# @ .   #","#########"],par:19},
       {m:["  ######","###    #","#  $ # #","# #. $ ##","# . @$. #","##  #   #"," ####### "],par:19},
       {m:["#########","#  . .  #","# $ # $ #","##  @  ##"," # $#. # "," #     # "," ####### "],par:30}],
      [{m:[" ####### "," #  .  # ","## $#$ ##","#  .@.  #","## $#$ ##"," #  .  # "," ####### "],par:30},
       {m:["#########","#   #   #","# $ . $ #","#  ###  #","#. $@$ .#","#  ###  #","# . $ . #","#   #   #","#########"],par:31},
       {m:["  #####  ","###   #  ","# $ # ## ","# #  . # ","#    # # ","## #   # "," #@$.### "," #####   "],par:41},
       {m:[" ###### "," #    # ","##$## # ","#  .  # ","# #$#.# ","#  @  # ","####### "],par:45}]];
    const R=srand(Math.abs(ctx.page.year)*7+ctx.page.i+ctx.page.tries*13), pk=a=>a[Math.floor(R()*a.length)];
    const seq=D>1.7?[pk(POOL[1]),POOL[2][R()<.5?0:1],POOL[2][R()<.5?2:3]]:[pk(POOL[0]),pk(POOL[1]),pk(POOL[2])];
    const DIRS={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
    let li=0,L=null,t=0,tl=0,moves=0,total=0,parSum=0,eggs=0,done=0,doneT=0,end=0,rep=0,lastDir=null,bump=0;
    function load(i,keepTime){
      const lv=seq[i],m=lv.m,rows=m.length,cols=Math.max(...m.map(r=>r.length));const wall=[],goal=[],boxes=[];let px=0,py=0;
      for(let y=0;y<rows;y++){wall.push([]);goal.push([]);for(let x=0;x<cols;x++){const c=m[y][x]||' ';wall[y][x]=c==='#';goal[y][x]='.*+'.includes(c);
        if('$*'.includes(c))boxes.push({x,y,dx:x,dy:y,on:goal[y][x],wob:0});if('@+'.includes(c)){px=x;py=y;}}}
      const ins=[];for(let y=0;y<rows;y++)ins.push(new Array(cols).fill(false));
      const st=[[px,py]];while(st.length){const [x,y]=st.pop();if(x<0||y<0||x>=cols||y>=rows||ins[y][x]||wall[y][x])continue;ins[y][x]=true;st.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}
      const cs=Math.min(66,Math.floor((W-140)/cols),Math.floor((H-160)/rows));
      const lim=Math.round((lv.par*2.6+60)/(.75+.25*D));
      L={lv,rows,cols,wall,goal,boxes,ins,px,py,dx:px,dy:py,cs,ox:Math.round((W-cols*cs)/2),oy:Math.round(96+(H-150-rows*cs)/2),hist:[],face:1,push:0,limit:lim};
      moves=0;done=0;doneT=0;if(!keepTime)tl=lim;
    }
    load(0);
    const isWall=(x,y)=>y<0||y>=L.rows||x<0||x>=L.cols||L.wall[y][x];
    const boxAt=(x,y)=>L.boxes.find(b=>b.x===x&&b.y===y);
    const adjIns=(x,y)=>{for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=x+i,yy=y+j;if(yy>=0&&yy<L.rows&&xx>=0&&xx<L.cols&&L.ins[yy][xx])return true;}return false;};
    const stuck=()=>L.boxes.some(b=>!b.on&&(isWall(b.x-1,b.y)||isWall(b.x+1,b.y))&&(isWall(b.x,b.y-1)||isWall(b.x,b.y+1)));
    const cpos=(x,y)=>[L.ox+(x+.5)*L.cs,L.oy+(y+.5)*L.cs];
    function tryMove(d){
      const [dx,dy]=DIRS[d],nx=L.px+dx,ny=L.py+dy;if(dx)L.face=dx>0?1:-1;
      if(isWall(nx,ny)){bump=.12;sfx('click');return;}
      const b=boxAt(nx,ny);
      if(b){const bx=nx+dx,by=ny+dy;if(isWall(bx,by)||boxAt(bx,by)){bump=.12;sfx('miss');shake(2);return;}
        L.hist.push({px:L.px,py:L.py,b:L.boxes.indexOf(b),bx:b.x,by:b.y});b.x=bx;b.y=by;L.push=.28;AU.tone(170,.09,'triangle',.14,110);
        const on=L.goal[by][bx];if(on&&!b.on){const [cx,cy]=cpos(bx,by);sfx('like');b.wob=1;PFX.burst(cx,cy,16,['#ffb84a','#fff','#5ff'],180,.5,4);}b.on=on;}
      else L.hist.push({px:L.px,py:L.py,b:-1});
      L.px=nx;L.py=ny;moves++;sfx('step');
      if(L.boxes.every(b=>b.on)){done=1;doneT=0;total+=moves;parSum+=L.lv.par;eggs+=L.boxes.length;sfx('power');
        const n=ctx.addLikes(8*(li+1)+(moves<=L.lv.par*1.25?15:0));L.boxes.forEach(b=>{const [cx,cy]=cpos(b.x,b.y);PFX.burst(cx,cy,26,['#ffe066','#5f5','#fff'],260,.8,5);});
        PFX.text(W/2,150,'+'+n+' 👍','#ffe066',26);}
    }
    function undo(){const h=L.hist.pop();if(!h){sfx('miss');return;}L.px=h.px;L.py=h.py;if(h.face)L.face=h.face;
      if(h.b>=0){const b=L.boxes[h.b];b.x=h.bx;b.y=h.by;b.on=L.goal[b.y][b.x];}moves=Math.max(0,moves-1);sfx('back');}
    function drawEgg(g,cx,cy,cs,b){
      g.save();g.translate(cx,cy+cs*.04);const w=b.on?Math.sin(t*9+b.x)*.07*(1+b.wob*2):0;g.rotate(w);
      if(b.on)glow(g,0,0,cs*.6,'rgba(80,255,255,.45)');
      g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(0,cs*.3,cs*.24,cs*.07,0,0,7);g.fill();
      const gr=g.createRadialGradient(-cs*.08,-cs*.12,cs*.03,0,0,cs*.38);gr.addColorStop(0,'#fffdf4');gr.addColorStop(1,b.on?'#bff7ff':'#d9c9a3');
      g.fillStyle=gr;g.beginPath();g.ellipse(0,0,cs*.26,cs*.33,0,0,7);g.fill();
      g.fillStyle=b.on?'rgba(0,140,160,.5)':'rgba(120,80,30,.45)';[[-.09,-.1,.05],[.1,.04,.04],[-.03,.15,.035],[.07,-.2,.025]].forEach(s=>{g.beginPath();g.arc(s[0]*cs,s[1]*cs,s[2]*cs,0,7);g.fill();});
      if(b.on){g.strokeStyle='rgba(0,60,80,.7)';g.lineWidth=2;g.beginPath();g.moveTo(-cs*.2,-cs*.02);g.lineTo(-cs*.08,cs*.05);g.lineTo(0,-cs*.04);g.lineTo(cs*.1,cs*.06);g.lineTo(cs*.2,0);g.stroke();}
      g.restore();
    }
    return{
      update(dt){t+=dt;if(end)return;bump=Math.max(0,bump-dt);L.push=Math.max(0,L.push-dt);
        L.dx=lerp(L.dx,L.px,Math.min(1,dt*20));L.dy=lerp(L.dy,L.py,Math.min(1,dt*20));
        L.boxes.forEach(b=>{b.dx=lerp(b.dx,b.x,Math.min(1,dt*20));b.dy=lerp(b.dy,b.y,Math.min(1,dt*20));b.wob=Math.max(0,b.wob-dt*2);});
        if(done){doneT+=dt;if(doneT>2){li++;if(li>=seq.length){end=1;const r=total/parSum;
            ctx.win({stars:r<=1.3?3:r<=1.9?2:1,text:`Все ${eggs} яиц в гнёздах! Ходов: ${total} (рекорд инкубатора: ${parSum}). Вылупились черепашки и хором сказали: «черепаха».`});}
          else load(li);}return;}
        tl-=dt;if(tl<=0){end=1;sfx('lose');ctx.lose({text:'Инкубатор остыл. Яйца превратились в окаменелости 3278 года. Археологи будущего пишут: «черепаха».'});return;}
        if(tl<10&&Math.floor(tl*2)!==Math.floor((tl+dt)*2))sfx('beep');
        let dp=null;for(const d of ['left','right','up','down'])if(hit(d))dp=d;
        if(dp){tryMove(dp);rep=.22;lastDir=dp;}
        else if(lastDir&&held(lastDir)){rep-=dt;if(rep<=0){rep=.1;tryMove(lastDir);}}else lastDir=null;
        if(KP.KeyZ||KP.Backspace)undo();
        if(KP.KeyR){sfx('back');load(li,true);}
      },
      draw(g){
        drawBG(g,'bg_dream',.74,Math.sin(t*.2)*15,0);
        const cs=L.cs,ox=L.ox,oy=L.oy;
        panel(g,ox-14,oy-14,L.cols*cs+28,L.rows*cs+28,{fill:'rgba(5,0,18,.55)',stroke:'#7a5cff',blur:18,r:14});
        for(let y=0;y<L.rows;y++)for(let x=0;x<L.cols;x++){const X=ox+x*cs,Y=oy+y*cs;
          if(L.wall[y][x]){if(!adjIns(x,y))continue;g.fillStyle='#1b0a36';g.fillRect(X,Y,cs,cs);g.fillStyle='#2c1360';g.fillRect(X+3,Y+3,cs-6,cs-6);
            g.fillStyle='rgba(255,61,242,.6)';g.fillRect(X,Y,cs,3);g.fillStyle='rgba(39,243,255,.3)';g.fillRect(X,Y+cs-3,cs,3);
            g.fillStyle='rgba(255,255,255,.05)';g.fillRect(X+6,Y+6,cs*.35,4);}
          else if(L.ins[y][x]){g.fillStyle=(x+y)%2?'#100a26':'#160e33';g.fillRect(X,Y,cs,cs);g.strokeStyle='rgba(39,243,255,.07)';g.lineWidth=1;g.strokeRect(X+.5,Y+.5,cs-1,cs-1);}}
        for(let y=0;y<L.rows;y++)for(let x=0;x<L.cols;x++)if(L.goal[y][x]){const [cx,cy]=cpos(x,y);const p=.5+.5*Math.sin(t*3+x+y);
          g.save();g.strokeStyle='#ffb84a';g.shadowColor='#ff8a00';g.shadowBlur=10+p*10;g.lineWidth=3;g.beginPath();g.arc(cx,cy,cs*.34,0,7);g.stroke();
          g.strokeStyle='rgba(255,184,74,.5)';g.lineWidth=2;for(let k=0;k<6;k++){const a=k*1.05+t*.4;g.beginPath();g.moveTo(cx+Math.cos(a)*cs*.18,cy+Math.sin(a)*cs*.18);g.lineTo(cx+Math.cos(a+.5)*cs*.3,cy+Math.sin(a+.5)*cs*.3);g.stroke();}
          g.fillStyle=`rgba(255,140,0,${.1+p*.12})`;g.beginPath();g.arc(cx,cy,cs*.3,0,7);g.fill();g.restore();}
        const moving=Math.abs(L.dx-L.px)+Math.abs(L.dy-L.py)>.05;
        const [tx,ty]=[ox+(L.dx+.5)*cs,oy+(L.dy+.5)*cs];
        const ents=L.boxes.map(b=>({y:b.dy,f:()=>{const [cx,cy]=[ox+(b.dx+.5)*cs,oy+(b.dy+.5)*cs];
          if(done&&doneT>.35){const k=clamp((doneT-.35)*3,0,1);
            g.save();g.fillStyle='#fffbe9';g.translate(cx,cy);g.beginPath();g.ellipse(-cs*.2*k,cs*.12,cs*.16,cs*.12,-.5,0,Math.PI);g.fill();g.beginPath();g.ellipse(cs*.2*k,cs*.12,cs*.16,cs*.12,.5,0,Math.PI);g.fill();g.restore();
            turtle(g,cx+Math.sin(doneT*3+b.x)*cs*.15,cy+cs*.25-Math.abs(Math.sin(doneT*8+b.y))*cs*.25*k,{scale:cs/256*.55*k+.01,anim:'walk',dir:b.x%2?1:-1,fps:14,shadow:false});}
          else drawEgg(g,cx,cy,cs,b);}}));
        ents.push({y:L.dy+.01,f:()=>turtle(g,tx+(bump?Math.sin(t*90)*2:0),ty+cs*.36,{scale:cs/256*1.1,dir:L.face,anim:done?'dance':L.push>0?'attack':moving?'walk':'idle',fps:12,visor:ctx.visor})});
        ents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
        PFX.draw(g);
        txt(g,`ЗАЛ ${li+1}/${seq.length}`,24,60,{size:24,font:FONTB,color:'#fff',glow:'#f0f'});
        txt(g,`Ходы: ${moves}   ·   рекорд инкубатора: ${L.lv.par}`,24,82,{size:14,color:'#cdf'});
        txt(g,`Яйца: ${L.boxes.filter(b=>b.on).length}/${L.boxes.length}`,24,104,{size:14,color:'#ffb84a'});
        const crit=tl<20;txt(g,`🌡 ${Math.floor(Math.max(0,tl)/60)}:${String(Math.floor(Math.max(0,tl)%60)).padStart(2,'0')}`,W-24,62,{size:26,align:'right',color:crit?(Math.sin(t*12)>0?'#f55':'#fff'):'#9ff',font:FONTB});
        bar(g,W-224,72,200,8,tl/L.limit,crit?'#f33':'#27f3ff');txt(g,'тепло инкубатора',W-24,98,{size:12,align:'right',color:'#9bd'});
        if(done)glitchTitle(g,li+1>=seq.length?'ВСЕ ВЫЛУПИЛИСЬ!':'ВЫЛУПИЛИСЬ!',W/2,oy-24,40,'#5f5');
        else if(stuck())txt(g,'Яйцо застряло в углу! Z — отменить ход, R — начать зал заново',W/2,H-14,{size:15,align:'center',color:'#ff9',stroke:'#000',sw:4});
      }};
  }};
