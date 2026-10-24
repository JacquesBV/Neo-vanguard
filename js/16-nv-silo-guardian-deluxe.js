
(() => {
  /* Réinterprétation animée du boss du secteur 1 : forteresse volante à iris vivant. */
  const BOSS_NAME = 'GARDIEN DU SILO';
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const wrap = a => { while(a>Math.PI)a-=Math.PI*2; while(a< -Math.PI)a+=Math.PI*2; return a; };
  function drawArt(b, lookX, lookY) {
    const g=PAINT.g,K=PAINT.K,S=.9,t=b.t||0,phase=b.ph||0,open=clamp(b._open||0,0,1),fire=clamp((b._fireT||0)/.22,0,1),damage=1-b.hp/Math.max(1,b.maxHp);
    const q=TH.livery&&TH.livery.gb,mono=R.era===0&&q;
    const P=mono?{d:q[0],m:q[1],l:q[2],h:q[3],energy:q[3],edge:q[2]}:{d:'#07101c',m:'#21364b',l:'#52738c',h:'#d6f3fa',energy:'#65f5df',edge:'#ffb64d'};
    const X=x=>(b.x+x*S)*K,Y=y=>(b.y+y*S)*K,sc=v=>v*S*K;
    const polygon=(pts,fill,stroke=null,lw=2)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=Math.max(1,sc(lw));g.lineJoin='round';g.stroke();}};
    const line=(pts,col,w=2)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.strokeStyle=col;g.lineWidth=Math.max(1,sc(w));g.lineCap='round';g.lineJoin='round';g.stroke();};
    const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(X(x)),Math.round(Y(y)),Math.max(1,Math.round(sc(w))),Math.max(1,Math.round(sc(h))));};
    const disc=(x,y,r,c)=>{g.beginPath();g.arc(X(x),Y(y),Math.max(.6,sc(r)),0,Math.PI*2);g.fillStyle=c;g.fill();};
    const ring=(x,y,r,w,c,a=0,b=Math.PI*2)=>{g.beginPath();g.arc(X(x),Y(y),sc(r),a,b);g.strokeStyle=c;g.lineWidth=Math.max(1,sc(w));g.stroke();};
    const ell=(x,y,rx,ry,c,alpha=1)=>{g.globalAlpha=alpha;g.beginPath();g.ellipse(X(x),Y(y),sc(rx),sc(ry),0,0,Math.PI*2);g.fillStyle=c;g.fill();g.globalAlpha=1;};
    const rotatedPoly=(cx,cy,a,pts,fill,stroke=null,lw=2)=>polygon(pts.map(([x,y])=>[cx+x*Math.cos(a)-y*Math.sin(a),cy+x*Math.sin(a)+y*Math.cos(a)]),fill,stroke,lw);
    const aim=clamp(wrap(Math.atan2(lookY,lookX)-Math.PI/2),-.52,.52);
    g.save();
    /* ombre et anneau d'énergie derrière le blindage */
    ell(0,132,105,17,P.d,.34);
    g.globalCompositeOperation=mono?'source-over':'screen';g.globalAlpha=mono?.38:.25+.08*Math.sin(t*3);
    ring(0,4,111,5,P.edge,t*.42,t*.42+Math.PI*1.64);ring(0,4,120,2,P.h,-t*.67,-t*.67+Math.PI*1.25);
    for(let i=0;i<8;i++){const a=t*(phase>=2?1.15:.62)+i*Math.PI/4;disc(Math.cos(a)*120,4+Math.sin(a)*120,3.5,i%2?P.h:P.energy);}
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    /* quatre propulseurs : le panache s'allonge à l'ouverture et au tir */
    for(let i=0;i<4;i++){
      const xx=-48+i*32, wob=.5+.5*Math.sin(t*18+i*1.7), len=13+8*wob+fire*16;
      polygon([[xx-9,77],[xx+9,77],[xx+6,91],[xx-6,91]],P.d,P.edge,1.5);
      polygon([[xx-5,85],[xx+5,85],[xx+2.5,91+len],[xx-2.5,91+len]],P.l);
      polygon([[xx-2.5,88],[xx+2.5,88],[xx,91+len*.76]],P.h);
      if(fire>.05)disc(xx,91+len,3+fire*4,P.energy);
    }
    /* ailes épaisses articulées, chacune respire et incline son blindage */
    for(const sg of [-1,1]){
      const flap=Math.sin(t*1.45+sg*.4)*3.2-open*2.5;
      const wing=[[sg*35,-72],[sg*68,-88+flap],[sg*124,-72+flap],[sg*140,-39],[sg*126,35],[sg*94,66],[sg*58,50],[sg*43,18]];
      polygon(wing,P.d,P.edge,3.4);
      polygon([[sg*48,-66],[sg*70,-77+flap],[sg*115,-63+flap],[sg*128,-38],[sg*116,24],[sg*94,48],[sg*69,34],[sg*52,10]],P.m);
      polygon([[sg*61,-63],[sg*105,-67+flap],[sg*119,-42],[sg*86,-45]],P.l);
      /* évents lumineux séquencés, donnant une animation de balayage */
      for(let j=0;j<4;j++){const lit=(Math.floor(t*8+j+ (sg>0?2:0))%4)===0;rect(sg*(72+j*11),-18+flap,6,20,lit?P.h:P.d);}
      line([[sg*70,22],[sg*94,34+flap],[sg*112,19]],P.edge,2);
      for(const yy of [-54,38])disc(sg*(70+(yy>0?28:38)),yy+flap,3.2,P.h);
      /* tourelle suit le pilote, recule franchement au tir */
      const tx=sg*73,ty=38,ang=aim;
      rotatedPoly(tx,ty,ang,[[-10,-7],[-8,7],[-5,29+fire*9],[-3,37+fire*9],[3,37+fire*9],[5,29+fire*9],[8,7],[10,-7]],P.d,P.edge,2);
      rotatedPoly(tx,ty,ang,[[-5,-2],[-4,18],[-2,31+fire*9],[2,31+fire*9],[4,18],[5,-2]],P.l);
      const mx=tx+Math.sin(ang)*(37+fire*9),my=ty-Math.cos(ang)*(37+fire*9);
      ring(mx,my,6+fire*3,2,P.h);if(fire>.05)disc(mx,my,3+fire*3,P.energy);
      disc(sg*72,ty,12,P.d);disc(sg*72,ty,7,P.edge);disc(sg*72,ty,3,P.h);
      /* vérin visible et coulissant */
      const slide=Math.sin(t*2+sg)*5;
      line([[sg*91,-38],[sg*100,-8+slide],[sg*104,27]],P.d,8);line([[sg*91,-38],[sg*100,-8+slide],[sg*104,27]],P.h,2.2);
      disc(sg*100,-8+slide,5,P.edge);disc(sg*100,-8+slide,2,P.h);
    }
    /* fuselage principal, à facettes, avec un nez de forteresse */
    const hull=[[-50,-104],[50,-104],[67,-82],[67,-56],[88,-27],[86,48],[61,77],[42,111],[0,130],[-42,111],[-61,77],[-86,48],[-88,-27],[-67,-56],[-67,-82]];
    polygon(hull,P.d,P.h,3.5);
    polygon([[-45,-97],[45,-97],[59,-77],[58,-55],[76,-25],[74,43],[52,68],[34,100],[0,119],[-34,100],[-52,68],[-74,43],[-76,-25],[-58,-55],[-59,-77]],P.m);
    /* plaques facettées en V, alternance d'ombres et d'arêtes */
    polygon([[-49,-86],[0,-99],[49,-86],[33,-65],[0,-57],[-33,-65]],P.l);
    polygon([[-76,-24],[-55,-46],[-42,-33],[-43,30],[-64,45],[-77,25]],P.d,P.edge,1.4);
    polygon([[76,-24],[55,-46],[42,-33],[43,30],[64,45],[77,25]],P.d,P.edge,1.4);
    for(const sg of [-1,1]){
      polygon([[sg*51,49],[sg*37,69],[sg*29,91],[sg*40,100],[sg*56,75]],P.l);
      line([[sg*48,-80],[sg*60,-53],[sg*61,-8]],P.h,2.4);
      for(let j=0;j<3;j++)disc(sg*(51+j*7),-43+j*9,2.3,j===1?P.h:P.edge);
    }
    /* capteurs sur la proue : une onde lumineuse balaie les cinq segments */
    polygon([[-31,-103],[31,-103],[39,-88],[-39,-88]],P.d,P.edge,1.7);
    for(let i=0;i<5;i++){
      const active=((Math.floor(t*6)+i)%5)===0;
      rect(-23+i*11,-99,7,6,active?P.h:P.l);rect(-21+i*11,-97,3,2,active?P.energy:P.d);
    }
    /* antennes à balayage opposé */
    for(const sg of [-1,1]){
      const a=Math.sin(t*1.2+sg)*.6, ax=sg*48, ay=-91;
      line([[ax,ay],[ax+Math.sin(a)*14,ay-17]],P.d,4);line([[ax,ay],[ax+Math.sin(a)*14,ay-17]],P.h,1.4);
      disc(ax+Math.sin(a)*14,ay-17,4,P.edge);disc(ax+Math.sin(a)*14,ay-17,1.8,P.h);
    }
    /* iris blindé : les pétales s'ouvrent en éventail pendant la charge */
    const cy=2,spin=t*(.18+phase*.12),outer=51,inner=19+open*19;
    disc(0,cy,61,P.d);ring(0,cy,59,4,P.h);ring(0,cy,53,3,P.edge);
    for(let i=0;i<8;i++){
      const a=spin+i*Math.PI/4,w=.205;
      const pts=[[inner*Math.cos(a-w),cy+inner*Math.sin(a-w)],[outer*Math.cos(a-w*.78),cy+outer*Math.sin(a-w*.78)],[outer*Math.cos(a+w*.78),cy+outer*Math.sin(a+w*.78)],[inner*Math.cos(a+w),cy+inner*Math.sin(a+w)]];
      polygon(pts,P.d,P.edge,1.3);
      const mid=(inner+outer)*.5,half=(outer-inner)*.42;
      polygon([[mid*Math.cos(a)-half*Math.sin(a),cy+mid*Math.sin(a)+half*Math.cos(a)],[outer*.88*Math.cos(a),cy+outer*.88*Math.sin(a)],[mid*Math.cos(a)+half*Math.sin(a),cy+mid*Math.sin(a)-half*Math.cos(a)]],i%2?P.m:P.l);
      line([[inner*Math.cos(a),cy+inner*Math.sin(a)],[outer*.88*Math.cos(a),cy+outer*.88*Math.sin(a)]],P.h,1.4);
    }
    const pulse=.82+.18*Math.sin(t*5.4)+fire*.42;
    disc(0,cy,inner+3,P.d);disc(0,cy,Math.max(8,inner-2),P.l);
    ring(0,cy,inner-5,2.4,P.h,spin,spin+Math.PI*(1.05+open*.6));
    /* noyau-œil orienté vers le joueur, qui se contracte avant le tir */
    const pupilX=clamp(lookX,-1,1)*9,pupilY=clamp(lookY,-.4,1)*7,eyeR=(10+open*3)*(1-fire*.18);
    disc(pupilX,pupilY,eyeR+5,P.d);disc(pupilX,pupilY,eyeR+2,P.h);disc(pupilX,pupilY,eyeR,P.energy);
    disc(pupilX+1.5,pupilY+1,eyeR*.54,P.d);disc(pupilX+2.2,pupilY-2,2.7,P.h);
    if(fire>.05){g.globalAlpha=.36+fire*.34;ring(0,cy,67+fire*10,3,P.energy,t*2,t*2+Math.PI*1.45);g.globalAlpha=1;}
    /* quatre verrous d'acier et icônes de danger aux coins du cœur */
    for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,xx=Math.cos(a)*72,yy=cy+Math.sin(a)*72;disc(xx,yy,5,P.d);disc(xx,yy,2.4,(Math.floor(t*5+i)%3===0)?P.h:P.edge);}
    /* panneaux de refroidissement sous l'œil */
    for(let i=0;i<5;i++){const w=28-i*3;rect(-w/2,72+i*5,w,2.5,i===Math.floor((t*5)%5)?P.h:P.d);}
    /* dégâts progressifs : fissures et arcs d'étincelles suivent l'état de la coque */
    if(damage>.22){line([[-63,-51],[-42,-29],[-49,-6],[-29,11]],P.d,3.5);line([[59,31],[38,45],[46,67]],P.d,3);}
    if(damage>.48){line([[56,-66],[38,-48],[49,-31]],P.d,4);line([[-65,36],[-45,49],[-52,70]],P.d,3.5);}
    if(damage>.72){for(let i=0;i<3;i++){const a=t*7+i*2.1,ex=Math.sin(a)*(78+i*4),ey=-22+Math.cos(a)*(45+i*4);disc(ex,ey,2.4+(i%2),i%2?P.h:P.energy);}}
    /* flash des impacts sans masquer le dessin sous-jacent */
    if(b.flash>0){g.globalCompositeOperation='screen';g.globalAlpha=clamp(b.flash*4,0,.72);polygon(hull,P.h);g.globalAlpha=1;g.globalCompositeOperation='source-over';}
    g.restore();
  }
  const previous=drawBoss;
  drawBoss=function(){
    const b=G.boss;if(!b||!b.def||b.def.name!==BOSS_NAME)return previous();
    useBuf(R.bufNear);
    const target=(typeof nearestPlayer==='function'?nearestPlayer(b.x,b.y):G.player)||G.player;
    if(b._ptA!==undefined&&b.atkT>b._ptA+.15)b._fireT=.22;
    b._ptA=b.atkT;b._fireT=Math.max(0,(b._fireT||0)-1/60);
    const opening=clamp(1-b.atkT/.7,0,1)*.75+.25*(b.ph>0?1:.4)+(b._fireT>0?.25:0);
    b._open=(b._open||0)+(opening-(b._open||0))*.12;
    const dx=target?target.x-b.x:0,dy=target?target.y-b.y:1,d=Math.hypot(dx,dy)||1;
    drawArt(b,dx/d,dy/d);
  };
})();
