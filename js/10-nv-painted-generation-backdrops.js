
(() => {
  const sources = {
    snes: 'assets/media/media-135.webp',
    mega: 'assets/media/media-136.webp',
    neo: 'assets/media/media-137.webp',
    pc: 'assets/media/media-138.webp'
  };
  /* le secteur 24 a ses propres décors (base de VORAX) : voir nv24-final-rework */
  const platform = n => n < 7 || n === 24 ? null : n <= 10 ? 'snes' : n <= 14 ? 'mega' : n <= 18 ? 'neo' : 'pc';
  const retro = {snes:1, mega:1, neo:1, pc:1};
  const images = {};
  const plates = new Map();
  let decorFar = null, decorMid = null, starBack = null, starMid = null, activeId = null;
  const tileColors = {
    snes:['#124258','#63d9ec','#9df6ff'],
    mega:['#21133d','#e043d8','#51edff'],
    neo:['#34252c','#ffb94f','#ff685d'],
    pc:['#102a3e','#62ddf2','#bedcff']
  };
  function drawTilePlane(layer,id) {
    // Pas de tuiles translucides répétées : le plan intermédiaire est réservé
    // aux éléments de décor réels et aux étoiles en parallaxe.
    const g=layer.g;
    g.setTransform(1,0,0,1,0,0);
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    g.clearRect(0,0,layer.c.width,layer.c.height);
  }

  /* Deux plans stellaires nets donnent une profondeur indépendante à l'illustration. */
  function drawStarPlane(layer,id,W,H,speed,count,seed) {
    const g=layer.g; g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,W,H);
    const palette=id==='mega'?['#ff8c63','#f6c26b','#70eaff']:id==='neo'?['#ffb35d','#ff766b','#a1eaff']:['#b5dfff','#76dcff','#fff0bb'];
    const scroll=SCROLL.y||0, unit=Math.max(1,Math.min(W,H)/700);
    for(let i=0;i<count;i++){
      const x=Math.floor(((i*193+seed*71+17)%997)/997*W);
      const y0=((i*389+seed*137+43)%991)/991*H;
      const y=((y0+scroll*speed)%H+H)%H;
      const large=i%13===0, size=Math.max(1,Math.round(unit*(large?1.5:1)));
      g.globalAlpha=large?.48:.27; g.fillStyle=palette[(i+seed)%palette.length];
      g.fillRect(Math.round(x),Math.round(y),size,size);
      if(large){g.globalAlpha=.18;g.fillRect(Math.round(x-size),Math.round(y),size*3,size);g.fillRect(Math.round(x),Math.round(y-size),size,size*3);}
    }
    g.globalAlpha=1;
  }
  for (const [id,src] of Object.entries(sources)) { const im = new Image(); im.src = src; images[id] = im; }
  function plateFor(id, level, w, h) {
    const key = `${id}:${level}:${w}:${h}`; if (plates.has(key)) return plates.get(key);
    const im = images[id]; if (!im || !im.complete || !im.naturalWidth) return null;
    const scale = retro[id], cw = Math.max(40,Math.round(w*scale)), ch = Math.max(64,Math.round(h*1.08*scale));
    const c = document.createElement('canvas'); c.width=cw; c.height=ch;
    const g=c.getContext('2d'); if(!g) return null;
    g.imageSmoothingEnabled=id==='pc';
    const cropW=Math.min(im.naturalWidth,im.naturalHeight*cw/ch);
    const phases=id==='pc'?6:4, phase=(level-(id==='snes'?7:id==='mega'?11:id==='neo'?15:19))%phases;
    const maxX=im.naturalWidth-cropW, sx=maxX>0?maxX*(phase/(phases-1)):0;
    g.drawImage(im,sx,0,cropW,im.naturalHeight,0,0,cw,ch);
    // Blend the vertical edges into each other so the scrolling loop stays calm.
    const band=Math.max(5,Math.round(ch*.09)),data=g.getImageData(0,0,cw,ch),p=data.data;
    for(let y=0;y<band;y++){
      const t=y/Math.max(1,band-1),yb=ch-1-y;
      for(let x=0;x<cw;x++)for(let q=0;q<3;q++){
        const a=(y*cw+x)*4+q,b=(yb*cw+x)*4+q,edge=(p[a]+p[b])*.5;
        p[a]=edge*(1-t)+p[a]*t; p[b]=edge*(1-t)+p[b]*t;
      }
    }
    g.putImageData(data,0,0); plates.set(key,c);
    if(plates.size>8) plates.delete(plates.keys().next().value);
    return c;
  }
  const base=drawWorld;
  drawWorld=function(dt){
    base(dt); const id=platform(G.level|0); if(!id){activeId=null;return;} if(!R.bufFar)return;
    activeId=id;
    // Keep every painted and parallax plane at the full internal frame resolution.
    if(R.bufNear&&R.bufNear.c){R.bufFar=reuseBuf(R.bufFar,R.bufNear.c.width,R.bufNear.c.height);R.bufMid=reuseBuf(R.bufMid,R.bufNear.c.width,R.bufNear.c.height);}
    const layer=R.bufFar,g=layer.g,W=layer.c.width,H=layer.c.height; if(!g)return;
    starBack=reuseBuf(starBack,W,H);starMid=reuseBuf(starMid,W,H);
    drawStarPlane(starBack,id,W,H,.13,58,(G.level|0)+1);
    drawStarPlane(starMid,id,W,H,.48,24,(G.level|0)+7);
    if(R.bufFG&&R.bufFG.g)R.bufFG.g.clearRect(0,0,R.bufFG.c.width,R.bufFG.c.height);
    if(R.bufMid&&R.bufMid.g)drawTilePlane(R.bufMid,id);
    const art=plateFor(id,G.level|0,W,H);
    const off=art?(((SCROLL.y||0)*.055)%art.height):0;
    g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,W,H);
    g.imageSmoothingEnabled=id==='pc';
    if(art){for(let y=off-art.height;y<H+art.height;y+=art.height)g.drawImage(art,0,y,W,art.height);}
    else {g.fillStyle=id==='pc'?'#071a2d':id==='neo'?'#101327':'#071226';g.fillRect(0,0,W,H);for(let i=0;i<58;i++){const x=((i*97+13)%W),y=((i*173+31)%H),sz=i%9===0?2:1;g.fillStyle=i%4===0?'rgba(106,220,255,.7)':'rgba(190,222,255,.45)';g.fillRect(x,y,sz,sz);}}
    // Hardware-specific finishing pass, kept restrained behind bullets and ships.
    if(id!=='pc'){
      g.globalAlpha=id==='snes'?.045:id==='mega'?.065:.035;g.fillStyle='#050817';
      for(let y=0;y<H;y+=id==='neo'?3:4)g.fillRect(0,y,W,1);
    }else{
      const shade=g.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(3,9,24,.10)');shade.addColorStop(.5,'rgba(3,9,24,.22)');shade.addColorStop(1,'rgba(3,9,24,.14)');
      g.globalAlpha=1;g.fillStyle=shade;g.fillRect(0,0,W,H);
    }
    g.restore();
    // Existing stage props now occupy two genuine intermediate parallax planes.
    decorFar=reuseBuf(decorFar,W,H);decorMid=reuseBuf(decorMid,W,H);
    decorFar.g.clearRect(0,0,W,H);decorMid.g.clearRect(0,0,W,H);
    const cleanProps=list=>list.filter(o=>!/(radar|antenne|parabole|dish|anneau|portail|cristaux)/i.test((CHUNKS[o.ci]&&CHUNKS[o.ci].id)||''));
    const distantProps=DEC&&Array.isArray(DEC.far)?cleanProps(DEC.far):[];
    const middleProps=DEC&&Array.isArray(DEC.mid)?cleanProps(DEC.mid):[];
    // Keep foreground scenery fully opaque and pixel-crisp; only the parallax speed separates these planes.
    if(distantProps.length){decorFar.g.save();decorFar.g.globalAlpha=1;decorFar.g.globalCompositeOperation='source-over';decorFar.g.imageSmoothingEnabled=false;decorBlit(distantProps,decorFar);decorFar.g.restore();}
    if(middleProps.length){decorMid.g.save();decorMid.g.globalAlpha=1;decorMid.g.globalCompositeOperation='source-over';decorMid.g.imageSmoothingEnabled=false;decorBlit(middleProps,decorMid);decorMid.g.restore();}
  };
  // Insert both moving prop planes after the tile plane, but behind ships and bullets.
  const originalBlit=blitTo;
  blitTo=function(dst,src,dx,dy,dw,dh,alpha,comp,smooth){
    const out=originalBlit(dst,src,dx,dy,dw,dh,alpha,comp,smooth);
    if(dst===R.bufC&&src===R.bufFar&&activeId&&(G.level|0)>=7&&G.state!=='title'&&starBack)originalBlit(dst,starBack,dx,dy,dw,dh,.82,'source-over',false);
    if(dst===R.bufC&&src===R.bufMid&&activeId&&(G.level|0)>=7&&G.state!=='title'){
      if(starMid)originalBlit(dst,starMid,dx,dy,dw,dh,.9,'source-over',false);
      if(decorFar)originalBlit(dst,decorFar,dx,dy,dw,dh,1,'source-over',smooth);
      if(decorMid)originalBlit(dst,decorMid,dx,dy,dw,dh,1,'source-over',smooth);
    }
    return out;
  };
})();
