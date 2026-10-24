
(() => {
  const banner=document.createElement('div');banner.id='nvPraise';banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');
  banner.innerHTML='<span class="seal" aria-hidden="true">✦</span><span class="copy"><strong></strong><span></span></span>';document.body.appendChild(banner);
  const title=banner.querySelector('strong'),detail=banner.querySelector('.copy span'),seal=banner.querySelector('.seal');
  const labels={fr:['BRAVO, PILOTE !','SECTEUR ACCOMPLI'],en:['WELL DONE, PILOT!','SECTOR CLEARED'],es:['¡BIEN HECHO, PILOTO!','SECTOR COMPLETADO'],pt:['MUITO BEM, PILOTO!','SETOR CONCLUÍDO'],ja:['よくやった、パイロット！','セクター完了']};
  /* un message différent à chaque secteur : on tire dans un sac mélangé, sans répétition */
  const CHEERS=[
    ['🚀',"Pilote d'élite !",'Elite pilot!','¡Piloto de élite!','Piloto de elite!','エリートパイロット！'],
    ['🔥','Tu es en feu !',"You're on fire!",'¡Estás que ardes!','Estás em chamas!','絶好調だね！'],
    ['🎯','Tir parfait, pilote !','Sharp shooting, pilot!','¡Puntería perfecta, piloto!','Pontaria perfeita, piloto!','見事な射撃！'],
    ['⚡','Réflexes de légende !','Legendary reflexes!','¡Reflejos de leyenda!','Reflexos lendários!','伝説の反射神経！'],
    ['🏆','Secteur conquis !','Sector conquered!','¡Sector conquistado!','Setor conquistado!','セクター制圧！'],
    ['🌟','Vesta est fière de toi !','Vesta is proud of you!','¡Vesta está orgullosa de ti!','A Vesta tem orgulho de ti!','ヴェスタも誇りに思ってる！'],
    ['👾',"Les envahisseurs n'ont rien vu venir !",'The invaders never saw it coming!','¡Los invasores no lo vieron venir!','Os invasores nem viram chegar!','侵略者もびっくり！'],
    ['💎',"Du travail d'orfèvre !",'Flawless work!','¡Un trabajo de orfebre!','Trabalho de mestre!','職人技だ！'],
    ['🛡️','Le Vanguard tient bon !','The Vanguard holds strong!','¡El Vanguard resiste!','O Vanguard aguenta firme!','ヴァンガードは健在！'],
    ['🎮','Quelle partie, champion !','What a run, champ!','¡Qué partida, campeón!','Que partida, campeão!','最高のプレイだ！'],
    ['💥','Boum ! Secteur nettoyé !','Boom! Sector cleared!','¡Bum! ¡Sector limpio!','Bum! Setor limpo!','ドカン！セクター一掃！'],
    ['🌠','Une étoile est née !','A star is born!','¡Ha nacido una estrella!','Nasceu uma estrela!','新たなスター誕生！'],
    ['🥇',"Digne d'une médaille d'or !",'Gold medal material!','¡Digno de medalla de oro!','Digno de medalha de ouro!','金メダル級だ！'],
    ['🛰️','Mission accomplie, as du ciel !','Mission complete, sky ace!','¡Misión cumplida, as del cielo!','Missão cumprida, ás dos céus!','任務完了、空のエース！'],
    ['✨','La mémoire revient grâce à toi !','Memory is coming back thanks to you!','¡La memoria vuelve gracias a ti!','A memória volta graças a ti!','君のおかげで記憶が戻る！'],
    ['😎','Trop facile pour toi !','Too easy for you!','¡Demasiado fácil para ti!','Fácil demais para ti!','楽勝だね！']
  ];
  let cheerBag=[],lastCheer=-1;
  function nextCheer(){
    if(!cheerBag.length){cheerBag=CHEERS.map((_,i)=>i);for(let i=cheerBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cheerBag[i],cheerBag[j]]=[cheerBag[j],cheerBag[i]];}if(cheerBag[cheerBag.length-1]===lastCheer)cheerBag.unshift(cheerBag.pop());}
    lastCheer=cheerBag.pop();return CHEERS[lastCheer];
  }
  let hideTimer=0;
  function announceReward(r){
    const lang=['fr','en','es','pt','ja'].includes(LANG)?LANG:'fr',L=labels[lang],cheer=nextCheer();
    const cash=r&&r.credits?` +${fmt(r.credits)} COINS`:'';
    const bomb=r&&r.bomb?` · ${lang==='fr'?'BOMBE +1':lang==='en'?'BOMB +1':lang==='es'?'BOMBA +1':'BOMBA +1'}`:'';
    const score=r&&r.score?` · ${lang==='fr'?'SCORE':lang==='en'?'SCORE':lang==='es'?'PUNTOS':'PONTOS'} ${fmt(r.score)}`:'';
    seal.textContent=cheer[0];title.textContent=cheer[1+['fr','en','es','pt','ja'].indexOf(lang)].toUpperCase();detail.textContent=L[1]+bomb+cash+score;
    banner.classList.remove('show');void banner.offsetWidth;banner.classList.add('show');
    clearTimeout(hideTimer);hideTimer=setTimeout(()=>banner.classList.remove('show'),3600);
  }
  const originalAddScore=addScore;
  addScore=function(P,n){if(G.state==='play'||G.state==='warp')G.secScore=(G.secScore|0)+Math.round(n);return originalAddScore(P,n);};
  const originalStartLevel=startLevel;
  startLevel=function(level){G.secScore=0;G.rewardedLevel=0;G.lastReward=null;return originalStartLevel.apply(this,arguments);};
  function rewardForSector(){
    const score=Math.max(0,G.secScore|0),med=medalOf(G.level),checks=med.crit.filter(c=>c.ok).length;
    const target=Math.max(2200,medalPar(G.level)*82);
    const tier=score>=target*2.35?3:score>=target*1.55?2:score>=target?1:0;
    const payout=[0,100,230,420][tier];
    const wantsBomb=tier>=2&&checks>=3;
    let bomb=false,credits=payout;
    if(wantsBomb&&!G.netOnline&&!G.mods.includes('nobomb')){
      const P=(G.players||[]).find(p=>p&&!p.out)||G.player;
      if(P&&P.bombs<5){P.bombs++;G.bombs=G.players[0].bombs;bomb=true;}
      else credits+=300;
    }else if(checks>=1){credits+=checks*85;}
    if((G.mods||[]).includes('nobomb')&&wantsBomb)credits+=300;
    if(G.netOnline){credits=0;bomb=false;}
    if(credits){G.credits=(G.credits|0)+credits;G.runCredits=(G.runCredits|0)+credits;G.lastBonus=(G.lastBonus|0)+credits;}
    const result={score,tier,checks,bomb,credits};G.rewardedLevel=G.level;G.lastReward=result;return result;
  }
  const originalLevelComplete=levelComplete;
  levelComplete=function(){
    const before=G.phase,out=originalLevelComplete.apply(this,arguments);
    if(before!=='clear'&&G.phase==='clear')announceReward(rewardForSector());
    return out;
  };
  const originalShowClear=showClearScreen;
  showClearScreen=function(){
    const r=G.rewardedLevel===G.level&&G.lastReward?G.lastReward:rewardForSector();
    const out=originalShowClear.apply(this,arguments);
    if(r.bomb||r.credits){
      const row=document.createElement('div');row.className='opt';
      const label=document.createElement('label'),value=document.createElement('b');
      label.textContent='Récompense performance';value.style.color=r.bomb?'#ffd166':'#76e7ff';
      value.textContent=(r.bomb?'BOMBE +1':'')+(r.bomb&&r.credits?' · ':'')+(r.credits?'+'+fmt(r.credits)+' COINS':'');
      row.append(label,value);const stats=document.getElementById('clearStats');if(stats)stats.appendChild(row);
    }
    return out;
  };

})();
