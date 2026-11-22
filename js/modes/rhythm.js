'use strict';
/* РИТМ-ИГРА — «Черепаха-вейв» */
MODES.rhythm={genre:'Ритм-игра',title:'Черепаха-вейв',icon:'🎵',music:'rhythm',bg:'bg_space',
  goal:'Рэп-баттл с Зайцем-диджеем в космосе. Попадай по нотам в такт синтвейва. Каждое попадание — слог «ЧЕ-РЕ-ПА-ХА».',
  controls:['D F J K  или  ← ↓ ↑ → — четыре дорожки','Жми, когда нота касается линии. Промахи отнимают энергию.'],
  create(ctx){
    const D=ctx.D,F=ctx.F;MUS.stop();MUS.play('rhythm');
    const s=SONGS.rhythm,sp=60/s.bpm/4,BARS=26,start=MUS.start||0,useAudio=!!(AU.ctx&&AU.ctx.currentTime>0);
    const rr=srand(ctx.page.year+7);const notes=[];const laneOf={7:0,10:1,12:2,14:3,15:3,17:3};const dens=Math.min(.7,.2+.22*D);
    for(let i=32;i<(BARS-1)*16;i++){const st=i%16,bar=Math.floor(i/16);const L=s.lead[i%s.lead.length];
      if(L!=null)notes.push({t:i*sp,lane:laneOf[L]!=null?laneOf[L]:2});
      else if(st%4===0&&rr()<dens)notes.push({t:i*sp,lane:Math.floor(bar+st/4+rr()*2)%4});
      if(D>1.3&&st===0&&bar%2===0&&rr()<.5)notes.push({t:i*sp,lane:(bar+2)%4});}
    notes.forEach(n=>{n.hit=0;n.miss=0;});
    const KEYL=[['KeyD','ArrowLeft'],['KeyF','ArrowDown'],['KeyJ','ArrowUp'],['KeyK','ArrowRight']];
    const win=F.zen?1.4:1,WP=.05*win,WG=.09*win,WO=.14*win,TRAVEL=1.7/(.85+.15*D),HY=450,TOP=40;
    let t=0,score=0,combo=0,maxc=0,hp=1,judg='',jt=0,syl=0,end=0,acc=0,cnt=0,lastBeat=0,pulse=0;const flash=[0,0,0,0];const SY=['ЧЕ','РЕ','ПА','ХА'];
    const lx=l=>W/2-150+l*100;
    const songT=()=>useAudio?AU.t()-start:t-.12;
    function judge(n,d){const ad=Math.abs(d);let pts,name,w,col;
      if(ad<=WP){pts=300;name='ИДЕАЛЬНО!';w=1;col='#5ff';}else if(ad<=WG){pts=200;name='ОТЛИЧНО';w=.8;col='#5f5';}else{pts=100;name='НОРМ';w=.5;col='#ff5';}
      n.hit=1;combo++;maxc=Math.max(maxc,combo);score+=Math.round(pts*(1+Math.floor(combo/10)*.1));acc+=w;cnt++;hp=Math.min(1,hp+.025);
      judg=name;jt=.5;flash[n.lane]=1;PFX.burst(lx(n.lane),HY,14,[col,'#fff','#f0f'],260,.4,5);PFX.text(lx(n.lane),HY-50,SY[syl++%4],'#fff',30);
      if(combo%25===0){PFX.text(W/2,200,'КОМБО '+combo+'!','#ff0',40);ctx.addLikes(5);}}
    return{
      update(dt){t+=dt;jt-=dt;const T=songT();
        const beat=T*s.bpm/60;if(Math.floor(beat)!==lastBeat){lastBeat=Math.floor(beat);pulse=1;}pulse=Math.max(0,pulse-dt*4);
        for(let l=0;l<4;l++){flash[l]=Math.max(0,flash[l]-dt*5);
          if(KEYL[l].some(k=>KP[k])){let best=null,bd=1e9;for(const n of notes){if(n.hit||n.miss||n.lane!==l)continue;const d=T-n.t;if(Math.abs(d)<=WO&&Math.abs(d)<bd){bd=Math.abs(d);best=n;}if(n.t-T>WO)break;}
            if(best)judge(best,T-best.t);else{flash[l]=.4;sfx('click');}}}
        for(const n of notes){if(!n.hit&&!n.miss&&T-n.t>WO){n.miss=1;combo=0;cnt++;hp-=.075;judg='МИМО';jt=.5;sfx('miss');}}
        if(!end&&hp<=0){end=1;MUS.stop();sfx('lose');setTimeout(()=>ctx.lose({text:'Заяц-диджей перебил твой бит. Черепаха ушла со сцены под свист.'}),1200);}
        if(!end&&T>(BARS-1)*16*sp+1){end=1;const a=cnt?acc/cnt:0;MUS.stop();
          setTimeout(()=>ctx.win({stars:a>=.9?3:a>=.75?2:1,text:`Точность ${(a*100).toFixed(1)}% · Очки ${fmt(score)} · Макс. комбо ${maxc}. Зал скандирует: «Че-ре-па-ха!»`}),900);sfx('win');cherepaha();}
      },
      draw(g){const T=songT();
        drawBG(g,'bg_space',.35-pulse*.15,Math.sin(t*.3)*20,pulse*6);
        g.save();g.globalCompositeOperation='lighter';for(let i=0;i<8;i++){g.fillStyle=`hsla(${(i*45+t*60)%360},100%,60%,${.05+pulse*.06})`;g.beginPath();g.moveTo(W/2,-50);g.lineTo(W/2+Math.cos(t*.5+i*.8)*900,H);g.lineTo(W/2+Math.cos(t*.5+i*.8+.12)*900,H);g.fill();}g.restore();
        // танцоры
        const beat=T*s.bpm/60;
        turtle(g,150,H-40,{anim:'dance',frame:Math.floor(beat*2)%8,scale:.95+pulse*.04,dir:1,visor:ctx.visor});
        spr(g,'hare',W-150,H-40,{w:210,sy:1-pulse*.06,rot:Math.sin(beat*Math.PI)*.08});txt(g,'🎧',W-170,H-205,{size:40,align:'center'});
        txt(g,'ЗАЯЦ-ДИДЖЕЙ',W-150,H-14,{size:14,align:'center',color:'#ff9'});
        // дорожки
        panel(g,W/2-205,TOP-10,410,HY-TOP+70,{fill:'rgba(5,0,20,.72)',stroke:'#7a5cff',blur:6});
        for(let l=0;l<4;l++){const x=lx(l);g.fillStyle=`rgba(255,255,255,${.04+flash[l]*.25})`;g.fillRect(x-45,TOP,90,HY-TOP+40);
          g.save();g.strokeStyle=['#ff3df2','#27f3ff','#5f5','#ffe066'][l];g.lineWidth=4;g.shadowColor=g.strokeStyle;g.shadowBlur=12+flash[l]*20;g.beginPath();g.arc(x,HY,32+flash[l]*6,0,7);g.stroke();g.restore();
          txt(g,['D ←','F ↓','J ↑','K →'][l],x,HY+56,{size:14,align:'center',color:'#ccc'});}
        for(const n of notes){if(n.hit)continue;const dtn=n.t-T;if(dtn>TRAVEL)break;if(dtn<-.3)continue;const y=HY-(dtn/TRAVEL)*(HY-TOP),x=lx(n.lane),c=['#ff3df2','#27f3ff','#5f5','#ffe066'][n.lane];
          g.save();g.globalAlpha=n.miss?.3:1;g.fillStyle=c;g.shadowColor=c;g.shadowBlur=16;g.beginPath();g.arc(x,y,26,0,7);g.fill();g.restore();spr(g,'shell',x,y+14,{w:44,alpha:n.miss?.3:1});}
        PFX.draw(g);
        txt(g,fmt(score),W/2,80,{size:34,font:FONTB,align:'center',color:'#fff',stroke:'#000',sw:5});
        if(combo>2)txt(g,combo+' комбо',W/2,112,{size:20,align:'center',color:'#ff0',stroke:'#000',sw:4});
        if(jt>0)txt(g,judg,W/2,HY-110,{size:34,font:FONTB,align:'center',color:judg==='МИМО'?'#f55':'#fff',stroke:'#000',sw:5,alpha:clamp(jt*3,0,1)});
        bar(g,20,40,22,300,1,'#222');g.save();g.fillStyle=hp>.3?'#3dff8a':'#ff3d3d';g.shadowColor=g.fillStyle;g.shadowBlur=10;g.fillRect(21,41+298*(1-clamp(hp,0,1)),20,298*clamp(hp,0,1));g.restore();
        txt(g,'⚡',31,362,{size:18,align:'center'});
        const prog=clamp(T/((BARS-1)*16*sp),0,1);bar(g,W/2-200,H-20,400,8,prog,'#ff3df2');
        if(T<4){txt(g,T<0?'':['3','2','1','ЧЕРЕПАХА!'][clamp(Math.floor(T),0,3)],W/2,250,{size:70,font:FONTB,align:'center',color:'#fff',stroke:'#f0f',sw:8});}
      }};
  }};
