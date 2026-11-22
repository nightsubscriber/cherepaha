// Bot runner: plays a mode with a scripted bot to check balance. Usage: node tools/bot.js <mode> <seconds> [D]
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT=path.join(__dirname,'..');const noop=()=>{};const grad={addColorStop:noop};
function ctx2d(){const c={canvas:null,measureText:s=>({width:String(s).length*9}),createLinearGradient:()=>grad,createRadialGradient:()=>grad,createPattern:()=>({}),
  createImageData:(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),getImageData:(x,y,w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}),drawImage:noop};
  return new Proxy(c,{get:(t,k)=>k in t?t[k]:noop,set:(t,k,v)=>{t[k]=v;return true;}});}
function canvas(){const cv={width:300,height:150,style:{},getContext:()=>{const x=ctx2d();x.canvas=cv;return x;},getBoundingClientRect:()=>({left:0,top:0,width:960,height:540}),addEventListener:noop,requestPointerLock:noop,focus:noop};return cv;}
const audioNode=()=>new Proxy({},{get:(t,k)=>{if(['connect','start','stop','disconnect'].includes(k))return noop;if(k in t)return t[k];return t[k]={value:0,setValueAtTime:noop,exponentialRampToValueAtTime:noop,linearRampToValueAtTime:noop,setTargetAtTime:noop,cancelScheduledValues:noop};}});
class AudioContext{constructor(){this.currentTime=0;this.sampleRate=44100;this.state='running';this.destination={};}createGain(){return audioNode();}createOscillator(){return audioNode();}createBiquadFilter(){return audioNode();}createDelay(){return audioNode();}createBufferSource(){return audioNode();}createBuffer(c,l){return{getChannelData:()=>new Float32Array(l)};}resume(){}}
class Image{constructor(){this.complete=true;}set src(v){this._src=v;this.naturalWidth=this.width=v.includes('turtle_atlas')?2048:200;this.naturalHeight=this.height=v.includes('turtle_atlas')?768:180;if(this.onload)this.onload();}get src(){return this._src;}}
const timers=[];const store={};const mainCv=canvas();
const sb={console,Math,JSON,Date,Object,Array,String,Number,Set,Map,Uint8Array,Uint8ClampedArray,Float32Array,Int16Array,Uint16Array,Int32Array,Int8Array,Error,Infinity,NaN,isFinite,parseInt,parseFloat,Promise,Symbol,
  document:{getElementById:()=>mainCv,createElement:()=>canvas(),addEventListener:noop,pointerLockElement:null,exitPointerLock:noop,documentElement:{requestFullscreen:noop}},
  innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:noop,AudioContext,Image,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v},performance:{now:()=>Date.now()},
  setInterval:()=>0,clearInterval:noop,setTimeout:(f,ms)=>{timers.push({f,at:(ms||0)/1000});return 0;},clearTimeout:noop,speechSynthesis:{speak:noop,cancel:noop,getVoices:()=>[]},SpeechSynthesisUtterance:function(){}};
sb.window=sb;sb.globalThis=sb;vm.createContext(sb);
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const files=[...html.matchAll(/src="(js\/[^"]+)"/g)].map(m=>m[1]).filter(f=>fs.existsSync(path.join(ROOT,f)));
vm.runInContext(files.map(f=>fs.readFileSync(path.join(ROOT,f),'utf8')).join('\n;\n')+`;globalThis.__T={KP,K,M,MODES,G,newRun,PFX,AU,get g(){return g;}};`,sb,{filename:'game.js'});
const T=sb.__T;T.AU.init();
const mode=process.argv[2],secs=+process.argv[3]||300,Dv=+process.argv[4]||1.2;
T.newRun(0);let result=null;
const page={i:0,month:'ТЕСТ',year:2278,mode,done:false,stars:0,tries:0};
const ctx={page,def:T.MODES[mode],D:Dv,P:T.G.run.stats,F:T.G.run.flags,likes:0,done:false,addLikes(n){ctx.likes+=n;return n;},win(i){if(!result)result={win:true,i,t:time};},lose(i){if(!result)result={win:false,i,t:time};}};
const inst=T.MODES[mode].create(ctx);let time=0;const dt=1/60;
const bots=require('./bots.js');const bot=bots[mode];
for(let f=0;f<secs*60&&!result;f++){time+=dt;
  for(const k in T.KP)delete T.KP[k];T.M.click=T.M.rclick=false;
  bot(inst,T,time,f);
  inst.update(dt);inst.draw(T.g);T.PFX.update(dt);
  for(const tm of timers){tm.at-=dt;}for(let i=timers.length-1;i>=0;i--)if(timers[i].at<=0){const tm=timers.splice(i,1)[0];try{tm.f();}catch(e){}}
  if(f%(60*30)===0&&inst.dbg)console.log('t='+Math.round(time),JSON.stringify(bots.summary?bots.summary(mode,inst.dbg):''));
}
console.log('RESULT D='+Dv,result?JSON.stringify({win:result.win,t:Math.round(result.t),stars:result.i&&result.i.stars,text:result.i&&result.i.text}):'none after '+secs+'s', inst.dbg&&bots.summary?JSON.stringify(bots.summary(mode,inst.dbg)):'');
