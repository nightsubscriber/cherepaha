'use strict';
/* КВЕСТ — «Тайна оригинальной черепахи» (point-and-click) */
MODES.quest={genre:'Квест',title:'Тайна оригинальной черепахи',icon:'🔍',music:'chill',bg:'bg_city',
  goal:'Из архива паблика пропала оригинальная фотка черепахи 2278 года, та самая, с подписью «черепаха». Найди её и распечатай обложку календаря на хроно-принтере в музее.',
  controls:['ЛКМ — идти / осмотреть / говорить · щёлкни предмет внизу, потом цель — использовать','ПКМ — убрать предмет из лапы · H — подсказка (−⭐) · стрелки у краёв экрана — другая локация'],
  create(ctx){
    const tr=!!G.run.translator,FLOOR=452,yr=String(Math.abs(ctx.page.year)),CODE=yr.slice(-4).padStart(4,'0');
    const IT={battery:['🔋','Батарейка «Вечная-2278»'],coin:['🪙','Лайк-монета'],coffee:['☕','Капучино «Черепаший»'],cabbage:['🥬','Элитная капуста'],photo:['🖼','Фото черепахи (оригинал)']};
    const ROOMS={archive:{n:'Архив паблика «черепаха»',bg:'bg_city',dim:.66,r:'street'},street:{n:'Неон-проспект',bg:'bg_city',dim:.22,l:'archive',r:'museum'},museum:{n:'Музей черепах',bg:'bg_ruins',dim:.45,l:'street'}};
    const fl={};let room='archive',inv=[],held=null,px=200,face=1,tx=null,pend=null,dlg=null,pad=null,hints=0,t=0,hideT=0,hareRun=0,win=0,winT=0,wrong=0,flash=0,act=0;
    const has=i=>inv.includes(i),take=i=>{inv.push(i);sfx('power');PFX.burst(px,FLOOR-60,24,['#ff0','#fff','#0ff'],200,.6,4);PFX.text(px,FLOOR-110,'+ '+IT[i][0]+' '+IT[i][1],'#ffe066',18);},
      drop=i=>{inv=inv.filter(x=>x!==i);if(held===i)held=null;};
    const L=(who,t,o={})=>Object.assign({who,t},o);
    const A=(t,trn,gest)=>L('Админ',t,{tr:trn,gest});
    function say_(lines){dlg={lines:Array.isArray(lines)?lines:[lines],i:0,ch:0};}
    const HS=[
      {id:'pile',room:'archive',x:100,y:318,w:130,h:110,n:'Стопка календарей',
        look(){if(!fl.battery){fl.battery=1;take('battery');say_([L('Ты','Календари на 2278, 2378, 3378, 12278... Год то +100, то +1000. Как во сне.'),L('Ты','Под ними что-то блестит! Батарейка «Вечная». Срок годности: до 9999 года.')]);}
          else say_(L('Ты','Просто стопка календарей. На всех черепаха. И подпись: «черепаха».'));}},
      {id:'wall',room:'archive',x:300,y:110,w:130,h:160,n:'Календарь на стене',
        look(){fl.code=1;say_([L('Ты',`На странице: «${ctx.page.month} ${yearStr(ctx.page.year)}». Внизу маркером приписано:`),L('Записка','«Код от витрины в музее — последние 4 цифры года на этой странице». Кто так хранит пароли?!')]);}},
      {id:'coffee',room:'archive',x:478,y:240,w:86,h:180,n:'Кофемашина «Капучино 2278»',
        look(){say_(L('Ты','Кофемашина из 2278 года. Принимает только лайк-монеты. Наличные отменили в 2150-м.'));},
        use(i){if(i!=='coin')return 0;drop('coin');take('coffee');say_(L('Кофемашина','Ж-ж-ж... ЧЕРЕПАХА. *налила капучино с пенкой в форме черепахи*'));return 1;}},
      {id:'admin',room:'archive',x:640,y:130,w:200,h:330,n:'Админ паблика',
        look(){const s=[A('черепаха.','О, ты пришла! Оригинальная фотка черепахи пропала. Без неё обложку календаря не напечатать.','*грустно смотрит в телефон*')];
          if(!fl.battery)s.push(A('черепаха?','Поройся в стопке старых календарей. Там вечно что-то теряется.','*кивает на стопку календарей*'));
          else if(!has('coin')&&!fl.coin)s.push(A('черепаха...','На улице есть мусорка. В 2278 году в мусорках часто валяются лайк-монеты.','*показывает лапой на улицу*'));
          else if(!fl.coffee)s.push(A('черепаха!','Кофемашина работает на лайк-монетах. Кофе в 2278 — самая твёрдая валюта.','*стучит по кофемашине*'));
          else if(!fl.hareGone)s.push(A('черепаха?!','Музей сторожит заяц. Зайцы продадут родную бабушку за капусту.','*изображает уши над головой*'));
          else if(!fl.photo)s.push(A('черепаха.','Фото в витрине в музее. Код — на моём календаре. Да, я храню пароли на стене.','*тычет в календарь на стене*'));
          else s.push(A('ЧЕРЕПАХА!!!','Неси фото к хроно-принтеру в музее! Ему нужна батарейка.','*прыгает от радости*'));
          if(!tr&&!fl.noTr){fl.noTr=1;s.push(L('Ты','Я не понимаю по-черепашьи... но жесты понятны. (В паблике продаётся переводчик.)'));}
          say_(s);},
        use(i){say_(A('черепаха.',i==='photo'?'Это она! Скорее к принтеру в музее!':'Зачем мне это? Я админ, у меня всё есть. Кроме фотки.','*вертит предмет и возвращает*'));return 1;}},
      {id:'trash',room:'street',x:90,y:330,w:80,h:110,n:'Мусорка',
        look(){if(!fl.coin){fl.coin=1;take('coin');say_(L('Ты','Порылась в мусорке 2278 года. Нашлась лайк-монета! И айфон 47, но он без проводов не работает.'));}
          else say_(L('Ты','Больше ничего полезного. Только айфон 47 и коробка из-под капусты.'));}},
      {id:'snail',room:'street',x:260,y:250,w:200,h:200,n:'Улитка-торговка',
        look(){say_(fl.cabbage?L('Улитка','Я теперь бодрая! Ползу со скоростью 0,003 км/ч! Спасибо, черепаха!'):[L('Улитка','Ка-а-апу-у-уста-а... све-е-ежая... я о-о-очень медленно просыпа-а-аюсь...'),L('Улитка','Отда-ала бы всю капу-усту за ча-ашку ко-офе...')]);},
        use(i){if(i==='coffee'){drop('coffee');fl.cabbage=1;take('cabbage');say_(L('Улитка','КОФЕ! *выпила залпом* Я ЧУВСТВУЮ СКОРОСТЬ! Держи элитную капусту!'));return 1;}
          if(i==='coin'){say_(L('Улитка','Мне не нужны мо-оне-еты... мне нужен ко-о-офе...'));return 1;}return 0;}},
      {id:'hare',room:'street',x:600,y:250,w:100,h:200,n:'Заяц-охранник',vis:()=>!fl.hareGone,
        look(){say_([L('Заяц','Музей закрыт на обед. Обед до 3278 года.'),L('Заяц','Хотя... если бы у тебя была капустка... я бы, может, отошёл. На тысячу лет.')]);},
        use(i){if(i!=='cabbage')return 0;drop('cabbage');fl.hareGone=1;hareRun=1.6;sfx('boost');ctx.addLikes(15);say_(L('Заяц','КАПУСТА! *хватает и уносится в 3278 год*'));return 1;}},
      {id:'door',room:'street',x:730,y:170,w:160,h:280,n:'Дверь музея',
        look(){if(fl.hareGone){goRoom('museum','l');}else say_(L('Ты','Заяц не пускает. Надо его чем-то отвлечь.'));}},
      {id:'statue',room:'museum',x:70,y:150,w:220,h:300,n:'Статуя на постаменте',
        look(){hideT=2;sfx('hurt');say_([L('Табличка','«Человек-паук, согнутый в форму черепахи. Обложка календаря, 2278 г.»'),L('Ты','Он смотрит на меня. Хотя у него нет глаз. Только линзы. *прячется в панцирь*')]);}},
      {id:'case',room:'museum',x:340,y:270,w:150,h:170,n:'Витрина',
        look(){if(!fl.open){pad={s:'',err:0};}else if(!fl.photo){fl.photo=1;take('photo');say_(L('Ты','Вот она — оригинальная фотка. Черепаха. Подпись: «черепаха». Шедевр.'));}else say_(L('Ты','Пустая витрина. Табличка: «Здесь была черепаха».'));}},
      {id:'drone',room:'museum',x:530,y:130,w:100,h:120,n:'Дрон-смотритель',
        look(){say_(fl.pass?L('Дрон','Доступ разрешён. Код витрины ищи на календаре в архиве.'):L('Дрон','СТОП. НАЗОВИТЕ ПАРОЛЬ.',{opts:['qwerty123','черепаха','Я из 2278 года, мне можно'],ans(k){
          if(k===1){fl.pass=1;ctx.addLikes(25);sfx('like');say_(L('Дрон','ДОСТУП РАЗРЕШЁН. Пароль всегда «черепаха». Код витрины — на календаре в архиве.'));}
          else{sfx('miss');say_(L('Дрон','НЕВЕРНО. Подсказка: это животное. С панцирем. Медленное. Начинается на «чере», заканчивается на «паха».'));}}}));}},
      {id:'printer',room:'museum',x:690,y:200,w:200,h:250,n:'Хроно-принтер',
        look(){say_(L('Ты',fl.power?'Принтер гудит и ждёт оригинал для печати обложки.':'Хроно-принтер печатает обложки календарей сквозь время. Отсек для батарейки пуст.'));},
        use(i){if(i==='battery'){drop('battery');fl.power=1;sfx('power');shake(4);say_(L('Хроно-принтер','ПИТАНИЕ: 100%. ВРЕМЯ: СЛОМАНО. ГОТОВ К ПЕЧАТИ.'));return 1;}
          if(i==='photo'){if(!fl.power){say_(L('Ты','Принтер не включён. Нужна батарейка.'));return 1;}drop('photo');win=1;winT=0;MUS.play('title');sfx('boost');return 1;}return 0;}},
    ];
    function goRoom(r,side){room=r;px=side==='l'?70:890;face=side==='l'?1:-1;tx=null;pend=null;flash=.5;sfx('step');}
    const hintTxt=()=>!fl.battery?'Поройся в стопке календарей в архиве.':!fl.coin?'На улице есть мусорка. Загляни в неё.':!fl.coffee&&!fl.cabbage?'Кофемашина в архиве принимает лайк-монеты.':!fl.cabbage?'Улитка-торговка очень хочет кофе.':!fl.hareGone?'Заяц-охранник обожает капусту.':!fl.open?`Код от витрины — последние 4 цифры года на календаре в архиве: ${CODE}.`:!fl.photo?'Забери фото из витрины.':!fl.power?'Вставь батарейку в хроно-принтер.':'Используй фото на хроно-принтере!';
    const visible=()=>HS.filter(h=>h.room===room&&(!h.vis||h.vis()));
    const under=()=>M.y<FLOOR+20&&visible().slice().reverse().find(h=>M.x>=h.x&&M.x<=h.x+h.w&&M.y>=h.y&&M.y<=h.y+h.h);
    function interact(h,item){face=(h.x+h.w/2)>px?1:-1;act=.4;if(item){if(h.use&&h.use(item)){if(item==='coin'&&h.id==='coffee')fl.coffee=1;}else say_(L('Ты',`Не думаю, что ${IT[item][1].toLowerCase()} тут поможет.`));held=null;}else h.look();}
    function padKey(k){if(!pad)return;if(k==='C')pad.s='';else if(k==='OK'){if(pad.s===CODE){fl.open=1;pad=null;sfx('win');ctx.addLikes(20);say_(L('Витрина','*щёлк* Код принят. Витрина открыта.'));}
        else{pad.err=.5;pad.s='';wrong++;sfx('miss');shake(5);if(wrong===3)say_(L('Дрон','ПОДСКАЗКА: календарь в архиве. Последние 4 цифры года.'));}}else if(pad.s.length<4){pad.s+=k;sfx('click');}}
    return{get dbg(){return{room,inv:inv.join(","),fl:Object.keys(fl).join(","),px,win,hints,busy:!!(dlg||tx!=null||hideT>0),pad:!!pad};},
      update(dt){t+=dt;flash=Math.max(0,flash-dt);hideT-=dt;act-=dt;if(hareRun>0)hareRun-=dt;
        if(win){winT+=dt;if(winT>1&&winT-dt<=1)cherepaha();if(winT>4.6&&win===1){win=2;ctx.win({stars:hints===0?3:hints<=2?2:1,xp:30,text:`Хроно-принтер напечатал обложку: черепаха и подпись «черепаха». Календарь на ${yearStr(ctx.page.year)} год спасён. Подсказок использовано: ${hints}.`});}return;}
        if(dlg){dlg.ch+=dt*55;const ln=dlg.lines[dlg.i];
          if(ln.opts){for(let k=0;k<ln.opts.length;k++)if(KP['Digit'+(k+1)]){const f=ln.ans;dlg=null;f(k);return;}}
          else if(M.click||KP.Space||KP.Enter){M.click=false;if(dlg.ch<ln.t.length)dlg.ch=999;else{dlg.i++;dlg.ch=0;sfx('click');if(dlg.i>=dlg.lines.length)dlg=null;}}return;}
        if(pad){for(let k=0;k<10;k++)if(KP['Digit'+k]||KP['Numpad'+k])padKey(String(k));if(KP.Backspace)pad.s=pad.s.slice(0,-1);if(KP.Enter||KP.NumpadEnter)padKey('OK');if(pad)pad.err=Math.max(0,pad.err-dt);if(M.rclick){pad=null;M.rclick=false;}return;}
        if(KP.KeyH){hints++;sfx('beep');say_(L('Подсказка','💡 '+hintTxt()));return;}
        if(M.rclick){held=null;M.rclick=false;}
        if(M.click&&M.y<FLOOR+24){M.click=false;const h=under();const R=ROOMS[room];
          if(h){tx=clamp(h.x+h.w/2,60,900);pend={h,item:held};}
          else if(M.x<50&&R.l){tx=40;pend={exit:'l'};}else if(M.x>910&&R.r){tx=920;pend={exit:'r'};}
          else{tx=clamp(M.x,50,910);pend=null;}}
        const sp=260*(.8+.2*ctx.P.spd);
        if(tx!=null&&hideT<=0){const d=tx-px;if(Math.abs(d)<=sp*dt+1){px=tx;tx=null;if(pend){const p=pend;pend=null;
            if(p.exit){const R=ROOMS[room];goRoom(p.exit==='l'?R.l:R.r,p.exit==='l'?'r':'l');}else interact(p.h,p.item);}}
          else{px+=Math.sign(d)*sp*dt;face=Math.sign(d);if(Math.random()<dt*4)sfx('step');}}},
      draw(g){const R=ROOMS[room];drawBG(g,R.bg,R.dim);
        if(room==='archive'){g.fillStyle='rgba(20,6,40,.55)';g.fillRect(0,26,W,400);for(let s=0;s<3;s++){g.fillStyle='#2a1a40';g.fillRect(40,90+s*80,220,8);g.fillRect(860-0,90+s*80,90,8);
            for(let k=0;k<12;k++){g.fillStyle=['#ff3df2','#27f3ff','#ffe066','#5f5'][(k+s)%4];g.globalAlpha=.6;g.fillRect(48+k*17,58+s*80,12,32);g.globalAlpha=1;}}}
        if(room==='museum'){g.fillStyle='rgba(30,10,30,.35)';g.fillRect(0,26,W,400);for(let k=0;k<5;k++){glow(g,100+k*190,40,90,'rgba(255,220,150,.18)');}}
        g.fillStyle=room==='street'?'rgba(10,0,25,.75)':'rgba(25,10,45,.92)';g.fillRect(0,FLOOR-30,W,H-FLOOR+30);neonLine(g,0,FLOOR-30,W,FLOOR-30,room==='street'?'#ff3df2':'#27f3ff',2);
        for(const h of visible()){const cx=h.x+h.w/2;
          switch(h.id){
            case'pile':for(let k=0;k<7;k++){g.fillStyle=k%2?'#f5f0ff':'#e8dcff';g.fillRect(h.x+10+(k%3)*6,h.y+h.h-14-k*13,100,12);g.fillStyle='#a0008a';g.fillRect(h.x+14+(k%3)*6,h.y+h.h-12-k*13,24,8);}
              if(!fl.battery){g.globalAlpha=.5+.5*Math.sin(t*6);txt(g,'✦',h.x+108,h.y+h.h-10,{size:16,color:'#ff0'});g.globalAlpha=1;}break;
            case'wall':g.fillStyle='#f5f0ff';g.fillRect(h.x,h.y,h.w,h.h);g.fillStyle='#a0008a';g.fillRect(h.x,h.y,h.w,26);txt(g,ctx.page.month.slice(0,10),cx,h.y+18,{size:12,align:'center',color:'#fff'});
              turtle(g,cx,h.y+96,{scale:.36,anim:'idle',shadow:false});txt(g,yearStr(ctx.page.year),cx,h.y+122,{size:20,align:'center',color:'#1a0a3a',font:FONTB});txt(g,'черепаха',cx,h.y+145,{size:13,align:'center',color:'#333'});break;
            case'coffee':g.fillStyle='#3a3a4a';g.fillRect(h.x,h.y,h.w,h.h-20);g.fillStyle='#111';g.fillRect(h.x+18,h.y+70,50,50);txt(g,'КОФЕ',cx,h.y+30,{size:16,align:'center',color:'#ffb347',glow:'#f80'});txt(g,'🪙',cx,h.y+56,{size:14,align:'center'});if(fl.coffee)txt(g,'☕',cx,h.y+110,{size:18,align:'center',alpha:.4});break;
            case'admin':spr(g,'admin',cx+6,h.y+h.h+8,{w:200,sy:1+Math.sin(t*2)*.01});break;
            case'trash':g.fillStyle='#25303a';g.fillRect(h.x+8,h.y+20,h.w-16,h.h-20);g.fillStyle='#3a4a5a';g.fillRect(h.x,h.y+10,h.w,14);txt(g,'♻',cx,h.y+70,{size:22,align:'center',color:'#5f5'});break;
            case'snail':g.fillStyle='#3a1a10';g.fillRect(h.x+10,h.y+90,h.w-20,90);g.fillStyle='#5f5';for(let k=0;k<5;k++)txt(g,'🥬',h.x+30+k*30,h.y+100,{size:20,align:'center'});
              panel(g,h.x+20,h.y+4,h.w-40,30,{fill:'rgba(0,40,10,.9)',stroke:'#5f5',r:4});txt(g,'КАПУСТА 24/7',cx,h.y+25,{size:14,align:'center',color:'#9f9'});spr(g,'snail',cx,h.y+96,{w:90,sy:1+Math.sin(t*1.5)*.03});break;
            case'hare':{const k=hareRun>0?(1.6-hareRun)/1.6:0;spr(g,'hare',cx+k*700,h.y+h.h+(k?-Math.abs(Math.sin(t*20))*30:0),{w:90,flip:k>0,sy:1+Math.sin(t*3)*.02});break;}
            case'door':g.fillStyle='#120820';g.fillRect(h.x,h.y,h.w,h.h);neonLine(g,h.x,h.y,h.x+h.w,h.y,'#27f3ff');neonLine(g,h.x,h.y,h.x,h.y+h.h,'#27f3ff');neonLine(g,h.x+h.w,h.y,h.x+h.w,h.y+h.h,'#27f3ff');
              txt(g,'МУЗЕЙ',cx,h.y-26,{size:22,align:'center',color:'#27f3ff',glow:'#27f3ff',font:FONTB});txt(g,'ЧЕРЕПАХ',cx,h.y-6,{size:14,align:'center',color:'#9ff'});
              if(fl.hareGone){g.fillStyle='rgba(255,230,120,.25)';g.fillRect(h.x+6,h.y+6,h.w-12,h.h-6);}break;
            case'statue':g.fillStyle='#3a3040';g.fillRect(h.x+30,h.y+h.h-50,h.w-60,50);spr(g,'boss',cx,h.y+h.h-46,{w:210,alpha:.75,sy:1+Math.sin(t*2)*.01});glow(g,cx,h.y+80,70,'rgba(80,255,120,.12)');break;
            case'case':g.fillStyle='#2a2030';g.fillRect(h.x+10,h.y+100,h.w-20,70);if(!fl.photo){g.fillStyle='#fff';g.fillRect(cx-34,h.y+30,68,56);turtle(g,cx,h.y+80,{scale:.2,anim:'idle',shadow:false});}
              g.fillStyle='rgba(150,230,255,.15)';g.fillRect(h.x+6,h.y+10,h.w-12,90);g.strokeStyle='#9ef';g.strokeRect(h.x+6,h.y+10,h.w-12,90);txt(g,fl.open?'🔓':'🔒',h.x+h.w-18,h.y+130,{size:16,align:'center'});break;
            case'drone':spr(g,'drone',cx,h.y+h.h+Math.sin(t*3)*8,{w:90});break;
            case'printer':g.fillStyle='#202838';g.fillRect(h.x+10,h.y+60,h.w-20,h.h-60);g.fillStyle='#0a0e18';g.fillRect(h.x+30,h.y+80,h.w-60,20);
              txt(g,'ХРОНО-ПРИНТЕР',cx,h.y+130,{size:14,align:'center',color:fl.power?'#5f5':'#f55',glow:fl.power?'#5f5':'#f55'});txt(g,fl.power?'● ON':'○ OFF',cx,h.y+156,{size:13,align:'center',color:fl.power?'#5f5':'#866'});
              for(let k=0;k<3;k++)neonLine(g,h.x+20+k*60,h.y+60,h.x+40+k*60,h.y+20+Math.sin(t*2+k)*6,fl.power?'#27f3ff':'#334',2);
              if(win){const k=clamp(winT/2.2,0,1);g.fillStyle='#f5f0ff';const py=h.y+90-k*180;g.fillRect(cx-70,py,140,k*180);if(k>.5){turtle(g,cx,py+110,{scale:.4,anim:'dance',shadow:false});txt(g,'черепаха',cx,py+150,{size:18,align:'center',color:'#222'});}
                if(winT>1)glow(g,cx,h.y+60,260,'rgba(255,240,150,.35)');}break;}}
        const h=!dlg&&!pad&&!win&&under();
        if(h){g.save();g.strokeStyle='rgba(255,255,255,.35)';g.setLineDash([4,4]);g.strokeRect(h.x,h.y,h.w,h.h);g.restore();}
        if(R.l){glow(g,24,300,40,'rgba(39,243,255,.4)');txt(g,'◀',22,308,{size:28,align:'center',color:'#27f3ff'});txt(g,ROOMS[R.l].n.split(' ')[0],26,330,{size:11,align:'left',color:'#9ff'});}
        if(R.r){glow(g,936,300,40,'rgba(39,243,255,.4)');txt(g,'▶',938,308,{size:28,align:'center',color:'#27f3ff'});txt(g,ROOMS[R.r].n.split(' ')[0],934,330,{size:11,align:'right',color:'#9ff'});}
        turtle(g,px,FLOOR,{scale:.42,dir:face>0?1:-1,anim:hideT>0?'hide':win?'dance':tx!=null?'walk':act>0?'attack':'idle',fps:tx!=null?12:8,visor:ctx.visor});
        PFX.draw(g);
        txt(g,ROOMS[room].n,W/2,48,{size:16,align:'center',color:'#cff',stroke:'#000',sw:4});
        if(h)txt(g,held?`Использовать ${IT[held][0]} → ${h.n}`:'🔎 '+h.n,W/2,74,{size:18,align:'center',color:'#ffe066',stroke:'#000',sw:4});
        // инвентарь
        panel(g,0,H-58,W,58,{fill:'rgba(6,2,22,.9)',r:0,blur:4});txt(g,'🎒',22,H-20,{size:22,align:'center'});
        inv.forEach((id,k)=>{const x=50+k*64,y=H-52;const hov=inRect(x,y,56,46);panel(g,x,y,56,46,{fill:held===id?'rgba(255,0,170,.45)':'rgba(20,10,50,.9)',stroke:held===id?'#ff3df2':hov?'#fff':'#27f3ff',r:6,blur:held===id?16:4});
          txt(g,IT[id][0],x+28,y+32,{size:24,align:'center'});if(hov){txt(g,IT[id][1],x,y-8,{size:13,color:'#fff',stroke:'#000',sw:3});if(M.click&&!dlg&&!pad){M.click=false;held=held===id?null:id;sfx('select');}}});
        if(button(g,W-150,H-50,136,40,'💡 Подсказка (H)',{size:14})&&!dlg&&!pad&&!win){hints++;sfx('beep');say_(L('Подсказка','💡 '+hintTxt()));}
        txt(g,`Предметов: ${inv.length}`,W-170,H-24,{size:13,align:'right',color:'#9ff'});
        if(held&&!pad)txt(g,IT[held][0],M.x+16,M.y+20,{size:24});
        if(flash>0){g.fillStyle=`rgba(255,255,255,${flash})`;g.fillRect(0,0,W,H);}
        if(dlg){const ln=dlg.lines[dlg.i];panel(g,40,H-210,W-80,146,{fill:'rgba(5,0,20,.94)',stroke:ln.who==='Админ'?'#ffe066':'#ff3df2'});
          txt(g,ln.who,64,H-180,{size:18,color:ln.who==='Ты'?'#9f9':'#ffe066'});const s=ln.t.slice(0,Math.floor(dlg.ch));wrapText(g,s,64,H-152,W-140,24,{size:19});
          if(ln.who==='Админ'&&dlg.ch>=ln.t.length){txt(g,ln.gest,64,H-112,{size:15,color:'#c9b8ff',bold:false});if(tr)wrapText(g,'(перевод: '+ln.tr+')',64,H-90,W-140,17,{size:14,color:'#9ff',bold:false});}
          if(ln.opts){ln.opts.forEach((o,k)=>{if(button(g,90+k*270,H-104,250,36,`${k+1}) ${o}`,{size:14})){const f=ln.ans;dlg=null;f(k);}});}
          else txt(g,'▼ клик / пробел',W-60,H-74,{size:12,align:'right',color:'#9cf',alpha:.5+.5*Math.sin(t*5)});}
        if(pad){g.fillStyle='rgba(0,0,0,.6)';g.fillRect(0,0,W,H);const x0=W/2-130,y0=90;panel(g,x0,y0,260,360,{fill:'rgba(10,14,30,.97)',stroke:pad.err>0?'#f33':'#27f3ff'});
          txt(g,'ВИТРИНА · КОД',W/2,y0+30,{size:16,align:'center',color:'#9ff'});panel(g,x0+30,y0+44,200,46,{fill:'#021',stroke:'#5f5',r:4});
          txt(g,pad.err>0?'ОШИБКА':pad.s.padEnd(4,'_').split('').join(' '),W/2,y0+76,{size:26,align:'center',color:pad.err>0?'#f55':'#5f5',font:MONO});
          ['1','2','3','4','5','6','7','8','9','C','0','OK'].forEach((k,i)=>{if(button(g,x0+30+(i%3)*70,y0+104+Math.floor(i/3)*58,60,50,k,{size:20}))padKey(k);});
          if(button(g,x0+222,y0+6,32,28,'✕',{size:14}))pad=null;}
        if(win&&winT>1.4){txt(g,'черепаха',W/2,140,{size:64,align:'center',color:'#fff',glow:'#ff3df2',blur:30,font:FONTB,alpha:clamp(winT-1.4,0,1)});}
      }};
  }};
