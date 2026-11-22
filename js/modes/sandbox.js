'use strict';
/* ПЕСОЧНИЦА — «Черепаший песок»: симулятор падающего песка */
MODES.sandbox={genre:'Песочница',title:'Черепаший песок',icon:'🏖',music:'chill',bg:'bg_dream',
  goal:'Мир 2278 года рассыпался в песок. Твори что хочешь: песок, вода, лава, капуста, огонь, черепахи. Выполни 3 из 5 творческих заданий и опубликуй свой мир в паблике.',
  controls:['ЛКМ — рисовать · ПКМ — стирать · колесо или [ ] — размер кисти · 1-9 — материал','C — очистить мир · P — опубликовать пост (после 3 заданий)'],
  create(ctx){
    const GW=240,GH=110,CS=4,OY=30,N=GW*GH,BOT=OY+GH*CS;
    const c=new Uint8Array(N),sh=new Uint8Array(N),lf=new Uint8Array(N),up=new Uint8Array(N);
    const COL=[null,[232,200,110],[40,120,255],[112,106,128],[255,90,20],[60,210,70],[255,190,40],[205,222,238],[70,36,110]];
    const TOOLS=[{n:'Песок',ic:'🟨',m:1},{n:'Вода',ic:'💧',m:2},{n:'Камень',ic:'🪨',m:3},{n:'Лава',ic:'🌋',m:4},{n:'Капуста',ic:'🥬',m:5},{n:'Огонь',ic:'🔥',m:6},{n:'Черепаха',ic:'🐢',m:'T'},{n:'Бомба',ic:'💣',m:'B'},{n:'Ластик',ic:'🧽',m:0}];
    const ST={obs:0,turtles:0,eaten:0,grown:0,maxSteam:0},cnt=new Array(9).fill(0);
    const TASKS=[{n:'Вырасти 150 капусты (сажай у воды)',ic:'🥬',ok:()=>ST.grown>=150,v:()=>Math.min(ST.grown,150)+'/150'},
      {n:'Получи 60 клеток обсидиана (лава + вода)',ic:'🪨',ok:()=>ST.obs>=60,v:()=>Math.min(ST.obs,60)+'/60'},
      {n:'Запусти 5 черепах',ic:'🐢',ok:()=>ST.turtles>=5,v:()=>Math.min(ST.turtles,5)+'/5'},
      {n:'Черепахи съели 40 капусты',ic:'😋',ok:()=>ST.eaten>=40,v:()=>Math.min(ST.eaten,40)+'/40'},
      {n:'Устрой баню: 150 клеток пара сразу',ic:'♨',ok:()=>ST.maxSteam>=150,v:()=>Math.min(ST.maxSteam,150)+'/150'}];
    const done=TASKS.map(()=>false);let tool=0,brush=4,fc=1,t=0,tur=[],note='',noteT=0,posted=0,first=1;
    const set=(i,m)=>{c[i]=m;sh[i]=(Math.random()*255)|0;lf[i]=m===6?20+(Math.random()*40|0):m===7?90+(Math.random()*120|0):0;};
    function mv(i,j){const a=c[i],b=sh[i],l=lf[i];c[i]=c[j];sh[i]=sh[j];lf[i]=lf[j];c[j]=a;sh[j]=b;lf[j]=l;up[i]=up[j]=fc;}
    const N4=[[0,1],[0,-1],[1,0],[-1,0]];
    function powder(x,y,i){if(y+1>=GH)return;const b=i+GW,cb=c[b];if(cb===0||cb===2||cb===7||(cb===4&&Math.random()<.3)){mv(i,b);return;}
      const d=Math.random()<.5?-1:1;for(const dx of[d,-d]){const nx=x+dx;if(nx<0||nx>=GW)continue;const cj=c[b+dx];if(cj===0||cj===2){mv(i,b+dx);return;}}}
    function liquid(x,y,i,s){if(y+1<GH){const b=i+GW;if(c[b]===0||c[b]===7){mv(i,b);return;}const d=Math.random()<.5?-1:1;for(const dx of[d,-d]){const nx=x+dx;if(nx>=0&&nx<GW&&c[b+dx]===0){mv(i,b+dx);return;}}}
      const d=Math.random()<.5?-1:1;for(const dx of[d,-d]){let j=-1;for(let k=1;k<=s;k++){const nx=x+dx*k;if(nx<0||nx>=GW||c[i+dx*k]!==0)break;j=i+dx*k;}if(j>=0){mv(i,j);return;}}}
    function nb(x,y,f){for(const[dx,dy]of N4){const nx=x+dx,ny=y+dy;if(nx<0||nx>=GW||ny<0||ny>=GH)continue;if(f(ny*GW+nx))return 1;}return 0;}
    function sim(){fc=fc>=255?1:fc+1;cnt.fill(0);
      for(let y=GH-1;y>=0;y--){const l2r=(y+fc)&1;for(let k=0;k<GW;k++){const x=l2r?k:GW-1-k,i=y*GW+x,m=c[i];if(!m)continue;cnt[m]++;if(up[i]===fc)continue;
        if(m===1)powder(x,y,i);
        else if(m===2)liquid(x,y,i,3);
        else if(m===4){if(nb(x,y,j=>{if(c[j]===2){set(j,7);up[j]=fc;if(Math.random()<.35){set(i,8);up[i]=fc;ST.obs++;return 1;}}if((c[j]===5)&&Math.random()<.08)set(j,6);return 0;}))continue;if(Math.random()<.45)liquid(x,y,i,1);}
        else if(m===5){if(y+1<GH&&c[i+GW]===0&&lf[i]===0){mv(i,i+GW);continue;}if(Math.random()<.02)nb(x,y,j=>{if(c[j]===2&&Math.random()<.5){set(j,5);lf[j]=1;up[j]=fc;ST.grown++;return 1;}return 0;});}
        else if(m===6){if(--lf[i]<=0){c[i]=0;continue;}nb(x,y,j=>{if(c[j]===5&&Math.random()<.06){set(j,6);up[j]=fc;}if(c[j]===2&&Math.random()<.2){set(j,7);c[i]=0;return 1;}return 0;});
          if(c[i]&&Math.random()<.6&&y>0){const dx=(Math.random()*3|0)-1,j=i-GW+dx;if(x+dx>=0&&x+dx<GW&&c[j]===0)mv(i,j);}}
        else if(m===7){if(--lf[i]<=0){if(Math.random()<.4){c[i]=2;}else c[i]=0;continue;}if(Math.random()<.7){const dx=(Math.random()*3|0)-1,nx=x+dx;
          if(y>0&&nx>=0&&nx<GW&&c[i-GW+dx]===0)mv(i,i-GW+dx);else if(nx>=0&&nx<GW&&c[i+dx]===0)mv(i,i+dx);}}}}
      ST.maxSteam=Math.max(ST.maxSteam,cnt[7]);}
    function cellAt(px,py){const x=Math.floor(px/CS),y=Math.floor((py-OY)/CS);if(x<0||x>=GW||y>=GH)return 3;if(y<0)return 0;return c[y*GW+x];}
    const solid=(px,py)=>{const m=cellAt(px,py);return m===1||m===3||m===5||m===8;};
    function paint(mx,my,m,r){const cx=Math.floor(mx/CS),cy=Math.floor((my-OY)/CS);
      for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(x<0||x>=GW||y<0||y>=GH||(x-cx)**2+(y-cy)**2>r*r)continue;const i=y*GW+x;
        if(m===0){c[i]=0;continue;}if(c[i]!==0&&!(m===6&&c[i]===5))continue;if((m===1||m===2||m===4||m===6)&&Math.random()<.5)continue;set(i,m);}}
    function bomb(mx,my){const cx=Math.floor(mx/CS),cy=Math.floor((my-OY)/CS),r=13;for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(x<0||x>=GW||y<0||y>=GH)continue;const d=(x-cx)**2+(y-cy)**2;
        if(d<=r*r){const i=y*GW+x;if(d>(r-3)**2&&c[i]===0&&Math.random()<.5)set(i,6);else if(d<=(r-3)**2)c[i]=0;}}
      shake(10);sfx('explode');PFX.burst(mx,my,40,['#ff0','#f80','#fff'],320,.6,5);for(const u of tur)if(dist(u.x,u.y,mx,my)<90){u.vy=-380;u.dir=u.x<mx?-1:1;PFX.text(u.x,u.y-30,'ЧЕРЕПАХА?!','#ff0',14);}}
    function addTurtle(x,y,count=true){if(tur.length>=30){note='Максимум 30 черепах. Это и так много черепах.';noteT=2;return;}tur.push({x,y,vy:0,dir:Math.random()<.5?-1:1,ph:rnd(9),g:0,hot:0,eatT:0});if(count){ST.turtles++;}sfx('jump');
      if(first){first=0;cherepaha();}PFX.text(x,y-30,'черепаха','#fff',14);}
    function updTurtle(u,dt){u.hot-=dt;u.eatT-=dt;const inW=cellAt(u.x,u.y-6)===2,inL=cellAt(u.x,u.y-4)===4||cellAt(u.x,u.y+2)===4;
      u.vy+=700*dt;if(inW){u.vy-=1150*dt;u.vy=clamp(u.vy,-60,60);}
      if(inL&&u.hot<=0){u.vy=-360;u.hot=1;PFX.text(u.x,u.y-30,'АЙ! ГОРЯЧО!','#f80',14);sfx('hurt');}
      let ny=u.y+u.vy*dt;u.g=0;
      if(u.vy>=0&&(solid(u.x-8,ny)||solid(u.x+8,ny))){let k=0;while((solid(u.x-8,ny)||solid(u.x+8,ny))&&k<24){ny-=1;k++;}u.vy=0;u.g=1;}
      else if(u.vy<0&&solid(u.x,ny-18)){u.vy=0;ny=u.y;}
      u.y=Math.min(ny,BOT);
      const nx=u.x+u.dir*(inW?20:30)*dt,fx=nx+u.dir*12;
      if(solid(fx,u.y-2)){let ok=0;for(let s=1;s<=9;s++)if(!solid(fx,u.y-2-s)&&!solid(fx,u.y-14-s)){u.y-=s;u.x=nx;ok=1;break;}if(!ok)u.dir*=-1;}else u.x=nx;
      if(u.x<12){u.x=12;u.dir=1;}if(u.x>W-12){u.x=W-12;u.dir=-1;}if(Math.random()<dt*.08)u.dir*=-1;
      if(u.eatT<=0){const hx=Math.floor((u.x+u.dir*14)/CS),hy=Math.floor((u.y-8-OY)/CS);
        for(let y=hy-2;y<=hy+2;y++)for(let x=hx-2;x<=hx+2;x++){if(x<0||x>=GW||y<0||y>=GH)continue;const i=y*GW+x;if(c[i]===5){c[i]=0;ST.eaten++;u.eatT=.25;if(Math.random()<.15)PFX.text(u.x,u.y-28,pick(['ням','хрум','капуста!','черепаха']),'#9f5',13);y=99;break;}}}}
    // стартовый мир
    for(let x=0;x<GW;x++){const h=Math.floor(10+5*Math.sin(x/23)+3*Math.sin(x/7.3+1));for(let y=GH-h;y<GH;y++)set(y*GW+x,3);}
    for(let x=14;x<74;x++){const d=Math.floor(9*Math.sin((x-14)/60*Math.PI));for(let y=GH-18;y<GH-18+d+8;y++){const i=y*GW+x;if(y<GH)c[i]=0;}}
    for(let x=14;x<74;x++)for(let y=GH-24;y<GH;y++){const i=y*GW+x;if(c[i]===0&&y>GH-20)set(i,2);}
    for(let x=150;x<230;x++){const h=Math.floor(12*Math.sin((x-150)/80*Math.PI));for(let k=0;k<h;k++){const y=GH-14-k;if(y>=0&&c[y*GW+x]===0)set(y*GW+x,1);}}
    for(let x=76;x<84;x++)for(let y=GH-26;y<GH-16;y++)if(c[y*GW+x]===0)set(y*GW+x,5);
    try{const oc=document.createElement('canvas');oc.width=GW;oc.height=GH;const o=oc.getContext('2d');o.fillStyle='#fff';o.font='bold 30px Arial';o.textAlign='center';o.textBaseline='top';o.fillText('ЧЕРЕПАХА',GW/2,4);
      const d=o.getImageData(0,0,GW,GH).data;for(let i=0;i<N;i++)if(d[i*4+3]>110&&c[i]===0)set(i,1);}catch(e){}
    addTurtle(300,200,false);
    const oc=document.createElement('canvas');oc.width=GW;oc.height=GH;const ox=oc.getContext('2d');const img=ox.createImageData(GW,GH);
    function publish(){if(posted)return;posted=1;const n=done.filter(Boolean).length;sfx('win');cherepaha();
      ctx.win({stars:n>=5?3:n>=4?2:1,xp:20*n,text:`Твой мир опубликован в паблике «черепаха». Заданий выполнено: ${n}/5, черепах запущено: ${ST.turtles}, капусты съедено: ${ST.eaten}. Подпись к посту: «черепаха».`});}
    return{get dbg(){return{t,ST:JSON.stringify(ST),done:done.filter(Boolean).length,tur:tur.length,sand:cnt[1],water:cnt[2]};},
      api:{paint,addTurtle,bomb,set,c,GW,GH,CS,OY},
      update(dt){t+=dt;noteT-=dt;sim();for(const u of tur)updTurtle(u,dt);
        for(let k=0;k<9;k++)if(KP['Digit'+(k+1)]){tool=k;sfx('select');}
        if(KP.BracketLeft||M.wheel>0)brush=Math.max(1,brush-1);if(KP.BracketRight||M.wheel<0)brush=Math.min(14,brush+1);M.wheel=0;
        if(KP.KeyC){c.fill(0);sfx('explode');note='Мир очищен. Чистый лист 2278 года.';noteT=2;}
        const inField=M.y>OY&&M.y<BOT,T=TOOLS[tool];
        if(inField){if(T.m==='T'){if(M.click){M.click=false;addTurtle(M.x,M.y);}}else if(T.m==='B'){if(M.click){M.click=false;bomb(M.x,M.y);}}
          else if(M.down){paint(M.x,M.y,T.m,brush);if(Math.random()<.15)AU.noise(.02,.02,T.m===2?800:3000);}
          if(M.rdown)paint(M.x,M.y,0,brush);}
        TASKS.forEach((k,i)=>{if(!done[i]&&k.ok()){done[i]=true;sfx('power');ctx.addLikes(20);note=`✅ Задание выполнено: ${k.n}`;noteT=3;PFX.burst(W/2,80,40,['#ff0','#0ff','#f0f'],260,.8,5);}});
        if(KP.KeyP&&done.filter(Boolean).length>=3)publish();},
      draw(g){drawBG(g,'bg_dream',.55);
        const d=img.data;for(let i=0;i<N;i++){const m=c[i],p=i*4;if(!m){d[p+3]=0;continue;}const col=COL[m];let k=.82+sh[i]/255*.3;
          if(m===6)k=.7+Math.random()*.5;else if(m===4)k=.85+.15*Math.sin(t*3+sh[i]);else if(m===2)k=.9+.1*Math.sin(t*2+(i%GW)*.3+sh[i]*.05);
          d[p]=Math.min(255,col[0]*k);d[p+1]=Math.min(255,col[1]*k);d[p+2]=Math.min(255,col[2]*k);d[p+3]=m===7?120:m===2?215:255;}
        ox.putImageData(img,0,0);g.save();g.imageSmoothingEnabled=false;g.drawImage(oc,0,OY,GW*CS,GH*CS);g.restore();
        for(const u of tur)turtle(g,u.x,u.y+1,{scale:.17,dir:u.dir,anim:u.g?'walk':u.vy<0?'jump':'idle',fps:9,t:TIME+u.ph,shadow:false,visor:ctx.visor,flash:u.hot>0?u.hot:0});
        PFX.draw(g);
        const T=TOOLS[tool];if(M.y>OY&&M.y<BOT){g.save();g.strokeStyle='rgba(255,255,255,.7)';g.setLineDash([3,3]);g.beginPath();g.arc(M.x,M.y,T.m==='B'?52:T.m==='T'?14:brush*CS,0,7);g.stroke();g.restore();}
        g.save();g.globalAlpha=.88;panel(g,W-292,34,284,138,{fill:'rgba(6,2,22,.75)',blur:4});g.restore();
        txt(g,'🎨 ТВОРЧЕСКИЕ ЗАДАНИЯ',W-282,54,{size:13,color:'#ffe066'});
        TASKS.forEach((k,i)=>{txt(g,(done[i]?'✅ ':k.ic+' ')+k.n,W-282,76+i*20,{size:11,color:done[i]?'#7f7':'#fff',bold:false});if(!done[i])txt(g,k.v(),W-14,76+i*20,{size:11,align:'right',color:'#9cf'});});
        if(noteT>0)txt(g,note,W/2-120,60,{size:17,align:'center',color:'#fff',stroke:'#000',sw:4,alpha:Math.min(1,noteT)});
        panel(g,0,BOT+2,W,H-BOT-2,{fill:'rgba(6,2,22,.94)',r:0,blur:4});
        TOOLS.forEach((T2,k)=>{const x=6+k*76;if(button(g,x,BOT+8,70,56,'',{sel:k===tool,size:12})){tool=k;}txt(g,T2.ic,x+35,BOT+34,{size:22,align:'center'});txt(g,(k+1)+' '+T2.n,x+35,BOT+56,{size:10,align:'center',color:'#cff'});});
        txt(g,'Кисть: '+brush,700,BOT+30,{size:13,color:'#9cf'});txt(g,'C — очистить',700,BOT+52,{size:12,color:'#789'});
        const n=done.filter(Boolean).length;if(button(g,800,BOT+10,152,52,n>=3?'📸 Опубликовать':`📸 ещё ${3-n} зад.`,{disabled:n<3,size:15}))publish();
      }};
  }};
