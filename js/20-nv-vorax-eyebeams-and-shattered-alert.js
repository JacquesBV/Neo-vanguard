
(() => {
  const NAME = 'VORAX';
  const NV24_ROBOT = { torsoDY: -120, torsoSc: 0.8 };
  const clampV = (v, a, b) => Math.max(a, Math.min(b, v));
  const previousWarning = drawBossWarning;
  drawBossWarning = function () {
    const upcoming = bossForLevel(G.level);
    if (!upcoming || !upcoming.def || !upcoming.def.final) return previousWarning();
    const t = Math.max(0, G.bossWarnT || 0), total = 3.6;
    /* L'alerte se détruit avant l'arrivée : elle ne nomme jamais le boss. */
    if (t >= 3.28) return;
    const q = clampV(t / total, 0, 1), fadeIn = clampV(t / .22, 0, 1);
    const crack = clampV((q - .36) / .44, 0, 1), shatter = clampV((q - .78) / .13, 0, 1);
    const x = PF.x, y = PF.y, w = PF.w, h = PF.h;
    const cardW = Math.min(w - 18, Math.max(230, w * .92));
    const cardH = Math.max(104, Math.min(132, h * .14));
    const bx = x + (w - cardW) / 2, by = y + Math.min(118, Math.max(54, h * .08));
    const pulse = .72 + .28 * Math.sin(t * 15), cx = bx + cardW / 2;
    const opacity = fadeIn * (1 - shatter * .95);
    const title = ({fr:'ALERTE — SIGNATURE INCONNUE',en:'ALERT — UNKNOWN SIGNATURE',es:'ALERTA — FIRMA DESCONOCIDA',pt:'ALERTA — ASSINATURA DESCONHECIDA',ja:'警告 — 未確認シグナル'})[LANG] || 'ALERTE — SIGNATURE INCONNUE';
    const line1 = ({fr:'ANOMALIE AMIRALE EN APPROCHE',en:'FLAGSHIP ANOMALY APPROACHING',es:'ANOMALÍA ALMIRANTE EN APROXIMACIÓN',pt:'ANOMALIA DA NAVE-MÃE A APROXIMAR-SE',ja:'敵旗艦級の異常接近'})[LANG] || 'ANOMALIE AMIRALE EN APPROCHE';
    const line2 = ({fr:'IDENTIFICATION IMPOSSIBLE · MENACE MAXIMALE',en:'IDENTIFICATION LOST · MAXIMUM THREAT',es:'IDENTIFICACIÓN PERDIDA · AMENAZA MÁXIMA',pt:'IDENTIFICAÇÃO PERDIDA · AMEAÇA MÁXIMA',ja:'識別不能 · 脅威レベル最大'})[LANG] || 'IDENTIFICATION IMPOSSIBLE · MENACE MAXIMALE';
    const fitAlert = (text, start, min, maxW) => { let size=start; while(size>min && hudW(text,size)>maxW) size-=.1; return Math.max(min,size); };
    const textW = cardW - 24;
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.translate(0, (1 - fadeIn) * -18);
    const hot = '#ff263f', ice = '#ffc6d0';
    /* panneau de signal brut, sans champ de nom */
    ctx.shadowColor = hot; ctx.shadowBlur = 15 + pulse * 18;
    ctx.fillStyle = 'rgba(5,7,16,.96)'; ctx.fillRect(bx, by, cardW, cardH);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = hot; ctx.lineWidth = 2 + pulse; ctx.strokeRect(bx + 1, by + 1, cardW - 2, cardH - 2);
    ctx.strokeStyle = 'rgba(255,220,230,.72)'; ctx.lineWidth = 1; ctx.strokeRect(bx + 7, by + 7, cardW - 14, cardH - 14);
    ctx.fillStyle = hot; ctx.fillRect(bx, by, cardW, 5); ctx.fillRect(bx, by + cardH - 5, cardW, 5);
    for (let i=0;i<6;i++) { const sx=bx+12+i*10; ctx.fillStyle=i%2?ice:hot; ctx.fillRect(sx,by+11,7,4); ctx.fillRect(bx+cardW-19-i*10,by+cardH-15,7,4); }
    hudText(ctx, title, cx, by + 25, ice, fitAlert(title, R.era >= 3 ? 2.35 : 1.9, 1.15, textW), {align:'center',glow:hot});
    hudText(ctx, line1, cx, by + 56, '#ffffff', fitAlert(line1, R.era >= 3 ? 3 : 2.5, 1.2, textW), {align:'center',glow:hot});
    hudText(ctx, line2, cx, by + cardH - 22, ice, fitAlert(line2, R.era >= 3 ? 1.55 : 1.3, .9, textW), {align:'center'});
    /* jauge de confinement saturée avant la rupture */
    ctx.fillStyle='rgba(255,255,255,.16)'; ctx.fillRect(bx+12,by+cardH-9,cardW-24,2);
    ctx.fillStyle=hot; ctx.fillRect(bx+12,by+cardH-9,(cardW-24)*clampV(q/.84,0,1),2);
    /* arcs électriques irréguliers qui courent sur les quatre bords */
    const arcCount = 3 + Math.floor(q * 10);
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='#ff7584'; ctx.shadowColor=hot; ctx.shadowBlur=12; ctx.lineWidth=1.2 + pulse;
    for(let i=0;i<arcCount;i++){
      const side=i%4, u=((i*0.618+t*(.55+i%3)*.16)%1);
      let ax,ay,bx2,by2;
      if(side===0){ax=bx+u*cardW;ay=by;bx2=ax+(u<.5?1:-1)*12;by2=by+18;}
      else if(side===1){ax=bx+cardW;ay=by+u*cardH;bx2=bx+cardW-18;by2=ay+(u<.5?1:-1)*12;}
      else if(side===2){ax=bx+u*cardW;ay=by+cardH;bx2=ax+(u<.5?1:-1)*12;by2=by+cardH-18;}
      else{ax=bx;ay=by+u*cardH;bx2=bx+18;by2=ay+(u<.5?1:-1)*12;}
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+(bx2-ax)*.34+(i%2?5:-5),ay+(by2-ay)*.27);ctx.lineTo(ax+(bx2-ax)*.7+(i%3? -4:4),ay+(by2-ay)*.72);ctx.lineTo(bx2,by2);ctx.stroke();
    }
    ctx.restore();
    /* fissures traversent le panneau, puis celui-ci se désagrège en éclats */
    if(crack>0){
      ctx.save();ctx.globalAlpha*=crack;ctx.strokeStyle='#ff8290';ctx.lineWidth=1.5+crack;ctx.shadowColor=hot;ctx.shadowBlur=6;
      const cracks=[[[bx+cardW*.18,by],[bx+cardW*.24,by+cardH*.24],[bx+cardW*.19,by+cardH*.4],[bx+cardW*.31,by+cardH*.61],[bx+cardW*.27,by+cardH]],[[bx+cardW*.82,by],[bx+cardW*.77,by+cardH*.22],[bx+cardW*.84,by+cardH*.39],[bx+cardW*.7,by+cardH*.55],[bx+cardW*.74,by+cardH]],[[bx,by+cardH*.48],[bx+cardW*.2,by+cardH*.53],[bx+cardW*.34,by+cardH*.45]],[[bx+cardW,by+cardH*.35],[bx+cardW*.82,by+cardH*.4],[bx+cardW*.67,by+cardH*.3]]];
      for(const path of cracks){ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
      ctx.restore();
    }
    if(shatter>0){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=hot;ctx.strokeStyle=ice;ctx.lineWidth=1;
      for(let i=0;i<12;i++){
        const side=i%4, u=((i*.618)%1), sx=side===1?bx+cardW:side===3?bx:bx+u*cardW, sy=side===0?by:side===2?by+cardH:by+u*cardH;
        const dx=(sx-cx)*(.22+shatter*1.7)+(i%3-1)*8, dy=(sy-(by+cardH/2))*.12+(i%2?1:-1)*(10+shatter*48);
        const r=4+(i*7%11)*(1-shatter*.45), px=sx+dx*shatter, py=sy+dy*shatter;
        ctx.globalAlpha=fadeIn*(1-shatter*.18);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+r,py-r*.8);ctx.lineTo(px+r*.45,py+r);ctx.closePath();ctx.fill();ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  };

  /* séquence de regards : charge lente, verrouillage visible, deux rayons rouges. */
  const priorUpdateBoss = updateBoss;
  updateBoss = function (dt) {
    const b=G.boss, isVorax=!!(b&&b.def&&b.def.name===NAME&&!b.dead);
    if(isVorax&&!b.enter&&G.phase==='boss'){
      if(!b._eyeLaser){
        b._eyeLaserCooldown=(b._eyeLaserCooldown===undefined?4.8:b._eyeLaserCooldown)-dt;
        if(b._eyeLaserCooldown<=0){
          const target=(typeof nearestPlayer==='function'?nearestPlayer(b.x,b.y):G.player)||G.player;
          b._eyeLaser={t:0,targetX:target?target.x:L_W/2,hitCd:0,fired:false};
          Audio2.sfx('alert');
        }
      }else{
        const shot=b._eyeLaser,old=shot.t;shot.t+=dt;shot.hitCd=Math.max(0,shot.hitCd-dt);
        if(!shot.fired&&old<1.32&&shot.t>=1.32){shot.fired=true;Audio2.sfx('laser');FX.addFlash(.08,'#ff3344');}
        if(shot.t>=2.08){b._eyeLaser=null;b._eyeLaserCooldown=7.2;}
      }
    }
    priorUpdateBoss(dt);
    if(!isVorax||G.boss!==b||!b._eyeLaser||b._eyeLaser.t<1.32||b._eyeLaser.t>=2.08||NET.role==='guest')return;
    const shot=b._eyeLaser, hy=b.y+NV24_ROBOT.torsoDY-.78*125*NV24_ROBOT.torsoSc, ex=.14*170*NV24_ROBOT.torsoSc;
    for(const P of G.players){
      if(!P||!P.alive||P.out||P.inv>0||shot.hitCd>0)continue;
      let hit=false;
      for(const side of [-1,1]){
        const x1=b.x+side*ex,y1=hy+5,x2=clampV(shot.targetX+side*34,26,L_W-26),y2=L_H+30;
        const vx=x2-x1,vy=y2-y1,u=clampV(((P.x-x1)*vx+(P.y-y1)*vy)/(vx*vx+vy*vy),0,1);
        const dx=P.x-(x1+u*vx),dy=P.y-(y1+u*vy);
        if(dx*dx+dy*dy<(P.r+9)*(P.r+9)){hit=true;break;}
      }
      if(hit){hitPlayer(P,1,false);shot.hitCd=.48;}
    }
  };

  const priorDrawBoss = drawBoss;
  drawBoss = function () {
    const b=G.boss;
    priorDrawBoss();
    if(!b||!b.def||b.def.name!==NAME||b.dead||b.enter||!b._eyeLaser)return;
    const shot=b._eyeLaser,g=PAINT.g,K=PAINT.K,e=R.era;
    const t=shot.t, charge=clampV(t/1.32,0,1), fire=clampV((t-1.32)/.12,0,1)*(t<2.08?1:0);
    const hy=b.y+NV24_ROBOT.torsoDY-.78*125*NV24_ROBOT.torsoSc, ex=.14*170*NV24_ROBOT.torsoSc;
    const ends=[];
    for(const side of [-1,1])ends.push([side,clampV(shot.targetX+side*34,26,L_W-26)]);
    g.save();
    /* la pupille passe du rouge sombre au blanc incandescent avant le tir */
    for(const side of [-1,1]){
      const exy=b.x+side*ex;
      g.save();g.globalCompositeOperation=e===0?'source-over':'lighter';g.globalAlpha=.35+charge*.6;g.shadowColor='#ff172c';g.shadowBlur=6+charge*22;
      circle(exy,hy,3.5+charge*5.5,charge>.82?'#fff0e9':'#ff283b');
      circle(exy,hy,7+charge*12,'rgba(255,25,45,.28)');
      if(charge>.12)ring(exy,hy,7+charge*10,1.3+charge*1.2,'#ff5964',b.t*3,b.t*3+Math.PI*(.7+charge));
      g.restore();
      if(charge>.72&&!fire){
        const x2=clampV(shot.targetX+side*34,26,L_W-26);g.save();g.globalAlpha=(charge-.72)*.55;g.setLineDash([5*K,8*K]);g.strokeStyle='#ff5964';g.lineWidth=1.5*K;g.beginPath();g.moveTo(exy*K,(hy+7)*K);g.lineTo(x2*K,(L_H+24)*K);g.stroke();g.setLineDash([]);g.restore();
      }
    }
    if(fire>0){
      g.save();g.globalCompositeOperation=e===0?'source-over':'lighter';g.lineCap='round';g.shadowColor='#ff1428';g.shadowBlur=28*fire;
      for(const [side,x2] of ends){
        const x1=b.x+side*ex,y1=hy+6;
        g.globalAlpha=.28+.24*fire;g.strokeStyle='#ff1d35';g.lineWidth=(22+8*Math.sin(t*52))*K;g.beginPath();g.moveTo(x1*K,y1*K);g.lineTo(x2*K,(L_H+30)*K);g.stroke();
        g.globalAlpha=.9;g.strokeStyle='#ff273a';g.lineWidth=9*K;g.beginPath();g.moveTo(x1*K,y1*K);g.lineTo(x2*K,(L_H+30)*K);g.stroke();
        g.globalAlpha=1;g.strokeStyle='#fff2e9';g.lineWidth=2.4*K;g.beginPath();g.moveTo(x1*K,y1*K);g.lineTo(x2*K,(L_H+30)*K);g.stroke();
        circle(x1,y1,5+Math.sin(t*35)*2,'#fff2e9');
      }
      g.restore();
    }
    g.restore();
  };
})();
