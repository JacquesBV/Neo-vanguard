/* FanBoy FX portrait — matériaux de la référence et LCD positif, réédition 8.
 * Retrouve les encres LCD estimées d'après les captures fournies (fond sauge
 * clair, structures olive sombre), telles que validées à l'écran : la palette
 * interne du moteur (indices de terrain, ombrages, collisions) n'est pas
 * modifiée, seule la présentation convertit les encres à l'affichage.
 * Ce module pose aussi :
 *   · une coque FX texturée, découpée en panneaux adaptables, et commandes réactives ;
 *   · le verre LCD : grille de pixels physique, matte et reflet de lumière
 *     ambiante fixé à la vitre ;
 *   · un cadrage épinglé : aucun rescale / resize en pleine partie ;
 *   · la désactivation des masques CRT / phosphores / flou shader (un LCD
 *     n'a pas de tube).
 */
(() => {
  'use strict';
  const inks = ['#9ea483', '#7d8267', '#595c4c', '#2f3329']; // source sombre -> affichage clair
  const rgb = inks.map(c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)));
  const sourceLum = GB4.map(c => {
    const p = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    return p[0] * .2126 + p[1] * .7152 + p[2] * .0722;
  });
  const active = () => R.era === 0 && G.eraIdx === 0 && G.state !== 'story' && G.state !== 'title';
  const framed = () => active() && S.opts.gbBezel !== 0;

  /* Migration unique : puce sonore, coque, clignotement et fantôme d'origine. */
  if (S.opts.fanboyGlassV5 !== 1) {
    S.opts.fanboyGlassV5 = 1;
    S.opts.gbFlicker = 1; S.opts.gbBezel = 1;
    S.opts.gbContrast = 'normal'; S.opts.gbGhost = 'low';
    saveGame();
  }

  /* ---------------------------------------------------------- encres LCD */
  const oldPalette = applyGameBoyPalette;
  applyGameBoyPalette = function (buf) {
    oldPalette.apply(this, arguments);
    if (!active() || !buf || !buf.g) return;
    const w = buf.c.width, h = buf.c.height;
    let image;
    try { image = buf.g.getImageData(0, 0, w, h); } catch (err) { return; }
    const d = image.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const lum = d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722;
      let k = 0, delta = Infinity;
      for (let j = 0; j < 4; j++) {
        const distance = Math.abs(lum - sourceLum[j]);
        if (distance < delta) { delta = distance; k = j; }
      }
      const p = rgb[k]; d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2];
    }
    buf.g.putImageData(image, 0, 0);
  };

  /* Le vocabulaire graphique a sa polarité propre : contours et cockpits
     sombres, coques claires. Le fond positif ne doit pas inverser les sprites. */
  const artPalette = GB4.slice().reverse();
  function artTheme(fn, self, args) {
    if (!active()) return fn.apply(self, args);
    const previous = TH;
    const copy = { ...TH, livery: { ...TH.livery, gb: artPalette } };
    for (const key of Object.keys(copy)) {
      const index = GB4.indexOf(copy[key]); if (index >= 0) copy[key] = artPalette[index];
    }
    TH = copy;
    try { return fn.apply(self, args); } finally { TH = previous; }
  }
  const oldSprite = drawSpriteTo;
  drawSpriteTo = function () { return artTheme(oldSprite, this, arguments); };
  const oldBossSprite = drawBossSprite;
  drawBossSprite = function () { return artTheme(oldBossSprite, this, arguments); };
  const oldCore = drawPlayerCore;
  drawPlayerCore = function () { return artTheme(oldCore, this, arguments); };

  /* Géométrie du décor conservée, encres et faces éclairées rendues. */
  const oldDecorCanvas = decorCanvas, correctedDecor = new WeakMap();
  decorCanvas = function () {
    const record = oldDecorCanvas.apply(this, arguments);
    if (!active() || !record || !record.c) return record;
    if (correctedDecor.has(record)) return correctedDecor.get(record);
    const c = document.createElement('canvas'); c.width = record.c.width; c.height = record.c.height;
    const g = c.getContext('2d'); g.drawImage(record.c, 0, 0);
    const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
    const map = [3, 1, 0, 0];
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const l = d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722;
      let k = 0;
      for (let j = 1; j < 4; j++) if (Math.abs(l - sourceLum[j]) < Math.abs(l - sourceLum[k])) k = j;
      const p = GB4[map[k]];
      d[i] = parseInt(p.slice(1, 3), 16); d[i + 1] = parseInt(p.slice(3, 5), 16); d[i + 2] = parseInt(p.slice(5, 7), 16);
    }
    g.putImageData(im, 0, 0);
    const rec = { ...record, c, sh: null }; correctedDecor.set(record, rec); return rec;
  };
  const oldDecorBlit = decorBlit;
  decorBlit = function (list, layer) {
    if (!active()) return oldDecorBlit.apply(this, arguments);
    useBuf(layer);
    const g = PAINT.g, K = PAINT.K;
    g.imageSmoothingEnabled = false;
    for (const item of list) {
      const rec = decorCanvas(item.ci, item.w, item.h, item.seed, K);
      const x = Math.round(item.x * K), y = Math.round(item.y * K);
      if (!rec.sh) {
        rec.sh = document.createElement('canvas'); rec.sh.width = rec.c.width; rec.sh.height = rec.c.height;
        const sg = rec.sh.getContext('2d'); sg.drawImage(rec.c, 0, 0);
        sg.globalCompositeOperation = 'source-in'; sg.fillStyle = GB4[2]; sg.fillRect(0, 0, rec.c.width, rec.c.height);
      }
      g.save(); g.globalAlpha *= .35;
      g.drawImage(rec.sh, x + Math.round(6 * K), y + Math.round(9 * K)); g.restore();
      g.drawImage(rec.c, x, y);
      const ch = CHUNKS[item.ci];
      if (ch.anim) artTheme(ch.anim, ch, [item.x, item.y, item.w, item.h, DEC.t, item.seed]);
    }
  };
  const oldFloor = decorDrawFloor;
  decorDrawFloor = function (layer) {
    if (!active()) return oldFloor.apply(this, arguments);
    useBuf(layer);
    const g = layer.g, K = layer.K;
    const tile = 64, scroll = SCROLL.y * FLOOR_SPD;
    const start = Math.floor(-scroll / tile) - 1;
    const offset = start * tile + scroll;
    g.fillStyle = GB4[0]; g.fillRect(0, 0, layer.c.width, layer.c.height);
    g.fillStyle = GB4[1];
    for (let row = 0; offset + row * tile < L_H + tile; row++) {
      const y = Math.round((offset + row * tile) * K);
      g.fillRect(0, y, layer.c.width, 1);
      for (let x = ((row + start) & 1) * tile; x < L_W; x += tile * 2) {
        g.fillRect(Math.round(x * K), y, 1, Math.round(tile * K));
      }
    }
    decorBlit(DEC.floor, layer);
  };
  const oldTerrain = drawTerrain;
  drawTerrain = function () {
    if (!active()) return oldTerrain.apply(this, arguments);
    /* le lissage à fond sombre du module 32 effacerait les encres rendues */
    const calm = S.opts.lcdCalm; S.opts.lcdCalm = false;
    try { return oldTerrain.apply(this, arguments); } finally { S.opts.lcdCalm = calm; }
  };

  /* Portrait FX : one viewport, one existing render loop, no image aperture.
     PF remains the only world/input transform. Pixel sectors use whole
     physical output pixels; the shell absorbs the remaining space. */
  let layout = null;
  const oldResize = resizeView;
  resizeView = function () {
    const result = oldResize.apply(this, arguments);
    if (!framed()) return result;
    const W = view.w, H = view.h;
    // Raster pixels map to physical screen pixels even when adaptive effects
    // run at reduced quality. Only the lightweight FX display uses native DPR.
    const d = Math.max(1, window.devicePixelRatio || 1);
    view.dpr=d;cv.width=Math.round(W*d);cv.height=Math.round(H*d);
    ctx.setTransform(d,0,0,d,0,0);ctx.imageSmoothingEnabled=false;
    const style = getComputedStyle(document.documentElement);
    const safeTop = parseFloat(style.getPropertyValue('--fx-safe-top')) || 0;
    const safeBottom = parseFloat(style.getPropertyValue('--fx-safe-bottom')) || 0;
    const top = 42 + safeTop;
    const bottom = (IS_TOUCH ? W * 346 / 1024 : 148) + 26 + safeBottom;
    const availableW = Math.max(1, W - 24), availableH = Math.max(1, H - top - bottom);
    const rasterW = R.bufC.w, rasterH = R.bufC.h;
    const fit = Math.min(availableW / rasterW, availableH / rasterH);
    const pixels = Math.floor(fit * d);
    const scale = pixels >= 1 ? pixels / d : fit;
    PF.w = rasterW * scale; PF.h = rasterH * scale;
    PF.s = PF.w / L_W;
    PF.x = Math.round((W - PF.w) / 2 * d) / d;
    PF.y = Math.round(top * d) / d;
    const shellW = IS_TOUCH ? W : Math.min(W, PF.w + 48);
    const deviceH=IS_TOUCH ? H-safeTop-safeBottom : top+PF.h+26+shellW*346/1024;
    const deviceY=IS_TOUCH ? safeTop : Math.max(0,(H-deviceH)/2);
    if(!IS_TOUCH)PF.y=Math.round((deviceY+top)*d)/d;
    layout = { x:(W-shellW)/2, y:deviceY, w:shellW, h:deviceH,
      top:PF.y, bottom:PF.y+PF.h, controlsY:PF.y+PF.h+36 };
    document.body.classList.add('fanboy-fx');
    document.body.style.setProperty('--fx-touch-width', shellW+'px');
    const deckH=Math.min(H-safeBottom-PF.y-PF.h-26,shellW*346/1024);
    document.body.style.setProperty('--fx-controls-top', (H-safeBottom-deckH)+'px');
    document.body.style.setProperty('--fx-controls-height', deckH+'px');
    R.vig = null; R.fog = null; gpuResize();
    return { sideRes:0 };
  };
  function panel(x,y,w,h,fill,stroke,r=10) {
    ctx.beginPath(); ctx.roundRect(x,y,w,h,r);
    ctx.fillStyle=fill; ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  function label(text,x,y,size=11,color='#bdeeff',align='left') {
    ctx.font='700 '+size+'px system-ui,sans-serif';ctx.textAlign=align;
    ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,x,y);
  }
  function signal() {
    const end=G.plan && G.plan.length ? G.plan[G.plan.length-1].t+3 : G.levelDur || 50;
    const progress=clamp((G.waveT||0)/Math.max(1,end),0,1);
    const warning=G.phase==='bossWarn';
    const danger=warning || ['boss','harvest','clear'].includes(G.phase);
    const color=danger || progress>=.9 ? '#ff233e' : progress>=.5 ? '#ff9a20' : '#55ff77';
    const pulse=window.nvAlertSignal(Math.max(0,G.bossWarnT||0),G.bossWarnTotal||3.6);
    return {color,progress,alpha:warning ? pulse.envelope*(pulse.blink?1:.10):1};
  }
  // The supplied art is a material atlas, never a displayed gameplay image.
  // Only armor and separate control cutouts are sampled from it.
  const fxAtlas=new Image();let armorPattern=null;
  fxAtlas.onload=()=>{const tile=document.createElement('canvas');tile.width=tile.height=96;tile.getContext('2d').drawImage(fxAtlas,390,1260,96,96,0,0,96,96);armorPattern=ctx.createPattern(tile,'repeat');sceneDirty=true;};
  fxAtlas.src='assets/fanboy/fx-material-reference.png';
  const keyStates=new Float32Array(4);let keyTime=null;
  let stickX=0,stickY=0;
  const oldFrame=drawMachineFrame;
  drawMachineFrame=function(){
    if(!framed() || !layout){keyTime=null;keyStates.fill(0);stickX=stickY=0;return oldFrame.apply(this,arguments);}
    const q=layout,sig=signal(),x=q.x,w=q.w;
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.fillStyle='#03060b';ctx.fillRect(0,0,view.w,view.h);
    const loaded=fxAtlas.complete&&fxAtlas.naturalWidth;
    const controlsH=Math.max(1,Math.min(q.y+q.h-PF.y-PF.h-26,w*346/1024));
    const controlsTop=q.y+q.h-controlsH;
    // Separate top, side rails and control deck adapt to the aperture. The
    // gameplay pixels and reference HUD are deliberately never sampled.
    if(loaded){
      ctx.drawImage(fxAtlas,0,0,1024,83,x,q.y,w,Math.max(1,w*83/1024));
      ctx.drawImage(fxAtlas,0,83,94,1072,x,PF.y-27,Math.max(1,PF.x-x),PF.h+57);
      ctx.drawImage(fxAtlas,931,83,93,1072,PF.x+PF.w,PF.y-27,Math.max(1,x+w-PF.x-PF.w),PF.h+57);
      const spacerY=PF.y+PF.h+26;
      if(controlsTop>spacerY){
        ctx.fillStyle=armorPattern||'#262b34';ctx.fillRect(x,spacerY,w,controlsTop-spacerY);
        const rail=Math.max(10,(PF.x-x));
        ctx.drawImage(fxAtlas,0,1155,94,35,x,spacerY,rail,controlsTop-spacerY);
        ctx.drawImage(fxAtlas,931,1155,93,35,x+w-rail,spacerY,rail,controlsTop-spacerY);
      }
      ctx.drawImage(fxAtlas,0,1190,1024,346,x,controlsTop,w,controlsH);
    }else panel(x,q.y,w,q.h,'#171e29','#647084',12);
    panel(PF.x-5,PF.y-5,PF.w+10,PF.h+10,'#02050a','#667385',5);
    ctx.save();ctx.globalAlpha=sig.alpha;ctx.strokeStyle=sig.color;ctx.shadowColor=sig.color;ctx.shadowBlur=10;ctx.lineWidth=3;
    ctx.strokeRect(PF.x-4,PF.y-4,PF.w+8,PF.h+8);ctx.shadowBlur=3;ctx.lineWidth=1;ctx.strokeStyle='#e0fff3';ctx.strokeRect(PF.x-4,PF.y-4,PF.w+8,PF.h+8);ctx.restore();
    const p=G.player,live=G.state==='play'&&p&&p.alive&&!p.out,input=live&&p.controlVisual||{};
    const now=Number(G.t)||0,dt=keyTime===null?1/60:clamp(now-keyTime,0,.05);keyTime=now;
    const k=live?1-Math.exp(-32*dt):1;
    stickX+=((input.x||0)-stickX)*k;stickY+=((input.y||0)-stickY)*k;
    const targets=[!!input.fire,!!(input.bomb || p&&p.nvBombVisual>0),!!input.x,!!input.y];
    keyStates.forEach((v,i)=>{keyStates[i]=v+(Number(live&&targets[i])-v)*k;});
    if(loaded){
      const sx=w/1024,sy=controlsH/346;
      function cap(cx,cy,r,dx,dy,amount,color){
        const destX=x+cx*sx,destY=controlsTop+(cy-1190)*sy;
        const rx=r*sx,ry=r*sy;
        ctx.save();ctx.beginPath();ctx.ellipse(destX,destY,rx,ry,0,0,TAU);ctx.clip();
        // Paint the socket, then a displaced, inset cap from the same material.
        ctx.fillStyle='#05070c';ctx.fillRect(destX-rx,destY-ry,rx*2,ry*2);
        const press=amount*1.2;
        ctx.drawImage(fxAtlas,cx-r,cy-r,r*2,r*2,destX-rx+dx+press*.3,destY-ry+dy+press,rx*2-press*.6,ry*2-press*.6);
        ctx.restore();
        if(amount>.01){ctx.save();ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=8;ctx.globalAlpha=amount*.8;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(destX+dx,destY+dy+press,rx*.88,ry*.88,0,0,TAU);ctx.stroke();ctx.restore();}
      }
      cap(200,1328,79,stickX*5,stickY*5,Math.min(1,Math.hypot(stickX,stickY)),'#27daff');
      cap(637,1351,56,0,keyStates[0]*2,keyStates[0],'#27daff');
      cap(834,1372,39,0,0,keyStates[0],'#37e9ff');
      cap(898,1310,39,0,0,keyStates[1],'#ff3f63');
      // Neutral cyan in the reference is replaced by the shared sector signal.
      for(const side of [x+w*.039,x+w*.96]){
        ctx.save();ctx.globalAlpha=sig.alpha;ctx.strokeStyle=sig.color;ctx.shadowColor=sig.color;ctx.shadowBlur=7;ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(side,controlsTop+controlsH*.38);ctx.lineTo(side,controlsTop+controlsH*.72);ctx.stroke();ctx.restore();
      }
    }
    ctx.restore();
  };
  // The arcade base can bypass drawMachineFrame: select the FX backdrop here.
  const oldBackdrop=drawBackdrop;
  drawBackdrop=function(){if(framed())return drawMachineFrame();return oldBackdrop.apply(this,arguments);};
  function drawShellHUD(){
    if(!layout || !G.player)return;
    const p=G.player,q=layout,x=PF.x,w=PF.w;
    ctx.save();
    const fs=Math.max(9,Math.min(12,w/28));
    const ty=PF.y-16;
    panel(x,ty-10,w,20,'#061322','#20566d',4);
    label('1P '+fmt(p.score),x+7,ty,fs,'#c4f3ff');
    label('S'+String(G.level).padStart(2,'0'),x+w/2,ty,fs,'#46dfff','center');
    label('V '+(cheatOn('lives')?'∞':p.lives)+'  B '+(cheatOn('bombs')?'∞':p.bombs),x+w-7,ty,fs,'#c4f3ff','right');
    const fy=PF.y+PF.h+11;
    panel(x,fy-10,w,20,'#061322','#20566d',4);
    label('PWR '+p.power,x+7,fy,fs,'#40dbff');
    const weapon=G.stats && G.stats.weapon;
    label(weapon ? L(weapon.name) : 'ARME',x+w*.5,fy,fs,'#def7ff','center');
    label('$ '+fmt(NET.role==='guest' ? HUDNET.credits||0 : G.credits+S.credits),x+w-7,fy,fs,'#ffd675','right');
    if(G.twoP && G.players[1]){
      const p2=G.players[1];label('2P '+fmt(p2.score)+'  V '+p2.lives+'  B '+p2.bombs,x+w/2,fy+16,fs-1,'#ffb8e6','center');
    }
    if(anyCheat())label('*',x+w-2,ty-15,8,'#ffd675','right');
    // Hull, shield and boss telemetry live in the armor, outside PF.
    const b=G.boss;
    const y=fy+10;
    const hull=p.maxHp || 1;
    label('COQUE '+Math.round(p.hp||0)+'  / '+(hull||1)+'  •  SH '+(p.shield||0),x+5,y,fs-1,'#b1c6d8');
    if(b&&!b.dead){
      const bw=w*.38,bx=x+w-bw;
      panel(bx,y-6,bw,12,'#260a15','#7f263b',2);
      ctx.fillStyle='#ff3856';ctx.fillRect(bx+2,y-4,(bw-4)*clamp(b.hp/b.maxHp,0,1),8);
    }
    ctx.restore();
    if(G.phase==='bossWarn')drawBossWarning();
  }
  const oldSidePanels=drawSidePanels,oldRadioSide=drawRadioSide;
  drawSidePanels=function(){if(!framed())return oldSidePanels.apply(this,arguments);};
  drawRadioSide=function(){if(!framed())return oldRadioSide.apply(this,arguments);};

  /* Le verre : grille de sortie physique, matte et reflet de lumière ambiante
     d'une pièce éclairée, fixé à la vitre (il ne suit pas le monde). */
  const oldGlass = drawScreenGlass;
  let grid = null, gridKey = '';
  drawScreenGlass = function () {
    if (!active()) return oldGlass.apply(this, arguments);
    ctx.save(); ctx.beginPath(); ctx.rect(PF.x, PF.y, PF.w, PF.h); ctx.clip();
    const step = Math.max(2, Math.round(PF.w * view.dpr / R.bufC.w));
    const key = step + ':' + view.dpr;
    if (key !== gridKey) {
      const tile = document.createElement('canvas'); tile.width = tile.height = step;
      const g = tile.getContext('2d'); g.fillStyle = 'rgba(35,43,29,.055)';
      g.fillRect(0, 0, 1, step); g.fillRect(1, 0, step - 1, 1);
      grid = ctx.createPattern(tile, 'repeat'); gridKey = key;
    }
    if (grid) {
      ctx.save(); ctx.translate(PF.x, PF.y); ctx.scale(1 / view.dpr, 1 / view.dpr);
      ctx.fillStyle = grid; ctx.fillRect(0, 0, PF.w * view.dpr, PF.h * view.dpr); ctx.restore();
    }
    const shade = ctx.createLinearGradient(0, PF.y, 0, PF.y + PF.h);
    shade.addColorStop(0, 'rgba(25,34,18,.12)'); shade.addColorStop(.12, 'rgba(25,34,18,0)');
    shade.addColorStop(.72, 'rgba(25,34,18,.025)'); shade.addColorStop(1, 'rgba(25,34,18,.10)');
    ctx.fillStyle = shade; ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
    const reflection = ctx.createLinearGradient(PF.x, PF.y + PF.h, PF.x + PF.w, PF.y);
    reflection.addColorStop(0, 'rgba(244,247,223,0)');
    reflection.addColorStop(.52, 'rgba(244,247,223,.015)');
    reflection.addColorStop(.80, 'rgba(244,247,223,.065)');
    reflection.addColorStop(1, 'rgba(250,252,235,.17)');
    ctx.fillStyle = reflection; ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
    const glint = ctx.createLinearGradient(PF.x + PF.w * .74, 0, PF.x + PF.w, 0);
    glint.addColorStop(0, 'rgba(250,252,235,0)');
    glint.addColorStop(.55, 'rgba(250,252,235,.025)');
    glint.addColorStop(.82, 'rgba(250,252,235,.085)');
    glint.addColorStop(1, 'rgba(250,252,235,.015)');
    ctx.fillStyle = glint; ctx.fillRect(PF.x + PF.w * .74, PF.y, PF.w * .26, PF.h);
    ctx.strokeStyle = 'rgba(241,246,217,.18)'; ctx.lineWidth = 1 / view.dpr;
    ctx.beginPath(); ctx.moveTo(PF.x, PF.y + 1 / view.dpr);
    ctx.lineTo(PF.x + PF.w, PF.y + 1 / view.dpr); ctx.stroke();
    ctx.restore();
  };

  /* HUD et bannière écrits dans les encres LCD ; le cadre peint par le
     module 24 s'efface derrière la coque complète. */
  function displayTheme(fn, self, args) {
    if (!active()) return fn.apply(self, args);
    const previous = TH, copy = { ...TH };
    for (const key of Object.keys(copy)) {
      const index = GB4.indexOf(copy[key]); if (index >= 0) copy[key] = inks[index];
    }
    copy.livery = { ...TH.livery, gb: inks };
    TH = copy;
    const bezel = S.opts.gbBezel; S.opts.gbBezel = 0;
    try { return fn.apply(self, args); }
    finally { TH = previous; S.opts.gbBezel = bezel; }
  }
  const oldHUD = drawHUD;
  drawHUD = function () { if (framed()) return; return displayTheme(oldHUD, this, arguments); };
  const oldBanner = drawEraBanner;
  drawEraBanner = function () { return displayTheme(oldBanner, this, arguments); };

  /* Le FanBoy n'a ni masque CRT, ni phosphores RGB, ni flou shader global. */
  const oldPresent = presentFrame;
  presentFrame = function () {
    if (!active()) return oldPresent.apply(this, arguments);
    const keys = ['crt', 'crtMask', 'crtVignette', 'shaderSmooth'];
    const saved = keys.map(k => S.opts[k]);
    Object.assign(S.opts, { crt: 'off', crtMask: 'off', crtVignette: 0, shaderSmooth: false });
    ctx.save();
    if(framed()){ctx.beginPath();ctx.rect(PF.x,PF.y,PF.w,PF.h);ctx.clip();}
    try { return oldPresent.apply(this, arguments); }
    finally { ctx.restore(); keys.forEach((k, i) => { if (saved[i] === undefined) delete S.opts[k]; else S.opts[k] = saved[i]; }); }
  };

  /* Entrer/sortir d'un menu restaure les marges de viewport appropriées. */
  const oldRender = render;
  let lastFrameState = null;
  render = function () {
    const state = framed();
    document.body.classList.toggle('fanboy-fx', state);
    if (state !== lastFrameState) { lastFrameState = state; sideRes = resizeView().sideRes; }
    const result=oldRender.apply(this, arguments);
    if(state && ['play','pause','clear','victory'].includes(G.state))hudOvRun('fxHUD',drawShellHUD,[]);
    return result;
  };

  window.NV_FANBOY_REFERENCE = Object.freeze({ revision: 8, inks: Object.freeze(inks), shell: true, glass: true });
})();
