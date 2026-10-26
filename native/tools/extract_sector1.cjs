// Offline development bake of source-authored pixel art. No JS runs in Godot.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,Image}=require('@napi-rs/canvas');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),src=fs.readFileSync(path.join(root,'js/02-moteur-jeu.js'),'utf8'),lines=src.split('\n');
const cat=JSON.parse(fs.readFileSync(path.join(root,'native/reference/catalog.json')));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'native/reference/source_manifest.json')));
for(const name of ['js/02-moteur-jeu.js','js/17-nv-silo-guardian-v3.js','js/24-nv-fanboy-authentic.js','js/34-nv-ship-native.js','js/51-nv-fanboy-reference.js']){
 const expected=manifest.files.find(f=>f.path===name);
 const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');
 if(!expected||actual!==expected.sha256)throw Error('Source changed; audit before rebaking: '+name);
}
const out=path.join(root,'native/sector1/baked');fs.mkdirSync(out,{recursive:true});
const pending=[];
class LocalImage extends Image {set src(v){super.src=fs.readFileSync(path.join(root,v));pending.push(this.decode());this._ok=true;if(this.onload)this.onload()}get src(){return ''}}
(async()=>{
const box={console,Math,Image:LocalImage,Uint8Array,Uint8ClampedArray,Float32Array,Int16Array,Map,WeakMap,Set,cat,fs,out,createCanvas,document:{createElement:()=>createCanvas(1,1)},window:{},setTimeout:()=>{},setInterval:()=>{}};
box.window=box; const ctx=vm.createContext(box);
const run=s=>vm.runInContext(s,ctx,{timeout:30000});
const range=(a,b)=>run(lines.slice(a-1,b).join('\n'));
function fun(name,last=false){let start=last?src.lastIndexOf('function '+name+'('):src.indexOf('function '+name+'(');if(start<0)throw Error(name);let p=src.indexOf('{',start),depth=0,quote=null,line=false,block=false;for(let i=p;i<src.length;i++){let c=src[i],n=src[i+1];if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;i++}continue}if(quote){if(c==='\\')i++;else if(c===quote)quote=null;continue}if(c==='/'&&n==='/'){line=true;i++;continue}if(c==='/'&&n==='*'){block=true;i++;continue}if('"\'`'.includes(c)){quote=c;continue}if(c==='{')depth++;if(c==='}'&&!--depth)return src.slice(start,i+1)}throw Error('brace '+name)}
range(1401,1413);
run(`const S=cat.default_save;let L_W=480,L_H=860;let IS_TOUCH=false,TOUCH_ACTOR_SCALE=1.22;const R={era:0,sec:0,S:1/3};const G={state:'play',eraIdx:0,level:1,stage:0,players:[],enemies:[],bullets:[],ebullets:[],props:[],pickups:[]};let PAINT={g:null,K:1/3};const Audio2={sfx:()=>{}};function saveGame(){};function useBuf(b){PAINT={g:b.g,K:b.K}};function clearBuf(b){b.g.clearRect(0,0,b.w,b.h)};const lv=()=>0;const L=x=>x;const radioSay=()=>{};const ENAMES={mGuardian:'GARDIEN DU SILO'};const nearestPlayer=()=>G.player;`);
range(2612,2627);run(fun("applyConsoleColorDepth"));range(1528,1733);range(1735,1845);range(2734,2774);
// Original rasterizer, geometry, materials, poses, drawing primitives and decor.
range(4304,5822);range(5831,6160); // through decorCanvas
range(7812,7837);
run(fun('decorBlit'));run(fun('decorDrawFloor'));run(fun('drawEnemyOne'));run(fun('line'));run(fun('poly'));run(fun('circle'));run(fun('ring'));run(fun('applyGameBoyPalette'));
run(`computeTheme(0,'squadron');const SCROLL={y:0,speed:95,boost:1};R.bufNear={c:createCanvas(160,287),w:160,h:287,K:1/3};R.bufNear.g=R.bufNear.c.getContext('2d');useBuf(R.bufNear);G.player={x:240,y:600,alive:true,inv:0,hp:3,maxHp:3,anim:0,bank:0,power:1};G.players=[G.player];function drawBoss(){};function drawPlayerCore(){};function drawPlayer(p){drawSpriteTo(PAINT.g,PAINT.K,S.sel.ship,p.x,p.y,{kind:'player',scale:IS_TOUCH?1.22:1})};const NVN={cur:null};`);
run(fs.readFileSync(path.join(root,'js/34-nv-ship-native.js'),'utf8'));
await Promise.all(pending);
run(fs.readFileSync(path.join(root,'js/17-nv-silo-guardian-v3.js'),'utf8'));
// Only LCD theme/decor corrections; browser shell is recreated natively.
let fx=fs.readFileSync(path.join(root,'js/51-nv-fanboy-reference.js'),'utf8');fx=fx.slice(0,fx.indexOf('  const oldTerrain'))+'})();';run(fx);
run(`const result={source_commit:cat.source_commit,raster:[160,287],logical:[480,860],sprites:{},decor:[],palette:['#9ea483','#7d8267','#595c4c','#2f3329']};
function bake(name,draw,ax=240,ay=600){clearBuf(R.bufNear);useBuf(R.bufNear);draw();applyGameBoyPalette(R.bufNear);const b=R.bufNear,im=b.g.getImageData(0,0,160,287),d=im.data;let x0=160,y0=287,x1=0,y1=0;for(let y=0;y<287;y++)for(let x=0;x<160;x++)if(d[(y*160+x)*4+3]>0){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}if(x1<x0)throw Error('empty '+name);const c=createCanvas(x1-x0+1,y1-y0+1);c.getContext('2d').drawImage(b.c,x0,y0,c.width,c.height,0,0,c.width,c.height);fs.writeFileSync(out+'/'+name+'.png',c.toBuffer('image/png'));result.sprites[name]={path:'res://native/sector1/baked/'+name+'.png',anchor:[Math.round(ax/3)-x0,Math.round(ay/3)-y0],size:[c.width,c.height]};}
for(const mobile of [false,true]){IS_TOUCH=mobile;for(let bank=-2;bank<=2;bank++)for(let f=0;f<4;f++){G.player.bank=bank*.5;G.player.anim=f/11;bake((mobile?'mobile_':'')+'falcon_'+bank+'_'+f,()=>drawPlayer(G.player));}} IS_TOUCH=false;
`);
// Basic flight data and mini stats are extracted, not guessed.
run(src.slice(src.indexOf('const ETYPES ='),src.indexOf('function eScale()')));
run(src.slice(src.indexOf('Object.assign(ETYPES, {'),src.indexOf('Object.assign(ETHEME, {')));
run(`for(const kind of ['drone','stinger','mGuardian','crate','barrel','pod'])for(let f=0;f<8;f++){const e={kind,x:240,y:600,t:f/8,phase:0,hp:150,maxHp:150,r:48,fireT:1,flash:0};bake(kind+'_'+f,()=>kind==='mGuardian'||kind==='drone'||kind==='stinger'?drawEnemyOne(e,PAINT.g,PAINT.K,0):drawSpriteTo(PAINT.g,PAINT.K,kind,240,600,{kind:'enemy',frame:f&3}));}
const dims={plateforme:[190,130],conduites:[140,80],baie:[110,105],paroi:[60,220],dock:[160,140]};
for(let i=0;i<CHUNKS.length;i++){const c=CHUNKS[i];if((c.minE||0)>0||(c.maxE!==undefined&&c.maxE<0)||c.fore||c.id==='cristaux'||c.sec!==undefined||c.stage!==undefined)continue;for(let seed=0;seed<4;seed++){const [w,h]=dims[c.id]||[150,130],inst={ci:i,x:90,y:90,w,h,seed};bake('decor_'+i+'_'+seed,()=>decorBlit([inst],R.bufNear),90,90);result.decor.push({id:c.id,ci:i,seed,w,h,sprite:'decor_'+i+'_'+seed,weight:c.wt||1});}}
IS_TOUCH=true;for(const kind of ['drone','stinger','crate','barrel','pod'])for(let f=0;f<8;f++){const e={kind,x:240,y:600,t:f/8,phase:0,flash:0};bake('mobile_'+kind+'_'+f,()=>kind==='drone'||kind==='stinger'?drawEnemyOne(e,PAINT.g,PAINT.K,0):drawSpriteTo(PAINT.g,PAINT.K,kind,240,600,{kind:'enemy',frame:f&3}));}IS_TOUCH=false;result.enemy_types={drone:ETYPES.drone,stinger:ETYPES.stinger,mGuardian:ETYPES.mGuardian};`);
// Atlas pixels retain the source frame anchors, scale and ordered palette conversion.
box.bossImage=new LocalImage();box.bossImage.src='assets/bosses/boss-01.webp';await Promise.all(pending);
run(`const m=cat.boss_atlas['1'];const kb=Math.min(clamp(96*2.25,180,360)/m.bw,320/(m.h*.9));for(let i=0;i<m.f.length;i++){const [fx,fy,fw,fh,ax,ay,sc]=m.f[i],s=kb*sc*(i>=18?.88:i===17?.94:1);bake('boss_'+i,()=>{const g=PAINT.g;g.imageSmoothingEnabled=false;g.drawImage(bossImage,fx,fy,fw,fh,(240-ax*s)/3,(600-ay*s)/3,fw*s/3,fh*s/3);});}result.boss=cat.levels[0].boss;result.boss.hp=Math.round(result.boss.hp*1.55);fs.writeFileSync(out+'/../sector.json',JSON.stringify(result,null,2));`);
// Extract authored chiptune note events with the source composition RNG.
const chip=fs.readFileSync(path.join(root,'js/24-nv-fanboy-authentic.js'),'utf8');
let songcode=chip.slice(chip.indexOf('  const SONGS ='),chip.indexOf('  const _mtick'));
run(`const AudioNotes=[];function gbVoice(t,o){AudioNotes.push({t,...o,type:o.type||'square'})};function gbNoise(t,o){AudioNotes.push({t,...o,type:'noise'})};const cl=clamp;Audio2.musicGain='music';const playing=()=>true;const calOn=()=>false;const O={};`);
run(songcode);
run(`result.music={};for(const [name,song] of [['sector',SONGS[0]],['boss',BOSS]]){AudioNotes.length=0;compose(song);const sd=60/song.bpm/4;for(let i=0;i<128;i++)gmSchedule(song,i,i*sd,sd);result.music[name]={duration:128*sd,events:AudioNotes.slice()};}fs.writeFileSync(out+'/../sector.json',JSON.stringify(result,null,2));`);
// Pack without resampling: native rendering uses these exact integer regions.
const sprites=run('result.sprites'),atlas=createCanvas(1024,1024),ag=atlas.getContext('2d');let x=0,y=0,rowH=0;
for(const [key,m] of Object.entries(sprites)){const im=new Image();im.src=fs.readFileSync(path.join(out,key+'.png'));await im.decode();if(x+im.width>1024){x=0;y+=rowH+2;rowH=0;}if(y+im.height>1024)throw Error('atlas overflow');ag.drawImage(im,x,y);m.path='res://native/sector1/baked/atlas.png';m.region=[x,y,im.width,im.height];x+=im.width+2;rowH=Math.max(rowH,im.height);}
fs.writeFileSync(path.join(out,'atlas.png'),atlas.toBuffer('image/png'));
run('result.sprites='+JSON.stringify(sprites));
run(`fs.writeFileSync(out+'/../sector.json',JSON.stringify(result,null,2));`);
for(const key of Object.keys(sprites)){fs.unlinkSync(path.join(out,key+'.png'));const imp=path.join(out,key+'.png.import');if(fs.existsSync(imp))fs.unlinkSync(imp);}
console.log('Packed',Object.keys(sprites).length,'source sprites in atlas.png');

})().catch(e=>{console.error(e);process.exit(1)});
