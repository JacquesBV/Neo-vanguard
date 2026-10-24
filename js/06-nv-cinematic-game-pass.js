
/* Passe artistique globale : lumière, profondeur et lisibilité, sans toucher aux règles. */
(() => {
  const nvPulse = t => 0.5 + 0.5 * Math.sin(t);
  const nvGlow = (g, K, x, y, rx, ry, color, alpha) => {
    if (!(rx > 0 && ry > 0)) return;
    const cx=x*K, cy=y*K, rad=Math.max(rx,ry)*K;
    const grad=g.createRadialGradient(cx,cy,0,cx,cy,rad);
    grad.addColorStop(0,color); grad.addColorStop(.38,color); grad.addColorStop(1,'rgba(0,0,0,0)');
    g.save(); g.globalCompositeOperation='lighter'; g.globalAlpha=alpha;
    g.fillStyle=grad; g.beginPath(); g.ellipse(cx,cy,rx*K,ry*K,0,0,TAU); g.fill(); g.restore();
  };
  const oldFog=drawFog;
  drawFog=function(){
    oldFog();
    if (R.era < 2) return;
    useBuf(R.bufNear);
    const g=PAINT.g, K=PAINT.K, t=(G.t||0), W=L_W, H=L_H;
    const c1=TH.neb1 || 'rgba(45,120,255,.2)', c2=TH.neb2 || 'rgba(210,60,210,.16)';
    /* Deux nappes colorées lentes donnent du relief au fond sans gêner les tirs. */
    nvGlow(g,K,W*(.25+.18*Math.sin(t*.17)),H*(.26+.1*Math.sin(t*.23)),W*.42,H*.3,c1,.13);
    nvGlow(g,K,W*(.77+.13*Math.sin(t*.14+2)),H*(.68+.08*Math.cos(t*.19)),W*.37,H*.32,c2,.105);
    if (R.era >= 3) {
      /* Quelques rayons très fins et mouvants, typés animation grand écran. */
      g.save(); g.globalCompositeOperation='screen'; g.globalAlpha=.11;
      for(let i=0;i<3;i++){
        const x=W*(.12+i*.37)+Math.sin(t*.22+i*1.7)*26;
        const q=g.createLinearGradient(x*K,0,(x+70)*K,H*K);
        q.addColorStop(0,'rgba(120,220,255,0)'); q.addColorStop(.48,'rgba(120,220,255,.55)'); q.addColorStop(1,'rgba(160,120,255,0)');
        g.fillStyle=q; g.beginPath(); g.moveTo(x*K,0);g.lineTo((x+17)*K,0);g.lineTo((x+110)*K,H*K);g.lineTo((x+42)*K,H*K);g.closePath();g.fill();
      }
      g.restore();
    }
  };

  const oldPlayer=drawPlayer;
  drawPlayer=function(pl){
    const P=pl||G.player;
    if(P&&P.alive&&R.era>=2&&!(window.NVS&&NVS.on())){
      useBuf(R.bufNear); const g=PAINT.g,K=PAINT.K, box=spriteBox(S.sel.ship), t=P.anim||0;
      const x=P.x,y=P.y+box.h*.29, len=(R.era>=3?56:39)*(IS_TOUCH?TOUCH_ACTOR_SCALE:1);
       nvGlow(g,K,x,y+len*.33,box.w*.17,len*.82,R.era>=3?'rgba(90,220,255,.82)':'rgba(100,155,255,.56)',R.era>=3?.38:.24);
      g.save();g.globalCompositeOperation='lighter';
      for(let side of [-1,1]){
        const sx=x+side*box.w*.095, sway=Math.sin(t*12+side)*2.2;
        const grad=g.createLinearGradient(sx*K,y*K,(sx+sway)*K,(y+len)*K);
        grad.addColorStop(0,'rgba(255,255,255,.72)');grad.addColorStop(.18,R.era>=3?'rgba(88,225,255,.72)':'rgba(100,165,255,.5)');grad.addColorStop(1,'rgba(70,115,255,0)');
        g.globalAlpha=.7;g.strokeStyle=grad;g.lineWidth=Math.max(1,box.w*.022*K);g.beginPath();g.moveTo(sx*K,y*K);g.quadraticCurveTo((sx+sway)*K,(y+len*.45)*K,(sx-sway*.4)*K,(y+len)*K);g.stroke();
      }
      g.restore();
    }
    return oldPlayer(pl);
  };

  const oldEnemy=drawEnemyOne;
  drawEnemyOne=function(en,g,K,e){
    if(en&&e>=2){
      const th=ETHEME[en.kind]||ETHEME.drone, box=spriteBox(EID[en.kind]||'drone');
      const hue=th.hue===undefined?190:th.hue, r=Math.max(box.w,box.h)*(.52+(en.elite?.14:0));
      const pulse=.76+.24*nvPulse((en.t||0)*3.2+(en.phase||0));
       nvGlow(g,K,en.x,en.y,r,r*.74,`hsla(${hue},100%,68%,.76)`,(e>=3?.19:.10)*pulse*(en.spawnT>0?.65:1));
      if(en.elite||en.mini){g.save();g.globalCompositeOperation='screen';g.globalAlpha=.24*pulse;g.strokeStyle=`hsla(${hue},100%,78%,.9)`;g.lineWidth=Math.max(1,1.2*K);g.beginPath();g.ellipse(en.x*K,en.y*K,(box.w*.48)*K,(box.h*.43)*K,0,Math.PI*1.08,Math.PI*1.92);g.stroke();g.restore();}
    }
    return oldEnemy(en,g,K,e);
  };

  const oldBoss=drawBoss;
  drawBoss=function(){
    const b=G.boss;
    if(b&&R.era>=1){useBuf(R.bufNear);const g=PAINT.g,K=PAINT.K,e=R.era;
      const hue=b.def&&b.def.hue!==undefined?b.def.hue:300, r=Math.max(110,b.r||120);
      nvGlow(g,K,b.x,b.y,r*1.48,r*.88,`hsla(${hue},100%,66%,.72)`,e>=3?.24:e>=2?.17:.09);
      if(e>=2){g.save();g.globalCompositeOperation='screen';g.globalAlpha=.20+.07*Math.sin((b.t||0)*2.6);g.strokeStyle=`hsla(${hue},100%,76%,.8)`;g.lineWidth=Math.max(1,1.4*K);g.beginPath();g.ellipse(b.x*K,b.y*K,r*1.22*K,r*.73*K,0,Math.PI*1.06,Math.PI*1.94);g.stroke();g.restore();}
    }
    return oldBoss();
  };

  const oldRender=render;
  render=function(dt){
    oldRender(dt);
    if(!ctx||!PF||!view||G.state==='title'||G.state==='warp'||G.state==='story')return;   /* le récit a ses propres cadres : pas de cadre sur cadre */
    const x=PF.x,y=PF.y,w=PF.w,h=PF.h,e=R.era,t=G.t||0;
    ctx.save();
    /* Reflet subtil et assombrissement des bords : le centre de l'action reste net. */
    const v=ctx.createRadialGradient(x+w*.5,y+h*.48,Math.min(w,h)*.24,x+w*.5,y+h*.48,Math.max(w,h)*.72);
    v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(.72,'rgba(0,0,0,0)');v.addColorStop(1,e>=3?'rgba(2,8,24,.30)':'rgba(2,5,16,.22)');
    ctx.fillStyle=v;ctx.fillRect(x,y,w,h);
    const a=TH.acc||'#58dfff';ctx.globalCompositeOperation='screen';ctx.globalAlpha=.18+.035*Math.sin(t*1.8);
    ctx.strokeStyle=a;ctx.lineWidth=Math.max(1,Math.min(2,w/260));ctx.strokeRect(x+.5,y+.5,w-1,h-1);
    const k=Math.max(5,Math.min(18,Math.min(w,h)*.035));ctx.globalAlpha=.34;
    for(const [sx,sy,dx,dy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){
      ctx.beginPath();ctx.moveTo(sx+dx*k,sy);ctx.lineTo(sx,sy);ctx.lineTo(sx,sy+dy*k);ctx.stroke();
    }
    ctx.restore();
  };
})();
