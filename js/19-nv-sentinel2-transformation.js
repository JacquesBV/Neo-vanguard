
(() => {
  const NAME='SENTINELLE-2';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a< -Math.PI)a+=Math.PI*2;return a;};
  function palette(){
    const q=TH.livery&&TH.livery.gb;
    return R.era===0&&q?{d:q[0],m:q[1],l:q[2],h:q[3],c:q[3],v:q[2],hot:q[0]}:
      {d:'#0a101d',m:'#20344e',l:'#557895',h:'#e9fbff',c:'#65f4ff',v:'#b276ff',hot:'#ff557e'};
  }
  function drawArt(b,lookX,lookY,alpha,trans){
    if(alpha<=.005)return;
    const g=PAINT.g,K=PAINT.K,S=.96,t=b.t||0,ph=b.ph||0,P=palette(),damage=1-b.hp/Math.max(1,b.maxHp);
    const X=x=>(b.x+x*S)*K,Y=y=>(b.y+y*S+Math.sin(t*1.2)*2)*K,sc=v=>v*S*K;
    const poly=(pts,fill,stroke=null,w=2)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=Math.max(1,sc(w));g.lineJoin='round';g.stroke();}};
    const line=(pts,col,w=2)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.strokeStyle=col;g.lineWidth=Math.max(1,sc(w));g.lineCap='round';g.lineJoin='round';g.stroke();};
    const disc=(x,y,r,col)=>{g.beginPath();g.arc(X(x),Y(y),Math.max(.65,sc(r)),0,Math.PI*2);g.fillStyle=col;g.fill();};
    const ell=(x,y,rx,ry,col,a=1)=>{g.globalAlpha=a;g.beginPath();g.ellipse(X(x),Y(y),sc(rx),sc(ry),0,0,Math.PI*2);g.fillStyle=col;g.fill();g.globalAlpha=1;};
    const ring=(x,y,r,w,col,a=0,z=TAU)=>{g.beginPath();g.arc(X(x),Y(y),sc(r),a,z);g.strokeStyle=col;g.lineWidth=Math.max(1,sc(w));g.stroke();};
    const rect=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(X(x)),Math.round(Y(y)),Math.max(1,Math.round(sc(w))),Math.max(1,Math.round(sc(h))));};
    const aim=clamp(wrap(Math.atan2(lookY,lookX)-Math.PI/2),-.58,.58),targetX=aim*19,targetY=clamp(lookY,-.3,1)*8;
    const shellAlpha=alpha*(1-trans), coreAlpha=alpha*trans;
    g.save();g.globalAlpha*=alpha;
    ell(0,137,90,16,P.d,.42);
    /* Coque complète : sentinelle ailée, lance de garde et œil suiveur. */
    if(shellAlpha>.01){
      g.save();g.globalAlpha*=1-trans;
      g.globalCompositeOperation=R.era===0?'source-over':'screen';g.globalAlpha*=R.era===0?.25:.28;
      ring(0,0,104,3,P.c,t*.34,t*.34+Math.PI*1.5);ring(0,0,115,1.8,P.h,-t*.46,-t*.46+Math.PI*1.02);
      for(let i=0;i<8;i++){const a=-t*.46+i*Math.PI/4;disc(Math.cos(a)*115,Math.sin(a)*115,2.7,i%2?P.h:P.c);}
      g.globalCompositeOperation='source-over';g.globalAlpha=alpha*(1-trans);
      /* moteurs et traînées pulsées */
      for(let i=0;i<3;i++){const xx=-25+i*25,w=.5+.5*Math.sin(t*17+i*1.9),len=14+12*w+(ph===2?8:0);
        poly([[xx-7,78],[xx+7,78],[xx+5,96],[xx-5,96]],P.d,P.c,1.4);
        poly([[xx-4,91],[xx+4,91],[xx+2,93+len],[xx-2,93+len]],P.l);
        poly([[xx-1.5,93],[xx+1.5,93],[xx,92+len*.83]],P.h);
      }
      /* ailes longues en céramique sombre et nervures cyan */
      for(const side of [-1,1]){
        const flap=Math.sin(t*1.7+side*.6)*5;
        poly([[side*30,-55],[side*55,-89+flap],[side*111,-116+flap],[side*136,-101],[side*120,-52],[side*91,-8],[side*52,35],[side*37,6]],P.d,P.h,3);
        poly([[side*44,-54],[side*62,-79+flap],[side*104,-101+flap],[side*119,-94],[side*105,-56],[side*84,-17],[side*56,18],[side*49,1]],P.m);
        poly([[side*66,-64],[side*103,-91+flap],[side*111,-85],[side*89,-49]],P.l);
        line([[side*55,-44],[side*94,-72+flap],[side*113,-88]],P.c,2.4);
        for(let j=0;j<4;j++){const lit=(Math.floor(t*7+j+(side>0?1:0))%4)<2;disc(side*(63+j*12),-30-j*12+flap*.3,2.5,lit?P.h:P.c);}
        line([[side*41,3],[side*69,24+flap],[side*88,10]],P.v,2);
      }
      /* queue segmentée et plaque dorsale */
      poly([[-41,-59],[-27,-101],[0,-139],[27,-101],[41,-59],[31,-36],[-31,-36]],P.d,P.h,3);
      poly([[-29,-61],[-19,-98],[0,-124],[19,-98],[29,-61],[22,-47],[-22,-47]],P.m);
      poly([[-15,-87],[0,-119],[15,-87],[0,-75]],P.l,P.c,1.5);
      for(let i=0;i<5;i++){const on=(Math.floor(t*8)+i)%5<2;line([[0,-113+i*10],[0,-109+i*10]],on?P.h:P.c,3);}
      /* flancs en armure, attaches articulées */
      for(const side of [-1,1]){
        line([[side*29,-47],[side*55,-25+Math.sin(t*2+side)*4],[side*62,17]],P.d,9);
        line([[side*29,-47],[side*55,-25+Math.sin(t*2+side)*4],[side*62,17]],P.h,2);
        disc(side*55,-25+Math.sin(t*2+side)*4,6,P.v);disc(side*55,-25+Math.sin(t*2+side)*4,2.4,P.h);
        poly([[side*48,-7],[side*72,-25],[side*90,-2],[side*76,25],[side*54,20]],P.d,P.c,2);
        disc(side*70,0,9,P.m);disc(side*70,0,4,P.h);
      }
      /* blindage thoracique en V, avec lignes d'arête façon mecha anime */
      const shell=[[-45,-66],[-29,-82],[29,-82],[45,-66],[53,-31],[47,43],[30,77],[0,105],[-30,77],[-47,43],[-53,-31]];
      poly(shell,P.d,P.h,3.5);
      poly([[-36,-63],[-23,-73],[23,-73],[36,-63],[42,-29],[37,38],[23,67],[0,89],[-23,67],[-37,38],[-42,-29]],P.m);
      poly([[-35,-51],[0,-67],[35,-51],[25,-28],[0,-18],[-25,-28]],P.l,P.h,1.3);
      line([[-39,-20],[-26,-1],[-28,42],[-13,65]],P.c,2);line([[39,-20],[26,-1],[28,42],[13,65]],P.c,2);
      for(const side of [-1,1])for(let i=0;i<3;i++)disc(side*(28+i*4),-37+i*10,2.2,i===1?P.h:P.v);
      /* visière et iris oculaire orientés vers le pilote */
      poly([[-31,-5],[-23,-34],[0,-45],[23,-34],[31,-5],[18,15],[0,22],[-18,15]],P.d,P.h,2.5);
      poly([[-23,-8],[-17,-29],[0,-37],[17,-29],[23,-8],[13,8],[0,13],[-13,8]],P.l);
      ell(targetX,-12+targetY,14,20,P.d);ell(targetX,-12+targetY,10,16,P.h);ell(targetX,-12+targetY,6,12,P.c);
      ell(targetX+2,-14+targetY,2.6,6,P.d);ell(targetX+3,-18+targetY,1.7,3,P.h);
      /* coques ébréchées avant l'explosion finale */
      if(damage>.2){line([[-48,-44],[-31,-27],[-37,-5],[-18,9]],P.d,3);line([[-48,-44],[-31,-27]],P.hot,1.4);}
      if(damage>.4){line([[45,16],[30,30],[34,49],[19,61]],P.hot,2.2);}
      if(damage>.55){for(let i=0;i<5;i++){const a=t*4+i*1.4;disc(Math.sin(a)*(50+i*7),Math.cos(a)*(53+i*4),1.8,i%2?P.h:P.c);}}
      g.restore();
    }
    /* Forme libérée : le noyau devient une sentinelle solaire à six lames. */
    if(coreAlpha>.01){
      g.save();g.globalAlpha*=trans;
      const bloom=.75+.25*Math.sin(t*5.5),spin=t*(.48+ph*.16),spread=trans;
      g.globalCompositeOperation=R.era===0?'source-over':'screen';g.globalAlpha*=R.era===0?.3:.42;
      ring(0,0,104+10*spread,4,P.v,spin,spin+Math.PI*1.55);
      ring(0,0,91,2,P.h,-spin*1.24,-spin*1.24+Math.PI*1.25);
      g.globalCompositeOperation='source-over';g.globalAlpha=alpha*trans;
      /* six blades orbit with a slight breathing motion */
      for(let i=0;i<6;i++){
        const a=spin+i*TAU/6,rx=Math.cos(a),ry=Math.sin(a),r=54+spread*25+Math.sin(t*2+i)*3;
        const cx=rx*r,cy=ry*r;
        const tangent=a+Math.PI/2,tipX=cx+Math.cos(tangent)*11,tipY=cy+Math.sin(tangent)*11;
        const backX=cx-Math.cos(tangent)*11,backY=cy-Math.sin(tangent)*11;
        poly([[rx*24,ry*24],[backX-rx*8,backY-ry*8],[cx-rx*4,cy-ry*4],[tipX+rx*15,tipY+ry*15],[cx+rx*4,cy+ry*4],[backX+rx*8,backY+ry*8]],i%2?P.m:P.l,P.h,1.8);
        line([[rx*31,ry*31],[cx+rx*8,cy+ry*8]],i%2?P.c:P.v,2.5);
        disc(cx,cy,3.5,P.h);
      }
      /* corps central dépouillé : un prisme d'énergie dans une cage noire */
      poly([[-43,-34],[-28,-52],[28,-52],[43,-34],[49,0],[35,37],[0,53],[-35,37],[-49,0]],P.d,P.v,3);
      poly([[-33,-30],[-21,-42],[21,-42],[33,-30],[38,0],[27,27],[0,40],[-27,27],[-38,0]],P.m,P.h,1.5);
      poly([[-24,-25],[0,-40],[24,-25],[18,12],[0,33],[-18,12]],P.l,P.c,2);
      /* regard vivant : regard mobile, contraction avant chaque salve */
      const charge=.5+.5*Math.sin(t*3.2)+(b._sentFire||0)*.8,eye=7+charge*5;
      disc(targetX*.48,-5+targetY*.5,eye+8,P.d);disc(targetX*.48,-5+targetY*.5,eye+4,P.h);
      disc(targetX*.48,-5+targetY*.5,eye,P.c);disc(targetX*.48+1,-7+targetY*.5,eye*.44,P.d);
      disc(targetX*.48+2,-10+targetY*.5,2.4,P.h);
      /* pulsations radiales, étincelles et filaments » */
      ring(0,0,28+charge*8,2.5,P.h,spin*2,spin*2+Math.PI*(1.1+charge*.8));
      for(let i=0;i<9;i++){const a=-t*1.5+i*TAU/9;disc(Math.cos(a)*67,Math.sin(a)*67,2.2+(i%3),i%2?P.c:P.v);}
      for(let side of [-1,1]){
        const sway=Math.sin(t*2+side)*9;
        line([[side*27,30],[side*(48+sway),55],[side*(57+sway),84]],P.d,8);
        line([[side*27,30],[side*(48+sway),55],[side*(57+sway),84]],P.h,2);
        disc(side*(57+sway),84,5,P.v);disc(side*(57+sway),84,2.2,P.c);
      }
      if(damage>.72){for(let i=0;i<5;i++){const a=t*5+i*1.25;disc(Math.cos(a)*(62+i*3),Math.sin(a)*(48+i*4),2.2,i%2?P.h:P.hot);}}
      if(b.flash>0){g.globalCompositeOperation='screen';g.globalAlpha=clamp(b.flash*3,.0,.65);poly([[-43,-34],[-28,-52],[28,-52],[43,-34],[49,0],[35,37],[0,53],[-35,37],[-49,0]],P.h);g.globalAlpha=1;g.globalCompositeOperation='source-over';}
      g.restore();
      /* les plaques rompues s'écartent, tournent puis restent en orbite autour du noyau */
      for(let i=0;i<6;i++){
        const a=spin+i*TAU/6,flight=(1-trans)*Math.min(1,Math.max(0,(b.t-(b._sentBreakAt||b.t))/.7));
        const orbit=78+flight*75,px=Math.cos(a)*orbit,py=Math.sin(a)*orbit;
        const rot=a+t*(i%2?-.7:.7),pts=[[-11,-20],[6,-16],[13,0],[6,17],[-9,13],[-14,-2]].map(([x,y])=>[px+x*Math.cos(rot)-y*Math.sin(rot),py+x*Math.sin(rot)+y*Math.cos(rot)]);
        g.globalAlpha=alpha*(.35+.65*trans);poly(pts,P.d,P.v,1.4);line([[px-5,py-5],[px+5,py+4]],P.h,1.2);
        g.globalAlpha=alpha;
      }
    }
    g.globalAlpha=1;g.globalCompositeOperation='source-over';g.restore();
  }
  function startBreak(b){
    if(!b||b._sentinelBroken)return;
    b._sentinelBroken=true;b._sentBreakAt=b.t||0;b._sentinelBreakEvent=true;
    try{FX.addFlash(.58,TH.white);FX.addShake(17);explode(b.x,b.y,2.5,TH.eBoss,TH.eBossLite);Audio2.sfx('explode',{big:true});}catch(e){}
  }
  const priorDamage=bossDamage;
  bossDamage=function(dmg,part){
    const b=G.boss,before=b&&b.def&&b.def.name===NAME?b.hp/b.maxHp:1;
    const out=priorDamage(dmg,part);
    if(b&&b.def&&b.def.name===NAME&&!part&&!b._sentinelBroken&&before>.56&&b.hp/b.maxHp<=.56&&b.hp>0)startBreak(b);
    return out;
  };
  const previous=drawBoss;
  drawBoss=function(){
    const b=G.boss;if(!b||!b.def||b.def.name!==NAME)return previous();
    useBuf(R.bufNear);
    if(!b._sentinelBroken&&b.hp/b.maxHp<=.56&&b.hp>0)startBreak(b);
    if(b._sentPrevAtk!==undefined&&b.atkT>b._sentPrevAtk+.14)b._sentFire=.24;
    b._sentPrevAtk=b.atkT;b._sentFire=Math.max(0,(b._sentFire||0)-1/60);
    const target=(typeof nearestPlayer==='function'?nearestPlayer(b.x,b.y):G.player)||G.player;
    const dx=target?target.x-b.x:0,dy=target?target.y-b.y:1,d=Math.hypot(dx,dy)||1;
    const elapsed=b._sentinelBroken?Math.max(0,(b.t||0)-(b._sentBreakAt||0)):0;
    const trans=b._sentinelBroken?clamp(elapsed/1.05,0,1):0;
    drawArt(b,dx/d,dy/d,1,trans);
  };
})();
