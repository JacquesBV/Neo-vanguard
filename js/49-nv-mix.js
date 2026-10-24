
/* =========================== MIXAGE AUDIO ===================================
   Trois familles bien séparées : MUSIQUE, EFFETS, VOIX.
   - la voix a son propre bus (bips, ronronnement et couche robot du droïde
     compris) : le curseur « Effets » ne la touche plus ;
   - quand VESTA parle, la musique s'efface (−8 dB) et les effets baissent un
     peu (−3 dB), puis tout remonte en douceur ;
   - les tirs du joueur, joués en continu, sont baissés (−4 dB) pour ne plus
     masquer les explosions, les alertes et la voix ;
   - la touche M coupe aussi la voix.                                         */
(function () {
  const MIX = {
    duckMusic: 0.40,   /* musique sous la voix  (≈ −8 dB) */
    duckSfx:   0.70,   /* effets sous la voix   (≈ −3 dB) */
    shots:     0.63,   /* tirs du joueur        (≈ −4 dB) */
    voice:     1.00,   /* bus voix (bips / ronronnement) */
  };
  const K = { music: 1, sfx: 1 };                 /* niveaux de ducking courants */
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const voicePct = () => cl((S.opts.voiceVol === undefined ? 100 : Number(S.opts.voiceVol)) / 100, 0, 1);
  const talking = () => {
    try { return !!(DROID && DROID.busy) || !!(window.speechSynthesis && window.speechSynthesis.speaking); }
    catch (e) { return false; }
  };

  /* ---- bus voix + bus tirs, branchés à la création du moteur ---- */
  function ensureBuses(a) {
    if (!a.ok || !a.ctx) return;
    if (!a.voiceGain) { a.voiceGain = a.ctx.createGain(); a.voiceGain.connect(a.master); }
    if (!a.shotGain) { a.shotGain = a.ctx.createGain(); a.shotGain.gain.value = MIX.shots; a.shotGain.connect(a.sfxGain); }
  }
  const _apply = Audio2.applyVolumes;
  Audio2.applyVolumes = function () {
    _apply.apply(this, arguments);
    if (!this.ok) return;
    ensureBuses(this);
    if (this.musicGain) this.musicGain.gain.value *= K.music;
    if (this.sfxGain) this.sfxGain.gain.value *= K.sfx;
    if (this.voiceGain) this.voiceGain.gain.value = this.muted ? 0 : voicePct() * MIX.voice;
  };
  /* bande originale (lecteur HTML) : même ducking */
  const _mxVol = mxVol;
  mxVol = function () { return _mxVol() * K.music; };

  /* ---- les tirs passent par leur bus atténué ---- */
  const _sfx = Audio2.sfx;
  Audio2.sfx = function (name) {
    if ((name === 'shoot' || name === 'laser') && this.shotGain) {
      const keep = this.sfxGain; this.sfxGain = this.shotGain;
      try { return _sfx.apply(this, arguments); } finally { this.sfxGain = keep; }
    }
    return _sfx.apply(this, arguments);
  };

  /* ---- habillage du droïde sur le bus voix ---- */
  function onVoiceBus(fn, self, args) {
    const a = Audio2; ensureBuses(a);
    if (!a.voiceGain) return fn.apply(self, args);
    const keepBus = a.sfxGain, keepVol = S.opts.sfx;
    a.sfxGain = a.voiceGain; S.opts.sfx = 100;        /* le niveau vient du bus voix */
    try { return fn.apply(self, args); } finally { a.sfxGain = keepBus; S.opts.sfx = keepVol; }
  }
  const _chirp = droidChirp, _hum = droidHumStart;
  droidChirp = function () { return onVoiceBus(_chirp, this, arguments); };
  droidHumStart = function () { return onVoiceBus(_hum, this, arguments); };

  /* ---- synthèse vocale : volume voix, et silence si le son est coupé ---- */
  if ('speechSynthesis' in window) {
    const ss = window.speechSynthesis, _speak = ss.speak;
    ss.speak = function (u) {
      try { u.volume = Audio2.muted ? 0 : voicePct(); } catch (e) {}
      return _speak.call(this, u);
    };
  }

  /* ---- ducking : la musique laisse la place à la voix ---- */
  const _update = update;
  update = function (dt) {
    try { mixTick(dt); } catch (e) {}
    return _update(dt);
  };
  function mixTick(dt) {
    {
      const on = talking();
      const tm = on ? MIX.duckMusic : 1, ts = on ? MIX.duckSfx : 1;
      const sp = on ? 8 : 1.6;                          /* descente rapide, remontée douce */
      const k = Math.min(1, (dt || 0.016) * sp);
      const pm = K.music, ps = K.sfx;
      K.music += (tm - K.music) * k; K.sfx += (ts - K.sfx) * k;
      if (Math.abs(K.music - tm) < 0.002) K.music = tm;
      if (Math.abs(K.sfx - ts) < 0.002) K.sfx = ts;
      if ((K.music !== pm || K.sfx !== ps) && Audio2.ok) Audio2.applyVolumes();
    }
  }

  /* ---- réglages : « Volume de la voix » juste sous Musique / Effets ---- */
  const _rows = voiceOptionsRows;
  voiceOptionsRows = function (add) {
    const o = S.opts;
    if (o.voiceVol === undefined) o.voiceVol = 100;
    const lab = NXT('vo.vol');
    const d = add(`<div><label>${lab}<span class="hint">${NXT('vo.volH')}</span></label></div>
      <div class="ctl"><input type="range" min="0" max="100" step="5" value="${o.voiceVol}"><span style="min-width:44px;text-align:right;color:#ffe066">${o.voiceVol}%</span></div>`);
    const inp = d.querySelector('input'), out = d.querySelector('.ctl span');
    inp.oninput = () => { o.voiceVol = +inp.value; out.textContent = o.voiceVol + '%'; Audio2.applyVolumes(); saveGame(); };
    inp.onchange = () => { try { if (o.speech) voSample(null); } catch (e) {} };
    /* l'ancien curseur, plus bas dans la liste, n'est plus affiché */
    return _rows.call(this, html => (typeof html === 'string' && html.includes('<label>' + lab + '<'))
      ? Object.assign(document.createElement('div'), { innerHTML: html })
      : add(html));
  };


  if (Audio2.ok) Audio2.applyVolumes();
})();
