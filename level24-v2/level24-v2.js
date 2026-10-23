/* NEO-VANGUARD — Secteur 24 / VORAX V2
 * Direction artistique, couches de décor et rendu des trois formes.
 * Le script est chargé après nv24-final-rework et nv-boss-sprites.
 */
(() => {
  'use strict';
  const DIR = 'assets/level24-v2/';
  const CELL = 640;
  const FILES = {
    earth: 'environment/earth.webp', nebula: 'environment/nebula-tile.webp', base: 'environment/vorax-base.webp',
    corridor: 'environment/corridor-tile.webp', core: 'environment/core-chamber.webp',
    debris0: 'debris/alloy.webp', debris1: 'debris/solar.webp', debris2: 'debris/rock.webp', debris3: 'debris/engine.webp',
    boss0: 'boss/vorax-cuirasse.webp', boss1: 'boss/vorax-necro-reacteur.webp', boss2: 'boss/vorax-singularite.webp',
    ring: 'effects/charge-ring.png', beam: 'effects/beam-red.png', fracture: 'effects/fracture.png'
  };
  const IM = {};
  let requested = false;
  const ensure = () => {
    if (requested) return; requested = true;
    for (const [key, file] of Object.entries(FILES)) {
      const im = new Image(); im.decoding = 'async'; im.src = DIR + file; IM[key] = im;
    }
  };
  const ok = im => !!(im && im.complete && im.naturalWidth > 0);
  const bossReady = () => { ensure(); return ok(IM.boss0) && ok(IM.boss1) && ok(IM.boss2); };
  const envReady = () => { ensure(); return ok(IM.nebula) && ok(IM.earth) && ok(IM.corridor) && ok(IM.core); };
  const cl = (v,a,b) => Math.max(a,Math.min(b,v));
  const sm = v => { v=cl(v,0,1); return v*v*(3-2*v); };
  const on = () => typeof G !== 'undefined' && G.level === 24 && G._nv24 && G._nv24.level === 24;
  const V = () => G._nv24;
  const lang = () => typeof LANG === 'string' ? LANG : 'fr';
  const TX = {
    morph: { fr:'MÉTAMORPHOSE', en:'TRANSFORMATION', es:'TRANSFORMACIÓN', pt:'TRANSFORMAÇÃO', ja:'形態変化' },
    form: { fr:'FORME', en:'FORM', es:'FORMA', pt:'FORMA', ja:'形態' },
    names: [
      { fr:'VORAX · CUIRASSÉ', en:'VORAX · ARMORED', es:'VORAX · ACORAZADO', pt:'VORAX · BLINDADO', ja:'ヴォラックス・装甲形態' },
      { fr:'VORAX · NÉCRO-RÉACTEUR', en:'VORAX · NECRO-REACTOR', es:'VORAX · NECROREACTOR', pt:'VORAX · NECRORREATOR', ja:'ヴォラックス・ネクロリアクター' },
      { fr:'VORAX · SINGULARITÉ', en:'VORAX · SINGULARITY', es:'VORAX · SINGULARIDAD', pt:'VORAX · SINGULARIDADE', ja:'ヴォラックス・特異点' }
    ]
  };
  const tr = o => o[lang()] || o.fr;

  /* Points d'ancrage logiques, communs aux collisions et aux rayons. */
  const ANCHORS = [
    { eyes:[[294,151],[350,151]], head:[322,170], hands:[[142,400],[502,400]] },
    { eyes:[[292,208],[352,208]], head:[322,225], hands:[[128,388],[516,388]] },
    { eyes:[[294,151],[350,151]], head:[322,170], hands:[[135,400],[509,400]] }
  ];
  const formOf = b => cl(b && b.nv ? (b.nv.form | 0) : 0, 0, 2);
  const bobOf = b => Math.sin((b && b.t || 0) * 1.7) * 2.4 * ((b && b.vz) || 1);

  /* Remplacement du seul rendu VORAX ; les autres boss gardent leur atlas. */
  if (window.NVBOSS && NVBOSS.vorax) {
    NVBOSS.vorax.ready = bossReady;
    NVBOSS.vorax.form = formOf;
    NVBOSS.vorax.eyes = (b,vpt) => ANCHORS[formOf(b)].eyes.map(p => { const q=vpt(b,p[0],p[1]); q[1]+=bobOf(b); return q; });
    NVBOSS.vorax.head = b => ANCHORS[formOf(b)].head;
    NVBOSS.vorax.hands = b => ANCHORS[formOf(b)].hands;
    NVBOSS.vorax.draw = drawVorax;
  }

  function frameFor(b,v) {
    if (b.dead) return 11;
    if (v && v.stage === 'morph') return b.hp > 0 ? 0 : 10;
    const A=b.atk, t=b.t||0;
    if (A) {
      const n=A.name;
      if (n === 'palms') return A.ends ? 8 : 5;
      if (n.startsWith('laser') || n === 'sweep') return A.ends ? 6 : 4;
      if (n === 'orbs') return A.t > .9 ? 7 : 5;
      if (n === 'spiral' || n === 'rain') return A.ch >= 1 ? 8 : 4;
    }
    if (b.flash > .045) return 9;
    if (b.hp / Math.max(1,b.maxHp) < .16 && Math.floor(t*7)%5===0) return 10;
    return Math.floor(t*5.5)%4;
  }

  function drawVorax(b,v,alpha=1,extra={},vpt,VXS) {
    if (!bossReady()) return false;
    useBuf(R.bufNear);
    const g=PAINT.g, K=PAINT.K, form=formOf(b), z=b.vz||1, s=VXS*z;
    const stage=v&&v.stage, A=b.atk, charge=A?(A.ch||0):0;
    const top=vpt(b,0,0), bob=bobOf(b);
    let jx=0,jy=0,scale=1;
    if (stage==='morph') { const u=cl(v.t/2.4,0,1); jx=(Math.random()-.5)*9*u; jy=(Math.random()-.5)*7*u; scale=1+Math.sin(u*Math.PI)*.06; }
    const drawFrame=(f,im,a,addScale=1) => {
      if (a<=0) return;
      const cw=im.naturalWidth/4,ch=im.naturalHeight/3,sx=(f%4)*cw,sy=Math.floor(f/4)*ch;
      const w=CELL*s*scale*addScale,x=top[0]+jx-(w-CELL*s)/2,y=top[1]+bob+jy-(w-CELL*s)/2;
      g.save(); g.globalAlpha=cl(a,0,1); g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
      if (extra.dark) g.filter=`brightness(${Math.max(.06,1-extra.dark)})`;
      g.drawImage(im,sx,sy,cw,ch,x*K,y*K,w*K,w*K); g.restore();
    };
    const glowFrame=(f,im,a,col) => {
      if (a<=0 || (R.qual!==undefined && R.qual<.35)) return;
      const cw=im.naturalWidth/4,ch=im.naturalHeight/3,sx=(f%4)*cw,sy=Math.floor(f/4)*ch,w=CELL*s*scale;
      g.save(); g.globalCompositeOperation='lighter'; g.globalAlpha=a; g.shadowColor=col; g.shadowBlur=24*K;
      g.drawImage(im,sx,sy,cw,ch,(top[0]+jx)*K,(top[1]+bob+jy)*K,w*K,w*K); g.restore();
    };
    if (stage==='morph' && b.nv.morphFrom!==undefined) {
      const from=cl(b.nv.morphFrom|0,0,2), u=sm((v.t-.55)/1.65);
      const oldF=v.t<.75?10:11,newF=v.t<1.55?4:0;
      glowFrame(oldF,IM['boss'+from],.3*(1-u),'#ff2848');
      drawFrame(oldF,IM['boss'+from],(1-u)*alpha,1+u*.08);
      glowFrame(newF,IM['boss'+form],.38*u,form===2?'#ff2848':'#b25cff');
      drawFrame(newF,IM['boss'+form],u*alpha,.92+u*.08);
    } else {
      const f=frameFor(b,v),im=IM['boss'+form];
      const energy=charge*.34+(form===2?.14:.06);
      glowFrame(f,im,energy*alpha,form===1?'#ae4cff':'#ff2848');
      /* Crossfondus courts entre les poses d'attente, déplacements restant continus. */
      if (!A && !b.dead && stage!=='reveal') {
        const pos=(b.t||0)*5.5,frac=pos-Math.floor(pos),blend=sm((frac-.78)/.22);
        if (blend>0) { drawFrame(f,im,(1-blend)*alpha); drawFrame((f+1)%4,im,blend*alpha); }
        else drawFrame(f,im,alpha);
      } else drawFrame(f,im,alpha);
      if (b.flash>0 && !b.dead) {
        g.save();g.globalCompositeOperation='lighter';g.globalAlpha=cl(b.flash*4,0,.5);g.filter='brightness(2.4) saturate(.25)';
        const cw=im.naturalWidth/4,ch=im.naturalHeight/3,w=CELL*s*scale;
        g.drawImage(im,(f%4)*cw,Math.floor(f/4)*ch,cw,ch,(top[0]+jx)*K,(top[1]+bob+jy)*K,w*K,w*K);g.restore();
      }
    }
    /* Charge locale : anneaux et arcs aux yeux/paumes, sans masquer la silhouette. */
    if (A && charge>.06 && !b.dead) {
      const palm=A.name==='palms'||A.name==='orbs';
      const pts=palm?NVBOSS.vorax.hands(b).map(p=>vpt(b,p[0],p[1])):NVBOSS.vorax.eyes(b,vpt);
      g.save();g.globalCompositeOperation='lighter';
      for (const p of pts) {
        const r=(10+charge*30)*z;
        if (ok(IM.ring)) g.drawImage(IM.ring,(p[0]-r)*K,(p[1]-r)*K,r*2*K,r*2*K);
        g.globalAlpha=.35+.5*charge;g.strokeStyle='#ff5b70';g.lineWidth=1.5*K;g.beginPath();g.arc(p[0]*K,p[1]*K,r*.55*K,0,Math.PI*2*(.25+charge*.75));g.stroke();
      }
      g.restore();
    }
    if (form===2 && !b.dead) {
      g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.16+.08*Math.sin((b.t||0)*4);g.strokeStyle='#ff3048';g.lineWidth=1.5*K;
      g.beginPath();g.ellipse(b.vx*K,(b.vy+bob)*K,245*z*K,175*z*K,(b.t||0)*.12,0,Math.PI*2);g.stroke();g.restore();
    }
    return true;
  }

  /* --------------------------------------------------------- décor V2 */
  let seed=0x24a9;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const STARS=Array.from({length:90},()=>({x:rnd(),y:rnd(),z:.25+rnd()*.75,s:.4+rnd()*1.5}));
  const DEBRIS=Array.from({length:20},(_,i)=>({x:rnd(),y:rnd(),type:i%4,s:.35+rnd()*.85,speed:12+rnd()*34,rot:rnd()*Math.PI*2,vr:(rnd()-.5)*.35,depth:.25+rnd()*.75}));
  const SHARDS=Array.from({length:22},(_,i)=>({a:i/22*Math.PI*2+(i%3)*.09,r:35+(i*37%150),s:3+(i*11%9)}));
  const BG={scene:'',prev:'',mix:1,t:0};
  function sceneOf(v){if(['approach','arrive','talk','sas','boom'].includes(v.stage))return 'space';if(['hall','alarm','hands','tear'].includes(v.stage))return 'corridor';return 'core';}
  function cover(g,im,W,H,zoom,alpha,yBias=.5){
    if(!ok(im)||alpha<=0)return;const sc=Math.max(W/im.naturalWidth,H/im.naturalHeight)*zoom,w=im.naturalWidth*sc,h=im.naturalHeight*sc;
    g.save();g.globalAlpha=alpha;g.drawImage(im,(W-w)/2,(H-h)*yBias,w,h);g.restore();
  }
  function paintSpace(g,W,H,v,alpha){
    const t=v.T||0,progress=cl((v.waveT||0)/100,0,1);
    g.save();g.globalAlpha=alpha;g.fillStyle='#02040c';g.fillRect(0,0,W,H);
    if(ok(IM.nebula)){
      const size=Math.max(W,H)*.82,ox=-((t*2.3)%size),oy=-((t*5.5)%size);
      g.globalAlpha=alpha*.76;
      for(let x=ox-size;x<W+size;x+=size)for(let y=oy-size;y<H+size;y+=size)g.drawImage(IM.nebula,x,y,size,size);
    }
    g.globalCompositeOperation='lighter';
    for(const s of STARS){const y=(s.y*H+t*(8+s.z*19))%(H+8)-4,x=s.x*W+Math.sin(t*.08+s.y*9)*s.z*5;g.globalAlpha=alpha*(.16+s.z*.48);g.fillStyle=s.z>.75?'#c8f5ff':'#788bb8';g.fillRect(x,y,s.s,s.s*(1+s.z*1.8));}
    g.globalCompositeOperation='source-over';
    if(ok(IM.earth)){
      const w=W*(1.32-progress*.24),x=-w*.36+Math.sin(t*.06)*8,y=H*.57+(1-progress)*H*.08;
      g.save();g.globalAlpha=alpha*.94;g.shadowColor='#5de7ff';g.shadowBlur=28;g.drawImage(IM.earth,x,y,w,w);g.restore();
    }
    if(ok(IM.base)){
      const late=v.stage!=='approach'?1:progress,p=sm(late),w=W*(1.12+p*.9),h=w*(IM.base.naturalHeight/IM.base.naturalWidth),x=(W-w)/2,y=-h*(.62-.43*p);
      g.save();g.globalAlpha=alpha*(.18+.82*p);g.drawImage(IM.base,x,y,w,h);g.restore();
    }
    for(const d of DEBRIS){
      const im=IM['debris'+d.type];if(!ok(im))continue;const unit=W/480,sz=(26+d.s*64)*unit*d.depth,x=d.x*W+Math.sin(t*.18+d.rot)*24*d.depth,y=(d.y*(H+180)+t*d.speed*d.depth)%(H+180)-90;
      g.save();g.globalAlpha=alpha*(.25+d.depth*.65);g.translate(x,y);g.rotate(d.rot+t*d.vr);g.drawImage(im,-sz/2,-sz/2,sz,sz);g.restore();
    }
    g.restore();
  }
  function paintCorridor(g,W,H,v,alpha){
    g.save();g.globalAlpha=alpha;g.fillStyle='#05050b';g.fillRect(0,0,W,H);
    if(ok(IM.corridor)){
      const size=W*1.14,off=(v.T*32+(498-(v.off||0))*2.1)%size;
      for(let y=off-size*2;y<H+size;y+=size)for(let x=-(size-W)/2-size;x<W+size;x+=size)g.drawImage(IM.corridor,x,y,size,size);
    }
    /* Deux plans de rails rapides donnent de la profondeur sans masquer les tirs. */
    g.globalCompositeOperation='lighter';
    for(let i=0;i<12;i++){const y=((i/12*H+v.T*95)%(H+80))-40;g.globalAlpha=alpha*(.05+(i%3)*.025);g.fillStyle=i%2?'#a342ff':'#ff3048';g.fillRect(W*.065,y,W*.012,26);g.fillRect(W*.923,y,W*.012,26);}
    g.restore();
  }
  function paintCore(g,W,H,v,alpha){
    cover(g,IM.core,W,H,1.045+Math.sin(v.T*.24)*.012,alpha,.46);
    if(!ok(IM.core)){g.save();g.globalAlpha=alpha;g.fillStyle='#09040d';g.fillRect(0,0,W,H);g.restore();}
    g.save();g.globalCompositeOperation='lighter';g.globalAlpha=alpha*(.1+.05*Math.sin(v.T*2));const gr=g.createRadialGradient(W/2,H*.12,0,W/2,H*.12,W*.65);gr.addColorStop(0,'#ff3048');gr.addColorStop(1,'rgba(255,30,70,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);g.restore();
  }
  const priorWorld=drawWorld;
  drawWorld=function(dt){
    const r=priorWorld.apply(this,arguments);
    if(!on()||!R.bufFar||!R.bufFar.g)return r;
    ensure();const v=V(),layer=R.bufFar,g=layer.g,W=layer.c.width,H=layer.c.height,scene=sceneOf(v);
    BG.t+=dt||0;if(BG.scene!==scene){BG.prev=BG.scene;BG.scene=scene;BG.mix=BG.prev?0:1;}BG.mix=Math.min(1,BG.mix+(dt||0)/1.1);
    g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.fillStyle='#02030a';g.fillRect(0,0,W,H);
    const paint=(sc,a)=>{if(sc==='space')paintSpace(g,W,H,v,a);else if(sc==='corridor')paintCorridor(g,W,H,v,a);else paintCore(g,W,H,v,a);};
    if(BG.prev&&BG.mix<1)paint(BG.prev,1);paint(scene,BG.prev?sm(BG.mix):1);
    const shade=g.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(2,3,12,.12)');shade.addColorStop(.55,'rgba(2,3,12,.25)');shade.addColorStop(1,'rgba(2,3,12,.42)');g.fillStyle=shade;g.fillRect(0,0,W,H);g.restore();
    for(const buf of [R.bufFG,R.bufMid])if(buf&&buf.g){buf.g.save();buf.g.setTransform(1,0,0,1,0,0);buf.g.clearRect(0,0,buf.c.width,buf.c.height);buf.g.restore();}
    return r;
  };

  /* ------------------------------------------------- alarme / métamorphose */
  function lightning(x1,y1,x2,y2,n,seed){
    ctx.beginPath();ctx.moveTo(x1,y1);for(let i=1;i<n;i++){const u=i/n,x=x1+(x2-x1)*u,y=y1+(y2-y1)*u,j=Math.sin(seed*13.1+i*7.7)*9;ctx.lineTo(x+j,y-j*.35);}ctx.lineTo(x2,y2);ctx.stroke();
  }
  function alarmFX(v){
    const t=v.t,x=PF.x,y=PF.y,w=PF.w,h=PF.h,cx=x+w/2,cy=y+h*.58,bw=w*.94,bh=Math.max(108,h*.155),q=cl((t-.75)/2.1,0,1),boom=cl((t-3.12)/.38,0,1);
    if(q<=0&&boom<=0)return;
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    const arcs=3+Math.floor(q*8);ctx.strokeStyle='rgba(255,105,135,.9)';ctx.shadowColor='#ff2448';ctx.shadowBlur=12;ctx.lineWidth=1.2+q*1.2;
    for(let i=0;i<arcs;i++){const side=i%4,u=(i*.618+t*.37)%1;let ax,ay,bx,by;if(side===0){ax=cx-bw/2+u*bw;ay=cy-bh/2;bx=ax+30;by=ay+28;}else if(side===1){ax=cx+bw/2;ay=cy-bh/2+u*bh;bx=ax-30;by=ay+20;}else if(side===2){ax=cx-bw/2+u*bw;ay=cy+bh/2;bx=ax-25;by=ay-28;}else{ax=cx-bw/2;ay=cy-bh/2+u*bh;bx=ax+30;by=ay-20;}lightning(ax,ay,bx,by,5,i+Math.floor(t*10));}
    if(q>.28){ctx.globalAlpha=(q-.28)*1.2;ctx.strokeStyle='#ffd5de';ctx.lineWidth=1.3;const cracks=[[[.18,0],[.24,.24],[.19,.43],[.31,.65],[.27,1]],[[.82,0],[.77,.25],[.84,.42],[.7,.59],[.74,1]],[[0,.48],[.2,.53],[.36,.45]],[[1,.35],[.82,.4],[.67,.3]]];for(const path of cracks){ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(cx-bw/2+p[0]*bw,cy-bh/2+p[1]*bh):ctx.moveTo(cx-bw/2+p[0]*bw,cy-bh/2+p[1]*bh));ctx.stroke();}}
    if(boom>0){ctx.globalAlpha=1-boom*.65;for(const s of SHARDS){const r=s.r*boom*2.2,px=cx+Math.cos(s.a)*r,py=cy+Math.sin(s.a)*r*.65;ctx.save();ctx.translate(px,py);ctx.rotate(s.a+boom*4);ctx.fillStyle=s.s%2?'#ff4962':'#ffe1e7';ctx.fillRect(-s.s/2,-s.s/3,s.s,s.s*.66);ctx.restore();}ctx.globalAlpha=(1-boom)*.6;ctx.strokeStyle='#fff0f3';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,boom*w*.55,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=(1-boom)*.16;ctx.fillStyle='#ff3048';ctx.fillRect(x,y,w,h);}
    ctx.restore();
  }
  function morphBanner(v){
    const b=G.boss;if(!b||!b.nv)return;const t=v.t,a=sm(t/.25)*(1-sm((t-2.55)/.4));if(a<=0)return;
    const x=PF.x,y=PF.y,w=PF.w,h=PF.h,cy=y+h*.68,band=Math.max(76,h*.1),form=cl(b.nv.form|0,0,2);
    ctx.save();ctx.globalAlpha=a*.92;const gr=ctx.createLinearGradient(0,cy-band/2,0,cy+band/2);gr.addColorStop(0,'rgba(5,3,12,.1)');gr.addColorStop(.25,'rgba(5,3,12,.94)');gr.addColorStop(.75,'rgba(5,3,12,.94)');gr.addColorStop(1,'rgba(5,3,12,.1)');ctx.fillStyle=gr;ctx.fillRect(x,cy-band/2,w,band);
    ctx.strokeStyle=form===1?'#b966ff':'#ff3855';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,cy-band/2+8);ctx.lineTo(x+w,cy-band/2+8);ctx.moveTo(x,cy+band/2-8);ctx.lineTo(x+w,cy+band/2-8);ctx.stroke();
    hudText(ctx,tr(TX.morph)+' · '+tr(TX.form)+' '+(form+1)+'/3',x+w/2,cy-band*.19,'#ffb6c2',Math.max(1.1,w/390),{align:'center',glow:'#ff3048'});
    hudText(ctx,tr(TX.names[form]),x+w/2,cy+band*.18,'#ffffff',Math.max(1.5,w/260),{align:'center',glow:form===1?'#a44fff':'#ff3048'});ctx.restore();
  }
  const priorHUD=drawHUD;
  drawHUD=function(){const r=priorHUD.apply(this,arguments);if(!on())return r;const v=V();if(v.stage==='alarm')alarmFX(v);if(v.stage==='morph')morphBanner(v);return r;};

  window.NV24V2={
    version:'2.0.0',assets:IM,ensure,
    ready:()=>envReady()&&bossReady()&&ok(IM.debris0)&&ok(IM.debris1)&&ok(IM.debris2)&&ok(IM.debris3),
    get state(){return on()?{stage:V().stage,form:G.boss&&G.boss.nv?G.boss.nv.form:null,hp:G.boss&&G.boss.hp,hands:G.boss&&G.boss.hands?G.boss.hands.map(h=>({hp:h.hp,maxHp:h.maxHp,dead:!!h.dead})):null}:null;}
  };
})();
