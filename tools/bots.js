// scripted bots for balance checks
const S={};
S.summary=(m,d)=>{const o={};if(m==='rpg'){o.mode=d.mode;o.seals=d.seals;o.lvl=d.lvl;o.party=d.party;o.B=d.B&&d.B.foes;return o;}if(m==='rts'){const my=d.units.filter(u=>u.side===0);o.my=my.length;o.w=my.filter(u=>u.type==='worker').length;o.en=d.units.length-my.length;}for(const k in d){const v=d[k];if(typeof v==='number'||typeof v==='string')o[k]=typeof v==='number'?Math.round(v*10)/10:v;else if(Array.isArray(v))o[k+'N']=v.length;}return o;};
S.td=(inst,T,time,f)=>{const d=inst.dbg;if(d.state==='wait'&&f%60===30)T.KP.Space=true;
  if(f%20!==0)return;
  const order=['archer','archer','laser','frost','cannon','laser','archer','cannon'];const costs={archer:60,laser:90,frost:75,cannon:120};
  const want=order[d.towers.length%order.length];
  if(d.towers.length>=6&&d.cab>=150){const tw=d.towers.find(t=>t.lvl<3);if(tw&&f%40===0){T.M.x=tw.x;T.M.y=tw.y;T.M.click=true;return;} if(tw&&f%40===20){T.KP.KeyU=true;return;}}
  if(d.cab>=costs[want]&&d.towers.length<22){
    const idx=['archer','laser','frost','cannon'].indexOf(want);
    if(f%40===0){T.KP['Digit'+(idx+1)]=true;return;}
    // find free cell with most path neighbors
    let best=null,bs=-1;for(let y=0;y<12;y++)for(let x=0;x<20;x++){if(d.grid[y][x]!==0)continue;let s=0;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const yy=y+j,xx=x+i;if(yy>=0&&yy<12&&xx>=0&&xx<20&&d.grid[yy][xx]===1)s+=(Math.abs(i)<=1&&Math.abs(j)<=1)?2:1;}
      if(s>bs){bs=s;best={x,y};}}
    if(best){T.M.x=best.x*40+20;T.M.y=34+best.y*40+20;T.M.click=true;}
  }};
S.survival=(inst,T,time,f)=>{const d=inst.dbg;if(d.choice){if(f%10===0)T.KP['Digit'+(1+(f/10|0)%3)]=true;return;}
  const p=d.p;let tx=null,ty=null;
  if(d.cold<45){const fi=d.FIRES.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);tx=fi.x;ty=fi.y;}
  else if(d.hunger<55&&d.food.length){const fo=d.food.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);tx=fo.x;ty=fo.y;}
  else if(d.gems.length){const gm=d.gems.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);if(Math.hypot(gm.x-p.x,gm.y-p.y)<400){tx=gm.x;ty=gm.y;}}
  let vx=0,vy=0;if(tx!=null){const l=Math.hypot(tx-p.x,ty-p.y)||1;vx+=(tx-p.x)/l;vy+=(ty-p.y)/l;}
  for(const e of d.en){const dx=p.x-e.x,dy=p.y-e.y,l=Math.hypot(dx,dy);if(l<200){vx+=dx/l*(200-l)/120;vy+=dy/l*(200-l)/120;}}
  const K=T.K;K.ArrowLeft=vx<-.3;K.ArrowRight=vx>.3;K.ArrowUp=vy<-.3;K.ArrowDown=vy>.3;};

S.rts=(inst,T,time,f)=>{const d=inst.dbg;if(f%30!==0)return;const my=d.units.filter(u=>u.side===0),w=my.filter(u=>u.type==='worker').length,army=my.length-w;
  if(w<7&&d.cab>=50)T.KP.Digit1=true;else if(d.upl<2&&army>=6&&d.cab>=180)T.KP.Digit5=true;else if(army>=8&&d.cab>=220&&f%90===0)T.KP.Digit4=true;else if(d.cab>=100)T.KP[army%3===2?'Digit3':'Digit2']=true;
  if(army>=16&&f%600===0)T.KP.Space=true;};

S.quest=(()=>{let step=0,wait=0,typed=0;const HS={pile:[165,373],wall:[365,190],coffee:[521,330],admin:[740,295],trash:[130,385],snail:[360,350],hare:[650,350],door:[810,310],case:[415,355],printer:[790,325],R:[935,300],L:[25,300]};
  const plan=[['pile'],['wall'],['admin'],['R'],['trash'],['L'],['coin','coffee'],['R'],['coffee','snail'],['cabbage','hare'],['door'],['case'],['PAD'],['case'],['battery','printer'],['photo','printer']];
  return (inst,T,time,f)=>{const d=inst.dbg;if(d.win)return;if(--wait>0)return;
    if(d.pad){const code='2278';if(typed<4){T.KP['Digit'+code[typed]]=true;typed++;}else{T.KP.Enter=true;typed=0;}wait=3;return;}
    if(d.busy){T.KP.Space=true;wait=4;return;}
    const a=plan[step];if(!a)return;
    if(a[0]==='PAD'){step++;return;}
    if(a.length===2&&!a.used){const inv=d.inv.split(',');const k=inv.indexOf(a[0]);if(k<0){console.log('missing item',a[0],'inv',d.inv,'flags',d.fl);step=99;return;}T.M.x=50+k*64+28;T.M.y=511;T.M.click=true;a.used=1;wait=3;return;}
    const p=HS[a[a.length-1]];T.M.x=p[0];T.M.y=p[1];T.M.click=true;step++;wait=6;};})();

S.sandbox=(inst,T,time,f)=>{const a=inst.api;
  if(f<60&&f%2===0)a.paint(176,384+(f%6),5,3);         // капуста над озером
  if(f===300)for(let k=0;k<5;k++)a.addTurtle(120+k*30,300);
  if(f>600&&f<720)a.paint(200,380,4,4);                 // лава в озеро
  if(f===900)a.bomb(600,420);
  if(f===1500)T.KP.KeyP=true;};

S.roguelike=(inst,T,time,f)=>{if(f%8!==0)return;const a=inst.api,d=inst.dbg;if(d.end)return;const p=a.p,MW=a.MW,MH=a.MH,map=a.map;
  if(d.hp<d.max*.4){const k=a.inv.findIndex(i=>i.k==='cab');if(k>=0){a.use(k);return;}const k2=a.inv.findIndex(i=>i.k==='pot');if(k2>=0&&d.hp<d.max*.3){a.use(k2);return;}}
  for(const m of a.mons)if(m.hp>0&&Math.abs(m.x-p.x)+Math.abs(m.y-p.y)===1){a.act(m.x-p.x,m.y-p.y);return;}
  if(d.hp<d.max*.6&&!a.mons.some(m=>m.awake&&Math.abs(m.x-p.x)+Math.abs(m.y-p.y)<7)){T.KP.Space=true;return;}
  // BFS к цели: портал > лестница > ближайший предмет > исследование
  const prev=new Int32Array(MW*MH).fill(-1),q=[p.y*MW+p.x];prev[q[0]]=q[0];let goal=-1;
  const isGoal=i=>{const x=i%MW,y=(i/MW)|0;if(a.portal&&a.portal.x===x&&a.portal.y===y)return 1;if(map[i]===2)return 1;if(a.items.some(it=>it.x===x&&it.y===y&&(a.inv.length<6||['weapon','armor','likes'].includes(it.k))))return 1;if(d.floor===3&&a.mons.some(m=>m.type==='boss'&&Math.abs(m.x-x)+Math.abs(m.y-y)===1))return 1;return 0;};
  while(q.length){const i=q.shift();if(i!==q[0]&&isGoal(i)&&i!==p.y*MW+p.x){goal=i;break;}const x=i%MW,y=(i/MW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const j=ny*MW+nx;if(prev[j]>=0||map[j]===0)continue;prev[j]=i;q.push(j);}}
  if(goal<0){a.act(...[[1,0],[-1,0],[0,1],[0,-1]][(f/8|0)%4]);return;}
  let c=goal;while(prev[c]!==p.y*MW+p.x&&prev[c]!==c)c=prev[c];const nx=c%MW,ny=(c/MW)|0;a.act(nx-p.x,ny-p.y);};

S.rpg=(()=>{let gi=0,healed=0;return (inst,T,time,f)=>{const a=inst.api,d=inst.dbg;if(d.end||f%6)return;
  if(d.mode==='world'){if(!healed){a.pl.x=480;a.pl.y=360;T.KP.KeyE=true;healed=1;return;}if(f%12===0&&!healed)return;T.KP.Space=true;
    if(gi<3){if(a.GROUPS[gi].alive){a.startBattle(a.GROUPS[gi]);}else gi++;healed=0;}else if(d.seals>=3){a.pl.x=480;a.pl.y=100;}return;}
  const B=a.B;if(!B||B.res||B.busy>0||B.st!=='cmd')return;const u=a.party[B.ci],low=a.party.some(p=>p.hp>0&&p.hp<p.max*.45);
  if(B.menu==='target'){T.KP.Enter=true;return;}if(B.menu==='skill'){if(u.cyber)T.KP[low?'Digit2':'Digit1']=true;else T.KP[low?'Digit3':'Digit1']=true;return;}
  const boss=B.foes[0].k==='boss';if(boss&&B.foes[0].charge&&B.foes[0].stun===0){if(!u.cyber&&u.mp>=8){T.KP.Digit2=true;return;}T.KP.Digit3=true;return;}
  if(low&&(u.cyber?u.mp>=5:u.mp>=6)){T.KP.Digit2=true;return;}if(low&&d.cab>0){T.KP.Digit4=true;return;}
  if(u.cyber&&u.mp>=6&&B.foes.filter(f=>f.hp>0).length>=2){T.KP.Digit2=true;return;}if(!u.cyber&&u.mp>=4&&Math.random()<.5){T.KP.Digit2=true;return;}T.KP.Digit1=true;};})();
module.exports=S;
