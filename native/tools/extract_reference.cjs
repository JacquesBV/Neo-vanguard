// Development-only extraction of authored data. No JavaScript runtime ships in Godot.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const baseline = 'ccd7e82087afc8a993fbb5e3a5dcf2d3f6dbf057';
function source(file) { return cp.execFileSync('git', ['show', `${baseline}:${file}`], {cwd:root,maxBuffer:10*1024*1024}).toString(); }
function expression(text, offset, open) {
  const pairs = {'[':']','{':'}','(':')'};
  const start = text.indexOf(open,offset), stack = [];
  if(start < 0) throw Error('Missing expression');
  let quote=null, line=false, block=false;
  for(let i=start;i<text.length;i++) {
    const c=text[i], n=text[i+1];
    if(line) {if(c==='\n')line=false;continue;}
    if(block) {if(c==='*'&&n==='/'){block=false;i++;}continue;}
    if(quote) {if(c==='\\'){i++;continue;} if(c===quote)quote=null;continue;}
    if(c==='/'&&n==='/'){line=true;i++;continue;}
    if(c==='/'&&n==='*'){block=true;i++;continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(pairs[c])stack.push(pairs[c]);
    else if(c===stack.at(-1)){stack.pop();if(!stack.length)return text.slice(start,i+1);}
  }
  throw Error('Unclosed expression');
}
function readConstant(text,name,open) {
  const m=new RegExp(`const\\s+${name}\\s*=`).exec(text);
  if(!m)throw Error(`Missing ${name}`);
  return vm.runInNewContext('('+expression(text,m.index+m[0].length,open)+')',Object.create(null),{timeout:1000});
}
const engine=source('js/02-moteur-jeu.js');
const catalog={source_commit:baseline,logical_width:480,logical_height:860};
for(const name of ['ERAS','LIVERIES','TRAILS','AURAS','BULLET_SKINS','SHIPS','WEAPONS','UPGRADES','DIFFS','CHEATS','BOSSES','BOSS_OF_LEVEL','STORY','GB4','PAL1','PAL2','PAL3','PAL4'])catalog[name.toLowerCase()]=readConstant(engine,name,'[');
const pushed=expression(engine,engine.indexOf('BOSSES.push('),'(');
catalog.bosses.push(...vm.runInNewContext('['+pushed.slice(1,-1)+']',Object.create(null),{timeout:1000}));
catalog.story_images=readConstant(engine,'STORY_IMG','{');
catalog.default_save=vm.runInNewContext('('+expression(engine,engine.indexOf('return {',engine.indexOf('function defaultSave()')),'{')+')',Object.create(null),{timeout:1000});
catalog.ship_sheets=readConstant(source('js/33-nv-ship-sheets.js'),'SHEETS','{');
catalog.ship_animation_rows=readConstant(source('js/33-nv-ship-sheets.js'),'ROWS','{');
catalog.ship_native_rows=readConstant(source('js/34-nv-ship-native.js'),'ROWS','{');
catalog.boss_atlas=readConstant(source('js/46-nv-boss-sprites.js'),'META','{');
catalog.music=JSON.parse(source('assets/music-shop/music-catalog.json'));
catalog.levels=catalog.boss_of_level.map((id,i)=>({level:i+1,era:Math.floor(i/4),stage:i%4,boss_index:id,boss:catalog.bosses[id]}));
const files=cp.execFileSync('git',['ls-tree','-r','--name-only',baseline],{cwd:root}).toString().trim().split('\n');
const manifest=files.map(file=>{const bytes=fs.readFileSync(path.join(root,file));return {path:file,size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});
const dataDir=path.join(root,'native/reference');fs.mkdirSync(dataDir,{recursive:true});
fs.writeFileSync(path.join(dataDir,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
fs.writeFileSync(path.join(dataDir,'source_manifest.json'),JSON.stringify({source_commit:baseline,files:manifest},null,2)+'\n');
if(catalog.levels.length!==24||catalog.bosses.length!==24||catalog.ships.length!==7)throw Error('Unexpected source inventory');
for(const sheets of Object.values(catalog.ship_sheets))for(const sheet of sheets)if(!fs.existsSync(path.join(root,sheet[0])))throw Error('Missing '+sheet[0]);
console.log(JSON.stringify({source_commit:baseline,files:manifest.length,bytes:manifest.reduce((n,f)=>n+f.size,0),levels:catalog.levels.length,ships:catalog.ships.length,music:catalog.music.length,options:Object.keys(catalog.default_save.opts).length}));
