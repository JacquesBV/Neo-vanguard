
(() => {
  /* BASTION-4 : forteresse-citadelle à quatre tourelles autonomes.
     Tout est dessiné en couches animées pour rester net sur chaque raster. */
  const BOSS_NAME = 'BASTION-4';
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const wrap = a => { while(a>Math.PI)a-=Math.PI*2; while(a< -Math.PI)a+=Math.PI*2; return a; };
  function drawBastion(b, lookX, lookY) {
    const g=PAINT.g,K=PAINT.K,S=1.0,t=b.t||0,phase=b.ph||0;
    const open=clamp(b._b4open||0,0,1),fire=clamp((b._b4fire||0)/.26,0,1);
    const damage=1-b.hp/Math.max(1,b.maxHp),bob=Math.sin(t*1.35)*2.4;
    const q=TH.livery&&TH.livery.gb,mono=R.era===0&&q;
    const P=mono?{d:q[0],m:q[1],l:q[2],h:q[3],energy:q[3],gold:q[2],red:q[0]}:{
      d:'#101722',m:'#344252',l:'#8293a0',h:'#edf4ec',energy:'#62f5df',gold:'#f6b743',red:'#ff5269'
    };
    const X=x=>(b.x+x*S)*K,Y=y=>(b.y+y*S+bob)*K,sc=v=>v*S*K;
    const polygon=(pts,fill,stroke=null,lw=2)=>{
      g.beginPath();pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));
      g.closePath();g.fillStyle=fill;g.fill();
      if(stroke){g.strokeStyle=stroke;g.lineWidth=Math.max(1,sc(lw));g.lineJoin='round';g.stroke();}
    };
    const line=(pts,col,w=2)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Y(p[1])):g.moveTo(X(p[0]),Y(p[1])));g.strokeStyle=col;g.lineWidth=Math.max(1,sc(w));g.lineCap='round';g.lineJoin='round';g.stroke();};
    const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(X(x)),Math.round(Y(y)),Math.max(1,Math.round(sc(w))),Math.max(1,Math.round(sc(h))));};
    const disc=(x,y,r,c)=>{g.beginPath();g.arc(X(x),Y(y),Math.max(.65,sc(r)),0,Math.PI*2);g.fillStyle=c;g.fill();};
    const ell=(x,y,rx,ry,c,alpha=1)=>{g.globalAlpha=alpha;g.beginPath();g.ellipse(X(x),Y(y),sc(rx),sc(ry),0,0,Math.PI*2);g.fillStyle=c;g.fill();g.globalAlpha=1;};
    const ring=(x,y,r,w,c,a=0,z=Math.PI*2)=>{g.beginPath();g.arc(X(x),Y(y),sc(r),a,z);g.strokeStyle=c;g.lineWidth=Math.max(1,sc(w));g.stroke();};
    const aim=clamp(wrap(Math.atan2(lookY,lookX)-Math.PI/2),-.5,.5);
    g.save();
    /* ombre d'ancrage et couronne énergétique en rotation lente */
    ell(0,137,116,19,P.d,.44);
    g.globalCompositeOperation=mono?'source-over':'screen';g.globalAlpha=mono?.32:.22+.07*Math.sin(t*2.4);
    ring(0,8,130,4,P.gold,t*.22,t*.22+Math.PI*1.56);
    ring(0,8,120,2,P.h,-t*.34,-t*.34+Math.PI*1.18);
    for(let i=0;i<12;i++){const a=-t*.3+i*Math.PI/6;disc(Math.cos(a)*130,8+Math.sin(a)*130,2.8,i%3===0?P.energy:P.gold);}
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    /* quatre tuyères accordées : les flammes répondent aux tirs et à la phase */
    for(let i=0;i<4;i++){
      const xx=-57+i*38,wob=.5+.5*Math.sin(t*17+i*1.4),len=13+9*wob+fire*19;
      polygon([[xx-10,76],[xx+10,76],[xx+8,96],[xx-8,96]],P.d,P.gold,1.8);
      polygon([[xx-6,91],[xx+6,91],[xx+3,95+len],[xx-3,95+len]],P.l);
      polygon([[xx-2.5,92],[xx+2.5,92],[xx,94+len*.76]],P.h);
      if(fire>.04)disc(xx,95+len,2+fire*4,P.energy);
    }
    /* stabilisateurs latéraux mobiles, épais et facettés */
    for(const sg of [-1,1]){
      const flap=Math.sin(t*1.1+sg*.5)*5+open*4;
      polygon([[sg*39,-61],[sg*79,-84-flap],[sg*131,-66-flap],[sg*145,-26],[sg*128,49],[sg*94,74],[sg*62,44],[sg*44,9]],P.d,P.gold,3);
      polygon([[sg*51,-54],[sg*82,-70-flap],[sg*119,-56-flap],[sg*132,-24],[sg*116,39],[sg*94,55],[sg*70,34],[sg*55,5]],P.m);
      polygon([[sg*63,-50],[sg*109,-54-flap],[sg*122,-25],[sg*86,-34]],P.l);
      line([[sg*67,23],[sg*93,40+flap],[sg*112,15]],P.h,2.2);
      for(let j=0;j<5;j++){const lit=(Math.floor(t*7+j+(sg>0?2:0))%5)<2;rect(sg*(73+j*9),-8+flap,5,16,lit?P.energy:P.d);}
      /* conduites hydrauliques animées */
      line([[sg*48,-38],[sg*83,-19+Math.sin(t*2+sg)*4],[sg*94,28]],P.d,8);
      line([[sg*48,-38],[sg*83,-19+Math.sin(t*2+sg)*4],[sg*94,28]],P.h,2);
      disc(sg*83,-19+Math.sin(t*2+sg)*4,5,P.gold);disc(sg*83,-19+Math.sin(t*2+sg)*4,2,P.h);
    }
    /* cœur du fort : silhoutte de bastion à étages, pas un simple bloc */
    const hull=[[-64,-112],[-44,-132],[44,-132],[64,-112],[70,-82],[91,-55],[88,43],[66,80],[47,111],[0,134],[-47,111],[-66,80],[-88,43],[-91,-55],[-70,-82]];
    polygon(hull,P.d,P.h,4);
    polygon([[-56,-107],[-40,-121],[40,-121],[56,-107],[61,-78],[78,-49],[76,38],[57,70],[39,101],[0,120],[-39,101],[-57,70],[-76,38],[-78,-49],[-61,-78]],P.m);
    /* épaules en chevron et strates de blindage */
    polygon([[-58,-91],[0,-112],[58,-91],[38,-67],[0,-57],[-38,-67]],P.l,P.h,1.5);
    polygon([[-75,-42],[-53,-58],[-39,-45],[-43,32],[-63,49],[-79,27]],P.d,P.gold,1.7);
    polygon([[75,-42],[53,-58],[39,-45],[43,32],[63,49],[79,27]],P.d,P.gold,1.7);
    for(const sg of [-1,1]){
      line([[sg*53,-81],[sg*62,-54],[sg*64,-9]],P.h,2.4);
      for(let j=0;j<4;j++)disc(sg*(48+j*7),-40+j*10,2.1,j%2?P.gold:P.h);
      polygon([[sg*45,54],[sg*31,77],[sg*37,100],[sg*57,76]],P.l);
    }
    /* quatre tours indépendantes : chacune pivote vers le joueur et recule au tir */
    const towers=[[-83,-54], [83,-54], [-83,49], [83,49]];
    towers.forEach(([tx,ty],i)=>{
      const firePulse=fire*(i%2===0?1:.78),rot=aim*(i<2?1:.72)+Math.sin(t*1.8+i*1.57)*.035;
      const cx=tx,cy=ty+(i>=2?8:0),recoil=firePulse*9;
      g.save();g.translate(X(cx),Y(cy));g.rotate(rot);
      const u=v=>sc(v);
      const polyLocal=(pts,fill,stroke=null,lw=1.5)=>{g.beginPath();pts.forEach((p,j)=>j?g.lineTo(u(p[0]),u(p[1])):g.moveTo(u(p[0]),u(p[1])));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=Math.max(1,u(lw));g.lineJoin='round';g.stroke();}};
      polyLocal([[-16,-22],[16,-22],[24,-14],[24,14],[16,22],[-16,22],[-24,14],[-24,-14]],P.d,P.gold,2);
      polyLocal([[-19,-14],[0,-22],[19,-14],[20,11],[0,22],[-20,11]],P.m,P.h,1.2);
      polyLocal([[-8,-7],[-6,-31-recoil],[0,-42-recoil],[6,-31-recoil],[8,-7]],P.d,P.gold,1.5);
      polyLocal([[-3,-12],[-2,-32-recoil],[0,-37-recoil],[2,-32-recoil],[3,-12]],P.l);
      g.beginPath();g.arc(0,-40-recoil,u(5+firePulse*3),0,Math.PI*2);g.fillStyle=firePulse>.04?P.energy:P.h;g.fill();
      g.beginPath();g.arc(0,0,u(7),0,Math.PI*2);g.fillStyle=P.d;g.fill();g.beginPath();g.arc(0,0,u(3.4),0,Math.PI*2);g.fillStyle=(Math.floor(t*8+i)%4===0)?P.energy:P.gold;g.fill();
      g.restore();
    });
    /* couronne frontale, plaques segmentées et rail de chargement */
    polygon([[-36,-124],[-26,-151],[26,-151],[36,-124],[28,-108],[-28,-108]],P.d,P.gold,2.4);
    polygon([[-25,-125],[-18,-143],[18,-143],[25,-125],[17,-116],[-17,-116]],P.l);
    for(let i=0;i<7;i++){const on=((Math.floor(t*7)+i)%7)<2;rect(-20+i*6.5,-137,4.3,7,on?P.energy:P.d);}
    for(let sg of [-1,1]){
      const a=Math.sin(t*1.25+sg)*.36,ax=sg*46,ay=-108;
      line([[ax,ay],[ax+Math.sin(a)*13,ay-22]],P.d,4.5);line([[ax,ay],[ax+Math.sin(a)*13,ay-22]],P.h,1.4);
      disc(ax+Math.sin(a)*13,ay-22,4,P.gold);disc(ax+Math.sin(a)*13,ay-22,1.8,P.energy);
    }
    /* cœur-citadelle : prisme lumineux cerclé de huit volets mécaniques */
    const cy=-13,spin=t*(.16+phase*.13),outer=48,inner=22+open*14;
    disc(0,cy,62,P.d);ring(0,cy,60,4,P.h);ring(0,cy,54,3,P.gold);
    for(let i=0;i<8;i++){
      const a=spin+i*Math.PI/4,w=.20;
      const pts=[[inner*Math.cos(a-w),cy+inner*Math.sin(a-w)],[outer*Math.cos(a-w*.8),cy+outer*Math.sin(a-w*.8)],[outer*Math.cos(a+w*.8),cy+outer*Math.sin(a+w*.8)],[inner*Math.cos(a+w),cy+inner*Math.sin(a+w)]];
      polygon(pts,i%2?P.m:P.l,P.gold,1.3);
      line([[inner*Math.cos(a),cy+inner*Math.sin(a)],[outer*.86*Math.cos(a),cy+outer*.86*Math.sin(a)]],P.h,1.4);
    }
    const pulse=.78+.22*Math.sin(t*5.7)+fire*.5;
    disc(0,cy,inner+1,P.d);disc(0,cy,Math.max(9,inner-4),P.energy);
    ring(0,cy,inner-6,2.7,P.h,spin,spin+Math.PI*(1.2+open*.5));
    /* noyau rouge-or : une lentille qui s'ouvre pour révéler le canon */
    disc(0,cy,13*pulse,P.d);disc(0,cy,9*pulse,P.gold);disc(0,cy,5.2*pulse,fire>.05?P.h:P.red);
    line([[-27,cy],[27,cy]],P.d,3.2);line([[-22,cy],[22,cy]],P.h,1.2);
    if(fire>.05){g.globalCompositeOperation=mono?'source-over':'screen';g.globalAlpha=.35+fire*.45;ring(0,cy,70+fire*12,3,P.energy,t*2,t*2+Math.PI*1.55);g.globalAlpha=1;g.globalCompositeOperation='source-over';}
    /* quatre verrous lumineux et lignes de refroidissement */
    for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,xx=Math.cos(a)*76,yy=cy+Math.sin(a)*76;disc(xx,yy,5,P.d);disc(xx,yy,2.4,(Math.floor(t*5+i)%3===0)?P.energy:P.gold);}
    for(let i=0;i<5;i++){const w=40-i*5,lit=i===Math.floor((t*5)%5);rect(-w/2,78+i*5,w,2.5,lit?P.h:P.d);}
    /* fumée, micro-étincelles et fissures progressives aux seuils de coque */
    if(damage>.18)line([[-67,-53],[-46,-33],[-54,-10],[-34,10]],P.d,4);
    if(damage>.42){line([[65,27],[43,44],[51,68]],P.d,3.5);line([[52,-76],[39,-55],[49,-38]],P.red,2.4);}
    if(damage>.68){for(let i=0;i<4;i++){const a=t*6+i*1.7,ex=Math.sin(a)*(91+i*5),ey=15+Math.cos(a)*(54+i*3);disc(ex,ey,2.2+i%2,i%2?P.h:P.energy);}}
    if(damage>.32){for(let s=-1;s<=1;s+=2)for(let i=0;i<2;i++){const ph=(t*.42+i*.5+(s>0?.3:0))%1;ell(s*(84+i*10)-ph*8,-42-i*10-ph*36,3+ph*5,4+ph*6,P.l,(1-ph)*.3);}}
    if(b.flash>0){g.globalCompositeOperation='screen';g.globalAlpha=clamp(b.flash*3.6,0,.65);polygon(hull,P.h);g.globalAlpha=1;g.globalCompositeOperation='source-over';}
    g.restore();
  }
  const previous=drawBoss;
  drawBoss=function(){
    const b=G.boss;if(!b||!b.def||b.def.name!==BOSS_NAME)return previous();
    useBuf(R.bufNear);
    const target=(typeof nearestPlayer==='function'?nearestPlayer(b.x,b.y):G.player)||G.player;
    if(b._b4Prev!==undefined&&b.atkT>b._b4Prev+.14)b._b4fire=.26;
    b._b4Prev=b.atkT;b._b4fire=Math.max(0,(b._b4fire||0)-1/60);
    const targetOpen=clamp(1-b.atkT/.75,0,1)*.72+.18+(b._b4fire>0?.24:0)+(b.ph>0?.1:0);
    b._b4open=(b._b4open||0)+(targetOpen-(b._b4open||0))*.13;
    const dx=target?target.x-b.x:0,dy=target?target.y-b.y:1,d=Math.hypot(dx,dy)||1;
    drawBastion(b,dx/d,dy/d);
  };
})();
