
(() => {
  const sprites=["assets/media/media-131.webp","assets/media/media-132.webp","assets/media/media-133.webp","assets/media/media-134.webp"].map(src=>{const im=new Image();im.src=src;return im;});
  const byBody={13:0,14:1,15:2,2:3};
  const prior=drawBoss;
  drawBoss=function(){
    prior();const b=G.boss;if(!b||R.sec!==2)return;
    const ix=byBody[Number(b.def&&b.def.body)];if(ix===undefined)return;
    const im=sprites[ix];if(!im.complete||!im.naturalWidth)return;
    useBuf(R.bufNear);const g=PAINT.g,K=PAINT.K,t=b.t||0;
    const w=Math.min(L_W*.88,(b.r||110)*2.25),h=(b.r||110)*1.88;
    const pulse=.94+.06*Math.sin(t*4.2),bob=Math.sin(t*1.65)*2.1;
    g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.34+.11*Math.sin(t*3.1);
    const glow=g.createRadialGradient(b.x*K,b.y*K,2*K,b.x*K,b.y*K,Math.max(w,h)*.48*K);
    glow.addColorStop(0,'rgba(80,220,255,.46)');glow.addColorStop(.5,'rgba(45,120,255,.18)');glow.addColorStop(1,'rgba(15,45,160,0)');
    g.fillStyle=glow;g.fillRect((b.x-w*.65)*K,(b.y-h*.6)*K,w*1.3*K,h*1.2*K);
    g.globalCompositeOperation='source-over';g.globalAlpha=b.flash>0?.82:1;
    g.imageSmoothingEnabled=false;
    g.drawImage(im,(b.x-w*pulse*.5)*K,(b.y-h*pulse*.5+bob)*K,w*pulse*K,h*pulse*K);
    g.restore();
  };
})();
