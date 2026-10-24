
/* ===== VOIX DU DROÏDE — homme / femme vraiment différents ========================
   Avant : le choix de la voix privilégiait toujours une voix « locale », même du
   mauvais genre, et la hauteur ne dépendait plus du genre : homme et femme
   sortaient souvent avec la même voix, au même timbre.
   Maintenant : 1) le genre demandé passe avant tout (puis local, puis le reste) ;
   2) si l'appareil n'a pas de voix du bon genre (fréquent sur téléphone, une
   seule voix par langue), la hauteur fait la différence : plus aiguë pour la
   voix féminine, plus grave pour la voix masculine.                          */
(() => {
  if (typeof DROID === 'undefined' || !DROID.ok) return;
  /* voix Android (moteur Google) : le genre n'est que dans le code du nom */
  const ANDROID_F = /x-(fra|frc|vlf|sfg|iob|iog|tpc|tpf|eea|eec|ptd|pte|htm|jab)\b/i;
  const ANDROID_M = /x-(frb|frd|iom|iol|tpd|eed|eef|ptc|pmj|jac|jad)\b/i;
  const _g = voGender;
  voGender = function (v) {
    const n = (v && (v.name + ' ' + (v.voiceURI || ''))) || '';
    if (ANDROID_F.test(n)) return 'female';
    if (ANDROID_M.test(n)) return 'male';
    return _g(v);
  };
  const ss = window.speechSynthesis;
  const langCode = () => (LANGS.find(l => l.id === LANG) || LANGS[0]).code;
  droidVoice = function (code) {
    const all = ss.getVoices() || [];
    const wl = String(code || langCode()).slice(0, 2).toLowerCase();
    const mine = all.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(wl) && !voIsCanadianFr(v));
    if (!mine.length) return null;
    if (S.opts.voiceName) { const v = mine.find(x => x.name === S.opts.voiceName); if (v) return v; }
    const g = S.opts.voiceGender === 'female' ? 'female' : 'male';
    let best = null, bs = -1e9;
    for (const v of mine) {
      const vg = voGender(v);
      let sc = vg === g ? 400 : vg === 'unknown' ? 0 : -400;          /* le genre d'abord */
      if (v.localService) sc += 100;                                    /* puis une voix locale (elle suit la hauteur) */
      if (/natural|neural|online/i.test(v.name)) sc -= 20;
      if (v.default) sc += 2;
      if (sc > bs) { bs = sc; best = v; }
    }
    return best;
  };
  /* hauteur : réglage fin × écart de genre (fort si la voix n'est pas du bon genre) */
  voApply = function () {
    const o = S.opts, fem = o.voiceGender === 'female';
    let pitch = clamp((o.voicePitch === undefined ? 100 : o.voicePitch) / 100, 0, 2);
    let vg = 'unknown'; try { const v = droidVoice(langCode()); if (v) vg = voGender(v); } catch (e) {}
    const match = vg === (fem ? 'female' : 'male');
    if (o.voiceStyle === 'droid') {
      /* voix de droïde : très grave pour l'homme, nettement plus haut pour la femme */
      pitch = fem ? clamp(pitch + (match ? 0.5 : 0.75), 0.6, 2) : clamp(pitch * (match ? 1 : 0.8), 0, 2);
    } else {
      pitch = fem ? clamp(pitch * (match ? 1.06 : 1.4), 0.5, 2) : clamp(pitch * (match ? 0.95 : 0.78), 0.3, 2);
    }
    DROID.pitch = pitch;
    DROID.rate = clamp((o.voiceRate === undefined ? 100 : o.voiceRate) / 100, 0.5, 1.5) * (fem ? 1.03 : 1);
  };
  voApply();
})();
