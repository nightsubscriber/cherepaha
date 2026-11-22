'use strict';
/* ФАЙТИНГ — Обложка: «Человек-паук, согнутый в форму черепахи» (финальный босс) */
MODES.fighting={genre:'Файтинг',title:'Человек-паук, согнутый в черепаху',icon:'🥊',music:'boss',bg:'bg_space',
  goal:'Финальный бой за обложку календаря. Сбей с босса всё здоровье. Он сгибается, плюётся паутиной, прыгает и катается панцирем.',
  controls:['←→ — ходьба · ↑ — прыжок · ↓ — спрятаться в панцирь (блок)','J/Z — клюв (комбо) · K/X — панцирь-таран · ↓→+J — панцирный хадокен · L/C — «ЧЕРЕПАХА!» (супер)'],
  create(ctx){
    const D=ctx.D,P=ctx.P,F=ctx.F,FL=470,L0=60,R0=900;
    const p={x:220,y:FL,vx:0,vy:0,dir:1,hp:100+20*P.hp,max:100+20*P.hp,gr:1,jumps:0,atk:null,at:0,combo:0,ct:0,block:0,bt:0,inv:0,stun:0,slow:0,flash:0,ram:0,rcd:0,hcd:0,sup:0,hurtT:0};
    const B={x:720,y:FL,vx:0,vy:0,dir:-1,hp:Math.round(260+90*(D-1)),max:0,state:'intro',st:0,cd:1.4,phase:1,flash:0,inv:0,rot:0,dizzy:0,hitDone:0,shadowX:0};
    B.max=B.hp;
    const shots=[];let t=0,hitstop=0,slowmo=0,end=0,banner='БОЙ!',bannerT=2,inputs=[],dmgTaken=0;
    const pBox=()=>p.block?{x:p.x-55,y:p.y-50,w:110,h:50}:{x:p.x-60,y:p.y-72,w:120,h:72};
    const bBox=()=>B.state==='spin'&&B.st>.5?{x:B.x-80,y:B.y-120,w:160,h:120}:{x:B.x-105,y:B.y-150,w:210,h:150};
    function hurtBoss(dmg,kb,kind){if(B.inv>0||end)return 0;dmg=Math.round(dmg*P.atk*(B.dizzy>0?1.5:1));B.hp-=dmg;B.flash=1;B.x+=kb;hitstop=.06;shake(kind==='super'?18:6);
      sfx(kind==='super'?'explode':'punch');PFX.burst(B.x-B.dir*40,B.y-90,kind==='super'?50:18,['#fff','#ff3df2','#ffe066'],kind==='super'?500:300,.5,6);
      PFX.text(B.x+rnd(-30,30),B.y-170,'-'+dmg,'#ffe066',kind==='super'?40:26);p.sup=Math.min(1,p.sup+.07);ctx.addLikes(1);
      const ph=B.hp/B.max>.66?1:B.hp/B.max>.33?2:3;if(ph>B.phase){B.phase=ph;banner=ph===2?'ФАЗА 2: ПАУЧЬЯ ЧЕРЕПАХА':'ФАЗА 3: ЧЕРЕПАШИЙ ПАУК';bannerT=2;sfx('alarm');shake(14);}
      if(B.hp<=0){B.hp=0;end=1;slowmo=2.2;banner='К.О.!';bannerT=3;say('черепаха!',{pitch:1.3});
        setTimeout(()=>ctx.win({stars:p.hp>p.max*.6?3:p.hp>p.max*.25?2:1,text:`Человек-паук разогнулся и признал поражение. Здоровья осталось: ${Math.round(p.hp)}/${p.max}.`}),2600);}
      return dmg;}
    function hurtP(dmg,kb){if(p.inv>0||p.ram>0||end)return;let d=dmg/P.def;if(p.block){d*=.15;sfx('hit');PFX.burst(p.x,p.y-40,8,'#9ff',200,.3,4);}
      else{p.vx=kb;p.vy=-260;p.gr=0;p.stun=.35;p.inv=.5;p.flash=1;sfx('hurt');shake(9);PFX.burst(p.x,p.y-40,16,['#f33','#fa0'],260,.5,5);}
      p.hp-=d;dmgTaken+=d;p.sup=Math.min(1,p.sup+.1);PFX.text(p.x,p.y-100,'-'+Math.round(d),'#f55',22);
      if(p.hp<=0){p.hp=0;end=2;slowmo=1.5;banner='ТЫ ПРОИГРАЛ';bannerT=3;setTimeout(()=>ctx.lose({text:'Человек-паук согнул тебя в форму черепахи. Ты и так была черепахой, но всё равно обидно.'}),2000);}}
    function think(){const d=Math.abs(p.x-B.x),o=['web'];if(d<330)o.push('stab','stab');if(d>300)o.push('walk','walk');o.push('jump');if(B.phase>=2)o.push('spin');if(B.phase>=3)o.push('web','stab');
      B.state=pick(o);B.st=0;B.hitDone=0;}
    function shoot(type,x,y,vx,vy,o={}){shots.push(Object.assign({type,x,y,vx,vy,life:4,r:18},o));}
    return{
      update(dt){
        if(hitstop>0){hitstop-=dt;return;}
        if(slowmo>0){slowmo-=dt;dt*=.3;}
        t+=dt;bannerT-=dt;
        // --- игрок ---
        p.inv=Math.max(0,p.inv-dt);p.stun=Math.max(0,p.stun-dt);p.slow=Math.max(0,p.slow-dt);p.flash=Math.max(0,p.flash-dt*4);p.rcd-=dt;p.hcd-=dt;p.ct-=dt;
        const toward=p.x<B.x?1:-1;
        if(hit('down'))inputs.push(['D',t]);if((toward>0&&hit('right'))||(toward<0&&hit('left')))inputs.push(['F',t]);inputs=inputs.filter(i=>t-i[1]<.5);
        if(!end&&p.stun<=0&&p.ram<=0&&B.state!=='intro'){
          p.block=held('down')&&p.gr&&!p.atk?1:0; p.bt=p.block?p.bt+dt:0;
          const sp=(p.slow>0?110:240)*P.spd,mv=(held('right')?1:0)-(held('left')?1:0);
          if(!p.block&&!p.atk){p.vx=mv*sp;if(mv)p.dir=mv;}else p.vx*=.8;
          if(hit('up')&&!p.block&&(p.gr||(F.dj&&p.jumps<2))){p.vy=-720;p.gr=0;p.jumps++;sfx('jump');}
          if(hit('act')&&!p.block){const di=inputs.findIndex(i=>i[0]==='D');const had=di>=0&&inputs.slice(di).some(i=>i[0]==='F');
            if(had&&p.hcd<=0){p.hcd=1.4;p.dir=toward;inputs=[];shoot('shell',p.x+p.dir*70,p.y-40,p.dir*620,0,{owner:'p',dmg:9,rot:0});sfx('shoot');PFX.text(p.x,p.y-110,'ПАНЦИРНЫЙ ХАДОКЕН!','#0ff',20);p.atk='throw';p.at=0;}
            else if(!p.atk){p.atk='bite';p.at=0;p.hitDone=0;p.combo=p.ct>0?(p.combo%3)+1:1;p.ct=.6;p.dir=toward;sfx('click');}}
          if(hit('alt')&&p.rcd<=0&&!p.block){p.ram=.5;p.rcd=F.turbo?.7:1.2;p.dir=toward;p.hitDone=0;sfx('boost');}
          if((KP.KeyL||KP.KeyC)&&p.sup>=1){p.sup=0;say('черепаха!',{pitch:.8,rate:1.1});shake(20);sfx('explode');
            shoot('super',p.x+p.dir*80,p.y-70,p.dir*520,0,{owner:'p',dmg:28,r:70});banner='ЧЕРЕПАХА!';bannerT=1.2;}
        } else if(p.stun<=0&&p.ram<=0)p.block=0;
        if(p.ram>0){p.ram-=dt;p.vx=p.dir*620;if(!p.hitDone&&overlap(pBox(),bBox())){p.hitDone=1;hurtBoss(10,p.dir*30,'ram');p.ram=Math.min(p.ram,.08);p.vx=-p.dir*200;}}
        if(p.atk){p.at+=dt;if(p.atk==='bite'&&p.at>.07&&p.at<.2&&!p.hitDone){const hb={x:p.x+(p.dir>0?40:-130),y:p.y-80,w:90,h:55};
            if(overlap(hb,bBox())){p.hitDone=1;hurtBoss(5+p.combo*2,p.dir*14,'bite');if(p.combo===3){B.x+=p.dir*40;PFX.text(B.x,B.y-200,'КОМБО x3','#f0f',24);}}}
          if(p.at>(p.atk==='throw'?.3:.32))p.atk=null;}
        p.vy+=2000*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.y>=FL){if(!p.gr&&p.vy>200)sfx('land');p.y=FL;p.vy=0;p.gr=1;p.jumps=0;}
        p.x=clamp(p.x,L0,R0);
        // --- босс ---
        B.flash=Math.max(0,B.flash-dt*5);B.inv=Math.max(0,B.inv-dt);B.dizzy=Math.max(0,B.dizzy-dt);B.st+=dt;
        const spd=1+.22*(B.phase-1)+.12*(D-1);
        if(!end){
          if(B.state!=='spin'&&B.state!=='stab')B.dir=p.x<B.x?-1:1;
          switch(B.state){
            case'intro':if(B.st>1.6){B.state='idle';B.st=0;}break;
            case'idle':B.vx*=.8;if(B.st>B.cd/spd)think();break;
            case'walk':B.vx=B.dir*150*spd;if(B.st>.9){B.state='idle';B.st=0;B.cd=.4;}break;
            case'stab':if(B.st<.45/spd){B.vx=-B.dir*40;}else if(B.st<.7/spd){B.vx=B.dir*720;const hb={x:B.x+(B.dir>0?60:-200),y:B.y-110,w:140,h:80};if(!B.hitDone&&overlap(hb,pBox())){B.hitDone=1;hurtP(13*spd,B.dir*420);}}
              else{B.vx*=.85;if(B.st>1.05/spd){B.state='idle';B.st=0;B.cd=.9;}}break;
            case'web':{B.vx*=.8;const n=B.phase;for(let k=0;k<n;k++){const tt=(.35+k*.28)/spd;if(B.st>=tt&&B.st-dt<tt){const a=ang(B.x,B.y-110,p.x,p.y-40)+rnd(-.12,.12);
                shoot('web',B.x+B.dir*90,B.y-110,Math.cos(a)*430,Math.sin(a)*430,{owner:'b',dmg:7});sfx('laser');}}
              if(B.st>(.5+n*.28)/spd){B.state='idle';B.st=0;B.cd=1;}break;}
            case'jump':if(B.st<.3){B.vx=0;}else if(B.y>=FL&&B.vy===0&&!B.air){B.air=1;B.vy=-980;B.vx=(p.x-B.x)/0.9;sfx('jump');}
              if(B.air){B.vy+=2200*dt;B.shadowX=B.x;if(B.y>=FL&&B.vy>0){B.y=FL;B.vy=0;B.air=0;B.vx=0;shake(16);sfx('explode');
                  shoot('wave',B.x-90,FL,-460,0,{owner:'b',dmg:10,r:26,life:2.2});shoot('wave',B.x+90,FL,460,0,{owner:'b',dmg:10,r:26,life:2.2});
                  if(overlap(bBox(),pBox()))hurtP(18,(p.x<B.x?-1:1)*500);B.state='idle';B.st=0;B.cd=1.1;}}break;
            case'spin':if(B.st<.5){B.vx=0;}else if(B.st<3.2){if(!B.vx)B.vx=B.dir*560*spd;B.inv=.1;B.rot+=B.vx*dt*.03;if(B.x<L0+60||B.x>R0-60){B.vx*=-1;B.x=clamp(B.x,L0+61,R0-61);shake(5);sfx('hit');}
                if(overlap(bBox(),pBox())&&!B.hitDone){B.hitDone=1;hurtP(11,Math.sign(B.vx)*480);setTimeout(()=>B.hitDone=0,600);}}
              else{B.vx=0;B.rot=0;B.state='idle';B.st=0;B.cd=1.6;B.dizzy=1.6;PFX.text(B.x,B.y-180,'ГОЛОВА КРУЖИТСЯ!','#ff0',20);}break;
          }
          B.x+=B.vx*dt;if(B.air||B.vy)B.y+=B.vy*dt;if(B.state!=='spin')B.x=clamp(B.x,L0+80,R0-80);
        }
        // --- снаряды ---
        for(const s of shots){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.type==='shell')s.rot=(s.rot||0)+dt*20;
          if(s.owner==='p'){if(overlap({x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2},bBox())){if(B.inv>0&&s.type!=='super'){s.vx*=-1;s.owner='x';sfx('hit');continue;}hurtBoss(s.dmg,Math.sign(s.vx)*(s.type==='super'?60:20),s.type);s.life=0;}}
          else if(s.owner==='b'){if(overlap({x:s.x-s.r,y:s.y-s.r*(s.type==='wave'?2:1),w:s.r*2,h:s.r*(s.type==='wave'?2:2)},pBox())){hurtP(s.dmg,Math.sign(s.vx)*300);if(s.type==='web'&&!p.block)p.slow=1.2;s.life=0;}}
          if(s.x<0||s.x>W)s.life=0;if(s.type==='web'&&s.y>FL)s.life=0;
          if(s.type==='super'&&Math.random()<.6)PFX.add(s.x,s.y+rnd(-40,40),{vx:-s.vx*.2,life:.4,color:pick(['#ff0','#f0f','#0ff']),size:10});}
        for(let i=shots.length-1;i>=0;i--)if(shots[i].life<=0)shots.splice(i,1);
      },
      draw(g){
        drawBG(g,'bg_space',.15,(p.x-W/2)*.05,0);
        g.save();g.strokeStyle='rgba(255,61,242,.55)';g.lineWidth=2;g.shadowColor='#f0f';g.shadowBlur=10;
        for(let i=0;i<14;i++){const x=(i/13)*W;g.beginPath();g.moveTo(W/2+(x-W/2)*.25,FL);g.lineTo(x+(x-W/2)*1.4,H);g.stroke();}
        for(let i=0;i<5;i++){const y=FL+Math.pow((i+(t*.6%1))/5,2)*(H-FL);g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}g.restore();
        g.fillStyle='rgba(10,0,30,.55)';g.fillRect(0,FL,W,H-FL);
        // босс
        if(B.air){g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(B.x,FL,90*(1-Math.min(.6,(FL-B.y)/600)),14,0,0,7);g.fill();}
        const bob=Math.sin(t*4)*.03,tele=(B.state==='stab'&&B.st<.45)||(B.state==='jump'&&B.st<.3)||(B.state==='spin'&&B.st<.5);
        if(B.phase===3)glow(g,B.x,B.y-90,170,'rgba(255,0,60,.35)');
        if(B.state==='spin'&&B.st>.5){spr(g,'boss',B.x,B.y-70,{w:220,ay:.5,rot:B.rot,flip:B.dir>0,flash:B.flash});}
        else spr(g,'boss',B.x,B.y+6,{w:310,flip:B.dir>0,sy:(tele?.88:1+bob)*(B.air?1.08:1),sx:B.state==='stab'&&B.st>.45&&B.st<.7?1.18:1,flash:Math.max(B.flash,tele?(Math.sin(t*40)>0?.4:0):0),rot:B.state==='walk'?Math.sin(t*12)*.04:0});
        if(B.dizzy>0)for(let i=0;i<3;i++)txt(g,'★',B.x+Math.cos(t*6+i*2.1)*50,B.y-170+Math.sin(t*6+i*2.1)*12,{size:20,color:'#ff0',align:'center'});
        // игрок
        if(!(p.inv>0&&Math.floor(t*25)%2&&!p.block)){
          if(p.ram>0)turtle(g,p.x,p.y-2,{anim:'hide',frame:7,scale:.72,rot:t*30*p.dir,shadow:false});
          else{let anim='idle',fr;if(p.block){anim='hide';fr=Math.min(7,Math.floor(p.bt*26));}else if(p.atk){anim='attack';fr=Math.min(7,Math.floor(p.at*25));}else if(!p.gr){anim='jump';fr=p.vy<0?2:4;}else if(Math.abs(p.vx)>20)anim='walk';
            turtle(g,p.x,p.y,{anim,frame:fr,scale:.72,dir:p.dir,fps:12,flash:p.flash,visor:ctx.visor});}
          if(p.slow>0)txt(g,'🕸',p.x,p.y-60,{size:40,align:'center',alpha:.8});}
        for(const s of shots){
          if(s.type==='web'){g.save();g.strokeStyle='#e8fff0';g.lineWidth=2;g.shadowColor='#5f5';g.shadowBlur=10;g.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3+t*3;g.moveTo(s.x,s.y);g.lineTo(s.x+Math.cos(a)*s.r,s.y+Math.sin(a)*s.r);}g.stroke();g.beginPath();g.arc(s.x,s.y,s.r*.6,0,7);g.stroke();g.restore();}
          else if(s.type==='shell')spr(g,'shell',s.x,s.y,{w:70,ay:.5,rot:s.rot});
          else if(s.type==='wave'){g.save();g.fillStyle='rgba(80,255,140,.8)';g.shadowColor='#5f5';g.shadowBlur=20;g.beginPath();g.moveTo(s.x-30,FL);g.quadraticCurveTo(s.x,FL-70,s.x+30,FL);g.fill();g.restore();}
          else if(s.type==='super'){glow(g,s.x,s.y,120,'rgba(255,230,0,.6)');txt(g,'ЧЕРЕПАХА!',s.x,s.y+14,{size:44,font:FONTB,align:'center',color:'#fff',stroke:'#f0f',sw:6,glow:'#ff0'});}
        }
        PFX.draw(g);
        // HUD
        const bw=380;bar(g,20,38,bw,22,p.hp/p.max,p.hp/p.max>.3?'#3dff8a':'#ff3d3d');txt(g,'ЧЕРЕПАХА',22,78,{size:16,color:'#fff',stroke:'#000',sw:3});
        bar(g,20,84,200,8,p.sup,p.sup>=1?`hsl(${t*400%360},100%,60%)`:'#ffe066');if(p.sup>=1)txt(g,'L/C — СУПЕР «ЧЕРЕПАХА!»',228,93,{size:13,color:'#ff0',stroke:'#000',sw:3});
        bar(g,W-20-bw,38,bw,22,B.hp/B.max,B.phase===3?'#ff2244':'#ff3df2');txt(g,'ЧЕЛОВЕК-ПАУК (СОГНУТЫЙ)',W-22,78,{size:16,color:'#fff',align:'right',stroke:'#000',sw:3});
        txt(g,'Фаза '+B.phase,W-22,96,{size:13,align:'right',color:'#f9f'});
        if(bannerT>0){const k=clamp(bannerT,0,1);txt(g,banner,W/2,H/2-60,{size:banner.length>12?40:76,font:FONTB,align:'center',color:'#fff',stroke:'#000',sw:8,glow:'#f0f',alpha:k});}
      }};
  }};
