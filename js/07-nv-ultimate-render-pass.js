
(() => {
  const nvBackplates=new Map();
  function nvEraPlate(im,era){
    const limit=({2:320,3:480,4:768,5:1024})[era]||1024,key=era+'|'+im.src;
    if(nvBackplates.has(key))return nvBackplates.get(key);
    const w=Math.min(limit,im.naturalWidth),h=Math.max(1,Math.round(w*im.naturalHeight/im.naturalWidth));
    const raw=document.createElement('canvas');raw.width=w;raw.height=h;
    const rg=raw.getContext('2d');rg.imageSmoothingEnabled=era>=4;rg.drawImage(im,0,0,w,h);
    /* A soft crossfade between the original top and bottom edge removes the seam before tiling. */
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const cg=c.getContext('2d');cg.drawImage(raw,0,0);
    const band=Math.max(8,Math.round(h*.11)),data=cg.getImageData(0,0,w,h),px=data.data;
    const top=px.slice(0,w*4),bot=px.slice((h-1)*w*4,h*w*4);
    for(let y=0;y<band;y++){
      const u=y/Math.max(1,band-1),blend=u*u*(3-2*u),yb=h-1-y;
      for(let x=0;x<w;x++)for(let q=0;q<4;q++){
        const i=(y*w+x)*4+q,j=(yb*w+x)*4+q,edge=(top[x*4+q]+bot[x*4+q])*.5;
        px[i]=edge*(1-blend)+px[i]*blend;px[j]=edge*(1-blend)+px[j]*blend;
      }
    }
    cg.putImageData(data,0,0);nvBackplates.set(key,c);return c;
  }
  const _drawWorld = drawWorld;
  drawWorld = function(dt) {
    _drawWorld(dt);
    if (!ART.on || R.sec < 2 || !R.bufFar) return;
    const im = artImg('fond', R.sec);
    if (!im || !im.naturalWidth) return;
    const layer=R.bufFar,g=layer.g,W=layer.c.width,H=layer.c.height;
    const plate=nvEraPlate(im,R.sec),ih=plate.height,scale=W/plate.width,tileH=ih*scale;
    const factor=R.sec===2?.18:R.sec===3?.22:R.sec===4?.25:.28;
    const offset=(((SCROLL.y||0)*factor)%tileH+tileH)%tileH;
    g.save();g.globalAlpha=R.sec===2?.58:R.sec===3?.64:R.sec===4?.70:.76;
    g.globalCompositeOperation='source-over';g.imageSmoothingEnabled=R.sec>=4;
    for(let yy=offset-tileH;yy<H+tileH;yy+=tileH)g.drawImage(plate,0,yy,W,tileH);
    /* protect bullet and boss readability while preserving the new backdrop */
    const shade=g.createLinearGradient(0,0,0,H);shade.addColorStop(0,'rgba(2,7,20,.10)');shade.addColorStop(.5,'rgba(2,7,20,.22)');shade.addColorStop(1,'rgba(2,7,20,.16)');
    g.globalAlpha=1;g.fillStyle=shade;g.fillRect(0,0,W,H);
    /* liseré atmosphérique en mouvement, posé derrière les sprites du jeu */
    const pulse=.5+.5*Math.sin((G.t||0)*.48),v=g.createLinearGradient(0,0,W,0);
    v.addColorStop(0,'rgba(20,80,150,.10)');v.addColorStop(.5,`rgba(35,150,255,${.025+.035*pulse})`);v.addColorStop(1,'rgba(220,60,180,.09)');
    g.globalAlpha=.65;g.fillStyle=v;g.fillRect(0,0,W,H);g.restore();
  };
  const _drawStoryArt = drawStoryArt;
  drawStoryArt = function(g,x,y,w,h,kind,t) {
    if (DECK && DECK.kind==='brief' && kind==='carte') {
      const level=(STORY[storyI]&&STORY[storyI].level)||G.level||1;
      const era=Math.floor((level-1)/4);
      if(era>=2&&ART.on){
        const im=artImg('fond',era);
        if(im&&im.naturalWidth){
          const plate=nvEraPlate(im,era),scale=Math.max(w/plate.width,h/plate.height),dw=plate.width*scale,dh=plate.height*scale;
          g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.imageSmoothingEnabled=era>=4;
          g.drawImage(plate,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
          g.fillStyle='rgba(3,7,18,.14)';g.fillRect(x,y,w,h);
          g.globalCompositeOperation='screen';g.globalAlpha=.34+.06*era;
          const glow=g.createRadialGradient(x+w*.63,y+h*.34,0,x+w*.63,y+h*.34,Math.max(w,h)*.65);
          glow.addColorStop(0,TH.pGlow||'#66ddff');glow.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=glow;g.fillRect(x,y,w,h);
          g.globalAlpha=1;g.globalCompositeOperation='source-over';
          /* tech HUD marks stay legible over the hand-painted background */
          g.strokeStyle='rgba(170,231,255,.48)';g.lineWidth=1.5;g.strokeRect(x+3,y+3,w-6,h-6);
          g.fillStyle='rgba(7,13,26,.76)';g.fillRect(x+w*.035,y+h*.085,w*.42,Math.max(17,h*.055));
          g.font=`700 ${Math.max(8,Math.round(w*.023))}px ui-monospace,monospace`;g.fillStyle='#d9f5ff';g.textAlign='left';
          g.fillText(`SECTEUR ${String(level).padStart(2,'0')}  ·  ${['','', '16-BIT','ARCADE','CD-ROM','HD'][era]}`,x+w*.05,y+h*.123);
          g.restore();return;
        }
      }
    }
    return _drawStoryArt(g,x,y,w,h,kind,t);
  };
})();
