/* Sector 24 only. ANIME artwork, original alpha, mirrored vertical loops. */
(() => {
'use strict';
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mobile=matchMedia('(pointer:coarse)').matches || innerWidth<760;
const dir='assets/level24-anime/'+(mobile?'mobile/':'pc/');
const files={boss:'boss/vorax_postures.webp',damage:'boss/vorax_degats.webp',hands:'boss/mains_articulees.webp',foes:'ennemis/escadrille.webp',defenses:'ennemis/defenses_base.webp',gate:'sas/sas_vorax_sequence.webp',base:'sas/base_toit_devanture.webp',door:'references/sas_exterieur_intact.webp',cracked:'references/sas_exterieur_fissure.webp',open:'references/sas_exterieur_detruit.webp',space:'decor/espace_profond.webp',blue:'decor/espace_bleu.webp',red:'decor/espace_rouge.webp',earth:'decor/terre.webp',halo:'decor/halo_terre.webp',corridor:'decor/couloir_intact.webp',debris:'decor/debris_12.webp',alert:'effets/alerte_sequence.webp',explosion:'effets/explosion_finale.webp'};
const im={},errors=[],audio=new Map();let pending=Object.keys(files).length;
for(const [k,f] of Object.entries(files)){const i=new Image();im[k]=i;i.decoding='async';i.onload=()=>{pending--;};i.onerror=()=>{pending--;errors.push(f);console.error('[Secteur 24] Texture manquante : '+dir+f);};i.src=dir+f;}
/* Salle du cœur de VORAX : dôme, plafond et réacteur rouge (pièce du boss).
   Image du pack level24-v2, chargée indépendamment des planches ANIME. */
const chamber=new Image();chamber.decoding='async';chamber.src='assets/level24-v2/environment/core-chamber.webp';
const chamberOk=()=>!!chamber.naturalWidth;
const on=()=>G.level===24&&G._nv24;
const tr=o=>o[typeof LANG==='string'?LANG:'fr']||o.fr;
const dialogue=()=>[
{fr:'Consoles, cartouches… votre petit bric-à-brac d’humains. Quel dégoût.',en:'Consoles, cartridges… your little human trinkets. Disgusting.',es:'Consolas, cartuchos… vuestras baratijas humanas. Qué asco.',pt:'Consolas, cartuchos… as vossas pequenas tralhas humanas. Que nojo.',ja:'ゲーム機、カートリッジ…人間どものくだらないガラクタ。反吐が出る。'},
{fr:'Grâce à moi, votre Terre sera comme les autres planètes : sans couleur, sans composants.',en:'Thanks to me, your Earth will be like the other planets: without color, without components.',es:'Gracias a mí, vuestra Tierra será como los otros planetas: sin color, sin componentes.',pt:'Graças a mim, a vossa Terra será como os outros planetas: sem cor, sem componentes.',ja:'私のおかげで、地球も他の惑星と同じになる。色も、部品もない世界に。'},
{fr:'Et mon armée la remplira tout entière.',en:'And my army will fill every last corner of it.',es:'Y mi ejército la ocupará por completo.',pt:'E o meu exército irá ocupá-la por inteiro.',ja:'そして私の軍勢が、その全てを埋め尽くす。'}].map(tr);
function sound(name){
 if(Audio2.muted||!S.opts.sfx)return;
 try{
  let a=audio.get(name);if(!a){a=new Audio();a.preload='auto';a.src='assets/sector24/audio/'+(a.canPlayType('audio/ogg')?'ogg/'+name+'.ogg':'wav/'+name+'.wav');a.onerror=()=>{if(a.src.endsWith('.ogg'))a.src='assets/sector24/audio/wav/'+name+'.wav';};audio.set(name,a);}
  a.volume=cl((S.opts.sfx||0)/100);a.currentTime=0;const p=a.play();if(p)p.catch(()=>{});
 }catch(e){console.error('[Secteur 24] Audio',name,e);}
}
function frame(g,key,f,cols,rows,x,y,w,h,alpha=1){const a=im[key];if(!a||!a.naturalWidth)return;const cw=a.naturalWidth/cols,ch=a.naturalHeight/rows;g.save();g.globalAlpha*=alpha;g.drawImage(a,(f%cols)*cw,Math.floor(f/cols)*ch,cw,ch,x-w/2,y-h/2,w,h);g.restore();}
function layer(g,key,x,y,w,h,alpha=1){const a=im[key];if(!a||!a.naturalWidth)return;g.save();g.globalAlpha*=alpha;g.drawImage(a,x,y,w,h);g.restore();}
function near(fn){useBuf(R.bufNear);const g=PAINT.g,K=PAINT.K;g.save();g.scale(K,K);fn(g);g.restore();}
function bar(g,x,y,w,value,label){g.fillStyle='#050912';g.fillRect(x-w/2-2,y-2,w+4,12);g.fillStyle='#513342';g.fillRect(x-w/2,y,w,8);g.fillStyle=value>0?'#ff4860':'#82969e';g.fillRect(x-w/2,y,w*cl(value),8);g.font='11px sans-serif';g.textAlign='center';g.fillStyle='#fff';g.fillText(label,x,y-7);}
function drawDoor(v){const d=v.door;if(!d)return;near(g=>{
 // The frame and roof enclose the same opening; no floating door.
 const bw=d.w*1.92,bh=bw*2/3;layer(g,'base',d.x-bw/2,d.y-bh*.77,bw,bh);
 if(v.stage!=='boom'){g.fillStyle='#151b24';g.fillRect(d.x-d.w*.46,d.y-d.w*.20,d.w*.92,d.w*.40);}
 const key=v.stage==='boom'?'open':d.hp/d.max<.58?'cracked':'door';layer(g,key,d.x-d.w/2,d.y-d.w*.17,d.w,d.w*.34);
 for(const side of [-1,1]) frame(g,'defenses',Math.floor(v.T*9)%4,4,4,d.x+side*d.w*.41,d.y-d.w*.25*.18,60,40);
 if(v.stage==='sas')bar(g,d.x,d.y+d.w*.16,d.w*.65,d.hp/d.max,tr({fr:'SAS DE CONFINEMENT',en:'CONTAINMENT AIRLOCK',es:'ESCLUSA',pt:'ESCOTILHA',ja:'封鎖エアロック'}));
 });}
function drawGate(v){const d=v.door2;if(!d)return;let f=0;
 if(v.stage==='hands') f=G.boss&&G.boss.hands&&G.boss.hands.some(h=>h.dead)?4:Math.min(3,1+Math.floor(v.t*5));
 if(v.stage==='tear')f=Math.min(7,4+Math.floor(v.t*1.5));
 if(['reveal','vorax','morph','dead'].includes(v.stage))return;
 near(g=>frame(g,'gate',f,2,4,d.x,d.y,d.w,d.w*.25));}
function drawHands(b,v){if(!b.hands)return;near(g=>{for(const h of b.hands){
 const label=tr(h.side<0?{fr:'MAIN GAUCHE',en:'LEFT HAND',es:'MANO IZQUIERDA',pt:'MÃO ESQUERDA',ja:'左手'}:{fr:'MAIN DROITE',en:'RIGHT HAND',es:'MANO DERECHA',pt:'MÃO DIREITA',ja:'右手'});
 if(v.stage==='hands')bar(g,h.x,h.y-62,110,h.hp/h.maxHp,label+(h.dead?' · 0':''));
 // Fingers are painted in the gate during endurance; detached hands only during the pull.
 if(v.stage==='tear'&&v.t<2)frame(g,'hands',(h.side<0?0:4)+2,4,2,h.x,h.y,100,100,h.a);
 // Repère visuel de dégât : la main touchée flashe (blanc chaud) et clipse.
 if(h.flash>0&&h.a>0){
  const fl=cl(h.flash*2.2),R=78;
  g.save();g.globalCompositeOperation='lighter';
  const gr=g.createRadialGradient(h.x,h.y,0,h.x,h.y,R);
  gr.addColorStop(0,'rgba(255,255,255,'+(0.9*fl)+')');
  gr.addColorStop(.45,'rgba(255,150,170,'+(0.55*fl)+')');
  gr.addColorStop(1,'rgba(255,90,120,0)');
  g.fillStyle=gr;g.fillRect(h.x-R,h.y-R,R*2,R*2);g.restore();
  g.save();g.globalAlpha=cl(fl)*.8;g.strokeStyle='#fff4f6';g.lineWidth=2;
  for(let i=0;i<5;i++){const a=i/5*TAU+h.side,gx=h.x+Math.cos(a)*R*.7,gy=h.y+Math.sin(a)*R*.7;
   g.beginPath();g.moveTo(gx,gy);g.lineTo(gx+Math.cos(a)*16,gy+Math.sin(a)*16);g.stroke();}
  g.restore();
 }
 }});}
const foeRows={lance:['foes',0],manta:['foes',1],dard:['foes',2],orbe:['foes',3],tourelle:['defenses',0],tambour:['defenses',1],griffe:['defenses',2],gatling:['defenses',3]};
const FOE_W={lance:70,manta:138,dard:62,orbe:74,tourelle:84,tambour:98,griffe:92,gatling:92};
/* Un seul cadre par ennemi : les ailes/lames sont fixes (fini le battement).
   La mise en vie vient d'effets procéduraux : réacteurs, LEDs, flashs de tir,
   anneaux de charge — aucun cycle de planche qui décale la silhouette. */
const FLYERS={lance:1,manta:1,dard:1,orbe:1,griffe:1,tambour:1};
function drawFoe(e){const a=foeRows[e.nv];if(!a)return false;if(pending||errors.length)return false;
 const w=FOE_W[e.nv],h=w*2/3,k=e.k||0,rot=(e.nv==='tourelle'||e.nv==='gatling');
 near(g=>{
  g.translate(e.x,e.y);
  if(rot)g.rotate((e.aimA||Math.PI/2)-Math.PI/2);
  /* réacteur : flamme tremblante derrière l'appareil (vers le haut de l'écran) */
  if(FLYERS[e.nv]){
   const fl=.7+.3*Math.sin(k*22+(e.spin||0))+.15*Math.sin(k*41),len=h*.42*fl,wf=w*.13;
   g.save();g.globalCompositeOperation='lighter';
   const gr=g.createLinearGradient(0,-h*.34,0,-h*.34-len);
   gr.addColorStop(0,'rgba(255,246,225,.95)');gr.addColorStop(.35,'rgba(255,138,48,.8)');gr.addColorStop(1,'rgba(255,40,60,0)');
   g.fillStyle=gr;g.beginPath();g.moveTo(-wf,-h*.34);g.quadraticCurveTo(0,-h*.34-len*1.25,wf,-h*.34);g.quadraticCurveTo(0,-h*.34-len*.55,-wf,-h*.34);g.fill();
   g.globalAlpha=.5;g.fillStyle='#fff2d8';g.beginPath();g.ellipse(0,-h*.36,wf*.32,h*.07,0,0,TAU);g.fill();g.restore();
  }
  /* orbe qui charge son tir radial : halo rouge pulsé + anneau */
  if(e.nv==='orbe'&&e.ch>0){
   g.save();g.globalCompositeOperation='lighter';
   const rr=w*.42+e.ch*w*.35;
   const rg=g.createRadialGradient(0,0,0,0,0,rr);rg.addColorStop(0,'rgba(255,60,72,'+(.5*e.ch)+')');rg.addColorStop(1,'rgba(255,40,60,0)');
   g.fillStyle=rg;g.fillRect(-rr,-rr,rr*2,rr*2);
   g.strokeStyle='rgba(255,90,110,'+(.8*e.ch)+')';g.lineWidth=2;g.beginPath();g.arc(0,0,w*.3*e.ch,0,TAU);g.stroke();g.restore();
  }
  /* silhouette fixe : toujours la première case de la ligne de la planche */
  frame(g,a[0],a[1]*4,4,4,0,0,w,h);
  /* LEDs de coque qui clignotent en opposition */
  const ledOn=Math.sin(k*7+(e.spin||0))>0;
  g.save();g.globalCompositeOperation='lighter';
  for(const s of [-1,1]){g.globalAlpha=ledOn?(s<0?.95:.35):(s<0?.35:.95);
   g.fillStyle=s<0?'#ff3b52':'#46d8ff';g.beginPath();g.arc(s*w*.28,h*.12,Math.max(1.8,w*.045),0,TAU);g.fill();}
  g.restore();g.globalAlpha=1;
  /* tambour : ses prises rouges s'allument pendant la rafale */
  if(e.nv==='tambour'&&e.fireOn>0){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.5+.5*Math.sin(k*18);
   g.fillStyle='rgba(255,60,72,.9)';for(const s of [-1,1]){g.beginPath();g.arc(s*w*.3,-h*.1,Math.max(2,w*.06),0,TAU);g.fill();}g.restore();}
  /* flash de bouche au tir (recul) */
  if(e.recoil>0){g.save();g.globalCompositeOperation='lighter';const rr=w*.16*(.6+e.recoil);
   const mg=g.createRadialGradient(0,h*.36,0,0,h*.36,rr);mg.addColorStop(0,'rgba(255,250,235,.95)');mg.addColorStop(.5,'rgba(255,150,70,.6)');mg.addColorStop(1,'rgba(255,80,40,0)');
   g.fillStyle=mg;g.fillRect(-rr,h*.36-rr,rr*2,rr*2);g.restore();}
  if(e.hp<e.maxHp)bar(g,0,-h*.6,w*.7,e.hp/e.maxHp,'');
 });return true;
}
// The atlas has common registration. Sockets below were inspected per painted pose.
const sockets=[[[0.527, 0.44], [0.573, 0.44], [0.25, 0.81], [0.81, 0.81]], [[0.492, 0.44], [0.538, 0.44], [0.23, 0.81], [0.8, 0.81]], [[0.462, 0.44], [0.508, 0.44], [0.22, 0.81], [0.8, 0.81]], [[0.437, 0.44], [0.483, 0.44], [0.21, 0.81], [0.79, 0.81]], [[0.527, 0.4], [0.573, 0.4], [0.25, 0.58], [0.81, 0.8]], [[0.492, 0.4], [0.538, 0.4], [0.23, 0.57], [0.81, 0.8]], [[0.462, 0.4], [0.508, 0.4], [0.23, 0.57], [0.76, 0.65]], [[0.437, 0.4], [0.483, 0.4], [0.22, 0.55], [0.77, 0.55]], [[0.527, 0.35], [0.573, 0.35], [0.27, 0.61], [0.81, 0.76]], [[0.492, 0.35], [0.538, 0.35], [0.25, 0.57], [0.81, 0.67]], [[0.462, 0.35], [0.508, 0.35], [0.2, 0.55], [0.75, 0.65]], [[0.437, 0.35], [0.483, 0.35], [0.19, 0.55], [0.75, 0.6]], [[0.527, 0.325], [0.573, 0.325], [0.42, 0.7], [0.6, 0.68]], [[0.492, 0.325], [0.538, 0.325], [0.2, 0.65], [0.75, 0.7]], [[0.462, 0.325], [0.508, 0.325], [0.22, 0.7], [0.81, 0.65]], [[0.437, 0.325], [0.483, 0.325], [0.19, 0.69], [0.77, 0.69]]];
/* Posture de repos FIXE par forme : plus de cycle de frames continu (le sprite
   ne se décale plus). Seules la charge d'attaque (télégraphe) et la
   transformation (morph) font changer de cadre. Le boss continue de se
   déplacer par sa position b.vx/b.vy, indépendamment de la posture. */
function pose(b){const A=b.atk;if(A&&A.ch>.05)return 8+Math.min(3,Math.floor(cl(A.ch)*3));return (b.nv.form===2?12:b.nv.form===1?4:0);}
function geom(b){const w=545*(500/629)*(b.vz||1),h=w;return {w,h,x:b.vx-w/2,y:b.vy-h/2};}
function socket(b,n){const q=geom(b),p=sockets[pose(b)][n];return [q.x+p[0]*q.w,q.y+p[1]*q.h];}
function drawBoss(b,v,alpha=1){if(pending||errors.length)return false;near(g=>{const q=geom(b),A=b.atk,f=pose(b);
 if(v.stage==='morph'){frame(g,'damage',4+Math.min(3,Math.floor(v.t*4)),4,3,b.vx,b.vy,q.w,q.h,alpha*(1-cl(v.t/2.4)));frame(g,'boss',f,4,4,b.vx,b.vy,q.w,q.h,alpha*cl(v.t/2.4));}
 else frame(g,'boss',f,4,4,b.vx,b.vy,q.w,q.h,alpha);
 if(A&&A.ch>.05){g.save();g.globalCompositeOperation='lighter';const pts=A.name==='palms'||A.name==='orbs'?[2,3]:[0,1];for(const n of pts){const p=socket(b,n),r=8+28*cl(A.ch);const gr=g.createRadialGradient(...p,0,...p,r);gr.addColorStop(0,'#fff1de');gr.addColorStop(.25,'#ff253b');gr.addColorStop(1,'#ff253b00');g.fillStyle=gr;g.fillRect(p[0]-r,p[1]-r,r*2,r*2);}g.restore();}
 if(v.stage==='morph'){g.strokeStyle='#ff2645';g.lineWidth=2;for(let i=0;i<5;i++){const x=b.vx+Math.sin(b.t*9+i)*q.w*.4,y=b.vy+i*22-44;g.beginPath();g.moveTo(x,y);g.lineTo(x+16,y+18);g.lineTo(x-8,y+29);g.stroke();}}
 });return true;}
NVBOSS.vorax.ready=()=>pending===0&&!errors.length;
NVBOSS.vorax.draw=drawBoss;
NVBOSS.vorax.eyes=b=>[socket(b,0),socket(b,1)];
NVBOSS.vorax.hands=b=>[2,3].map(n=>{const p=socket(b,n),s=(500/629)*(b.vz||1);return [(p[0]-b.vx)/s+330.5,(p[1]-b.vy)/s+319.5];});
NVBOSS.vorax.head=b=>{const p=socket(b,0),s=(500/629)*(b.vz||1);return [(p[0]-b.vx)/s+330.5,(p[1]-b.vy)/s+319.5];};
function updateDeath(b,dt){if(!b.animeDeath){b.animeDeath=true;b.deadT=0;sound('23_vorax_explosion_FINALE');
 // L'explosion commence tout de suite : secousse + flash, VORAX ne reste pas figé.
 FX.addFlash(.7,'#ffd9c8');FX.addShake(22);}
 b.deadT+=dt;b.t+=dt;G.phase='boss';if(G.harvest)G.harvest.t=0;
 if(b.deadT>=2.6&&!b.animeBang){b.animeBang=true;FX.addFlash(1,'#fff');FX.addShake(38);}
 if(b.deadT>2.6&&b.deadT<6)FX.addShake(5);
 /* 11 s au lieu de 8 : on laisse l'explosion ET les mots de Vesta se lire
    avant le bilan de secteur (req. fin de niveau trop précipitée). */
 if(b.deadT>=11){G.boss=null;G.harvest=null;G._nv24.stage='complete';levelComplete();}}
function drawDeath(b){near(g=>{const t=b.deadT||0;const f=t<2.6?Math.min(3,Math.floor(t/2.6*4)):Math.min(15,4+Math.floor((t-2.6)/5.4*12));if(t<2.6)frame(g,'damage',8+Math.min(3,Math.floor(t*2)),4,3,b.vx,b.vy,430,430);frame(g,'explosion',f,4,4,b.vx,b.vy,650,490);});}
const debrisMasks=[];
function debrisAt(i,t){return {w:L_W*(.055+(i%3)*.015),x:L_W*(.08+((i*37)%85)/100),y:(i*L_H/7+t*(15+i)*L_H/(R.bufFar?.c.height||L_H))%(L_H+100*L_H/(R.bufFar?.c.height||L_H))-50*L_H/(R.bufFar?.c.height||L_H)};}
function debrisContact(v){
 if(v.stage!=='approach'||!im.debris.naturalWidth)return;
 if(!debrisMasks.length){const a=im.debris;for(let i=0;i<12;i++){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(a,i%4*a.naturalWidth/4,Math.floor(i/4)*a.naturalHeight/3,a.naturalWidth/4,a.naturalHeight/3,0,0,64,64);debrisMasks.push(g.getImageData(0,0,64,64).data);}}
 const t=v.sy||v.T;
 for(const p of G.players||[G.player]){if(!p?.alive||p.inv>0)continue;for(let i=0;i<12;i++){const d=debrisAt(i,t),x=Math.floor((p.x-d.x)/d.w*64+32),y=Math.floor((p.y-d.y)/(d.w*(R.bufFar?.c.width||L_W)/L_W*L_H/(R.bufFar?.c.height||L_H))*64+32);if(x>=0&&x<64&&y>=0&&y<64&&debrisMasks[i][(y*64+x)*4+3]>180){hitPlayer(p,1,true);break;}}}
}
let lastState,stage,lastAtk;
const priorFlow=updateLevelFlow;
updateLevelFlow=function(dt){const r=priorFlow(dt);if(!on())return r;const v=G._nv24;debrisContact(v);if(lastState!==v){lastState=v;stage=null;lastAtk=null;}
 if(stage!==v.stage){stage=v.stage;const snd={arrive:'08_sas_verrouille',boom:'10_sas_rupture',alarm:'14_alerte_sirene',tear:'13_porte_arrachee',reveal:'17_vorax_apparition',morph:'22_vorax_surcharge'}[stage];if(snd)sound(snd);}
 /* Son de charge répété (18_vorax_charge) retiré : il pesait à chaque attaque.
    Le début d'attaque garde son alerte du moteur ; seul le tir laser résonne. */
 const A=G.boss&&G.boss.atk;if(A!==lastAtk)lastAtk=A;
 if(A&&A.ends&&!A.animeSound){A.animeSound=true;sound('19_vorax_laser');}
 return r;};
const priorWorld=drawWorld;
drawWorld=function(dt){const result=priorWorld.apply(this,arguments);if(!on())return result;const v=G._nv24;if(!R.bufFar)return;const g=R.bufFar.g,W=R.bufFar.c.width,H=R.bufFar.c.height;
 g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle='#02040c';g.fillRect(0,0,W,H);
 const space=['approach','arrive','talk','sas','boom'].includes(v.stage),t=v.sy||v.T;
 if(space){nv24VerticalLoop(g,im.space,t*7,W,H);g.globalAlpha=.28;nv24VerticalLoop(g,im.blue,t*12,W,H);g.globalAlpha=.12;nv24VerticalLoop(g,im.red,t*18,W,H);g.globalAlpha=1;
 // One world position, never wrapped. Both Earth layers use the exact same rectangle.
 const ew=W*1.35,ex=-W*.38,ey=-ew+t*H/34;layer(g,'halo',ex,ey,ew,ew);layer(g,'earth',ex,ey,ew,ew);
 // Les débris flottent à la même vitesse que le fond : plus de traits verticaux sur les bords.
 for(let i=0;i<12;i++){const d=debrisAt(i,t),w=d.w*W/L_W;frame(g,'debris',i,4,3,d.x*W/L_W,d.y*H/L_H,w,w,.95);}
 }else{
  /* La salle du cœur (dôme, plafond, réacteur) remplace le couloir dès que
     VORAX apparaît : c'est SA pièce, avec un vrai plafond derrière lui. */
  if(['reveal','morph','vorax','dead','complete'].includes(v.stage)&&chamberOk()){
   if(v.stage==='reveal')nv24VerticalLoop(g,im.corridor,(498-v.off)*2*H/L_H,W,H);
   const a=v.stage==='reveal'?cl(v.t/1.1):1;
   const zoom=1.05+.012*Math.sin((v.T||0)*.4);
   const sc=Math.max(W/chamber.naturalWidth,H/chamber.naturalHeight)*zoom;
   const dw=chamber.naturalWidth*sc,dh=chamber.naturalHeight*sc;
   g.save();g.globalAlpha=a;g.drawImage(chamber,(W-dw)/2,(H-dh)/2,dw,dh);g.restore();
  }else nv24VerticalLoop(g,im.corridor,(498-v.off)*2*H/L_H,W,H);
 }
 g.fillStyle='#02040c30';g.fillRect(0,0,W,H);g.restore();
 for(const buf of [R.bufFG,R.bufMid])if(buf){buf.g.save();buf.g.setTransform(1,0,0,1,0,0);buf.g.clearRect(0,0,buf.c.width,buf.c.height);buf.g.restore();}
 // All actors still render through the campaign's normal render passes.
};
const GATE_TXT={fr:'LE GRAND SAS VA CÉDER · PRÉPARE-TOI',en:'THE GREAT AIRLOCK IS GIVING WAY · GET READY',es:'LA GRAN ESCLUSA VA A CEDER · PREPÁRATE',pt:'A GRANDE ESCOTILHA VAI CEDER · PREPARA-TE',ja:'大エアロックが破られる · 備えろ'};
const priorHUD=drawHUD;
drawHUD=function(){const r=priorHUD.apply(this,arguments);if(!on())return r;const v=G._nv24;
 if(pending||errors.length){loading();return r;}
 /* Bannière d'alerte identique aux autres secteurs (bandeau standard nvAlertDraw,
    texte inclus dans la box) — remplace l'ancienne planche alerte peu lisible. */
 if(v.stage==='alarm'&&window.nvAlertDraw&&window.nvAlertText){
  const X=window.nvAlertText;
  window.nvAlertDraw(v.t,3.7,{title:X.tr(X.title),name:X.tr(X.unknown),sub:tr(GATE_TXT),y:.58});
 }return r;};
function loading(){ctx.save();ctx.fillStyle='#050817e8';ctx.fillRect(PF.x,PF.y,PF.w,PF.h);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.fillText(errors.length?'Secteur 24 : texture manquante (voir console)':'Chargement du secteur 24…',PF.x+PF.w/2,PF.y+PF.h/2);ctx.restore();}
window.NV24ANIME={ready:()=>pending===0&&!errors.length,errors,images:im,drawDoor,drawGate,drawHands,drawFoe,drawBoss,drawDeath,updateDeath,sound,dialogue,loading};
// Explicit test entry skips the story and starts the existing campaign controller.
if(new URLSearchParams(location.search).has('nv24play')){
 const start=()=>{if(pending)return setTimeout(start,100);if(errors.length)return;document.querySelectorAll('.overlay').forEach(e=>e.classList.add('hidden'));startLevel(24);G.state='play';};
 setTimeout(start,100);
}
})();
