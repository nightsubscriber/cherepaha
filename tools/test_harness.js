// Headless smoke test: runs every scene/mode with random input in a fake canvas environment.
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.join(__dirname,'..');
const noop=()=>{};
const grad={addColorStop:noop};
function ctx2d(){const c={canvas:null,measureText:s=>({width:String(s).length*9}),createLinearGradient:()=>grad,createRadialGradient:()=>grad,createPattern:()=>({}),
  createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),
  drawImage:(im)=>{if(!im)throw new Error('drawImage null');}};
  return new Proxy(c,{get:(t,k)=>k in t?t[k]:noop,set:(t,k,v)=>{t[k]=v;return true;}});}
function canvas(){const cv={width:300,height:150,style:{},getContext:()=>{const x=ctx2d();x.canvas=cv;return x;},getBoundingClientRect:()=>({left:0,top:0,width:960,height:540}),addEventListener:noop,requestPointerLock:noop,focus:noop};return cv;}
const audioNode=()=>new Proxy({},{get:(t,k)=>{if(k==='connect'||k==='start'||k==='stop'||k==='disconnect')return noop;if(k in t)return t[k];return t[k]={value:0,setValueAtTime:noop,exponentialRampToValueAtTime:noop,linearRampToValueAtTime:noop,setTargetAtTime:noop,cancelScheduledValues:noop};}});
class AudioContext{constructor(){this.currentTime=0;this.sampleRate=44100;this.state='running';this.destination={};}
  createGain(){return audioNode();}createOscillator(){return audioNode();}createBiquadFilter(){return audioNode();}createDelay(){return audioNode();}createBufferSource(){return audioNode();}
  createBuffer(c,l){return{getChannelData:()=>new Float32Array(l)};}resume(){}}
class Image{constructor(){this.complete=true;this.naturalWidth=0;this.naturalHeight=0;}set src(v){this._src=v;this.naturalWidth=this.width=v.includes('turtle_atlas')?2048:v.includes('bg_')?960:200;this.naturalHeight=this.height=v.includes('turtle_atlas')?768:v.includes('bg_')?540:180;if(this.onload)this.onload();}get src(){return this._src;}}
const store={};
const doc={getElementById:()=>mainCv,createElement:()=>canvas(),addEventListener:noop,pointerLockElement:null,exitPointerLock:noop,documentElement:{requestFullscreen:noop}};
const mainCv=canvas();
const sandbox={console,Math,JSON,Date,Object,Array,String,Number,Set,Map,Uint8Array,Uint8ClampedArray,Float32Array,Int16Array,Uint16Array,Int32Array,Error,Infinity,NaN,isFinite,parseInt,parseFloat,Promise,Symbol,
  document:doc,innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:noop,AudioContext,Image,
  localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},performance:{now:()=>Date.now()},
  setInterval:()=>0,clearInterval:noop,setTimeout:(f)=>0,clearTimeout:noop,speechSynthesis:{speak:noop,cancel:noop,getVoices:()=>[]},SpeechSynthesisUtterance:function(){}};
sandbox.window=sandbox; sandbox.globalThis=sandbox;
vm.createContext(sandbox);
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const files=[...html.matchAll(/src="(js\/[^"]+)"/g)].map(m=>m[1]).filter(f=>fs.existsSync(path.join(ROOT,f)));
let code=files.map(f=>fs.readFileSync(path.join(ROOT,f),'utf8')).join('\n;\n');
code+=`\n;globalThis.__T={KP,K,M,step,MODES,G,newRun,makeCtx,playScene,setScene,go,titleScene,introScene,calendarScene,pageIntroScene,resultScene,perkScene,shopScene,feedScene,gameOverScene,victoryScene,boot,AU,get SCENE(){return SCENE},get FADEDIR(){return FADEDIR}};`;
vm.runInContext(code,sandbox,{filename:'game.js'});
const T=sandbox.__T; T.AU.init();
const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space','KeyJ','KeyK','KeyL','ShiftLeft','Enter','KeyZ','KeyX','KeyE','KeyQ','KeyR','Digit1','Digit2','Digit3','Digit4','KeyF','KeyH','KeyU','KeyI'];
function frames(n,rand=true,label=''){
  for(let i=0;i<n;i++){
    if(rand){ for(const k of keys){ if(Math.random()<0.04){T.KP[k]=true;T.K[k]=true;} else if(Math.random()<0.08)T.K[k]=false; }
      if(Math.random()<0.1){T.M.x=Math.random()*960;T.M.y=Math.random()*540;T.M.dx=(Math.random()-.5)*20;}
      if(Math.random()<0.06)T.M.click=true; if(Math.random()<0.03)T.M.rclick=true; T.M.down=Math.random()<0.3; if(Math.random()<.03)T.M.up=true; }
    delete T.KP.Escape; delete T.KP.KeyP; delete T.KP.KeyM;
    T.step(1/60);
  }
}
let fails=0;
function test(name,fn){try{fn();console.log('OK  ',name);}catch(e){fails++;console.log('FAIL',name,'\n   ',e.stack.split('\n').slice(0,4).join('\n    '));}}
const only=process.argv[2]; const onlySet=only?only.split(","):null;
if(!only){
test('boot+title',()=>{T.boot();frames(5,false);frames(200);});
test('intro',()=>{T.newRun(0);T.setScene(T.introScene());frames(300);});
test('calendar',()=>{T.newRun(0);T.setScene(T.calendarScene());frames(300);});
test('shop/feed/perk',()=>{T.newRun(0);T.G.run.likes=5000;T.G.run.pendingPerks=2;T.setScene(T.shopScene());frames(200);T.setScene(T.feedScene());frames(100);T.setScene(T.perkScene());frames(200);});
test('gameover/victory',()=>{T.newRun(0);T.setScene(T.gameOverScene());frames(150);T.newRun(0);T.setScene(T.victoryScene());frames(300);});
}
const modeIds=Object.keys(T.MODES).filter(m=>onlySet?onlySet.includes(m):m!=="fps");
for(const id of modeIds){
  test('mode '+id,()=>{
    for(let rep=0;rep<3;rep++){
      T.newRun(rep); const def=T.MODES[id]; const page={i:0,month:'ТЕСТ',year:2278+rep*5000,mode:id,done:false,stars:0,tries:0};
      if(rep===1){T.G.run.flags={dj:1,magnet:1,zen:1,turbo:1,rich:1};T.G.run.stats.hp=2;}
      const ctx=T.makeCtx(page,def); T.setScene(T.playScene(def,ctx)); frames(2,false);
      // pageIntro too
      frames(rep===2?3000:1500);
      if(rep===0){T.setScene(T.pageIntroScene(page));frames(30);T.setScene(T.resultScene(true,{xp:10,likes:10,lv:1,stars:2},ctx));frames(30);}
    }
  });
}
console.log(fails?`\n${fails} FAILED`:'\nALL OK', ' modes:',modeIds.join(','));
